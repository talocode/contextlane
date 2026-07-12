import re
from .ids import generate_fact_id, generate_decision_id, generate_action_id, generate_entity_id


ACTION_KEYWORDS = ["TODO", "FIXME", "HACK", "need to", "should", "must", "required", "action item", "todo:"]
DECISION_KEYWORDS = ["decision", "we decided", "we chose", "agreed", "elected", "resolved", "conclusion", "outcome"]
SKIP_WORDS = {"the", "this", "that", "with", "from", "have", "been", "will", "what", "about",
              "when", "where", "which", "their", "there", "would", "could", "should", "into",
              "more", "some", "than", "then", "also", "just", "like", "very", "well", "even",
              "still", "over", "such", "only", "other", "after", "before", "between", "through",
              "during", "without", "within", "along", "following", "including", "using", "based",
              "related", "various", "multiple", "across", "among", "while", "because", "though",
              "unless", "until", "since"}


def extract(run_id: str, chunks: list, citations: list) -> dict:
    all_text = "\n".join(c["text"] for c in chunks)
    lines = [l for l in all_text.split("\n") if l.strip()]

    summary = _generate_summary(chunks)
    facts = _extract_facts(chunks, citations)
    decisions = _extract_decisions(chunks, citations)
    actions = _extract_actions(chunks, citations)
    entities = _extract_entities(chunks, citations)
    tags = _extract_tags(chunks)

    return {
        "run_id": run_id,
        "summary": summary,
        "facts": facts,
        "decisions": decisions,
        "actions": actions,
        "entities": entities,
        "tags": tags,
        "citations": citations,
        "created_at": __import__("datetime").datetime.now().isoformat(),
    }


def _generate_summary(chunks: list) -> str:
    headlines = []
    for c in chunks:
        for line in c["text"].split("\n"):
            if line.strip().startswith("#"):
                headlines.append(line.strip().lstrip("#").strip())

    if headlines:
        return f"Source contains {len(chunks)} chunks across {len(headlines)} sections: {', '.join(headlines[:10])}."

    first = chunks[0]["text"][:200] if chunks else ""
    return f"Source contains {len(chunks)} chunks. First content: {first}..."


def _extract_facts(chunks: list, citations: list) -> list:
    facts = []
    seen = set()

    for chunk in chunks:
        for line in chunk["text"].split("\n"):
            t = line.strip()
            if not t or t.startswith("#") or t.startswith("```"):
                continue
            if len(t) < 20:
                continue
            key = t[:60]
            if key in seen:
                continue
            seen.add(key)

            cit_ids = [c["id"] for c in citations if c.get("start_line") == chunk.get("start_line")]
            if not cit_ids:
                cit_ids = [c["id"] for c in citations if c["source_id"] == chunk["source_id"]]

            facts.append({
                "id": generate_fact_id(),
                "text": t[:300],
                "confidence": 0.7,
                "tags": [],
                "citation_ids": cit_ids[:1],
            })

    return facts[:50]


def _extract_decisions(chunks: list, citations: list) -> list:
    decisions = []
    for chunk in chunks:
        for line in chunk["text"].split("\n"):
            lower = line.lower()
            if any(k in lower for k in DECISION_KEYWORDS):
                cit_ids = [c["id"] for c in citations if c.get("start_line") == chunk.get("start_line")]
                decisions.append({
                    "id": generate_decision_id(),
                    "text": line.strip()[:300],
                    "status": "active",
                    "citation_ids": cit_ids[:1],
                })
    return decisions


def _extract_actions(chunks: list, citations: list) -> list:
    actions = []
    for chunk in chunks:
        for line in chunk["text"].split("\n"):
            lower = line.lower()
            matched = next((k for k in ACTION_KEYWORDS if k.lower() in lower), None)
            if matched:
                priority = "high" if matched in ("HACK", "FIXME") else "medium" if matched == "TODO" else "low"
                cit_ids = [c["id"] for c in citations if c.get("start_line") == chunk.get("start_line")]
                actions.append({
                    "id": generate_action_id(),
                    "text": line.strip()[:300],
                    "priority": priority,
                    "citation_ids": cit_ids[:1],
                })
    return actions


URL_RE = re.compile(r"https?://[^\s)\"'>\]]+")
PROJECT_RE = re.compile(r"@[\w-]+/[\w-]+")


def _extract_entities(chunks: list, citations: list) -> list:
    entity_map = {}

    for chunk in chunks:
        matching_citations = [c for c in citations if c.get("start_line") == chunk.get("start_line")]
        cit_ids = [c["id"] for c in matching_citations]

        for m in URL_RE.finditer(chunk["text"]):
            url = m.group(0)
            if url not in entity_map:
                entity_map[url] = {"type": "url", "mentions": 0, "citation_ids": set()}
            entity_map[url]["mentions"] += 1
            entity_map[url]["citation_ids"].update(cit_ids)

        for m in PROJECT_RE.finditer(chunk["text"]):
            name = m.group(0)
            if name not in entity_map:
                entity_map[name] = {"type": "project", "mentions": 0, "citation_ids": set()}
            entity_map[name]["mentions"] += 1
            entity_map[name]["citation_ids"].update(cit_ids)

    return [
        {
            "id": generate_entity_id(),
            "name": name,
            "type": data["type"],
            "mentions": data["mentions"],
            "citation_ids": list(data["citation_ids"]),
        }
        for name, data in entity_map.items()
    ]


def _extract_tags(chunks: list) -> list:
    freq = {}
    for chunk in chunks:
        words = re.findall(r"\w{4,}", chunk["text"].lower())
        for w in words:
            if w not in SKIP_WORDS:
                freq[w] = freq.get(w, 0) + 1

    return [w for w, _ in sorted(freq.items(), key=lambda x: -x[1])[:15]]
