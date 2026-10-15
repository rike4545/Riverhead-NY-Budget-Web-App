#!/usr/bin/env python3
"""What the financial-report parse does when the Town's site does not answer.

On October 14, 2026 three of the Town's PDFs timed out during a scheduled run.
The parse left them out of the index and everything built on it (the Community
Preservation Fund history lost its 2022 year), and the job committed that; the
Pages deploy restored them eight minutes later. These tests hold the parse to
what it should do instead: try a failed download again, and when a document
still cannot be fetched, keep its last parse and say so."""

import io
import json
import tempfile
import unittest
from contextlib import redirect_stdout
from dataclasses import asdict
from pathlib import Path
from unittest import mock

import requests

import parse_all_pdfs as pap

TENTATIVE = '2022-2022-tentative-budget-pdf'
CPF = '2022-2022-peconic-bay-community-preservation-fund-financial-statements-pdf'
TEXT = {
    TENTATIVE: [
        '2022 TENTATIVE BUDGET\nA01-1-1010-100-000-00000 Town Board 1,234,567.00 1,250,000.00',
        'Total Town Operating 100,048,100.00',
    ],
    CPF: ['Peconic Bay Community Preservation Fund\nFund balance - end of year 18,686,618$'],
}
LINKS = [
    pap.Link('2022 Tentative Budget (PDF)', 'https://www.townofriverheadny.gov/DocumentCenter/View/261/2022-Tentative-Budget-PDF', 2022, 'tentative_budget', TENTATIVE),
    pap.Link('2022 Peconic Bay Community Preservation Fund Financial Statements (PDF)', 'https://www.townofriverheadny.gov/DocumentCenter/View/262/2022-CPF', 2022, 'community_preservation', CPF),
]
OUTPUTS = ('index.json', 'search-index.json', 'citations.json', 'line-item-candidates.json')


class FakePage:
    def __init__(self, text):
        self.text = text

    def extract_text(self):
        return self.text


class FakeReader:
    def __init__(self, path):
        self.pages = [FakePage(t) for t in TEXT[Path(path).stem]]


class KeepLastParseTests(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.TemporaryDirectory()
        self.addCleanup(self.dir.cleanup)
        self.root = Path(self.dir.name)
        out = self.root / 'out'
        for name, value in (('OUT', out), ('DOCS', out / 'documents'), ('CACHE', self.root / 'cache'), ('DIRECT_PDFS', [])):
            patcher = mock.patch.object(pap, name, value)
            patcher.start()
            self.addCleanup(patcher.stop)

    def run_parse(self, down=(), links=None):
        """One run of the parse, in which the documents named in `down` time out."""
        def download(link):
            if link.slug in down:
                raise requests.ConnectTimeout('Connection to www.townofriverheadny.gov timed out. (connect timeout=30)')
            path = self.root / 'cache' / f'{link.slug}.pdf'
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(b'%PDF-1.4')
            return path

        with mock.patch.object(pap, 'discover', return_value=list(links or LINKS)), \
                mock.patch.object(pap, 'download', side_effect=download), \
                mock.patch.object(pap, 'sha256', side_effect=lambda path: f'sha-{path.stem}'), \
                mock.patch.object(pap, 'PdfReader', FakeReader), \
                redirect_stdout(io.StringIO()) as log:
            code = pap.main()
        written = {name: json.loads((self.root / 'out' / name).read_text()) for name in OUTPUTS}
        return code, written, log.getvalue()

    def test_a_document_that_times_out_keeps_its_last_parse(self):
        _, before, _ = self.run_parse()
        code, after, log = self.run_parse(down={TENTATIVE})
        self.assertEqual(code, 0)
        self.assertEqual(after['index.json']['documents'], before['index.json']['documents'])
        for count in ('document_count', 'page_record_count', 'citation_count', 'line_item_candidate_count'):
            self.assertEqual(after['index.json'][count], before['index.json'][count], count)
        for name in OUTPUTS[1:]:
            self.assertEqual(after[name], before[name], f'{name} is not as the last parse wrote it')
        [failure] = after['index.json']['failures']
        self.assertEqual(failure['title'], '2022 Tentative Budget (PDF)')
        self.assertIn('is kept', failure['error'])
        self.assertIn('::warning', log)
        self.assertTrue((self.root / 'out' / 'documents' / f'{TENTATIVE}.json').exists())

    def test_the_document_comes_back_when_the_site_answers(self):
        _, before, _ = self.run_parse()
        self.run_parse(down={TENTATIVE})
        code, again, log = self.run_parse()
        self.assertEqual(code, 0)
        self.assertEqual(again['index.json']['failures'], [])
        self.assertEqual(again['index.json']['documents'], before['index.json']['documents'])
        self.assertNotIn('::warning', log)

    def test_an_incomplete_last_parse_leaves_the_document_out_without_ending_the_run(self):
        # The fallback runs inside the download's except handler, so anything
        # it raises would end the whole run (Graphify's review of #104).
        self.run_parse()
        index_path = self.root / 'out' / 'index.json'
        index = json.loads(index_path.read_text())
        for entry in index['documents']:
            if entry['slug'] == TENTATIVE:
                del entry['category']
        index_path.write_text(json.dumps(index))
        code, written, log = self.run_parse(down={TENTATIVE})
        self.assertEqual(code, 0)
        self.assertEqual([d['slug'] for d in written['index.json']['documents']], [CPF])
        [failure] = written['index.json']['failures']
        self.assertNotIn('is kept', failure['error'])

    def test_a_last_parse_that_cannot_be_rebuilt_leaves_the_document_out(self):
        self.run_parse()
        doc_path = self.root / 'out' / 'documents' / f'{TENTATIVE}.json'
        stored = json.loads(doc_path.read_text())
        stored['pages'][0]['text'] = None
        doc_path.write_text(json.dumps(stored))
        code, written, log = self.run_parse(down={TENTATIVE})
        self.assertEqual(code, 0)
        self.assertEqual([d['slug'] for d in written['index.json']['documents']], [CPF])
        [failure] = written['index.json']['failures']
        self.assertIn('could not be reused', failure['error'])
        self.assertFalse(any(r['slug'] == TENTATIVE for r in written['search-index.json']['records']))

    def test_a_query_string_on_either_side_still_finds_the_last_parse(self):
        # The Town's links sometimes end in "?bidId=". Both the saved entries
        # and the lookup drop the query string, so it never hides a last parse.
        tentative, cpf = LINKS
        for before, now in (('?bidId=', '?bidId='), ('', '?bidId='), ('?bidId=', '')):
            with self.subTest(before=before, now=now):
                (self.root / 'out' / 'index.json').unlink(missing_ok=True)
                self.run_parse(links=[pap.Link(**{**asdict(tentative), 'url': tentative.url + before}), cpf])
                _, written, _ = self.run_parse(down={TENTATIVE}, links=[pap.Link(**{**asdict(tentative), 'url': tentative.url + now}), cpf])
                self.assertIn(TENTATIVE, [d['slug'] for d in written['index.json']['documents']])

    def test_a_new_document_that_times_out_is_left_out_and_named(self):
        code, written, log = self.run_parse(down={TENTATIVE})
        self.assertEqual(code, 0)
        self.assertEqual([d['slug'] for d in written['index.json']['documents']], [CPF])
        [failure] = written['index.json']['failures']
        self.assertNotIn('is kept', failure['error'])
        self.assertNotIn('::warning', log)
        self.assertFalse(any(r['slug'] == TENTATIVE for r in written['search-index.json']['records']))


class DownloadRetryTests(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.TemporaryDirectory()
        self.addCleanup(self.dir.cleanup)
        patcher = mock.patch.object(pap, 'CACHE', Path(self.dir.name))
        patcher.start()
        self.addCleanup(patcher.stop)

    def response(self, status=200):
        r = requests.Response()
        r.status_code = status
        r._content = b'%PDF-1.4' if status == 200 else b'Not Found'
        r.headers['content-type'] = 'application/pdf' if status == 200 else 'text/html'
        r.url = LINKS[0].url
        return r

    def test_a_blip_then_the_file(self):
        with mock.patch.object(pap.requests, 'get', side_effect=[requests.ConnectTimeout('timed out'), self.response()]) as get, \
                mock.patch.object(pap.time, 'sleep') as sleep, redirect_stdout(io.StringIO()):
            path = pap.download(LINKS[0])
        self.assertEqual(path.read_bytes(), b'%PDF-1.4')
        self.assertEqual(get.call_count, 2)
        sleep.assert_called_once_with(pap.RETRY_WAITS[0])

    def test_three_timeouts_give_up(self):
        with mock.patch.object(pap.requests, 'get', side_effect=requests.ConnectTimeout('timed out')) as get, \
                mock.patch.object(pap.time, 'sleep') as sleep, redirect_stdout(io.StringIO()):
            with self.assertRaises(requests.ConnectTimeout):
                pap.download(LINKS[0])
        self.assertEqual(get.call_count, 1 + len(pap.RETRY_WAITS))
        self.assertEqual([c.args[0] for c in sleep.call_args_list], list(pap.RETRY_WAITS))

    def test_a_missing_file_is_not_tried_again(self):
        with mock.patch.object(pap.requests, 'get', return_value=self.response(404)) as get, \
                mock.patch.object(pap.time, 'sleep') as sleep:
            with self.assertRaises(requests.HTTPError):
                pap.download(LINKS[0])
        self.assertEqual(get.call_count, 1)
        sleep.assert_not_called()


if __name__ == '__main__':
    unittest.main()
