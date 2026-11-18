# OICL Premium Calculator — Smart Quick Quote (V31)

> Copyright notice: `© 2026 Mohit Sharma. All Rights Reserved.` is displayed in the app footer, sidebar, Motor and Health quotation/PDF footers, shared product-PDF footers, and exported Excel quotation footer.
 The app footer also carries the small clarification: `Unofficial internal calculation tool — not an official OICL application.`

## What changed

The original detailed tariff form is now preceded by a **Smart Quick Quote** flow. It requests the core renewal details only:

1. Vehicle type, fuel, CC / kW / seats / GVW and registration date
2. Rating zone and state
3. Last policy IDV (or invoice / agreed base value for a new vehicle)
4. Last-policy date, NCB and claim status
5. Required add-ons

On **Generate Premium**, the quick inputs are mapped to the existing premium engine. The detailed form remains available through **Edit all details**.

## Custom IDV rule in the Quick Quote

The requested business rule is intentionally used in Smart Quick Quote:

| Quote stage | Base | Suggested current IDV |
|---|---|---:|
| Brand-new vehicle | Invoice / agreed vehicle value | Base × **95%** (5% less) |
| First renewal | Last policy IDV | Last IDV × **85%** (15% less) |
| Second and later renewal | Last policy IDV | Last IDV × **90%** (10% less) |

The screen shows the actual calculation, for example:

```text
₹6,50,000 × 85% = ₹5,52,500
```

For a new vehicle, Quick Quote automatically changes the base field to **Invoice / vehicle value** and hides the last-policy date. For a renewal it identifies first versus later renewal from the registration date and the inferred start of the entered previous annual policy (previous expiry minus 364 days). The suggested current IDV can always be overwritten by the user.

> The detailed form's pre-existing **AUTO** button retains its original tariff age-table logic; the new 5% / 15% / 10% rule applies to the Smart Quick Quote renewal premium flow.

## NCB rule in the Quick Quote

The app asks for the **last policy NCB**, whether any claim occurred, and the last-policy date where applicable. The separate Policy Continuity field has been removed.

With **no claim**, it moves to the next slab:

| Last policy NCB | NCB for the new quote |
|---:|---:|
| 0% | 20% |
| 20% | 25% |
| 25% | 35% |
| 35% | 45% |
| 45% | 50% |
| 50% | 50% |

If a claim occurred, or **New Vehicle / First Policy** is selected in the Last Policy NCB field, Quick Quote locks NCB at **0%**. Otherwise, the quote-side NCB remains editable.

The premium engine applies NCB only to its eligible Own Damage base/components; it does not reduce TP, GST or PA premium. The final policy remains subject to insurer documentation and underwriting validation.

## Other auto-filled values

- Policy start date: current date
- Invoice / ex-showroom reverse estimate: retained only as an internal detailed-form fallback for vehicles up to 5 years; it is no longer shown in Smart Quick Quote
- U/W Discount %: the maximum permitted U/W discount auto-fills from the applicable vehicle / age / IDV / NCB rule; an entered value above that rule remains usable but is highlighted red as an approval-required exception
- Dep Cap / NIL Dep Discount %: optional Quick Quote input that maps to the detailed Dep Cap/NIL Dep discount; values above the applicable 40% (private/2W) or 20% (other) limit are retained and shown red for approval
- LL Paid Driver: available in Quick Quote add-ons; when selected it maps one paid driver to the detailed TP legal-liability field (the detailed field remains editable)
- GST: 18%
- Accessories, LL employees and paid driver: 0
- Anti-theft: No
- NIL Dep discount: 0%
- U/W discount: existing tariff rule's auto-picked maximum
- Owner-driver PA: selected by default (can be unticked)

After the first calculation, editing a Quick Quote field automatically refreshes the premium. The full underlying form remains available and the existing **Recalculate after editing** button remains the source of truth for detailed adjustments.

## Add-on age eligibility in Quick Quote

All eligible Quick Quote add-ons are auto-ticked. Covers outside the selected conservative eligibility cap are automatically unticked and disabled:

| Cover | Auto eligibility cap |
|---|---|
| NIL Dep / Dep Cap | Existing vehicle-specific rule: private car up to 6.5 yr, 2W up to 7 yr, commercial up to 5 yr; NCB gate remains applicable above 5 yr where configured |
| RTI | Up to 5 yr; Taxi up to 3 yr |
| Consumables | Up to 5 yr |
| Key Replacement | Up to 5 yr |
| Tyre & Rim | Up to 5 yr |
| Battery Protect | Up to 5 yr |
| Engine Protect | Private / EV car up to 10 yr; other supported types including 2W up to 5 yr |
| Towing and Owner-driver PA | No age cap in this Quick Quote rule |

Changing registration date, vehicle type, NCB or policy type triggers a fresh eligibility check.

## Updated files

- `index.html` — Smart Quick Quote UI, responsive inline styling and a collapsible advanced form.
- `app.js` — field mapping, custom 5% / 15% / 10% IDV logic, NCB logic, validation, default logic, auto-refresh and advanced-form controls.
- `rates.js` — small guard so the optional `commission_rates.js` dependency cannot stop rate-table loading when absent.
- `fire-data.js` — extracted Fire occupancy, treaty, category and revised add-on rate data.
- `fire.js` — Fire rating engine, caps, STFI/EQ/terrorism calculations, add-on treatment, result breakdown and Fire PDF payload.
- `product-pdf.js` — native one-page PDF quotation builder for Fire and the extended-product workspace; it reuses V31’s existing PDF renderer and does not embed a third-party calculator.
- `more-products-rates.js` — rate schedules extracted into data only for the native WC, CAR/EAR, CPM, Parivaar/PA, Shopkeepers and Office rating screens.
- `more-products.js` — V31’s own extended-product UI, rating engines and per-product PDF action; it does not embed or launch the public reference calculator.
- `other.js` — legacy Theft / Burglary and individual PA calculation support, patched so it does not attach its obsolete simple-Fire handler over V31’s schedule-led Fire engine. Theft has a native one-page PDF action.
- `commission_rates.js`, `history.js`, `pro.js`, `excel-export.js` — Motor commission table plus quote history, UI helper and Excel export support.
- `youth_eco_care.js`, `ossp_rates.js`, `ossp.js`, `hff_rates.js`, `hff.js`, `stu_rates.js`, `stu.js`, `med-nav.js`, `health-quote.js` — Youth Eco Care, Sampoorna Swasthya Suraksha, Happy Family Floater, Super Health Top-Up, Mediclaim navigation and Health/PA quotation support.
- `styles.css`, `styles-pro.css`, `styles-other.css` — the original base, UI enhancement and non-motor calculator styles needed for the complete V31 presentation.

## Integration status

The supplied support files for Motor commission, history, UI helpers, Excel export, Theft / individual PA, all four Health products, Mediclaim navigation, Health quotations and the original stylesheet set are now included in this complete V31 workspace. Every local stylesheet and script referenced by `index.html` resolves within the packaged project.

## Checks performed

- `node --check` passed for `app.js`, `rates.js`, `fire-data.js`, `fire.js`, `product-pdf.js`, `more-products-rates.js` and `more-products.js`.
- DOM regression checks passed for Fire plus all six native extended-product PDF controls and their Fire/WC/CAR/EAR/CPM/PA/Shop/Office export payloads.
- Integration simulation passed for the V31 Fire engine, Theft / Burglary, individual PA, Youth Eco Care, OSSP, HFF, Super Health Top-Up and the Health quotation hand-off; the old simple-Fire handler is intentionally not attached.
- Local HTTP asset audit passed: every stylesheet and script referenced by `index.html` returns successfully from the packaged V31 project.
- DOM simulations passed for the 5% brand-new, 15% first-renewal and 10% later-renewal IDV rules, NCB ladder/claim reset, and editable premium calculation.
- Motor layout/action regression passed: the complete right-side premium panel and Generate Quotation action are absent. The colour-matched Quick Quote strip reveals Agent Commission, Total Premium, GST and Net Payable after calculation; its figures exactly match the generated quotation, while Share, Download PDF and Download Excel sit directly beneath it without navigating away from the calculator or changing a premium/commission value.
- Registration-date policy regression passed on typed input, native date-picker change and field blur: a qualifying newly registered private vehicle selects Bundle + New Vehicle NCB; while bundled TP remains valid, Private Car / EV Car selects SAOD through year 3 and 2W / EV 2W selects SAOD through year 5; once that term ends and for commercial vehicles, Package renewal is selected.
- Quick Quote seating / passenger-PA regression passed: an auto-filled seating value can be overridden (including a 7-seat private vehicle), maps to the detailed calculation, and the selected ₹2 lakh PA Un-named Passenger SI maps and renders its TP premium row.
- Fire core regression checks passed for Sookshma and Laghu Rice Mill examples, STFI, EQ, terrorism, SFSP add-on pricing, treaty discount locking, and Bharat Griha Raksha annual / short-period calculations.

## Fire rating integration (V31)

The former simple Fire pane has been replaced with an occupancy-schedule calculation flow based on the public reference calculator supplied for this work: `https://nvkoicl.github.io/PREMIUM-CALCULATOR//` (source reviewed on 14 October 2026).

It now includes:

- 299 mapped Sookshma and Laghu / SFSP occupancy rates, plus 37 treaty occupancy entries;
- Bharat Sookshma (up to ₹5 Cr), Bharat Laghu (above ₹5 Cr to ₹50 Cr), SFSP / IAR (above ₹50 Cr) and the separate Bharat Griha Raksha home product;
- FLEXA, STFI, earthquake by class / zone, and terrorism at 0.210‰;
- extracted discount caps: NBSUS FLEXA up to 99.99%, NBSUS NATCAT by occupancy category (50% / 25% / nil), NBLUS/SFSP FLEXA up to 75% and no regular NATCAT discount; treaty FLEXA discount locks at zero;
- five Bharat add-ons and selectable SFSP, IAR or Declaration / Floater schedules, including per-cover / default discounts, free covers and declared-value covers; and
- Bharat Griha Raksha dwelling / co-operative-home rates, 1–10 year rate scales, short-period scale, optional terrorism, loss-of-rent, alternate-accommodation and PA pricing;
- long-term multiplication and GST at 18%, with a transparent result breakdown.

Fire quotations remain indicative and require the current OICL underwriting circular, inspection requirements and acceptance before issue.

After a successful Fire calculation, **Download Fire PDF (1-Page)** creates a concise native Fire quotation that includes the selected product, occupancy, sum insured, premium break-up, GST and the final payable premium.

## Extended product rating (V31)

The **WC · CAR · CPM & More** workspace is built directly inside this V31 application. It does **not** contain an iframe, local copy, launcher, UI, or executable calculator from the supplied public reference. The reference was used only to extract the underlying rate schedules and rating approach into `more-products-rates.js`; V31’s own screens and formula engines are in `more-products.js`.

The native screens cover:

- Employees’ Compensation / Workmen’s Compensation (WC): occupation schedule, wage-cap / excess-wage treatment, short-period / pro-rata treatment, medical extension, discount and tax breakdown.
- Contractors’ All Risks / Erection All Risks (CAR / EAR): CAR base/additional-month rates and EAR Column 4–7 time rating.
- Contractors’ Plant & Machinery (CPM): equipment group rates, short-period scale, floater / underground loadings and STFI, EQ and terrorism pricing.
- Parivaar Suraksha / PA: published chart rates, selected add-ons, term factor, risk / pre-existing loading and applicable discount cap.
- Shopkeepers’ Package and Office Umbrella: section-by-section sum-insured × per-mille rating, dependencies / derived limits, discount and GST breakdown.
- Health / Mediclaim: opens the existing native Mediclaim workspace already provided in the main application.

After a calculation, the WC, CAR/EAR, CPM, PA Parivaar, Shopkeepers and Office screens each provide their own **Download PDF (1-Page)** action. It exports the visible calculation, selected rating facts, GST treatment and total payable premium.

All quotations are indicative and remain subject to prevailing OICL circulars, proposal requirements and underwriting approval.

## Latest motor refinements (V31)

- Smart Quote **Fuel** begins at `-- Select fuel --` and is required for conventional vehicles. It keeps the customer's selected conventional fuel when moving away from and back from an EV; an EV automatically selects and locks Electric.
- Smart Quote now infers policy from the registration date on typing, native date-picker selection, field blur or vehicle change: eligible private vehicles registered within their first 31 days default to **New Vehicle Bundle** (with `New Vehicle / First Policy` NCB). While the bundled TP remains valid, **Private Car / EV Car** defaults to **SAOD** through its 3-year TP term and **2W / EV 2W** defaults to **SAOD** through its 5-year TP term. After that TP term, and for commercial classes, it defaults to **Package renewal**. Any automatic selection can be manually changed.
- The Smart Quote **U/W Discount** box now auto-fills the rule-based maximum rather than only displaying it in a note.
- A U/W or Dep Cap / NIL Dep discount above its automatic / permitted limit is still carried into the calculation, but the relevant Quick and detailed fields turn red and record that authorization is required.
- **LL Paid Driver** has been added to the Quick Quote add-on choices and maps to one detailed paid-driver liability cover.
- **Seating Capacity** is auto-filled but editable in Quick Quote for non-goods, non-bus vehicles, so an actual higher RC / permit capacity can be used in seating-sensitive calculations. Buses continue to use the entered seating-capacity field and goods vehicles use one driver seat.
- **PA Cover — Un-named Passengers** is available in Quick Quote with a per-passenger SI choice of ₹1 lakh or ₹2 lakh. It maps to the detailed PA cover, uses Seating Capacity minus the driver for passenger count, and is included in TP premium where eligible.
- The Smart Quote no longer displays the **estimated original ex-showroom price** box.
- The complete right-side Motor premium panel (Total Premium, Basic OD Rate, OD/TP/GST/Net totals and the former policy hero) has been removed. A colour-matched Quick Quote result strip now appears immediately below **Generate Premium** after calculation: **Agent Commission**, **Total Premium** (before GST), **GST**, and **Net Payable Premium**. **Share**, **Download PDF** and **Download Excel** sit directly below that strip. These outputs use the existing quotation/export pipelines and do not alter the premium or commission calculation.

## RSA / Roadside Assistance (V31)

RSA is a **separately charged flat-premium add-on**, implemented from the RSA rate table in the supplied public reference calculator. It is available in both Smart Quick Quote and the editable detailed motor form, and it maps between them.

| Eligible class / policy basis | RSA premium before GST |
| --- | ---: |
| Private Car / EV Private Car — Package, SAOD or Liability only | ₹100 |
| Private Car / EV Private Car — new-vehicle 3-year Bundle | ₹283 |
| Two-Wheeler / EV Two-Wheeler — Package, SAOD or Liability only | ₹50 |
| Two-Wheeler / EV Two-Wheeler — new-vehicle 5-year Bundle | ₹223 |
| PCCV up to 6 passengers (up to 7 seats including driver in this app) | ₹100 |
| GCCV / GCCV 3W up to 3,500 kg GVW | ₹100 |

- It is auto-selected for eligible Package / SAOD / Bundle Quick Quotes. On TP-only it stays available as an optional agent selection.
- RSA is shown in the OD breakdown for an OD policy and in the TP breakdown for a liability-only policy.
- RSA does **not** receive U/W or NCB discount; applicable GST is charged. Unsupported capacities/classes are automatically disabled.
