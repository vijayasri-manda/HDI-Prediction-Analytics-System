# Maintained data

`raw/undp_hdr2025.csv` is the pinned UNDP HDR 2025 source (Windows-1252, 2021 PPP income units). Source: https://hdr.undp.org/sites/default/files/2025_HDR/HDR25_Composite_indices_complete_time_series.csv

SHA-256: `61ed82e5b66c88dfca8ff9fac775c63981ecab6a254862af97acacc41c143117`.

`processed/undp_panel.csv` supplies exact-record regression tests and explorer preparation. `raw/raw_hdi_data.csv` is the original synthetic dataset still required by `ml/train.py` for its explicitly historical comparison audit. These files serve different purposes; they are not interchangeable duplicates.

The unused original pickle, metadata, processed synthetic panel and Flask source are preserved in the local historical backup in folder 7. Current inference uses `public/data/model.json`; ordinary website use requires no Python or database. See the [model card](<../../7. Project Documentation/MODEL_CARD.md>).
