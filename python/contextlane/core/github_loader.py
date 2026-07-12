import subprocess
import tempfile
import os

from .folder_loader import load_folder


def load_github(repo_url: str) -> dict:
    repo_name = repo_url.rstrip(".git").split("/")[-2:]
    repo_name = "/".join(repo_name)

    clone_dir = tempfile.mkdtemp(prefix="ctxlane-")
    try:
        subprocess.run(
            ["git", "clone", "--depth", "1", repo_url, clone_dir],
            capture_output=True, text=True, timeout=60, check=True,
        )
    except subprocess.CalledProcessError as e:
        raise RuntimeError(f"Failed to clone repo: {repo_url}. Error: {e.stderr}")
    except FileNotFoundError:
        raise RuntimeError("git not found. Install git to use GitHub ingestion.")

    items = load_folder(clone_dir)
    return {"repo": repo_name, "items": items, "clone_dir": clone_dir}
