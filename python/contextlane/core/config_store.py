import os
from pathlib import Path


def get_contextlane_home() -> str:
    return os.environ.get("CONTEXTLANE_HOME", str(Path.home() / ".contextlane"))


def get_runs_dir() -> str:
    d = Path(get_contextlane_home()) / "runs"
    d.mkdir(parents=True, exist_ok=True)
    return str(d)


def get_run_dir(run_id: str) -> str:
    d = Path(get_runs_dir()) / run_id
    d.mkdir(parents=True, exist_ok=True)
    return str(d)
