import json
import urllib.request
import urllib.error


class ContextLaneError(Exception):
    pass


class ContextLaneClient:
    def __init__(self, base_url: str, api_key: str | None = None):
        self.base_url = base_url.rstrip("/")
        self.headers = {"Content-Type": "application/json"}
        if api_key:
            self.headers["Authorization"] = f"Bearer {api_key}"

    def _request(self, method: str, path: str, body: dict | None = None):
        url = f"{self.base_url}{path}"
        data = json.dumps(body).encode("utf-8") if body else None
        req = urllib.request.Request(url, data=data, headers=self.headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                ct = resp.headers.get("Content-Type", "")
                text = resp.read().decode("utf-8")
                if "application/json" in ct:
                    return json.loads(text)
                return text
        except urllib.error.HTTPError as e:
            raise ContextLaneError(f"HTTP {e.code}: {e.read().decode()}")
        except urllib.error.URLError as e:
            raise ContextLaneError(f"URL error: {e.reason}")

    def health(self) -> dict:
        return self._request("GET", "/health")

    def capabilities(self) -> dict:
        return self._request("GET", "/v1/contextlane/capabilities")

    def ingest(self, input_str: str, type: str | None = None,
               sync_to_memory_lane: bool = False) -> dict:
        return self._request("POST", "/v1/contextlane/ingest", {
            "input": input_str, "type": type,
            "syncToMemoryLane": sync_to_memory_lane,
        })

    def ingest_url(self, url: str, sync_to_memory_lane: bool = False) -> dict:
        return self.ingest(url, type="url", sync_to_memory_lane=sync_to_memory_lane)

    def ingest_github(self, repo_url: str, sync_to_memory_lane: bool = False) -> dict:
        return self.ingest(repo_url, type="github", sync_to_memory_lane=sync_to_memory_lane)

    def list_runs(self) -> list:
        return self._request("GET", "/v1/contextlane/runs")

    def get_run(self, run_id: str) -> dict:
        return self._request("GET", f"/v1/contextlane/runs/{run_id}")

    def get_report(self, run_id: str) -> str:
        return self._request("GET", f"/v1/contextlane/runs/{run_id}/report")

    def get_memory_records(self, run_id: str) -> list:
        return self._request("GET", f"/v1/contextlane/runs/{run_id}/memory-records")

    def search(self, query: str, limit: int = 5) -> list:
        return self._request("POST", "/v1/contextlane/search", {
            "query": query, "limit": limit,
        })

    def recall(self, query: str, limit: int = 5) -> list:
        return self.search(query, limit)

    def sync_memory_lane(self, run_id: str) -> dict:
        return self._request("POST", "/v1/contextlane/sync/memorylane", {
            "runId": run_id,
        })

    def export_run(self, run_id: str, out_path: str) -> None:
        self._request("POST", "/v1/contextlane/export", {
            "runId": run_id, "outPath": out_path,
        })

    def import_run(self, data_path: str) -> dict:
        return self._request("POST", "/v1/contextlane/import", {
            "path": data_path,
        })


def create_context_lane_client(base_url: str, api_key: str | None = None) -> ContextLaneClient:
    return ContextLaneClient(base_url, api_key)
