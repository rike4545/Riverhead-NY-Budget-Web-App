"""Tests for etl/safe_http.py. Run: python3 etl/test_safe_http.py"""

import socket
import unittest
from unittest import mock

from safe_http import UnsafeURL, meeting_date, require_public_https


def resolves_to(address):
    return mock.patch.object(
        socket, "getaddrinfo",
        return_value=[(socket.AF_INET, socket.SOCK_STREAM, 6, "", (address, 443))],
    )


class RequirePublicHttps(unittest.TestCase):
    def test_public_https_passes(self):
        with resolves_to("93.184.216.34"):
            url = "https://riverheadny.api.civicclerk.com/v1/Events"
            self.assertEqual(require_public_https(url), url)

    def test_other_schemes_refused(self):
        for url in ("http://townofriverheadny.gov/", "file:///etc/passwd", "ftp://example.com/x"):
            with self.subTest(url=url), self.assertRaises(UnsafeURL):
                require_public_https(url)

    def test_internal_literals_refused(self):
        for url in ("https://127.0.0.1/", "https://169.254.169.254/latest/meta-data/",
                    "https://10.0.0.5/", "https://[::1]/"):
            with self.subTest(url=url), self.assertRaises(UnsafeURL):
                require_public_https(url)

    def test_name_resolving_inside_refused(self):
        with resolves_to("192.168.1.10"), self.assertRaises(UnsafeURL):
            require_public_https("https://looks-public.example/")

    def test_unresolvable_name_allowed_for_proxies(self):
        with mock.patch.object(socket, "getaddrinfo", side_effect=socket.gaierror):
            require_public_https("https://www.townofriverheadny.gov/206/Financial-Reports")

    def test_no_host_refused(self):
        with self.assertRaises(UnsafeURL):
            require_public_https("https:///path-only")


class MeetingDate(unittest.TestCase):
    def test_valid(self):
        self.assertEqual(meeting_date("2026-11-18"), "2026-11-18")

    def test_traversal_and_junk_refused(self):
        for value in ("../../etc", "2026-11-18/../x", "2026-1-8", "", None):
            with self.subTest(value=value), self.assertRaises(ValueError):
                meeting_date(value)


if __name__ == "__main__":
    unittest.main()
