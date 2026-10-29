// Live data that a page fetches in the browser can fail in a few distinct ways,
// and each tells the reader something different: the State's site is down, it
// is turning requests away, or this site asked for something wrong. Errors
// thrown here keep which one it was, so a page can say what happened and what
// to do, instead of showing a status code.
//
// The rule they follow is in .claude/references/ux-writing.md: every error says
// what happened, why if known, and what to do next.

export type SourceName = 'state' | 'site'
export type FailureKind = 'unreachable' | 'busy' | 'server' | 'request'

export class SourceError extends Error {
  constructor(
    readonly source: SourceName,
    readonly kind: FailureKind,
    readonly status?: number,
  ) {
    super(`${source === 'state' ? 'data.ny.gov' : 'site data'} ${kind}${status ? ` (HTTP ${status})` : ''}`)
    this.name = 'SourceError'
  }
}

/** Fetch JSON, turning each kind of failure into a SourceError. */
export async function fetchJSON<T = unknown>(url: string, source: SourceName): Promise<T> {
  let response: Response
  try {
    response = await fetch(url)
  } catch (e) {
    if ((e as { name?: string }).name === 'AbortError') throw e
    throw new SourceError(source, 'unreachable')
  }
  if (!response.ok) {
    const kind: FailureKind = response.status === 429 ? 'busy' : response.status >= 500 ? 'server' : 'request'
    throw new SourceError(source, kind, response.status)
  }
  try {
    return (await response.json()) as T
  } catch {
    throw new SourceError(source, 'server', response.status)
  }
}

/** Why it failed, in a sentence a resident can act on, and a short technical note. */
export function explainFailure(error: unknown): { why: string; detail: string | null } {
  if (error instanceof SourceError) {
    const code = error.status ? ` (HTTP ${error.status})` : ''
    if (error.source === 'state') {
      switch (error.kind) {
        case 'unreachable': return { why: 'New York’s open data site, data.ny.gov, did not answer. Your connection or the State’s site may be down.', detail: null }
        case 'busy': return { why: 'data.ny.gov is limiting requests right now. Waiting a minute usually clears it.', detail: `HTTP ${error.status}` }
        case 'server': return { why: `data.ny.gov had an error on its end${code}. It is usually brief.`, detail: null }
        case 'request': return { why: `data.ny.gov turned the request down${code}. That points to a problem with this page, not with anything you did.`, detail: null }
      }
    }
    return error.kind === 'unreachable'
      ? { why: 'This site’s own data file did not load. Your connection may have dropped.', detail: null }
      : { why: `This site’s own data file did not load${code}.`, detail: null }
  }
  return {
    why: 'An unexpected error in this page stopped it.',
    detail: error instanceof Error && error.message ? error.message : null,
  }
}
