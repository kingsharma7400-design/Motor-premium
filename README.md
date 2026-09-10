# OICL Premium Calculator — V30.0

Upgraded version of the Oriental Insurance Motor Premium Calculator with a
modern UI and full **quote history + search**. The calculation engine is
**100% unchanged** — all OD/TP rates, GST logic and commission tables work
exactly as in V28.0.

## ✨ What's new

| Feature | Details |
|---|---|
| 🕘 Quote History | Every calculation auto-saves (reg. no, customer, vehicle, premium, full inputs + results) |
| 🔍 Search & filters | Search by reg. no / name / vehicle / quote no / premium; filter by policy, vehicle, date; 4 sort orders |
| 📊 Stats dashboard | Total quotes, this month, total premium, average premium |
| 📄 View / ✏️ Edit | One click restores any old quote into the calculator or quotation |
| ⬇️ CSV / JSON export | Backup all quotes for Excel / records |
| 🌙 Dark mode | Toggle in top bar, remembered across visits |
| 📊 Progress steps | Vehicle → Policy & IDV → Covers → Quote checklist |
| 🔔 Toast notifications | Validation errors & confirmations (no more alert popups) |
| 📱 Mobile upgrade | Sticky Calculate bar, responsive cards, bottom-safe layout |
| ⌨️ Shortcuts | `Ctrl+Enter` calculate · `Alt+H` history · `Alt+C` calculator · `Esc` close popup |
| 🔢 Stable quote numbers | One numbering sequence shared by history + quotation (legacy auto-increment locked & migrated) |

## 📁 Files

- `index.html` — updated (History tab, stepper, toasts, sticky bar, theme toggle)
- `app.js` — original + tiny PRO bridge (emits `premium:calculated`, toasts instead of alerts)
- `history.js` — **new**: history store, search, restore, export
- `pro.js` — **new**: theme, toasts, steps, count-up, shortcuts, sticky bar
- `styles-pro.css` — **new**: modern UI layer + dark mode (loads after `styles.css`)
- `rates.js`, `commission_rates.js`, `styles.css` — **untouched originals**

## 🛠️ Corrections (07-Sep-2026)
1. **Sum Insured (IDV)** added to quotation header (next to CC/GVW) + 1-page PDF + history CSV export.
2. **PCCV fix**: disabled CC/Seats field now auto-fills `0`, validation skips disabled fields,
   and quotation shows actual Seating Capacity (e.g. "12 Seats") instead of "0 Seats".
3. **Single Vehicle Type dropdown**: "Vehicle Category" second dropdown removed — all 16
   categories now directly in one grouped dropdown. History vehicle-filter still works.
4. **Electric Vehicle field removed** — EV status now auto-derived from vehicle type / fuel.
5. **Towing SI**: ₹10,000 option added (₹500 @ 5%).
6. **Calculate button**: brighter blue gradient + white text (stays at bottom).
7. **Disabled add-ons hidden** instead of greyed (incl. orphan SI boxes).
8. **Policy Type filter**: commercial vehicles show only Package + Liability
   (Car/2W incl. EV show all 4). Old quotes restore intact.
9. **Policy Start Date hidden** (temporary) — auto-set to today.
10. **Bugfix**: GCCV quote no longer breaks later renders/history (qGstPct).
11. **Calculate button: REVERTED to original** — orange in-form button back
    (blue theme + fixed/mobile bottom bar removed on user request).

## 🔒 Privacy note

History lives in the browser's `localStorage` (this device + browser only,
max 200 quotes). Nothing is uploaded anywhere. Use **⬇️ CSV** regularly as backup.

## 🚀 Deploy to your GitHub Pages site

Your live site repo is `kingsharma7400-design/Motor-premium`.

**Option A — GitHub website (easiest):**
1. Open the repo → click each file → ✏️ edit/paste, or
2. `Add file → Upload files` and drop all 8 files from this folder
   (`index.html`, `app.js`, `rates.js`, `commission_rates.js`,
   `styles.css`, `history.js`, `pro.js`, `styles-pro.css`).
3. Wait ~1 minute → site updates at
   `https://kingsharma7400-design.github.io/Motor-premium/`

**Option B — Git command line:**
```bash
git clone https://github.com/kingsharma7400-design/Motor-premium.git
cd Motor-premium
# copy the 8 files from motor-premium-pro over these, then:
git add -A && git commit -m "Upgrade to V29.0 PRO: history + modern UI" && git push
```

## 🧪 Tested

End-to-end test (jsdom) verified: Package/Bundles/Liability calculations,
auto-save, dedup, search, restore-without-duplicate, quote numbering,
stats, dark mode toggle. Originals kept intact in `../Motor-premium/`
for diff/comparison.

## 🔄 V30.0 rename & restructure (08-Sep-2026)

- **Renamed**: "Motor Premium Calculator PRO V29.0" → **OICL Premium Calculator V30.0**
  (title, sidebar brand, top bar, About tab, footer).
- **Sidebar split into two groups:**
  - **Products** — 🚗 Motor · 🔥 Fire & Theft · 🧍 Personal Accident · 🏥 Mediclaim
  - **Workspace** — 📄 Quotation · 🕘 History · ℹ️ About
- **Fire & Theft merged** into one product tab with two sub-tabs.
  Additionally, the Fire form has a **"🔐 Theft / Burglary Cover"** checkbox — tick it
  and enter your own **per-mille (‰) rate**; it is charged on the Fire Total Sum Insured
  and shown as a separate line in the breakdown.
- Sub-tab switching is now **scoped per section**, so PA / Mediclaim panes never get hidden.
- Helper `openProduct(tab, subTab)` added for direct navigation.

## 🧍 PA tables corrected (08-Sep-2026)

| Table | Cover | Rate |
|---|---|---|
| **Table I** | Death only | **0.45 ‰** |
| **Table II** | Death + PTD + PPD | **1.00 ‰** |
| **Table III** | Death + PTD + PPD + TTD | **1.50 ‰** |

- Old A/B/C/D tables replaced by these three.
- **Risk group is now a loading** on basic PA premium: Risk I = 0%, Risk II = +25%, Risk III = +50%.
- **Medical Expenses Extension** is now selectable — tick the checkbox and choose **10%** or **25%** of the PA premium.
- Rate field stays editable and auto-fills when the table is changed.

## 🧍 PA aligned to OICL Policy Wordings (08-Sep-2026)

Source: **PA (Individual) Policy Wordings · IRDA/NL-HLT/OIC/P-P/V.1/456/13-14**

### Medical Expenses Extension — clause (j)
| Additional premium | Covers |
|---|---|
| **+10%** on basic accident premium | **25%** of valid admissible claim |
| **+25%** on basic accident premium | **50%** of valid admissible claim |

### New: "Benefits Payable on Claim" table
Premium ke saath ab claim-side payouts bhi auto-calculate hote hain:

| Benefit | Limit (per wordings) |
|---|---|
| Death · 2 limbs/eyes · PTD | 100% CSI **+ Cumulative Bonus** |
| Loss of 1 limb / 1 eye | 50% CSI |
| TTD weekly (Table III) | 1% CSI/week, **cap ₹20,000**, max **100 weeks**, total ≤ CSI |
| PPD | As per scale (hearing both ears 50%, thumb 25%, etc.) |
| Carriage of dead body | 2% CSI or **₹2,500**, whichever less |
| Education fund — 1 child | 10% CSI, cap **₹5,000** |
| Education fund — 2+ children | 10% CSI, cap **₹10,000** |
| Loss of employment | 1% CSI or **₹15,000**, whichever less |

### Cumulative Bonus — clause 4(a)
**+5% per completed claim-free year, maximum 50%.** New "Claim-free Years" input added.
CB applies to death / loss of limbs / PTD only, on original CSI (not on CB itself).

### Removed
Ad-hoc riders (₹100 child education, ₹50 ambulance, manual weekly-benefit input) hata diye —
ye policy me **built-in benefits** hain, alag premium nahi lagta. Weekly benefit ab CSI se auto-derive hota hai.

---

## 🏥 V31–V34 · Mediclaim section expansion (08-Sep-2026)

Sidebar → **🏥 Mediclaim** ab ek multi-product section hai. Paanch sub-tabs:

| Sub-tab | Product | UIN | Rate source |
|---|---|---|---|
| 🌱 Youth Eco Care | Oriental Youth Eco Care | OICHLIP24034V012324 | Official chart — 14 SI × 11 age × 2 plans |
| 🛡️ Sampoorna Swasthya Suraksha | OSSP | OICHLIP26035V012526 | Official chart — **36 grids** (3 plans × 2 zones × 6 payment modes) × 17 age bands |
| 👨‍👩‍👧 Happy Family Floater | HFFP 2024 | OICHLIP25046V062425 | Official chart — 23 SI rows × 11 age bands, Silver zone-rated |
| ⬆️ Super Health Top-Up | Super Health Top-Up 2024 | OICHLIP25042V042425 | Official chart — 17 Deductible/SI combos × 4 age groups |
| 🏥 Generic Mediclaim | (original indicative calculator) | — | Editable guideline rates |

### 🚫 GST removed
Health insurance premium **GST-exempt** hai — Mediclaim ke saare sub-tabs aur **Personal Accident**
me GST NIL dikhta hai. `other.js` ke `render()` me ek optional `noGst` flag add kiya gaya hai.
**Fire, Theft aur Motor par GST 18% jaisa tha waisa hi hai.**

### Member loading rules (har product apna)
| Product | Primary | 2nd | 3rd | Others |
|---|---|---|---|---|
| Youth Eco Care | 100% | 75% | 50% | 50% |
| OSSP | 100% | 55% (66+ → 75%) | 55% / 75% | 55% / 75% |
| Happy Family Floater | 100% | 100% | 50% | 40% |
| Super Top-Up (Floater) | 100% | 50% | 40% | 40% |

### Discount caps (product-wise — alag alag hain)
- Youth Eco Care — Online 10% cap **₹2,000** · No-TPA 5.5% · Family 10% · CB-lieu 2%
- OSSP — Online 10% cap **₹5,000** · No-TPA 5.5% · Family 5% · age loadings 10/25/50%
- HFF — Online 10% cap **₹2,000** · No-TPA 5.5% · add-ons: restoration, waiver, co-pay removal, LHSB
- Super Top-Up — Loadings **pehle** (entry-age 10%, room-rent 20/10/5%), phir discounts
  (family 10%, loyalty 10%, staff 33%, portal 10% cap ₹2,000) — successive, cumulative nahi

### 📁 New files
`youth_eco_care.js` · `ossp.js` + `ossp_rates.js` · `hff.js` + `hff_rates.js` · `stu.js` + `stu_rates.js`

### ⚠️ Deploy note
Is folder me **`commission_rates.js` nahi hai** (original upload me nahi aayi thi).
Aapke live repo me woh already maujood hai — usko **delete mat karna**, baaki files upar se copy kar dena.
Motor engine (`app.js`, `rates.js`) bilkul untouched hai.

## 🔧 V35.0 corrections (09-Sep-2026)

1. **Sidebar sub-menu** — Products → 🏥 Mediclaim par click karte hi uske *neeche hi*
   plan list khulti hai (Youth Eco Care · Sampoorna Swasthya · Happy Family Floater ·
   Super Health Top-Up · Generic Mediclaim). Active plan highlight hota hai aur
   upar wale sub-tabs se switch karne par sidebar bhi sync ho jaata hai.
   Helper: `openMediclaim('ossp')`.

2. **Discounts temporarily disabled + hidden** — Mediclaim ke saare 13 discount
   checkboxes `disabled` + `display:none` hain aur calculation me bhi nahi jaate.
   Wapas chaalu karne ke liye `med-nav.js` line 12:
   `var DISCOUNTS_ENABLED = false;`  →  `true`
   (Rate engine me kuch nahi badla — sirf UI layer par hide kiya hai.)

3. **OSSP age loading auto-tick** — Member Ages ke neeche live indicator aa gaya.
   Koi member 66+ hote hi checkbox apne aap tick ho jaata hai aur
   "auto applied on 2 members (+10%, +25%)" jaisa summary + per-member detail dikhata hai.
   "3 years claim-free" tick karne par numbers turant ghat jaate hain (10→5%, 25→15%).
   Checkbox `disabled` hai — mandatory loading hai, indicator only.

### 📁 New file
`med-nav.js` — sidebar sub-menu + discount toggle

## 📄 V36.0 · Health Quotation page (09-Sep-2026)

Health products ka interface ab **Motor jaisa** hai — calculate karne ke baad
**"📄 Generate Quotation →"** button aata hai jo Motor wale same A4 layout me
health quotation kholta hai.

### Kya milta hai
- **Product header** — product name + UIN (dark navy band)
- **Premium Summary** strip — Base · Net · GST (NIL) · Payable
- **Brief details grid** — Motor ke `quote-meta` jaisa: plan, SI, zone, members,
  ages, age band, policy term, start/end date
- **Premium Breakdown** table — poora member-wise + loading/discount breakdown
- **Key Covers & Sub-limits** table — chosen SI/plan ke hisaab se auto
- **Signature blocks + disclaimer** — Motor jaisa hi
- **⬇️ Download PDF (1-Page)** — Motor ka hi `html2canvas` + A4 PDF engine reuse karta hai

### Technical
- `app.js` me `window.OIC.pdf` helpers expose kiye (renderHTMLToCanvas, canvasToA4,
  download, css, today) — Motor ka PDF engine chhua nahi, sirf share kiya.
- Har health calculator apna result `window.registerHealthQuote({...})` se register
  karta hai. Naya product add karna ho to bas yahi call add kar dena.
- Quote number Motor ke saath **shared sequence** (`oic_quote_seq`) use karta hai.

### 📁 New file
`health-quote.js`

## 🔧 V37.0 corrections (09-Sep-2026)

1. **Sidebar slide animation** — Mediclaim par click karte hi plan list smooth
   slide hokar khulti hai (max-height + opacity + translateX). Dobara click -> band.
2. **OSSP discounts enabled** — Online 10% (max ₹5,000) · No-TPA 5.5% ·
   Family 5% · **Long-term policy 5% (naya)**. Baaki products ke discounts abhi hidden.
3. **Top product tabs hidden** — ab product sirf **left sidebar** se select hota hai.
4. **Generate Quotation + Share** buttons ab **result box ke neeche** aate hain
   (calculate hone par apne aap dikhte hain, MutationObserver se).
5. **Quotation page par Share button** add hua (Web Share API + PDF fallback).
6. **Saare hint texts removed** — "Chart rate (primary, excl. GST)...",
   "(discounts abhi disabled hain)", "Age loading auto lagta hai...",
   "(eldest @100%, next @75%...)" — sab hata diye.
7. **Generic Mediclaim tab removed** — ab sirf 4 official chart-based products.

## ➕ V38.0 · OSSP missing add-ons (09-Sep-2026)

Prospectus clause 4.2.3 / 4.2.4 / 6.7 aur page-72 rate tables se teen cheezein add ki:

### 1. Room Rent Upgradation (clause 4.2.3)
% of base office premium, SI-wise:

| Sum Insured | Option 1 (50%) | Option 2 (100%) |
|---|---|---|
| ₹2L – ₹5L | +20% | +35% |
| ₹6L – ₹10L | +15% | +30% |

Sirf **PREMIUM & ELITE** plan me, SI **₹10 lakh tak**. Royal plan ya SI >10L par
dropdown auto-disable ho jaata hai (Royal me room rent already actuals hai).

### 2. PED Waiting Period Buyback (clause 4.2.4)
Plan ke hisaab se options auto-refill hote hain:

| Option | Premium | Elite | Royal |
|---|---|---|---|
| 3 yrs → 2 yrs | +20% | — | — |
| 3 yrs → 1 yr | +30% | — | — |
| 3 yrs → 0 yrs | +50% | — | — |
| 2 yrs → 1 yr | — | +20% | +20% |
| 2 yrs → 0 yrs | — | +30% | +30% |
| 1 yr → 0 yrs | — | — | +30% |

Fresh policies only · specified diseases (clause 5.2) par lagu nahi.

### 3. Migration Discount (clause 6.7)
HFF / Individual Mediclaim se migrate karne walon ke liye:

| Case | Discount | Cap |
|---|---|---|
| HFF ₹1L → Premium ₹2L (1st year) | 20% | 25% |
| HFF ₹1L — 2nd year | 20% | 20% |
| Other HFF holder (one-time) | 5% | 10% |
| HFF → higher SI (one-time) | 5% | 10% |
| Individual Mediclaim (one-time) | 5% | 10% |
| Individual Mediclaim → higher SI | 5% | 10% |

**Order:** add-on loadings (room rent, PED) base office premium par lagte hain →
phir discounts (long-term, family, TPA, online) → phir migration discount.
Teeno quotation ke brief details me bhi dikhte hain.

## 🔧 V39.0 corrections (09-Sep-2026)

1. **Migration discount simplified** — ab sirf 2 options:
   - Same Sum Insured — **5%**
   - Higher Sum Insured — **10%**
   (pehle wale 6 HFF/Individual sub-cases hata diye)

2. **Online discount ab auto-tick nahi** — pehle `checked` tha jisse inbuilt lagta tha.
   Ab OSSP, Youth Eco Care aur HFF teeno me by-default **untick** hai — user khud tick karega.

3. **Saare dropdowns ab "-- Select --" se start** — pehle sab pre-filled the.
   13 static selects + 4 JS-filled (SI / Deductible) sab par placeholder.
   Motor page ka hi `-- Select --` pattern follow kiya hai.

4. **Validation add** — blank chhodne par toast:
   "Plan chuniye" / "Sum Insured chuniye" / "Zone chuniye" /
   "Cover Basis chuniye" / "Number of Members chuniye"

## 🐞 V40.0 BUGFIX — Motor "Calculate Premium" kaam nahi kar raha tha (09-Sep-2026)

**Problem:** Motor tab me Calculate Premium dabane par kuch nahi hota tha.

**Root cause:** `app.js` line ~1569 par `getCommissionRates(...)` call hoti hai,
jo **`commission_rates.js`** me define hai. Woh file original upload me aayi hi
nahi thi (README me iska note tha), isliye browser me
`Uncaught ReferenceError: getCommissionRates is not defined` aata tha aur
`runCalc()` wahin ruk jaata tha — premium calculate hi nahi hota tha.

**Fix (do layer):**
1. `app.js` me guard lagaya — function na mile to `{od:0, tp:0}` use hota hai,
   calculation crash nahi hoti.
2. Ek **fallback `commission_rates.js` stub** banaya taaki preview me poora chale.

### ⚠️ DEPLOY KARTE WAQT DHYAN
Zip wali `commission_rates.js` **repo par upload MAT karna** — woh sirf stub hai.
Aapke repo me jo **asli** file hai wahi rehne dena, usme sahi agent commission
rates hain. Baaki saari files upar se copy kar dena.

(Agar galti se chali bhi gayi to app crash nahi hogi — bas Agent Commission
indicative dikhega, premium calculation bilkul sahi rahegi.)

## 🔧 V41.0 — Migration discount ab sirf BASIC premium par (09-Sep-2026)

**Problem:** Migration discount running `net` par lag raha tha, jisme Room Rent
Upgradation aur PED Buyback ke add-on amounts bhi jud chuke the. Isse discount
zarurat se zyada bann raha tha.

**Fix:** Ab migration discount `officeBase` (basic premium) par calculate hota hai.

Example — Basic ₹10,000 · Room Rent 50% (+20%) · PED 3→1 (+30%) · Migration 10%:

| Line | Pehle (galat) | Ab (sahi) |
|---|---|---|
| Basic premium | 10,000 | 10,000 |
| + Room Rent Upgrade (20%) | 2,000 | 2,000 |
| + PED Buyback (30%) | 3,000 | 3,000 |
| = Gross | 15,000 | 15,000 |
| − Migration (10%) | **1,500** ❌ | **1,000** ✅ |
| = Net premium | 13,500 | **14,000** |

Breakdown row me ab साफ likha aata hai: "Migration discount — Higher Sum Insured
(10% of basic premium)".

## ✅ V42.0 — Asli commission_rates.js + saare discounts basic premium par (09-Sep-2026)

### 1. Asli `commission_rates.js` install
User ne original file bhej di (530 lines, **CIRCULAR-8811 w.e.f 01.07.2026**).
Fallback stub replace kar diya. Verify:
- Pvt Car package (age 3) → OD 20% / TP 20%
- Two-wheeler package (age 2) → OD 30% / TP 30%
- Package + age > 15 yrs → 0% (no commission rule kaam kar raha hai)

Ab zip wali `commission_rates.js` **asli hai** — deploy pe safely copy kar sakte hain.
`app.js` ka guard bhi rehne diya taaki file kabhi miss ho to app crash na ho.

### 2. Saare discounts ab SIRF basic premium par (sab 4 health products)
Pehle discounts **successive** the (ek ke baad doosra ghati hui amount par) aur
add-ons/loadings par bhi lag rahe the. Ab har discount basic (office) premium ka
seedha % hai, aur sabka total ek saath ghataya jaata hai.

| Product | Discounts ab basic par |
|---|---|
| Sampoorna Swasthya (OSSP) | Family 5% · No-TPA 5.5% · Long-term 5% · Online 10% (max ₹5,000) · Migration 5/10% |
| Youth Eco Care | Family 10% · No-TPA 5.5% · CB-lieu 2% · Online 10% (max ₹2,000) |
| Happy Family Floater | No-TPA 5.5% · Online 10% (max ₹2,000) |
| Super Health Top-Up | Staff 33% · Family 10% · Loyalty 10% · Portal 10% (max ₹2,000) |

**Ab OSSP par asar** — Basic ₹10,000 · Room Rent +20% · PED +30% · sab discounts:

| Line | Amount |
|---|---|
| Basic premium | 10,000 |
| + Room Rent Upgrade (20%) | 2,000 |
| + PED Buyback (30%) | 3,000 |
| = Gross | 15,000 |
| − Total discount (35.5% of basic) | 3,550 |
| = **Net premium** | **11,450** |

Purane successive tareeke se ye ₹10,362 aata tha — add-ons par bhi discount lag
raha tha jo galat tha.

Breakdown me ab har row par saaf likha hai "(5% of basic)" etc., aur ek
**"Total discount"** row bhi aata hai. Loadings (STU entry-age, room-rent removal)
aur add-ons (OSSP room rent, PED) pehle jaise hi lagte hain — sirf discount base badla hai.
PA cover par pehle bhi discount nahi tha, ab bhi nahi hai.

## 🏷️ V43.0 — Page heading har product ke hisaab se badalta hai (09-Sep-2026)

**Problem:** Har tab par heading "Motor Premium Calculator" hi likha aata tha —
Fire, PA aur Mediclaim me bhi. Heading `index.html` me hardcoded thi.

**Fix:** Heading ko `#pageTitleMain` / `#pageTitleSub` IDs de kar dynamic banaya.
`app.js` me `PAGE_TITLES` map aur `window.setPageTitle(tab)` function add kiya,
jo har tab switch par chalta hai.

| Tab | Heading | Sub-heading |
|---|---|---|
| Motor | **Motor Premium Calculator** | Own Damage (OD) & Third Party (TP) Premium Calculator |
| Fire | **Fire Premium Calculator** | Fire & Allied Perils Premium Calculator |
| └ Theft sub-tab | Fire Premium Calculator | Theft / Burglary Premium Calculator |
| PA | **PA Premium Calculator** | Personal Accident Premium Calculator |
| Mediclaim | **Medical Premium Calculator** | Health / Mediclaim Premium Calculator |
| └ plan chunne par | Medical Premium Calculator | *(plan ka naam)* — Health Premium Calculator |
| Quotation | Quotation | Motor Insurance Quotation |
| Health Quotation | Health Quotation | Health / Mediclaim Insurance Quotation |
| History | Quote History | Saved quotations & calculation history |
| About | About | Oriental Insurance Premium Calculator |

Heading **har entry point se** update hoti hai — sidebar click, Generate Quotation,
quote-back button, history se quote kholna, aur Mediclaim plan switch. Browser tab
ka title (`document.title`) bhi saath me badalta hai.

## 🧍 V44.0 — PA: Select placeholders + Generate Quotation & Share (09-Sep-2026)

### 1. Saare bars "-- Select --" se start
PA ke teeno dropdown (Plan, Risk Group, Policy Term) ab khaali start hote hain,
baaki products ki tarah. **Rate field** bhi ab pre-filled 1.50 nahi hai — Plan
chunte hi apne aap bhar jaata hai (Table I → 0.45, II → 1.00, III → 1.50),
aur Plan hataने par khaali ho jaata hai.

Validation add: "Capital Sum Insured daaliye" / "Plan chuniye" /
"Risk Group chuniye" / "Policy Term chuniye" / "Rate daaliye".

### 2. Generate Quotation + Share buttons
Premium box ke **neeche** `#paGenRow` add kiya — bilkul health products jaisa
(`#paShare` + `#paGen`). Premium calculate hote hi row apne aap dikh jaati hai
(`med-nav.js` ke `GEN_MAP` me `pa` entry add ki, MutationObserver wahi purana).

`other.js` ka `calcPA()` ab `registerHealthQuote()` call karta hai — CSI, Plan,
Risk Group, Rate, Persons, Term, Medical Extension aur poora breakdown quotation
me chala jaata hai.

### 3. Quotation page PA ke liye adapt
Ek hi quotation page dono ke liye use hota hai, isliye ye dynamic kiya:

| Cheez | Health | PA |
|---|---|---|
| Quote label | Health Quotation | **PA Quotation** |
| Page heading | Health Quotation | **PA Quotation** |
| PDF filename | OIC_Health_Quotation_… | **OIC_PA_Quotation_…** |
| Back button | Mediclaim tab | **PA tab** |

Back button ab `backTab` yaad rakhta hai, to PA se quotation khol kar wapas aane
par PA tab hi khulta hai (pehle hamesha Mediclaim par chala jaata tha).
PA par GST pehle bhi nahi tha, ab bhi nahi.

## 🐞 V45.0 BUGFIX — Class D me OD premium ₹0 aa raha tha (09-Sep-2026)

**Problem:** Class D (Misc-D / Ambulance) me 7 se 10 saal purani gaadi par
Basic OD rate **0** aa jaata tha, isliye OD premium ₹0 dikhta tha.

**Root cause:** `app.js` ka age-band lookup —
```js
if (age <= 10) return slab.age7plus || slab.age10 || slab.rate || 0;
```
Class D ke rate slabs me `age5`, `age7` aur **`age10plus`** keys hoti hain —
`age7plus` ya `age10` bilkul nahi hote. Isliye 7-10 saal ki range me teeno
lookup fail ho jaate the aur function `0` return karta tha.

Baaki vehicles me `age7plus` (bus/PCCV) ya `age10` (Pvt Car) maujood hai,
isliye sirf Class D par asar padta tha.

**Fix:** `age10plus` ka fallback add kiya —
```js
if (age <= 10) return slab.age7plus || slab.age10 || slab.age10plus || slab.rate || 0;
```

**Class D ke sahi rates ab (3 age brackets: 1-5 | 5-7 | 7+ yrs):**

| Zone | 1-5 yrs | 5-7 yrs | 7+ yrs |
|---|---|---|---|
| Zone A | 1.208 % | 1.223 % | 1.268 % |
| Zone B | 1.202 % | 1.222 % | 1.232 % |
| Zone C | 1.190 % | 1.220 % | 1.250 % |

**Testing:** Misc-D + Ambulance × 3 zones × 6 age points = **36 combos sab sahi**
(pehle inme se 18 par ₹0 aa raha tha). Baaki 11 vehicle types × 3 zones × 4 ages
= **132 combos me ek rupee ka bhi change nahi** — regression clear.

*Note:* Class D me Policy Type sirf **Package** aur **Liability Only** hi hote hain
(SAOD / Bundle nahi) — ye pehle se sahi tha.

## 📄 V46.0 — Mediclaim/PA ka PDF layout theek kiya (09-Sep-2026)

**Problem:** Health aur PA quotation ka downloaded PDF bikhra hua aa raha tha —
tables ki koi styling nahi, columns align nahi, sab text raw dikh raha tha.

**Root cause:** PDF banate waqt Motor ka hi print-CSS (`OIC.pdf.css()`) use hota
hai, jo `table.bt`, `table.ft` aur `h3.sec` classes define karta hai. Lekin
`health-quote.js` ka `buildHTML()` purani screen-wali classes bhej raha tha —
`breakdown-table`, `final-table`, `card-title`. Ye teeno PDF CSS me maujood hi
nahi hain, isliye **koi style apply nahi hoti thi** aur tables bina border/padding
ke bikhar jaati thi.

(Screen wala quotation page theek tha — wo `styles.css` load karta hai jisme
ye classes defined hain. Sirf PDF affected tha.)

**Fix — `buildHTML()` poora rewrite:**
1. Sahi classes: `table.bt` (breakdown), `table.ft` (totals), `h3.sec` (headings)
2. **Do-column layout** — Premium Breakdown aur Key Covers side-by-side, taaki
   lambi list me PDF 1 page se bahar na jaaye
3. Meta grid 5 se **4 columns** (health me Motor se kam fields hote hain)
4. Product bar ab flexbox — lamba product naam aur UIN overlap nahi karte
   (pehle `float:right` se overlap ho jaata tha)
5. `N/A` / `Not opted` rows ab muted dikhti hain
6. "Total" se shuru hone wali rows bhi ab `final-row` me highlight hoti hain
7. PA ke liye labels adapt — "PA Quotation", "GST (Personal Accident)"

## 🔧 V47.0 — Class D ka Overturning Cover ab IDV par (09-Sep-2026)

**Problem:** Class D (Misc-D / Ambulance) me Overturning Cover **Basic OD** par
5% lag raha tha, jabki ise **IDV** par lagna chahiye.

**Fix:** Class D ke liye ab **5 per mille (‰) of IDV** = 0.5% of IDV.

| IDV | Pehle (5% of Basic) | Ab (5‰ of IDV) |
|---|---|---|
| ₹3,00,000 | ₹180 | **₹1,500** |
| ₹5,76,000 | ₹346 | **₹2,880** |
| ₹8,00,000 | ₹481 | **₹4,000** |
| ₹20,00,000 | ₹1,202 | **₹10,000** |

Breakdown row me ab likha aata hai: "5 per mille (‰) of IDV ₹8,00,000".

**Scope:** Sirf **Misc-D aur Ambulance**. Baaki vehicles (Pvt Car, 2W, PCCV,
School/Staff Bus) me purana 5% of Basic hi rehta hai — verify kiya, unme koi
change nahi.

Rate `rates.js` me `ADDON_FACTORS.overturningIdvPerMille` me rakha hai, taaki
aage badalna ho to ek hi jagah edit karna pade.

## 🔧 V48.0 — Class D: IMT-23 ab Overturning par bhi, NCB sab par (09-Sep-2026)

**Change:** Class D (Misc-D / Ambulance) me IMT-23 pehle sirf **Basic OD** par
lagta tha. Ab **Basic + Overturning Cover** par lagta hai. NCB pehle se hi
`postUWBase` par lagta hai, isliye badhe hue IMT ke saath NCB apne aap
Basic + Overturning + IMT — teeno par charge hota hai.

**Example — IDV ₹8,00,000 · Zone B · NCB 20% · Overturning ON:**

| Line | Pehle | Ab |
|---|---|---|
| Basic OD (1.202%) | 9,616 | 9,616 |
| Add: Overturning (5‰ of IDV) | 4,000 | 4,000 |
| Add: IMT-23 (15%) | 1,442 *(Basic only)* | **2,042** *(Basic + OT)* |
| Less: NCB 20% | −2,971 | **−3,132** |
| **OD Total** | 12,087 | **12,526** |

Breakdown row me ab base dikhta hai:
"15 % of Basic + Overturning (₹9,616 + ₹4,000 = ₹13,616)"

**Verify:** UW discount 0/25/90% aur NCB 0/20/25/50% ke saath test kiya — sab
sahi. Baaki 8 vehicle types (PCCV, School/Staff Bus, GCCV, Pvt Car, Taxi) me
IMT-23 bilkul **unchanged** hai — regression clear.

## 🎨 V49.0 — Left sidebar ka view theek kiya (09-Sep-2026)

Sidebar bikhra hua dikh raha tha. Teen alag-alag CSS bugs the:

**1. Brand header ki padding gayab**
`styles.css` me padding `.sidebar-top` par lagi hai, lekin HTML me wo wrapper
hai hi nahi — `.brand` seedha `.sidebar` ka child hai. Isliye OIC logo aur
"ORIENTAL INSURANCE" bilkul kinare chipke the.
→ `.sidebar > .brand` par padding + border-bottom diya, logo 52px se 44px.

**2. Footer card bilkul unstyled**
HTML `sidebar-footer-card` aur `footer-meta` classes use karta hai, jabki
`styles.css` me `.sidebar-card` aur `.meta` define hain. Naam match hi nahi
karte the, to "Revision Notes" wala box plain text jaisa dikhta tha.
→ Sahi class names par background, border, radius, padding add kiya.

**3. Sidebar me scroll nahi tha**
`.sidebar` par `overflow: hidden` tha. Mediclaim ka sub-menu khulne par
neeche ka content (Workspace section, footer) cut ho jaata tha.
→ `overflow-y: auto` + patla custom scrollbar.

**Saath me spacing bhi kasa:**
- `.nav-section` par `flex: 1` tha — dono sections aadhi-aadhi height khich
  lete the aur beech me badi khaali jagah aati thi. Ab `flex: none`.
- Nav items 13px padding se 10px, font 14px se 13px — 7 items bina scroll ke aate hain
- Products aur Workspace ke beech separator line
- History ka badge ab `margin-left:auto` se right side chipakta hai
- Sidebar width 280px se **252px** — content ko zyada jagah
- Mobile (≤900px) me brand padding aur width alag se adjust

---

## 📊 V50.0 — Excel export · Dark mode fix · Hi-DPI PDF (10-Sep-2026)

### 1. Excel (.xlsx) download — har quotation ke liye

PDF ke saath ab ek hara **📊 Download Excel** button bhi hai:

| Page | Kahan |
|---|---|
| Motor Quotation | toolbar me PDF ke baad |
| Health / PA Quotation | toolbar me PDF ke baad |
| Fire | calculate karte hi result ke neeche |
| Theft | calculate karte hi result ke neeche |

**Zero dependency.** `.xlsx` asal me ek ZIP hota hai, isliye CRC32 + ZIP writer
+ OOXML sheet XML sab `excel-export.js` me khud likha hai. Koi CDN library nahi,
matlab **internet band ho tab bhi Excel download chalega** (PDF wala html2canvas
CDN par depend karta hai).

Sheet PDF jaisi hi formatted hai — navy header band, section headings, blue table
headers, green grand-total rows, column widths, gridlines off, A4 portrait
fit-to-width. Amounts asli **numbers** hain (text nahi) `"₹" #,##0.00` format ke
saath, to Excel me SUM/filter/sort sab chalta hai. Negative values (NCB, discounts)
sahi minus me aate hain.

Validate kiya: ZIP integrity, XML well-formed, fonts/fills/borders/cellXfs ke
declared counts = actual (Excel isi par crash karta hai), style index range,
worksheet child elements ka schema order, `&`/`<`/`>`/`‰`/em-dash escaping,
aur khaali-quotation jaise edge cases.

### 2. Dark mode ke colors

**Asli bug:** `styles-other.css` me `var(--card, #fff)` use ho raha tha lekin
`--card` variable **kahin define hi nahi tha** — baaki CSS `--bg-card` naam
use karti hai. Isliye Fire/Theft/PA/Mediclaim ke result boxes hamesha fallback
`#fff` par gir rahe the → dark mode me safed box + light text = kuch padha
nahi jaata tha.

Saath me V49 ke naye sidebar rules (brand, footer card, footer-meta) ke dark
overrides likhe nahi the. Total 35 naye dark rules — modal card, date input ke
valid/invalid states, hero stats, history delete button, commission row,
About ke bullets/notes, Mediclaim sub-menu. Dark selectors 50 → 85.

### 3. PDF blur — ab 4x resolution

Do wajah thi:

- **Render scale 2x tha** → A4 794px ×2 = 1588px = sirf **192 DPI**. Print ke
  liye 300 DPI minimum chahiye.
- **JPEG quality 0.93** → text ke kinaron par ringing artifacts.

Ab adaptive `bestScale()`: desktop par **384 DPI** (3176×4492), mobile par
288 DPI. JPEG quality **0.985**, aur PDF image dictionary me `/Interpolate false`
taaki viewer sharp pixels ko smooth na kare.

**8K jaan-boojh kar nahi rakha** — browser canvas ki hard limit hoti hai,
40+ MP par mobile Chrome/Safari chupchaap **blank canvas** de dete hain aur PDF
khaali aa jaati. Code khud device memory, mobile detect, 16384px side aur 40 MP
budget check karta hai; fit na ho to 0.5 steps me neeche aata hai. DPI thodi kam
ho sakti hai, par **blank PDF kabhi nahi aayegi**.

### 4. Print ka chhupa hua bug

Print CSS me `#tab-quote { display: block !important }` hard-coded tha. Matlab
Health ya PA quotation print karo to **Motor ki quotation chhap jaati thi** aur
health wali missing rehti. Ab `.tab-content.active` par — jo tab khula hai wahi
chhapta hai. Saath me `print-color-adjust: exact` (table header backgrounds ab
kaagaz par aate hain), dark mode me print karne par kaagaz light theme me,
`@page { size: A4 portrait; margin: 8mm }`, aur naye elements print me hidden.

### 5. About tab

- 📅 **Date Format** section hata diya (form ke DD-MM-YYYY hints/engine intact).
- **Policy Types** ab "Motor — Policy Types", saath me note ki commercial
  vehicles (Taxi, Bus/PCCV, Goods, Class D) me sirf Package + Liability Only hote hain.
- Naye section: **Vehicle Classes** aur **Health & Other Products** (chaaron
  health UIN + GST note — health/PA par GST nahi, Motor/Fire/Theft par 18%).
- `CIRCULAR-8811` ka zikr **poore project se** hataya — 8 jagah, 4 files
  (footer, About note, aur 6 code comments). Rates/logic bilkul nahi chhue.

---

## 🏍️ 2W Dep Cap / Nil Dep: 5 yrs → 7 yrs + NCB gate (10-Sep-2026)

**Problem (user-reported):** 2W me 5 saal ke baad Dep Cap (Nil Dep) premium `₹0` aa
raha tha — NCB 20% hone par bhi. Pvt Car me "age > 5 yrs → min 20% NCB, upto 6.5 yrs"
wala rule hai, 2W par wo gate **implement hi nahi hua tha**, sirf ek hard block tha:

```js
if (ageInYears > 5) return 0;                     // getNilDepRate
if (isTwoWheelerFamily && ageInYears > 5) → TWO_WHEELER_AGE_EXCEEDED   // checkNilDepEligibility
```

**New schedule (as supplied):** % of IDV, ab **teen CC buckets** — pehle do hi the

| Age | 0–150 CC | Above 150–350 CC | Above 350 CC |
|---|---|---|---|
| 0-1 Yr  | 0.25 | 0.25 | 0.40 |
| 1-2 Yr  | 0.40 | 0.40 | 0.50 |
| 2-3 Yr  | 0.60 | 0.60 | 0.70 |
| 3-4 Yr  | 0.70 | 0.70 | 0.80 |
| 4-5 Yr  | 0.90 | 0.90 | 1.20 |
| **5-6 Yr** | **1.20** | **1.20** | **1.30** |
| **6-7 Yr** | **1.40** | **1.40** | **1.50** |

- Age > 5 yrs par Dep Cap **tabhi**, jab **NCB ≥ 20%** (0/5/10/15% NCB → blocked).
- Age > 7 yrs → NOT AVAILABLE (message: "above 7 years").
- **EV 2W** same table use karta hai: ≤ 16 KW → 0–150 column, > 16 KW → 150–350 column.
- ⚠️ **Side-effect (fix, not regression):** pehle `>150 CC` bucket me 0.40/0.50/0.70/0.80/1.20
  the aur `≤150 CC` me wahi 0.40…  Ab 0–150 **aur** 151–350 dono 0.25/0.40/0.60/0.70/0.90
  par aate hain, aur sirf >350 CC ko 0.40/0.50/0.70/0.80/1.20 milta hai. Isliye
  **110cc–350cc tak ki bikes ke 5 saal purane ND premium me kami** dikhegi
  (jaise 151cc @3.2 yr: 0.8% ₹960 → 0.7% ₹840). Ye schedule ke anusaar hai.
- Bucket names badle: `upto150`/`above150` → `ccUpto150`/`cc150To350`/`above350`
  (sirf `rates.js` ke andar hi reference hote the — koi aur file touched nahi).
- `app.js` me koi change nahi: ND row already `calcNilDepPremium` se aata hai aur
  `ncb: inputs.ncb` pass hota hai.

**Files:** `rates.js` (backup: `rates.js.bak`) · tests: `tools/test-2w-depcap-table.js`
(579 assertions), `tools/e2e-2w-depcap.js` (jsdom — real UI, 11 assertions PASS),
`tools/diff-old-new.js` (47,600 ND combinations: **4,000 changed — sab 2W/EV-2W**,
43,600 unchanged).

---

## 🏷️ Version label policy (10-Sep-2026)

Site ka version label **sirf `V30.0`** hai — title, sidebar brand, footer, About card,
har JS/CSS file ke header comment me. Neeche jo `V31.0 … V50.0` headings hain wo sirf
**change-log entries** hain (kaunsa fix kab aaya), app ka version nahi — inhe version ki
tarah kahi display nahi kiya jaata. Isliye code/UI me kahin V31+ nahi dikhega.

Saath hi `app.js` ka console banner `Motor Calculator V27.0` aur kai file headers
`PRO V29.0` / `V31.0–V37.0` likhe hue the — sab **V30.0** par normalize kar diye
gaye (display text + comments only, koi logic/rate nahi chhua).

## 🗂️ Har product ka quote History me + bold "Customized by" + dark mode text (10-Sep-2026)

**1) Fire / Theft / PA / Mediclaim quotes ab History me — alag alag product ke hisaab se**
Pehle sirf Motor quote save hota tha; baaki products ka quote calculate karne ke baad
Refresh/doosre tab jaate hi kho jaata tha.

- `history.js` ab multi-product hai: `PRODUCT_MAP` (fire, theft, pa, med, yec, ossp, hff, stu)
  ke saath `saveCustom()` — **wahi quote-number sequence** jo Motor use karta hai
  (`nextQuoteNo()`), isliye numbering ek hi series chalti hai: Motor `0001` → Fire `0002` → …
- Har product apne **Calculate** par auto-save hota hai (Fire/Theft/PA: `other.js`,
  health products: `health-quote.js` → `registerHealthQuote` hook se), aur "Generate
  Quotation" par **duplicate nahi banta** — same product + same inputs + same premium
  = puri row update (timestamp + fresh snapshot) ho jaati hai, upar aa jaati hai.
- **History tab me naya "Product" filter** (`#hFilterProduct`): All / Motor / Fire / Theft /
  PA / Youth Eco Care / OSSP / Family Floater / Top-Up. Card par product badge (`.h-tag-product`)
  aur Motor ke alawa card par `Sum Insured · plan/GST · Total` dikhta hai (OD/TP halves nahi).
- **View / Edit dono products ke liye kaam karte hain**: Edit us product ke pane ko kholkar
  uske saved inputs restore karta hai (snapshot save ke waqt hi capture hota hai, taaki
  saved inputs aur saved premium hamesha same rahein) aur koi duplicate row nahi banata.
- CSV/JSON export me nayi columns: `Product`, `Customer`. Purana localStorage key
  (`oic_quote_history_v2`) same hai — **purane Motor quotes waise hi kaam karenge**
  (un par `kind` missing = `motor`).

**2) "Customized by Mohit Sharma" — ab bold (text bilkul same)**
- `app.js` `getQuotePrintCSS()` me `.disclaimer strong { font-weight:800 !important; color:#0a2540 !important; }`
- `styles-pro.css` print block me `.quote-doc .disclaimer strong, .quote-doc strong.generated-by,
  .quote-doc .footer-meta strong` + `styles.css` me screen rule
- Motor (`app.js`) aur Health (`health-quote.js`) quotation HTML par `class="generated-by"` lagaya
- Excel footer pehle se bold style (`s:15`) use karta tha — wahi rakha
- **Wording me ek character bhi nahi badla** — sirf bold

**3) Dark mode me light-theme inline colours padhne me nahi aa rahe the**
`index.html` me kaafi elements par inline `style="color:#64748b / #1e40af / #b45309 / #92400e …"`
tha — inline styles class rules ko beat karte hain, isliye dark cards par wo colors gayab ho
jaate the. HTML ko chhue bina `styles-pro.css` ke end me **"DARK MODE · TEXT CONTRAST PASS"**
block add kiya gaya: `html[data-theme="dark"]` + attribute selectors + `!important`.
Covered: date/reg-no amber hints, SI / towing / CPA / passenger-PA chhote labels, unke tinted
boxes ka background (`#101a30`), `#cpaTermHint`, `#todayBtn`, Fire/PA form labels, result table
ke grey cells, history product badge.
**Quotation document (`.quote-doc`) jaan-boojhkar paper-white hi rehti hai** — har new rule
`:not(#tab-quote):not(#tab-hquote)` se scoped hai, aur `@media print` me dark theme ke cards
bhi white-on-white na ho jaayein isliye `.card/.op-pane/.op-result` print me white + dark text
par force kar diye.

### 🌙 DARK MODE · PASS 3 — home page ka breakdown box (10-Sep-2026)

**Problem:** dark mode me home page par niche wala poora box — *Own Damage (OD)
Breakdown*, *Liability (TP) Breakdown*, aur `Total Premium before GST` /
`GST @ 18%` / `Net Premium Payable` / `Agent Commission` wali table — **kaagaz jaisa
safed** dikh raha tha (light text safed par, ya dark text safed par, dono weird).

**Root cause:** wo apni hi class par `background: var(--white)` rakhte hain, aur dark
theme me `--white` remap **nahi** hai (us variable ko `.premium-hero`, `.badge-pill`,
logo, nav ke *text colour* ke liye bhi use kiya jaata hai — remap karne se wo sab black
ho jaate). `.card` ka dark override in tables tak pahunchta hi nahi tha kyunki table ka
apna background zyada specific tha.

**Fix (sirf CSS, `styles-pro.css` ke end me "DARK MODE · PASS 3"):**
`.breakdown-table` / `.rate-table` / `.final-table` (+ unke `th`, `tr.bold`, `tr.grand`,
`tr.commission-row`, `.final-row`, `.negative`, `.positive`), `.cb-row` aur unke
checkbox/radio, `.field select:focus`, `.stepper`/`.step-dot`/`.step-sep`, `.rate-card`,
`.h-tag`, `kbd`, `.note`, `input.date-input.is-valid` — sab dark surfaces par.
`--white` variable ko jaan-boojhkar nahi chhua.

**Guarantees (test se verified):**
- **Light mode bilkul same** — `#odTable`/`.final-table`/`.cb-row` ka declared background abhi bhi `var(--white)`, commission row `#fffbeb`
- **Quotation document paper-white hi rehti hai** — block ke end me `.quote-doc .breakdown-table / .final-table` ko dobara `#fff` + dark text + original gradients par force kar diya, isliye PDF/print output me koi farak nahi
- **`@media print` me in classes ka koi background declare nahi hai** — print CSS untouched
- `.stat-card` ko `#16223c` + visible border diya (pass-1 me wo page background `#0b1120` jaisa hi `#0b1526` tha, card gayab ho jaata tha)
- Sweep test: dark mode me **0** paper-white element, **0** near-black text bacha
- WCAG contrast (real calculation ke baad): OD row 15.4:1, TP header 7.7:1, GST cell 15.4:1, Net Premium 10.1:1, Commission 12.7:1 — sab ≥ 4.5:1

Extra polish: dark mode me page background ka "OICL" watermark (navy, 3% opacity)
gayab ho jaata tha — `.main` ke liye use white fill (4.5%) me re-declare kiya, taaki
paper wale `.card` / `.quote-doc` par watermark pehle jaisa dark hi rahe.
