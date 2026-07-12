import os
from pathlib import Path


def detect_source(input_str: str) -> tuple:
    """Returns (type, resolved_input)."""
    if input_str.startswith("https://github.com/") or input_str.startswith("http://github.com/"):
        return ("github", input_str)

    if input_str.startswith("http://") or input_str.startswith("https://"):
        return ("url", input_str)

    p = Path(input_str)
    if p.exists():
        if p.is_dir():
            return ("folder", str(p.resolve()))
        return ("file", str(p.resolve()))

    return ("url", input_str)
