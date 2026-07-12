import os
from pathlib import Path

from .file_loader import load_file, is_text_file, is_pdf

IGNORE_DIRS = {"node_modules", ".git", "dist", "build", ".next", "coverage", ".contextlane"}
IGNORE_FILES = {"package-lock.json", "yarn.lock", "pnpm-lock.yaml", ".DS_Store"}


def load_folder(folder_path: str) -> list:
    items = []
    folder_path = str(Path(folder_path).resolve())

    for root, dirs, files in os.walk(folder_path):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]

        for f_name in files:
            if f_name in IGNORE_FILES:
                continue
            ext = Path(f_name).suffix.lower()
            if not is_text_file(ext) and ext != ".pdf":
                continue

            full_path = os.path.join(root, f_name)
            rel_path = os.path.relpath(full_path, folder_path)
            try:
                file = load_file(full_path, force=True)
                items.append({
                    "path": full_path,
                    "relative_path": rel_path,
                    "text": file["text"],
                    "lines": file["lines"],
                    "ext": file["ext"],
                })
            except Exception:
                continue

    return items
