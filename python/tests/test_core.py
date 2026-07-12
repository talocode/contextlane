import json
import os
import tempfile
import pytest

from contextlane.core.ids import (
    generate_run_id, generate_source_id, generate_chunk_id,
    generate_fact_id, generate_decision_id, generate_action_id,
    generate_entity_id, generate_citation_id,
)
from contextlane.core.source_detector import detect_source
from contextlane.core.file_loader import load_file, is_text_file
from contextlane.core.chunker import chunk_text_string
from contextlane.core.extractor import extract
from contextlane.core.artifact_store import save_run, load_run, list_runs
from contextlane.core.export_import import export_run, import_run
from contextlane.core.search import search
from contextlane.core.memory_records_builder import build_memory_records
from contextlane.sdk import ContextLaneClient, create_context_lane_client


class TestIDs:
    def test_generate_run_id(self):
        rid = generate_run_id()
        assert rid.startswith("ctx_")
        assert len(rid) > 10

    def test_generate_source_id(self):
        sid = generate_source_id()
        assert sid.startswith("src_")

    def test_generate_chunk_id(self):
        cid = generate_chunk_id()
        assert cid.startswith("chk_")

    def test_all_ids_unique(self):
        ids = [generate_run_id() for _ in range(100)]
        assert len(set(ids)) == 100


class TestSourceDetector:
    def test_detect_github(self):
        t, r = detect_source("https://github.com/user/repo")
        assert t == "github"

    def test_detect_url(self):
        t, r = detect_source("https://example.com/page")
        assert t == "url"

    def test_detect_file(self):
        with tempfile.NamedTemporaryFile(suffix=".txt", delete=False) as f:
            f.write(b"hello")
            p = f.name
        t, r = detect_source(p)
        assert t == "file"
        os.unlink(p)

    def test_detect_text_fallback(self):
        t, r = detect_source("some random text without protocol")
        assert t == "url"


class TestFileLoader:
    def test_load_text_file(self):
        with tempfile.NamedTemporaryFile(suffix=".txt", mode="w", delete=False) as f:
            f.write("hello world\nline 2")
            p = f.name
        result = load_file(p)
        assert result["text"] == "hello world\nline 2"
        assert result["lines"] == ["hello world", "line 2"]
        os.unlink(p)

    def test_is_text_file(self):
        assert is_text_file(".py")
        assert is_text_file(".md")
        assert is_text_file(".js")
        assert not is_text_file(".exe")
        assert not is_text_file(".bin")

    def test_load_nonexistent(self):
        from contextlane.core.errors import SourceNotFound
        with pytest.raises(SourceNotFound):
            load_file("/nonexistent/file.txt")


class TestChunker:
    def test_chunk_small_text(self):
        text = "hello world\nline 2\nline 3"
        result = chunk_text_string(text, "src_1", "test")
        assert len(result["chunks"]) == 1
        assert len(result["citations"]) == 1
        assert result["chunks"][0]["citation"] == "[test:1]"

    def test_chunk_large_text(self):
        lines = [f"line {i}" for i in range(200)]
        text = "\n".join(lines)
        result = chunk_text_string(text, "src_1", "test")
        assert len(result["chunks"]) >= 4


class TestExtractor:
    def test_extract_empty(self):
        result = extract("run_1", [], [])
        assert result["facts"] == []
        assert result["decisions"] == []
        assert result["actions"] == []
        assert result["entities"] == []
        assert result["tags"] == []

    def test_extract_facts(self):
        chunks = [{"text": "TypeScript is a typed language.", "source_id": "src_1", "start_line": 1}]
        result = extract("run_1", chunks, [{"id": "cit_1", "source_id": "src_1", "start_line": 1}])
        assert len(result["facts"]) >= 1

    def test_extract_decision(self):
        chunks = [{"text": "Decision: We chose JWT over sessions.", "source_id": "src_1", "start_line": 1}]
        result = extract("run_1", chunks, [])
        assert len(result["decisions"]) >= 1
        assert "JWT" in result["decisions"][0]["text"]

    def test_extract_action(self):
        chunks = [{"text": "TODO: Add login page", "source_id": "src_1", "start_line": 1}]
        result = extract("run_1", chunks, [])
        assert len(result["actions"]) >= 1
        assert result["actions"][0]["priority"] == "medium"

    def test_extract_fixme_high_priority(self):
        chunks = [{"text": "FIXME: Fix password hashing", "source_id": "src_1", "start_line": 1}]
        result = extract("run_1", chunks, [])
        assert len(result["actions"]) >= 1
        assert result["actions"][0]["priority"] == "high"

    def test_extract_entities(self):
        chunks = [{"text": "Visit https://example.com and check @talocode/contextlane", "source_id": "src_1", "start_line": 1}]
        result = extract("run_1", chunks, [{"id": "cit_1", "source_id": "src_1", "start_line": 1}])
        types = {e["type"] for e in result["entities"]}
        assert "url" in types
        assert "project" in types

    def test_extract_tags(self):
        chunks = [{"text": "python javascript typescript python python", "source_id": "src_1"}]
        result = extract("run_1", chunks, [])
        assert "python" in result["tags"]


class TestArtifactStore:
    def test_save_and_load_run(self):
        run = {
            "id": "test_run_1",
            "sources": [{"id": "src_1", "type": "text", "input": "hello"}],
            "chunks": [],
            "extraction": {
                "run_id": "test_run_1",
                "summary": "test summary",
                "facts": [],
                "decisions": [],
                "actions": [],
                "entities": [],
                "tags": ["test"],
                "citations": [],
                "created_at": "now",
            },
            "memory_records": [],
            "created_at": "now",
        }
        save_run(run)
        loaded = load_run("test_run_1")
        assert loaded["id"] == "test_run_1"
        assert "summary" in str(loaded["extraction"])

    def test_list_runs(self):
        runs = list_runs()
        ids = [r["id"] for r in runs]
        assert "test_run_1" in ids


class TestExportImport:
    def test_export_and_import(self):
        out = tempfile.mktemp(suffix=".json")
        export_run("test_run_1", out)
        assert os.path.isfile(out)
        with open(out) as f:
            data = json.load(f)
        assert data["id"] == "test_run_1"

        run = import_run(out)
        assert run["id"] == "test_run_1"
        os.unlink(out)


class TestSearch:
    def test_search(self):
        results = search("hello")
        assert isinstance(results, list)

    def test_search_empty_query(self):
        results = search("")
        assert results == []


class TestMemoryRecordsBuilder:
    def test_build_from_extraction(self):
        extraction = {
            "facts": [{"text": "Python is great", "confidence": 0.9, "citation_ids": ["cit_1"], "tags": []}],
            "decisions": [{"text": "Use Python", "status": "active", "citation_ids": ["cit_2"]}],
            "actions": [{"text": "Install Python", "priority": "high", "citation_ids": ["cit_3"]}],
            "entities": [],
            "tags": ["python"],
        }
        records = build_memory_records("run_1", [{"id": "src_1", "input": "test.py"}], [], extraction)
        assert len(records) == 3
        texts = {r["text"] for r in records}
        assert "Python is great" in texts
        assert any("[Decision]" in r["text"] for r in records)
        assert any("[Action]" in r["text"] for r in records)


class TestSDK:
    def test_create_client(self):
        client = create_context_lane_client("http://localhost:3060", "test-key")
        assert isinstance(client, ContextLaneClient)
        assert client.base_url == "http://localhost:3060"

    def test_client_strips_trailing_slash(self):
        client = ContextLaneClient("http://localhost:3060/")
        assert client.base_url == "http://localhost:3060"
