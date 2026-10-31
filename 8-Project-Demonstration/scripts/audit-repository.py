"""Sanitized Git-candidate/staged audit. Never prints credentials or modifies real Git history."""
from pathlib import Path
from urllib.parse import unquote
import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parents[2]
EXPECTED = ["1. Brainstorming & Ideation", "2. Requirement Analysis", "3. Project Design Phase", "4. Project Planning Phase", "5. Project Development Phase", "6. Project Testing", "7. Project Documentation", "8-Project-Demonstration"]

def git(args, git_dir=None):
    prefix = ["git"] + (["--git-dir=" + str(git_dir), "--work-tree=" + str(ROOT), "-c", "core.bare=false"] if git_dir else [])
    return subprocess.run(prefix + args, cwd=ROOT, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True).stdout

def inspect(git_dir=None):
    names = git(["ls-files", "--cached", "-z"], git_dir).decode().split("\0")
    names = [n for n in names if n]
    local_values = []
    env = ROOT / "8-Project-Demonstration/.env"
    if env.exists():
        for line in env.read_text(encoding="utf-8-sig").splitlines():
            key, sep, value = line.partition("=")
            value = value.strip().strip(chr(34)).strip(chr(39))
            if sep and re.search(r"KEY|TOKEN|PASSWORD|SECRET|DATABASE_URL", key) and len(value) >= 12:
                local_values.append(value.encode())
    def suspect(data):
        return bool(re.search(rb"gsk_[A-Za-z0-9_-]{20,}", data) or any(v in data for v in local_values))
    leaks, forbidden, broken = [], [], []
    for name in names:
        parts = Path(name).parts
        if any(p in {"node_modules", "dist", ".vercel", "test-results", "playwright-report", "__pycache__"} for p in parts) or (Path(name).name.startswith(".env") and Path(name).name != ".env.example") or name.endswith("Historical project backup.zip"):
            forbidden.append(name)
        data = git(["show", ":" + name], git_dir)
        if suspect(data):
            leaks.append(name)
        if name.endswith(".md"):
            text = data.decode("utf-8-sig")
            for a, b in re.findall(r"\]\((?:<([^>]+)>|([^\)]+))\)", text):
                target = (a or b).split("#")[0]
                if target and ":" not in target and not target.startswith("/") and not ((ROOT/name).parent/unquote(target)).exists():
                    broken.append({"file": name, "target": target})
        if name.endswith(".html") and name.startswith("7. "):
            for target in re.findall(r'<img src="([^"]+)"', data.decode("utf-8")):
                if not ((ROOT/name).parent/unquote(target)).exists():
                    broken.append({"file": name, "target": target})
    archive = ROOT / "7. Project Documentation/Historical project backup.zip"
    backup = {"present": archive.exists()}
    if archive.exists():
        with zipfile.ZipFile(archive) as z:
            manifest = json.loads(z.read("BACKUP_MANIFEST.json"))
            backup["entries"] = len(manifest)
            backup["hashesVerified"] = all(hashlib.sha256(z.read(n)).hexdigest() == h for n, h in manifest.items())
            backup["secretLikeEntries"] = [n for n in z.namelist() if suspect(z.read(n)) or Path(n).name.startswith(".env")]
    folders = sorted(p.name for p in ROOT.iterdir() if p.is_dir() and not p.name.startswith("."))
    nested = [str(p.relative_to(ROOT)) for f in EXPECTED[:7] for p in (ROOT/f).iterdir() if p.is_dir()]
    result = {"mode": "staged" if git_dir is None else "isolated Git candidate index", "candidateFiles": len(names), "eightFoldersOnly": folders == EXPECTED, "nestedDirectoriesInFolders1to7": nested, "forbiddenStagedPaths": forbidden, "credentialLikePaths": leaks, "brokenLinks": broken, "backup": backup, "localEnvironmentInspectedWithoutPrintingValues": env.exists()}
    result["passed"] = not (leaks or forbidden or broken or nested) and folders == EXPECTED and (not backup["present"] or (backup["hashesVerified"] and not backup["secretLikeEntries"]))
    print(json.dumps(result, indent=2))
    return result["passed"]

try:
    if "--staged" in sys.argv:
        ok = inspect()
    else:
        # A separate temporary Git database honors the real .gitignore without creating .git here.
        with tempfile.TemporaryDirectory(prefix="hdi-stage-") as directory:
            temp = Path(directory).resolve()
            assert temp.parent == Path(tempfile.gettempdir()).resolve() and temp.name.startswith("hdi-stage-")
            subprocess.run(["git", "init", "--bare", str(temp)], stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
            git(["add", "--all", "--", "."], temp)
            ok = inspect(temp)
    sys.exit(0 if ok else 1)
except Exception as error:
    print(json.dumps({"passed": False, "errorType": type(error).__name__, "message": "Audit could not complete; no secret values are printed."}))
    sys.exit(1)
