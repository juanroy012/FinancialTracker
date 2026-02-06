"""
App configuration: load from environment and optional instance folder.
"""
import os
from pathlib import Path


def load_config(app) -> None:
    """Load config into app.config from env and instance."""
    app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-secret-change-in-production")
    # Instance folder: project_root/instance/ (for local DB, etc.)
    instance_path = Path(app.instance_path)
    instance_path.mkdir(parents=True, exist_ok=True)
    app.config["DATABASE"] = os.environ.get(
        "DATABASE",
        str(instance_path / "app.db"),
    )
