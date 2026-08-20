"""HydraDB connection and query client."""

import os
from neo4j import GraphDatabase


HYDRADB_HOST = os.getenv("HYDRADB_HOST", "localhost")
HYDRADB_PORT = int(os.getenv("HYDRADB_PORT", "7687"))
HYDRADB_USER = os.getenv("HYDRADB_USER", "")
HYDRADB_PASSWORD = os.getenv("HYDRADB_PASSWORD", "")
HYDRADB_TOKEN = os.getenv("HYDRADB_TOKEN", "")

# For hosted API mode
HYDRADB_API_URL = os.getenv("HYDRADB_API_URL", "https://api.hydradb.com")
HYDRADB_API_KEY = os.getenv("HYDRADB_API_KEY", "")


def get_bolt_driver():
    """Get a Neo4j driver connected to HydraDB via Bolt protocol."""
    auth = None
    if HYDRADB_TOKEN:
        auth = ("neo4j", HYDRADB_TOKEN)
    elif HYDRADB_USER:
        auth = (HYDRADB_USER, HYDRADB_PASSWORD)
    return GraphDatabase.driver(
        f"bolt://{HYDRADB_HOST}:{HYDRADB_PORT}",
        auth=auth,
        connection_timeout=3,
        max_transaction_retry_time=3,
    )


def run_query(driver, query, parameters=None):
    """Run a single auto-commit OpenCypher query and return results."""
    with driver.session() as session:
        result = session.run(query, parameters or {})
        return [record.data() for record in result]


def run_write_query(driver, query, parameters=None):
    """Run a single auto-commit OpenCypher write query.

    HydraDB rejects explicit transactions (execute_write); writes must be
    auto-commit RUN queries.
    """
    with driver.session() as session:
        return session.run(query, parameters or {}).consume()
