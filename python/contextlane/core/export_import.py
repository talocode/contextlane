import json
import os
from .artifact_store import load_run, save_run


def export_run(run_id: str, out_path: str) -> None:
    run = load_run(run_id)
    with open(out_path, "w") as f:
        json.dump(run, f, indent=2, default=str)


def import_run(in_path: str) -> dict:
    if not os.path.isfile(in_path):
        raise FileNotFoundError(f"File not found: {in_path}")
    with open(in_path) as f:
        run = json.load(f)
    save_run(run)
    return run
