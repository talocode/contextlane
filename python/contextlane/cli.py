import argparse
import asyncio
import os
import sys

from .core.orchestrator import (
    ingest,
    list_runs,
    load_run_ as load_run,
    search_ as search,
    export_run_ as do_export,
    import_run_ as do_import,
    sync_memory_lane,
)
from .core.config_store import get_contextlane_home, get_runs_dir
from .core.errors import ContextLaneError


def cmd_init(_):
    os.makedirs(get_runs_dir(), exist_ok=True)
    print(f"ContextLane initialized at {get_contextlane_home()}")


def cmd_doctor(_):
    print(f"ContextLane home: {get_contextlane_home()}")
    print(f"Runs dir: {get_runs_dir()}")
    print(f"MemoryLane URL: {os.environ.get('CONTEXTLANE_MEMORYLANE_URL', 'not set')}")
    print(f"Cloud mode: {os.environ.get('CONTEXTLANE_CLOUD_MODE', 'false')}")
    print(f"Python version: {sys.version}")


def cmd_demo(_):
    print("ContextLane Demo\n")
    demo_text = """# Sample Project Context
This is a demonstration of ContextLane ingestion.
We need to implement user authentication.
TODO: Add login page
FIXME: Fix password hashing
Decision: We chose JWT over sessions.
The project uses TypeScript and React.
https://example.com/docs
@talocode/contextlane is the product."""

    print("Ingesting demo content...\n")
    run = asyncio.run(ingest(demo_text, source_type="text"))
    print(f"Run ID: {run['id']}")
    print(f"Sources: {len(run['sources'])}")
    print(f"Chunks: {len(run['chunks'])}")
    print(f"\nSummary: {run['extraction']['summary']}")
    print(f"\nFacts ({len(run['extraction']['facts'])}):")
    for f in run["extraction"]["facts"][:5]:
        print(f"  - {f['text'][:80]}")
    print(f"\nDecisions ({len(run['extraction']['decisions'])}):")
    for d in run["extraction"]["decisions"]:
        print(f"  - [{d['status']}] {d['text'][:80]}")
    print(f"\nActions ({len(run['extraction']['actions'])}):")
    for a in run["extraction"]["actions"]:
        print(f"  - [{a['priority']}] {a['text'][:80]}")
    print(f"\nEntities ({len(run['extraction']['entities'])}):")
    for e in run["extraction"]["entities"]:
        print(f"  - {e['name']} ({e['type']}, {e['mentions']} mentions)")
    print(f"\nTags: {', '.join(run['extraction']['tags'])}")
    print(f"\nMemory records: {len(run['memory_records'])}")
    print(f"\nArtifacts saved to: {get_contextlane_home()}/runs/{run['id']}/")
    print(f"\nTo sync to MemoryLane:\n  contextlane sync memorylane {run['id']}")


def cmd_ingest(args):
    print(f"Ingesting: {args.input}")
    if args.sync:
        sync = True
    else:
        sync = False
    run = asyncio.run(ingest(args.input, sync_to_memory_lane=sync))
    print(f"Run ID: {run['id']}")
    print(f"Sources: {len(run['sources'])}")
    print(f"Chunks: {len(run['chunks'])}")
    print(f"Facts: {len(run['extraction']['facts'])}")
    print(f"Decisions: {len(run['extraction']['decisions'])}")
    print(f"Actions: {len(run['extraction']['actions'])}")
    print(f"Entities: {len(run['extraction']['entities'])}")


def cmd_ingest_url(args):
    print(f"Ingesting URL: {args.url}")
    if args.sync:
        sync = True
    else:
        sync = False
    run = asyncio.run(ingest(args.url, source_type="url", sync_to_memory_lane=sync))
    title = run["sources"][0].get("title", "unknown") if run["sources"] else "unknown"
    print(f"Run ID: {run['id']}")
    print(f"Title: {title}")
    print(f"Chunks: {len(run['chunks'])}")


def cmd_ingest_github(args):
    print(f"Cloning and ingesting: {args.repo_url}")
    if args.sync:
        sync = True
    else:
        sync = False
    run = asyncio.run(ingest(args.repo_url, source_type="github", sync_to_memory_lane=sync))
    print(f"Run ID: {run['id']}")
    print(f"Files ingested: {len(run['sources'])}")
    print(f"Chunks: {len(run['chunks'])}")


def cmd_sources_list(_):
    runs = list_runs()
    if not runs:
        print("No runs found.")
        return
    run = load_run(runs[0]["id"])
    for s in run["sources"]:
        print(f"{s['type']:8} {s.get('title') or s['input']}")


def cmd_runs_list(_):
    runs = list_runs()
    if not runs:
        print("No runs found.")
        return
    for r in runs:
        print(f"{r['id']:30} {r['source_count']} sources, {r['fact_count']} facts ({r['created_at']})")


def cmd_runs_show(args):
    run = load_run(args.run_id)
    print(f"Run: {run['id']}")
    print(f"Created: {run['created_at']}")
    print(f"Sources: {len(run['sources'])}")
    print(f"Chunks: {len(run['chunks'])}")
    print(f"Facts: {len(run['extraction']['facts'])}")
    print(f"Decisions: {len(run['extraction']['decisions'])}")
    print(f"Actions: {len(run['extraction']['actions'])}")
    print(f"Entities: {len(run['extraction']['entities'])}")
    print(f"Tags: {', '.join(run['extraction']['tags'])}")


def cmd_search(args):
    limit = args.limit or 5
    results = search(args.query, limit)
    if not results:
        print("No results found.")
        return
    for r in results:
        print(f"[{r['run_id']}] (score: {r['score']})")
        print(f"  {r['chunk']['text'][:120]}...")
        print(f"  {r['chunk']['citation']}\n")


def cmd_recall(args):
    limit = args.limit or 5
    results = search(args.query, limit)
    if not results:
        print("Nothing relevant found.")
        return
    for r in results:
        print(f"[{r['run_id']}] {r['chunk']['text'][:200]}")
        print(f"  {r['chunk']['citation']}\n")


def cmd_sync_memorylane(args):
    run = load_run(args.run_id)
    print(f"Syncing {len(run.get('memory_records', []))} records to MemoryLane...")
    result = asyncio.run(sync_memory_lane(args.run_id))
    print(f"Saved: {result['saved']}")
    print(f"Failed: {result['failed']}")
    print(f"Method: {result['method']}")
    for e in result.get("errors", []):
        print(f"  {e}", file=sys.stderr)


def cmd_export(args):
    out = args.out or "contextlane-export.json"
    do_export(args.run_id, out)
    print(f"Exported {args.run_id} to {out}")


def cmd_import(args):
    run = do_import(args.path)
    print(f"Imported run: {run['id']}")


def cmd_serve(args):
    port = args.port or 3060
    try:
        from .server import start_server
    except ImportError:
        print("Server module not available. Install with: pip install contextlane[server]")
        return
    start_server(port)


def main():
    parser = argparse.ArgumentParser(
        prog="contextlane",
        description="Context ingestion pipeline for persistent AI agents",
    )
    parser.add_argument("--version", action="version", version="0.2.0")
    sub = parser.add_subparsers(dest="command")

    p_init = sub.add_parser("init", help="Initialize ContextLane config directory")
    p_init.set_defaults(func=cmd_init)

    p_doctor = sub.add_parser("doctor", help="Check system dependencies and paths")
    p_doctor.set_defaults(func=cmd_doctor)

    p_demo = sub.add_parser("demo", help="Run a demo ingestion")
    p_demo.set_defaults(func=cmd_demo)

    p_ingest = sub.add_parser("ingest", help="Ingest a file, folder, or URL")
    p_ingest.add_argument("input", help="File path, folder path, or URL")
    p_ingest.add_argument("--sync", action="store_true", help="Sync to MemoryLane")
    p_ingest.set_defaults(func=cmd_ingest)

    p_ingest_url = sub.add_parser("ingest-url", help="Ingest a URL")
    p_ingest_url.add_argument("url", help="URL to ingest")
    p_ingest_url.add_argument("--sync", action="store_true", help="Sync to MemoryLane")
    p_ingest_url.set_defaults(func=cmd_ingest_url)

    p_ingest_gh = sub.add_parser("ingest-github", help="Ingest a GitHub repository")
    p_ingest_gh.add_argument("repo_url", help="GitHub repo URL")
    p_ingest_gh.add_argument("--sync", action="store_true", help="Sync to MemoryLane")
    p_ingest_gh.set_defaults(func=cmd_ingest_github)

    p_sources = sub.add_parser("sources", help="Source commands")
    sources_sub = p_sources.add_subparsers(dest="subcommand")
    p_sources_list = sources_sub.add_parser("list", help="List sources from the latest run")
    p_sources_list.set_defaults(func=cmd_sources_list)

    p_runs = sub.add_parser("runs", help="Run commands")
    runs_sub = p_runs.add_subparsers(dest="subcommand")
    p_runs_list = runs_sub.add_parser("list", help="List all runs")
    p_runs_list.set_defaults(func=cmd_runs_list)
    p_runs_show = runs_sub.add_parser("show", help="Show details of a run")
    p_runs_show.add_argument("run_id", help="Run ID")
    p_runs_show.set_defaults(func=cmd_runs_show)

    p_search = sub.add_parser("search", help="Search across all ingested context")
    p_search.add_argument("query", help="Search query")
    p_search.add_argument("-l", "--limit", type=int, default=5, help="Result limit")
    p_search.set_defaults(func=cmd_search)

    p_recall = sub.add_parser("recall", help="Recall context matching a query")
    p_recall.add_argument("query", help="Query string")
    p_recall.add_argument("-l", "--limit", type=int, default=5, help="Result limit")
    p_recall.set_defaults(func=cmd_recall)

    p_sync = sub.add_parser("sync", help="Sync commands")
    sync_sub = p_sync.add_subparsers(dest="subcommand")
    p_sync_ml = sync_sub.add_parser("memorylane", help="Sync a run to MemoryLane")
    p_sync_ml.add_argument("run_id", help="Run ID to sync")
    p_sync_ml.set_defaults(func=cmd_sync_memorylane)

    p_export = sub.add_parser("export", help="Export a run to a JSON file")
    p_export.add_argument("run_id", help="Run ID")
    p_export.add_argument("-o", "--out", default="contextlane-export.json", help="Output path")
    p_export.set_defaults(func=cmd_export)

    p_import = sub.add_parser("import", help="Import a run from a JSON file")
    p_import.add_argument("path", help="Path to import file")
    p_import.set_defaults(func=cmd_import)

    p_serve = sub.add_parser("serve", help="Start the local HTTP API server")
    p_serve.add_argument("-p", "--port", type=int, default=3060, help="Port to listen on")
    p_serve.set_defaults(func=cmd_serve)

    args = parser.parse_args()
    if not args.command:
        parser.print_help()
        sys.exit(1)

    try:
        args.func(args)
    except ContextLaneError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
    except KeyboardInterrupt:
        sys.exit(0)


if __name__ == "__main__":
    main()
