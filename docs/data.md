# Data — EcoFarm 📊

## `data/data.csv` schema
The CSV contains rows of soil and environmental samples labeled by crop.

Columns (header):
- `N` (numeric) — nitrogen level
- `P` (numeric) — phosphorus level
- `K` (numeric) — potassium level
- `temperature` (°C)
- `humidity` (%)
- `ph` (soil pH)
- `rainfall` (mm)
- `label` — crop name (e.g., `rice`, `maize`)

## Purpose
- Used by `backend/model.py` to compute mean conditions per crop and generate distance-based recommendations.

## Preprocessing notes
- `Model` filters by `CROPS_USED` and computes a per-label mean summary.
- If rows are missing or the file is not present, the `Model` prints an error and falls back to an empty mapping.

**TODOs / Questions**
- Add a script `scripts/preprocess_data.py` to validate schema and optionally augment with more samples.
- Consider storing `data.csv` in an external dataset location if file grows large.