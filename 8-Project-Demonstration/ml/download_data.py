"""Download the pinned public UNDP release; refuse unexpected bytes."""
from pathlib import Path
import hashlib
import json
import urllib.request

root = Path(__file__).resolve().parents[1]
evidence = json.loads((root / 'public/data/evaluation.json').read_text(encoding='utf-8'))
with urllib.request.urlopen(evidence['source'], timeout=60) as response:
    content = response.read()
if hashlib.sha256(content).hexdigest() != evidence['sha256']:
    raise SystemExit('Source differs from the pinned release. Review the new data before replacing the local snapshot.')
(root / 'data/raw/undp_hdr2025.csv').write_bytes(content)
print('Verified UNDP snapshot downloaded.')
