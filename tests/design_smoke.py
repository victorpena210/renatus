"""Compatibility entry point for the current studio design regression."""
from pathlib import Path
import subprocess
subprocess.run(["node", "tests/studio-smoke.cjs"], cwd=Path(__file__).resolve().parents[1], check=True)
