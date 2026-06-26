import subprocess
import json
from typing import Any, Optional


def run_model(model_name: str, prompt: str, timeout: int = 60, fmt: str = "json") -> Any:
    """Run a local Ollama model via the `ollama` CLI and return parsed output.

    - `model_name`: e.g. 'phi3'
    - `prompt`: the prompt text to send
    - `fmt`: response format; 'json' will attempt to parse JSON
    """
    cmd = ["ollama", "run", model_name, prompt, "--format", fmt]
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
    except subprocess.TimeoutExpired:
        return {"error": "timeout"}

    if proc.returncode != 0:
        return {"error": "failed", "stderr": proc.stderr.strip()}

    out = proc.stdout.strip()
    if fmt == "json":
        try:
            return json.loads(out)
        except Exception:
            # fall back to raw text when JSON parsing fails
            return out
    return out
