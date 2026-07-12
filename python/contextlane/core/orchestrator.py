import os
import time

from .ids import generate_run_id, generate_source_id
from .source_detector import detect_source
from .file_loader import load_file
from .folder_loader import load_folder
from .url_loader import load_url
from .github_loader import load_github
from .chunker import chunk_text_string
from .extractor import extract
from .artifact_store import save_run, load_run, list_runs as _list_runs
from .memorylane_sync import sync_to_memory_lane as _sync
from .export_import import export_run as _export, import_run as _import
from .search import search as _search
from .memory_records_builder import build_memory_records


async def ingest(input_str: str, source_type: str = None, sync_to_memory_lane: bool = False) -> dict:
    if source_type is None:
        source_type, resolved = detect_source(input_str)
    else:
        resolved = input_str

    run_id = generate_run_id()
    all_chunks = []
    all_citations = []
    sources = []

    if source_type == "file":
        file = load_file(resolved)
        label = os.path.basename(resolved)
        source_id = generate_source_id()
        sources.append({"id": source_id, "type": "file", "input": resolved, "title": label, "path": resolved, "loaded_at": time.ctime()})
        result = chunk_text_string(file["text"], source_id, label, resolved)
        all_chunks.extend(result["chunks"])
        all_citations.extend(result["citations"])

    elif source_type == "folder":
        items = load_folder(resolved)
        for item in items:
            item_source_id = generate_source_id()
            sources.append({"id": item_source_id, "type": "file", "input": item["path"], "title": item["relative_path"], "path": item["path"], "loaded_at": time.ctime()})
            result = chunk_text_string(item["text"], item_source_id, item["relative_path"], item["path"])
            all_chunks.extend(result["chunks"])
            all_citations.extend(result["citations"])

    elif source_type == "url":
        loaded = load_url(resolved)
        source_id = generate_source_id()
        sources.append({"id": source_id, "type": "url", "input": resolved, "title": loaded.get("title"), "url": resolved, "loaded_at": time.ctime()})
        result = chunk_text_string(loaded["text"], source_id, loaded.get("title") or resolved, None, resolved)
        all_chunks.extend(result["chunks"])
        all_citations.extend(result["citations"])

    elif source_type == "github":
        loaded = load_github(resolved)
        for item in loaded["items"]:
            item_source_id = generate_source_id()
            sources.append({"id": item_source_id, "type": "file", "input": item["path"], "title": item["relative_path"], "path": item["path"], "loaded_at": time.ctime()})
            result = chunk_text_string(item["text"], item_source_id, item["relative_path"], item["path"])
            all_chunks.extend(result["chunks"])
            all_citations.extend(result["citations"])

    elif source_type == "text":
        source_id = generate_source_id()
        sources.append({"id": source_id, "type": "text", "input": resolved, "title": "inline-text", "loaded_at": time.ctime()})
        result = chunk_text_string(resolved, source_id, "inline-text")
        all_chunks.extend(result["chunks"])
        all_citations.extend(result["citations"])

    extraction = extract(run_id, all_chunks, all_citations)
    memory_records = build_memory_records(run_id, sources, all_chunks, extraction)

    run = {
        "id": run_id,
        "sources": sources,
        "chunks": all_chunks,
        "extraction": extraction,
        "memory_records": memory_records,
        "created_at": time.ctime(),
    }

    save_run(run)

    if sync_to_memory_lane:
        sync_result = await _sync(memory_records)
        print(f"MemoryLane sync: {sync_result['saved']} saved, {sync_result['failed']} failed (via {sync_result['method']})", file=__import__("sys").stderr)

    return run


def load_run_(run_id: str) -> dict:
    return load_run(run_id)


def list_runs() -> list:
    return _list_runs()


def search_(query: str, limit: int = 5) -> list:
    return _search(query, limit)


def export_run_(run_id: str, out_path: str) -> None:
    return _export(run_id, out_path)


def import_run_(in_path: str) -> dict:
    return _import(in_path)


async def sync_memory_lane(run_id: str) -> dict:
    run = load_run(run_id)
    return await _sync(run["memory_records"])
