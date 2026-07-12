import os
import subprocess
import urllib.request
import urllib.error
import json


async def sync_to_memory_lane(records: list) -> dict:
    result = {"saved": 0, "failed": 0, "errors": [], "method": "none"}

    url = os.environ.get("CONTEXTLANE_MEMORYLANE_URL")

    if url:
        try:
            for record in records:
                data = json.dumps(record).encode("utf-8")
                req = urllib.request.Request(
                    f"{url}/v1/memorylane/memories",
                    data=data,
                    headers={"Content-Type": "application/json"},
                )
                resp = urllib.request.urlopen(req, timeout=10)
                if resp.status == 200:
                    result["saved"] += 1
                else:
                    result["failed"] += 1
                    result["errors"].append(f"HTTP {resp.status}")
            result["method"] = "http"
            return result
        except Exception as e:
            result["errors"].append(f"HTTP sync failed: {e}")

    # CLI fallback
    try:
        subprocess.run(["which", "memorylane"], capture_output=True, check=True)
        for record in records:
            try:
                tags = " ".join(f"--tag {t}" for t in record.get("tags", []))
                text = record["text"].replace('"', '\\"')
                subprocess.run(
                    f'memorylane remember "{text}" {tags} --tag contextlane',
                    shell=True, capture_output=True, timeout=10,
                )
                result["saved"] += 1
            except Exception:
                result["failed"] += 1
        result["method"] = "cli"
        return result
    except FileNotFoundError:
        pass

    result["errors"].append("MemoryLane not available. Set CONTEXTLANE_MEMORYLANE_URL or install @talocode/memorylane.")
    return result
