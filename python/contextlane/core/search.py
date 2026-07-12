from .artifact_store import list_runs, load_run


def search(query: str, limit: int = 5) -> list:
    terms = query.lower().split()
    results = []

    for meta in list_runs():
        run = load_run(meta["id"])
        for chunk in run["chunks"]:
            lower = chunk["text"].lower()
            score = sum(1 for t in terms if t in lower)
            if score > 0:
                results.append({
                    "run_id": meta["id"],
                    "chunk": chunk,
                    "score": score,
                })

    results.sort(key=lambda r: -r["score"])
    return results[:limit]
