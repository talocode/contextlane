import json
import os
from pathlib import Path

from .config_store import get_runs_dir, get_run_dir
from .errors import RunNotFound


def save_run(run: dict) -> None:
    run_dir = get_run_dir(run["id"])

    def write(name: str, data) -> None:
        path = os.path.join(run_dir, name)
        if isinstance(data, str):
            with open(path, "w") as f:
                f.write(data)
        else:
            with open(path, "w") as f:
                json.dump(data, f, indent=2, default=str)

    write("run.json", {"id": run["id"], "created_at": run["created_at"]})
    write("sources.json", run["sources"])
    write("chunks.json", run["chunks"])
    write("summary.md", _summary_md(run))
    write("facts.json", run["extraction"]["facts"])
    write("decisions.json", run["extraction"]["decisions"])
    write("actions.json", run["extraction"]["actions"])
    write("entities.json", run["extraction"]["entities"])
    write("citations.json", run["extraction"]["citations"])
    write("memory-records.json", run["memory_records"])
    write("report.md", _report_md(run))


def _summary_md(run: dict) -> str:
    e = run["extraction"]
    md = f"# ContextLane Run: {run['id']}\n\n"
    md += f"**Sources:** {len(run['sources'])}\n"
    md += f"**Chunks:** {len(run['chunks'])}\n"
    md += f"**Facts:** {len(e['facts'])}\n"
    md += f"**Decisions:** {len(e['decisions'])}\n"
    md += f"**Actions:** {len(e['actions'])}\n"
    md += f"**Entities:** {len(e['entities'])}\n"
    md += f"**Tags:** {', '.join(e['tags'])}\n\n"
    md += f"## Summary\n\n{e['summary']}\n\n"
    md += "## Sources\n\n"
    for s in run["sources"]:
        md += f"- {s['type']}: {s['input']}\n"
    return md


def _report_md(run: dict) -> str:
    e = run["extraction"]
    md = f"# ContextLane Report\n\nRun ID: {run['id']}\nCreated: {run['created_at']}\n\n"
    md += f"## Summary\n\n{e['summary']}\n\n"
    if e["facts"]:
        md += "## Facts\n\n" + "\n".join(f"- {f['text']}" for f in e["facts"]) + "\n\n"
    if e["decisions"]:
        md += "## Decisions\n\n" + "\n".join(f"- [{d['status']}] {d['text']}" for d in e["decisions"]) + "\n\n"
    if e["actions"]:
        md += "## Actions\n\n" + "\n".join(f"- [{a['priority']}] {a['text']}" for a in e["actions"]) + "\n\n"
    if e["entities"]:
        md += "## Entities\n\n" + "\n".join(f"- {en['name']} ({en['type']}, {en['mentions']} mentions)" for en in e["entities"]) + "\n\n"
    return md


def load_run(run_id: str) -> dict:
    run_dir = get_run_dir(run_id)
    if not os.path.isdir(run_dir):
        raise RunNotFound(run_id)

    def read_json(name: str) -> list:
        with open(os.path.join(run_dir, name)) as f:
            return json.load(f)

    run_meta = read_json("run.json")
    return {
        "id": run_id,
        "sources": read_json("sources.json"),
        "chunks": read_json("chunks.json"),
        "extraction": {
            "run_id": run_id,
            "summary": open(os.path.join(run_dir, "summary.md")).read(),
            "facts": read_json("facts.json"),
            "decisions": read_json("decisions.json"),
            "actions": read_json("actions.json"),
            "entities": read_json("entities.json"),
            "tags": [],
            "citations": read_json("citations.json"),
            "created_at": run_meta["created_at"],
        },
        "memory_records": read_json("memory-records.json"),
        "created_at": run_meta["created_at"],
    }


def list_runs() -> list:
    runs_dir = get_runs_dir()
    if not os.path.isdir(runs_dir):
        return []

    runs = []
    for entry in os.scandir(runs_dir):
        if entry.is_dir():
            run_json = os.path.join(entry.path, "run.json")
            if os.path.isfile(run_json):
                with open(run_json) as f:
                    meta = json.load(f)
                sources = json.load(open(os.path.join(entry.path, "sources.json")))
                facts = json.load(open(os.path.join(entry.path, "facts.json")))
                entities = json.load(open(os.path.join(entry.path, "entities.json")))
                chunks = json.load(open(os.path.join(entry.path, "chunks.json")))
                runs.append({
                    "id": entry.name,
                    "source_count": len(sources),
                    "chunk_count": len(chunks),
                    "fact_count": len(facts),
                    "entity_count": len(entities),
                    "created_at": meta["created_at"],
                })

    runs.sort(key=lambda r: r["created_at"], reverse=True)
    return runs
