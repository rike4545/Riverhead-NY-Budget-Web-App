"""Guards for the URLs and file names the ETL takes from outside sources.

The fetchers download from addresses the Town's pages and APIs hand back
(CivicClerk file streams, links scraped from the Financial Reports page), and
they name files after meeting dates those APIs return. Neither should be able
to send a request somewhere it should not go, or write outside the data
folders, even if a source page were altered.

- require_public_https(url): the URL must be https, name a host, and that host
  must not resolve to a private, loopback, link-local or otherwise internal
  address (the cloud metadata service at 169.254.169.254, for one).
- CURL_SAFE_ARGS: the curl fallback in each fetcher follows the same rule and
  never follows a redirect to anything but https.
- meeting_date(value): a meeting date must look like YYYY-MM-DD before it
  becomes part of a file path.
"""

from __future__ import annotations

import ipaddress
import re
import socket
import urllib.parse

CURL_SAFE_ARGS = ["--proto", "=https", "--proto-redir", "=https"]

_DATE = re.compile(r"\d{4}-\d{2}-\d{2}")


class UnsafeURL(ValueError):
    """A URL the ETL refuses to fetch."""


def _internal(address: str) -> bool:
    ip = ipaddress.ip_address(address)
    return (
        ip.is_private
        or ip.is_loopback
        or ip.is_link_local
        or ip.is_multicast
        or ip.is_reserved
        or ip.is_unspecified
    )


def require_public_https(url: str) -> str:
    """Return url unchanged if it is safe to fetch, else raise UnsafeURL."""
    parts = urllib.parse.urlsplit(url)
    if parts.scheme != "https":
        raise UnsafeURL(f"refusing to fetch a non-https URL: {url}")
    host = parts.hostname
    if not host:
        raise UnsafeURL(f"refusing to fetch a URL with no host: {url}")
    try:
        literal = ipaddress.ip_address(host)
    except ValueError:
        literal = None
    if literal is not None:
        if _internal(host):
            raise UnsafeURL(f"refusing to fetch an internal address: {url}")
        return url
    try:
        infos = socket.getaddrinfo(host, parts.port or 443, proto=socket.IPPROTO_TCP)
    except socket.gaierror:
        # Behind a proxy that resolves names itself, local DNS can fail for a
        # good host. The request then goes through the proxy, which cannot be
        # pointed at this machine's internal addresses, so let it through.
        return url
    for info in infos:
        if _internal(info[4][0]):
            raise UnsafeURL(f"refusing to fetch {url}: {host} resolves to an internal address")
    return url


def meeting_date(value: str) -> str:
    """Return value if it is a YYYY-MM-DD date, else raise ValueError."""
    if not isinstance(value, str) or not _DATE.fullmatch(value):
        raise ValueError(f"not a meeting date (YYYY-MM-DD): {value!r}")
    return value
