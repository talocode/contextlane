import os
import subprocess
from pathlib import Path

from .errors import SourceNotFound, SourceTooLarge

TEXT_EXTENSIONS = {
    ".md", ".txt", ".json", ".csv", ".js", ".ts", ".tsx", ".jsx", ".py", ".rb",
    ".go", ".rs", ".java", ".c", ".cpp", ".h", ".hpp", ".css", ".scss", ".html",
    ".yaml", ".yml", ".toml", ".xml", ".sh", ".bash", ".zsh", ".fish", ".ps1",
    ".env", ".cfg", ".ini", ".conf", ".sql", ".r", ".mjs", ".cjs", ".mts", ".cts",
    ".vue", ".svelte", ".astro", ".mdx",
}

MAX_SIZE = 10 * 1024 * 1024
PDF_MAX_SIZE = 50 * 1024 * 1024


def is_text_file(ext: str) -> bool:
    return ext.lower() in TEXT_EXTENSIONS


def is_pdf(path: str) -> bool:
    return path.lower().endswith(".pdf")


def load_file(path: str, force: bool = False) -> dict:
    if not force:
        try:
            s = os.stat(path)
        except FileNotFoundError:
            raise SourceNotFound(path)
        if not os.path.isfile(path):
            raise SourceNotFound(path)
        limit = PDF_MAX_SIZE if is_pdf(path) else MAX_SIZE
        if s.st_size > limit:
            raise SourceTooLarge(path, s.st_size, limit)

    ext = Path(path).suffix.lower()

    if is_pdf(path):
        return _load_pdf(path, force)

    with open(path, "r", encoding="utf-8", errors="replace") as f:
        text = f.read()
    lines = text.split("\n")
    return {"text": text, "lines": lines, "path": path, "ext": ext}


def _load_pdf(path: str, force: bool = False) -> dict:
    """Extract text using pdftotext."""
    try:
        subprocess.run(["which", "pdftotext"], capture_output=True, check=True)
    except subprocess.CalledProcessError:
        raise RuntimeError(
            "pdftotext not found. Install poppler-utils:\n"
            "  macOS: brew install poppler\n"
            "  Linux: apt-get install poppler-utils\n"
            "  Windows: choco install poppler"
        )

    result = subprocess.run(
        ["pdftotext", path, "-"],
        capture_output=True, text=True, timeout=30,
    )
    text = result.stdout.strip()
    lines = text.split("\n")
    return {"text": text, "lines": lines, "path": path, "ext": ".pdf"}
