class ContextLaneError(Exception):
    def __init__(self, message: str, code: str = "UNKNOWN"):
        super().__init__(message)
        self.code = code


class SourceNotFound(ContextLaneError):
    def __init__(self, path: str):
        super().__init__(f"Source not found: {path}", "SOURCE_NOT_FOUND")


class SourceTooLarge(ContextLaneError):
    def __init__(self, path: str, size: int, limit: int):
        super().__init__(f"Source too large: {path} ({size} bytes, limit {limit})", "SOURCE_TOO_LARGE")


class RunNotFound(ContextLaneError):
    def __init__(self, id: str):
        super().__init__(f"Run not found: {id}", "RUN_NOT_FOUND")


class Unauthorized(ContextLaneError):
    def __init__(self):
        super().__init__("Unauthorized: missing or invalid API key", "UNAUTHORIZED")
