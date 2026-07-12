from .ids import generate_chunk_id, generate_citation_id


def chunk_text(text: str, lines: list, source_id: str, source_label: str,
               source_path: str = None, source_url: str = None) -> dict:
    chunks = []
    citations = []
    max_lines = 50

    for i in range(0, len(lines), max_lines):
        chunk_lines = lines[i:i + max_lines]
        chunk_text_str = "\n".join(chunk_lines).strip()
        if not chunk_text_str:
            continue

        chunk_id = generate_chunk_id()
        cit_id = generate_citation_id()

        chunks.append({
            "id": chunk_id,
            "source_id": source_id,
            "text": chunk_text_str,
            "index": len(chunks),
            "start_line": i + 1,
            "end_line": i + len(chunk_lines),
            "citation": f"[{source_label}:{i + 1}]",
        })

        citations.append({
            "id": cit_id,
            "source_id": source_id,
            "label": source_label,
            "path": source_path,
            "url": source_url,
            "start_line": i + 1,
            "end_line": i + len(chunk_lines),
            "quote": chunk_text_str[:200],
        })

    return {"chunks": chunks, "citations": citations}


def chunk_text_string(text: str, source_id: str, source_label: str,
                      source_path: str = None, source_url: str = None) -> dict:
    lines = text.split("\n")
    return chunk_text(text, lines, source_id, source_label, source_path, source_url)
