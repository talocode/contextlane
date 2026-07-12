import time
import random
import string


def _rand(n: int = 4) -> str:
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=n))


def generate_run_id() -> str:
    ts = format(int(time.time() * 1000), 'x')
    return f"ctx_{ts}_{_rand()}"


def generate_source_id() -> str:
    return f"src_{_rand(8)}"


def generate_chunk_id() -> str:
    return f"chk_{_rand(8)}"


def generate_fact_id() -> str:
    return f"fct_{_rand(8)}"


def generate_decision_id() -> str:
    return f"dec_{_rand(8)}"


def generate_action_id() -> str:
    return f"act_{_rand(8)}"


def generate_entity_id() -> str:
    return f"ent_{_rand(8)}"


def generate_citation_id() -> str:
    return f"cit_{_rand(8)}"
