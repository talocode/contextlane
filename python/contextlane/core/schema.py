from dataclasses import dataclass, field
from typing import Optional


@dataclass
class ContextLaneSource:
    id: str
    type: str  # file | folder | url | github | text
    input: str
    title: Optional[str] = None
    path: Optional[str] = None
    url: Optional[str] = None
    hash: Optional[str] = None
    loaded_at: str = ""
    metadata: Optional[dict] = None


@dataclass
class ContextLaneChunk:
    id: str
    source_id: str
    text: str
    index: int
    start_line: Optional[int] = None
    end_line: Optional[int] = None
    citation: str = ""
    metadata: Optional[dict] = None


@dataclass
class ContextLaneFact:
    id: str
    text: str
    confidence: float = 0.7
    tags: list = field(default_factory=list)
    citation_ids: list = field(default_factory=list)


@dataclass
class ContextLaneDecision:
    id: str
    text: str
    status: str = "active"  # active | historical | unknown
    citation_ids: list = field(default_factory=list)


@dataclass
class ContextLaneAction:
    id: str
    text: str
    priority: str = "medium"  # low | medium | high
    citation_ids: list = field(default_factory=list)


@dataclass
class ContextLaneEntity:
    id: str
    name: str
    type: str = "other"  # person | project | tool | company | url | concept | other
    mentions: int = 1
    citation_ids: list = field(default_factory=list)


@dataclass
class ContextLaneCitation:
    id: str
    source_id: str
    label: str
    path: Optional[str] = None
    url: Optional[str] = None
    start_line: Optional[int] = None
    end_line: Optional[int] = None
    quote: Optional[str] = None


@dataclass
class ContextLaneExtraction:
    run_id: str
    summary: str = ""
    facts: list = field(default_factory=list)
    decisions: list = field(default_factory=list)
    actions: list = field(default_factory=list)
    entities: list = field(default_factory=list)
    tags: list = field(default_factory=list)
    citations: list = field(default_factory=list)
    created_at: str = ""


@dataclass
class ContextLaneMemoryRecord:
    text: str
    tags: list = field(default_factory=list)
    source: str = ""
    citation: str = ""
    metadata: Optional[dict] = None
    importance: int = 5


@dataclass
class ContextLaneRun:
    id: str
    sources: list = field(default_factory=list)
    chunks: list = field(default_factory=list)
    extraction: Optional[ContextLaneExtraction] = None
    memory_records: list = field(default_factory=list)
    created_at: str = ""


@dataclass
class ContextLaneRunMeta:
    id: str
    source_count: int = 0
    chunk_count: int = 0
    fact_count: int = 0
    entity_count: int = 0
    created_at: str = ""
