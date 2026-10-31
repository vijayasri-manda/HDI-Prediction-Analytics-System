"""Derive a UI-only historical indicator asset. Never trains or changes ML artifacts."""
import csv, json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
rows = list(csv.DictReader((ROOT / 'data/processed/undp_panel.csv').open(encoding='utf-8')))
keys = ['year','life_expectancy','expected_schooling','mean_schooling','gni_per_capita','hdi']
data = [{'iso3': r['iso3'], **{k: int(r[k]) if k == 'year' else float(r[k]) for k in keys}} for r in rows]
assert len(data) == 5940 and len({r['iso3'] for r in data}) == 193
(ROOT / 'public/data/explorer.json').write_text(json.dumps(data, separators=(',', ':')), encoding='utf-8')
print(f'Prepared {len(data)} historical records; no training performed.')
