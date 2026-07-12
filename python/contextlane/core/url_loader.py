import re
import urllib.request
import urllib.error


def load_url(url: str) -> dict:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "ContextLane/0.2.0 (context ingestion; +https://github.com/talocode/contextlane)",
            "Accept": "text/html,application/xhtml+xml",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            html = resp.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"HTTP {e.code}: {e.reason}")
    except urllib.error.URLError as e:
        raise RuntimeError(f"URL error: {e.reason}")

    text = _extract_text(html)
    title = _extract_title(html)
    return {"text": text, "url": url, "title": title}


def _extract_text(html: str) -> str:
    text = html
    for tag in ["script", "style", "nav", "footer", "header", "aside", "form", "svg"]:
        text = re.sub(f"<{tag}[^>]*>.*?</{tag}>", " ", text, flags=re.DOTALL | re.IGNORECASE)

    text = re.sub(r"<\/(p|div|h[1-6]|li|blockquote|section|article|pre|tr|th|td|br|hr)\s*>", "\n", text, flags=re.IGNORECASE)
    text = re.sub(r"<[^>]+>", " ", text)

    # entities
    text = text.replace("&nbsp;", " ").replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")
    text = text.replace("&quot;", '"').replace("&#39;", "'").replace("&#x27;", "'").replace("&#x2F;", "/")
    text = re.sub(r"&#\d+;", " ", text)

    text = re.sub(r"\r\n", "\n", text)
    text = re.sub(r"\r", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"[ \t]+", " ", text)

    lines = [l.strip() for l in text.split("\n") if len(l.strip()) > 2]
    return "\n".join(lines)


def _extract_title(html: str) -> str | None:
    m = re.search(r"<title[^>]*>([^<]+)</title>", html, re.IGNORECASE)
    if m:
        return m.group(1).strip()
    m = re.search(r'<meta[^>]+property="og:title"[^>]+content="([^"]+)"', html, re.IGNORECASE)
    if m:
        return m.group(1).strip()
    m = re.search(r"<h1[^>]*>([^<]+)</h1>", html, re.IGNORECASE)
    if m:
        return m.group(1).strip()
    return None
