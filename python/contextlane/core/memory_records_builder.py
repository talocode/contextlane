def build_memory_records(run_id: str, sources: list, chunks: list, extraction: dict) -> list:
    records = []

    for fact in extraction.get("facts", []):
        records.append({
            "text": fact["text"],
            "tags": ["contextlane"] + extraction.get("tags", [])[:5] + fact.get("tags", []),
            "source": sources[0]["input"] if sources else "unknown",
            "citation": fact["citation_ids"][0] if fact.get("citation_ids") else "",
            "metadata": {
                "run_id": run_id,
                "source_id": sources[0]["id"] if sources else "",
                "citation_ids": fact.get("citation_ids", []),
                "contextlane": True,
            },
            "importance": round(fact.get("confidence", 0.7) * 10),
        })

    for decision in extraction.get("decisions", []):
        records.append({
            "text": f"[Decision] {decision['text']}",
            "tags": ["contextlane", "decision", decision.get("status", "unknown")],
            "source": sources[0]["input"] if sources else "unknown",
            "citation": decision["citation_ids"][0] if decision.get("citation_ids") else "",
            "metadata": {
                "run_id": run_id,
                "source_id": sources[0]["id"] if sources else "",
                "citation_ids": decision.get("citation_ids", []),
                "contextlane": True,
            },
            "importance": 8,
        })

    for action in extraction.get("actions", []):
        priority_imp = 9 if action.get("priority") == "high" else 6
        records.append({
            "text": f"[Action] {action['text']}",
            "tags": ["contextlane", "action", action.get("priority", "medium")],
            "source": sources[0]["input"] if sources else "unknown",
            "citation": action["citation_ids"][0] if action.get("citation_ids") else "",
            "metadata": {
                "run_id": run_id,
                "source_id": sources[0]["id"] if sources else "",
                "citation_ids": action.get("citation_ids", []),
                "contextlane": True,
            },
            "importance": priority_imp,
        })

    return records
