# 2W Dep Cap / Nil Depreciation — V51.0 (APPLIED 10-Sep-2026)

## What changed — only `uploads/rates.js` (backup: `uploads/rates.js.bak`)

| # | Place | Change |
|---|---|---|
| 1 | `NIL_DEP_RATE.twoWheeler` | 2 buckets (`upto150`/`above150`) → **3 buckets** `ccUpto150` / `cc150To350` / `above350`, bands extended to 5-6 yr & 6-7 yr |
| 2 | `getNilDepRate()` | `if (age > 5) return 0` → `>7 → 0`, and `>5 → 0` **only when NCB < 20%**; 3-way CC/KW bucket choice |
| 3 | `checkNilDepEligibility()` | 2W block rewritten → `TWO_WHEELER_AGE_EXCEEDED` (>7) and new `TWO_WHEELER_NCB_TOO_LOW` (>5 & NCB<20) with an agent-readable reason |
| 4 | 2 doc comments | section-13 note + `getNilDepRate` header now describe the 2W rule |

Rule agreed with the user: Dep Cap for 2W **upto 7 years**; above 5 years **min 20% NCB**
(same gate that already existed for Pvt Car); petrol **and** EV 2W.
EV 2W (KW): ≤ 16 KW → 0-150 column, > 16 KW → 150-350 column.

`app.js`, `index.html`, `history.js`, `excel-export.js`, all other products: **untouched**.

## Schedule in force (% of IDV)

| Age | 0–150 | >150–350 | >350 |
|---|---|---|---|
| 0-1 | 0.25 | 0.25 | 0.40 |
| 1-2 | 0.40 | 0.40 | 0.50 |
| 2-3 | 0.60 | 0.60 | 0.70 |
| 3-4 | 0.70 | 0.70 | 0.80 |
| 4-5 | 0.90 | 0.90 | 1.20 |
| 5-6 | 1.20 | 1.20 | 1.30 |
| 6-7 | 1.40 | 1.40 | 1.50 |

Age bands are inclusive of the upper edge (matches `{max:N}`): 6.0 yr = 5-6 band,
6.1 yr = 6-7 band, 7.0 yr = 6-7 band, 7.1 yr = blocked.

## ⚠️ Side effect worth a second look (it is a fix, not a bug)

The schedule's first column ("150CC to 350CC" = 0.25/0.40/0.60/0.70/0.90) is what the app
was **already** charging for "upto 150 CC". So:
- **≤150 CC** bikes: 0-5 yr premium **unchanged**, and 5-7 yr now newly available.
- **151-350 CC** bikes: now use that same, **lower** table → e.g. 151 cc @3.2 yr was 0.80 %
  (₹960 on ₹1.2L), now 0.70 % (₹840). Confirm your schedule really has no separate
  "0-150" column; if 0-150 CC should be cheaper still, send those 7 figures.

## Verification run (all green)

```
node tools/test-2w-depcap-table.js uploads/rates.js   → 579 assertions PASS  (real functions, not a re-write)
node tools/e2e-2w-depcap.js                            → E2E PASS: jsdom drives index.html+app.js, clicks Calculate,
                                                          reads the rendered OD breakdown rows (11 assertions)
node tools/diff-old-new.js                              → 47,600 ND combos old-vs-new: 4,000 changed (twoWheeler 2,000
                                                          + evTwoWheeler 2,000), 43,600 unchanged → zero non-2W regression
node --check uploads/*.js                                → all parse
```

## Rerun / revert

```bash
node tools/apply-2w-depcap-v2.js            # cannot double-patch: anchors no longer match → aborts, file hash unchanged
cp uploads/rates.js.bak uploads/rates.js    # revert
node tools/e2e-2w-depcap.js tools/rates.before-fix.js   # same UI tests against the OLD rates (7/11 fail)
```

## Version labels (10-Sep-2026, after user said "V30 hi chahiye")

`V30.0` is now the **only** version label anywhere in the app. Normalized:
`app.js` header + its console banner (was V27.0) · `rates.js` header (was V27.0) ·
`pro.js` / `history.js` / `styles-pro.css` headers (were PRO V29.0) · `excel-export.js` ·
per-product module headers (were V30–V37) · `index.html` About card title and page footer
(added V30.0 where it was missing). CSS change-log tags V37/V49/V50 in `styles-pro.css`
were also dropped. `README.md` heading + all JS/CSS/HTML display text now agree.

Left alone on purpose: UIN strings (e.g. `OICHLIP24034V012324` — official policy numbers),
rate-structure dates (`w.e.f. 01st June 2026 (192001)`), and inline comments like
"added in V26.7 – GCCV is commercial" inside `rates.js`, which are rate provenance notes.
