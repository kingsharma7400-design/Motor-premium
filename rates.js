/* =========================================================
   Motor Premium Calculator Pro V 27.0  ·  Rate Tables
   Based on:
   - "Revised MOTOR TARIFF wef_01.06.22_NEW.pdf" (OIC official)
   - IRDAI notified rates effective FY 2024-25
   - Commission w.e.f. 01.07.2026 (CIRCULAR-8811)
   - Class D Age Brackets w.e.f. 01.07.2026
   ========================================================= */

/* ============================================================
   1.  ZONE-A CITIES
   ============================================================ */
var ZONE_A_CITIES = ['Ahmedabad', 'Bangalore', 'Chennai', 'Hyderabad',
                       'Kolkata', 'Mumbai', 'New Delhi', 'Pune', 'Delhi'];

/* ============================================================
   2.  PRIVATE CAR (Petrol / Diesel) — Own Damage
       Rates vary by CC, Zone and Vehicle Age.
       Source: PDF page 1, "NORMAL PRIVATE VEHICLES" table.
   ============================================================ */
var OD_RATES = {
  pvtCar: {
    /* Zone A — major metros */
    zoneA: [
      { max: 1000, age5: 3.127, age10: 3.283, age10plus: 3.362 },
      { max: 1500, age5: 3.283, age10: 3.447, age10plus: 3.529 },
      { max: Infinity, age5: 3.440, age10: 3.612, age10plus: 3.698 }
    ],
    /* Zone B — rest of India (lower than Zone A) */
    zoneB: [
      { max: 1000, age5: 3.039, age10: 3.191, age10plus: 3.267 },
      { max: 1500, age5: 3.191, age10: 3.351, age10plus: 3.430 },
      { max: Infinity, age5: 3.343, age10: 3.510, age10plus: 3.594 }
    ],
    /* Zone C — typically same as Zone B for Pvt Car */
    zoneC: [
      { max: 1000, age5: 3.039, age10: 3.191, age10plus: 3.267 },
      { max: 1500, age5: 3.191, age10: 3.351, age10plus: 3.430 },
      { max: Infinity, age5: 3.343, age10: 3.510, age10plus: 3.594 }
    ]
  },

  /* ============================================================
     3.  TWO WHEELER — Own Damage
     ============================================================ */
  twoWheeler: {
    zoneA: [
      { max: 75,   age5: 1.708, age10: 1.793, age10plus: 1.836 },
      { max: 150,  age5: 1.708, age10: 1.793, age10plus: 1.836 },
      { max: 350,  age5: 1.793, age10: 1.883, age10plus: 1.928 },
      { max: Infinity, age5: 1.879, age10: 1.973, age10plus: 2.020 }
    ],
    zoneB: [
      { max: 75,   age5: 1.676, age10: 1.760, age10plus: 1.802 },
      { max: 150,  age5: 1.676, age10: 1.760, age10plus: 1.802 },
      { max: 350,  age5: 1.760, age10: 1.848, age10plus: 1.892 },
      { max: Infinity, age5: 1.844, age10: 1.936, age10plus: 1.982 }
    ],
    zoneC: [
      { max: 75,   age5: 1.676, age10: 1.760, age10plus: 1.802 },
      { max: 150,  age5: 1.676, age10: 1.760, age10plus: 1.802 },
      { max: 350,  age5: 1.760, age10: 1.848, age10plus: 1.892 },
      { max: Infinity, age5: 1.844, age10: 1.936, age10plus: 1.982 }
    ]
  },

  /* ============================================================
     4.  ELECTRIC PRIVATE CAR (KW-based)
     ============================================================ */
  evPvtCar: {
    zoneA: [
      { max: 30,   age5: 3.127, age10: 3.283, age10plus: 3.362 },
      { max: 65,   age5: 3.283, age10: 3.447, age10plus: 3.529 },
      { max: Infinity, age5: 3.440, age10: 3.612, age10plus: 3.698 }
    ],
    zoneB: [
      { max: 30,   age5: 3.039, age10: 3.191, age10plus: 3.267 },
      { max: 65,   age5: 3.191, age10: 3.351, age10plus: 3.430 },
      { max: Infinity, age5: 3.343, age10: 3.510, age10plus: 3.594 }
    ],
    zoneC: [
      { max: 30,   age5: 3.039, age10: 3.191, age10plus: 3.267 },
      { max: 65,   age5: 3.191, age10: 3.351, age10plus: 3.430 },
      { max: Infinity, age5: 3.343, age10: 3.510, age10plus: 3.594 }
    ]
  },

  /* ============================================================
     5.  ELECTRIC TWO WHEELER (KW-based)
     ============================================================ */
  evTwoWheeler: {
    zoneA: [
      { max: 3,    age5: 1.708, age10: 1.793, age10plus: 1.836 },
      { max: 7,    age5: 1.708, age10: 1.793, age10plus: 1.836 },
      { max: 16,   age5: 1.793, age10: 1.883, age10plus: 1.928 },
      { max: Infinity, age5: 1.879, age10: 1.973, age10plus: 2.020 }
    ],
    zoneB: [
      { max: 3,    age5: 1.676, age10: 1.760, age10plus: 1.802 },
      { max: 7,    age5: 1.676, age10: 1.760, age10plus: 1.802 },
      { max: 16,   age5: 1.760, age10: 1.848, age10plus: 1.892 },
      { max: Infinity, age5: 1.844, age10: 1.936, age10plus: 1.982 }
    ],
    zoneC: [
      { max: 3,    age5: 1.676, age10: 1.760, age10plus: 1.802 },
      { max: 7,    age5: 1.676, age10: 1.760, age10plus: 1.802 },
      { max: 16,   age5: 1.760, age10: 1.848, age10plus: 1.892 },
      { max: Infinity, age5: 1.844, age10: 1.936, age10plus: 1.982 }
    ]
  },

  /* ============================================================
     6.  TAXI (4W Passenger Carrying < 6 seats)
     ============================================================ */
  taxi: {
    zoneA: [
      { max: 1000, age5: 3.284, age7: 3.366, age7plus: 3.448 },
      { max: 1500, age5: 3.448, age7: 3.534, age7plus: 3.620 },
      { max: Infinity, age5: 3.612, age7: 3.703, age7plus: 3.793 }
    ],
    zoneB: [
      { max: 1000, age5: 3.191, age7: 3.271, age7plus: 3.351 },
      { max: 1500, age5: 3.351, age7: 3.435, age7plus: 3.519 },
      { max: Infinity, age5: 3.510, age7: 3.598, age7plus: 3.686 }
    ],
    zoneC: [
      { max: 1000, age5: 3.191, age7: 3.271, age7plus: 3.351 },
      { max: 1500, age5: 3.351, age7: 3.435, age7plus: 3.519 },
      { max: Infinity, age5: 3.510, age7: 3.598, age7plus: 3.686 }
    ]
  },

  /* ============================================================
     7.  AUTO RICKSHAW (3W Passenger < 6 seats)
     ============================================================ */
  auto: {
    zoneA: [
      { max: Infinity, age5: 1.278, age7: 1.310, age7plus: 1.342 }
    ],
    zoneB: [
      { max: Infinity, age5: 1.272, age7: 1.304, age7plus: 1.336 }
    ],
    zoneC: [
      { max: Infinity, age5: 1.260, age7: 1.292, age7plus: 1.323 }
    ]
  },

  /* ============================================================
     8.  PCCV (6–17 seats)
     ============================================================ */
  pccvSmall: {
    zoneA: [
      { max: Infinity, age5: 1.656, age7: 1.697, age7plus: 1.739 }
    ],
    zoneB: [
      { max: Infinity, age5: 1.656, age7: 1.697, age7plus: 1.739 }
    ],
    zoneC: [
      { max: Infinity, age5: 1.656, age7: 1.697, age7plus: 1.739 }
    ]
  },

  /* ============================================================
     8A.  PCCV (17–34 seats)
     ============================================================ */
  pccvMedium: {
    zoneA: [
      { max: Infinity, age5: 1.656, age7: 1.697, age7plus: 1.739 }
    ],
    zoneB: [
      { max: Infinity, age5: 1.656, age7: 1.697, age7plus: 1.739 }
    ],
    zoneC: [
      { max: Infinity, age5: 1.656, age7: 1.697, age7plus: 1.739 }
    ]
  },

  /* ============================================================
     8B.  PCCV (34–60 seats)
     ============================================================ */
  pccvLarge: {
    zoneA: [
      { max: Infinity, age5: 1.656, age7: 1.697, age7plus: 1.739 }
    ],
    zoneB: [
      { max: Infinity, age5: 1.656, age7: 1.697, age7plus: 1.739 }
    ],
    zoneC: [
      { max: Infinity, age5: 1.656, age7: 1.697, age7plus: 1.739 }
    ]
  },

  /* ============================================================
     8C.  PCCV (>60 seats)
     ============================================================ */
  pccvExtraLarge: {
    zoneA: [
      { max: Infinity, age5: 1.656, age7: 1.697, age7plus: 1.739 }
    ],
    zoneB: [
      { max: Infinity, age5: 1.656, age7: 1.697, age7plus: 1.739 }
    ],
    zoneC: [
      { max: Infinity, age5: 1.656, age7: 1.697, age7plus: 1.739 }
    ]
  },

  /* ============================================================
     10. GCCV (Goods Carrying Commercial Vehicle) — by GVW
     ============================================================ */
  gccv: {
    zoneA: [
      { max: 7500,  age5: 1.751, age7: 1.795, age7plus: 1.839 },
      { max: 12000, age5: 1.751, age7: 1.795, age7plus: 1.839 },
      { max: 20000, age5: 1.751, age7: 1.795, age7plus: 1.839 },
      { max: 40000, age5: 1.751, age7: 1.795, age7plus: 1.839 },
      { max: Infinity, age5: 1.751, age7: 1.795, age7plus: 1.839 }
    ],
    zoneB: [
      { max: 7500,  age5: 1.743, age7: 1.787, age7plus: 1.830 },
      { max: 12000, age5: 1.743, age7: 1.787, age7plus: 1.830 },
      { max: 20000, age5: 1.743, age7: 1.787, age7plus: 1.830 },
      { max: 40000, age5: 1.743, age7: 1.787, age7plus: 1.830 },
      { max: Infinity, age5: 1.743, age7: 1.787, age7plus: 1.830 }
    ],
    zoneC: [
      { max: 7500,  age5: 1.726, age7: 1.770, age7plus: 1.812 },
      { max: 12000, age5: 1.726, age7: 1.770, age7plus: 1.812 },
      { max: 20000, age5: 1.726, age7: 1.770, age7plus: 1.812 },
      { max: 40000, age5: 1.726, age7: 1.770, age7plus: 1.812 },
      { max: Infinity, age5: 1.726, age7: 1.770, age7plus: 1.812 }
    ]
  },

  /* ============================================================
     11. Misc-D, Ambulance, etc.
     As per the attached PDF (Class D - Other Misc./Spl. Type of Vehs)
     ============================================================ */
  miscD: {
    /* Age brackets w.e.f. 01.07.2026: 1-5yr | 5-7yr | 7+ yrs */
    zoneA: [
      { max: Infinity, age5: 1.208, age7: 1.223, age10plus: 1.268 }
    ],
    zoneB: [
      { max: Infinity, age5: 1.202, age7: 1.222, age10plus: 1.232 }
    ],
    zoneC: [
      { max: Infinity, age5: 1.190, age7: 1.220, age10plus: 1.250 }
    ]
  },
  ambulance: {
    /* Age brackets w.e.f. 01.07.2026: 1-5yr | 5-7yr | 7+ yrs */
    zoneA: [
      { max: Infinity, age5: 1.208, age7: 1.223, age10plus: 1.268 }
    ],
    zoneB: [
      { max: Infinity, age5: 1.202, age7: 1.222, age10plus: 1.232 }
    ],
    zoneC: [
      { max: Infinity, age5: 1.190, age7: 1.220, age10plus: 1.250 }
    ]
  },
  schoolBus: {
    /* School bus — uses bus rates (1.656% etc.) */
    zoneA: [
      { max: Infinity, age5: 1.680, age7: 1.722, age7plus: 1.764 }
    ],
    zoneB: [
      { max: Infinity, age5: 1.672, age7: 1.714, age7plus: 1.756 }
    ],
    zoneC: [
      { max: Infinity, age5: 1.656, age7: 1.697, age7plus: 1.739 }
    ]
  },
  staffBus: {
    /* Staff bus — mirrors School Bus rates */
    zoneA: [
      { max: Infinity, age5: 1.680, age7: 1.722, age7plus: 1.764 }
    ],
    zoneB: [
      { max: Infinity, age5: 1.672, age7: 1.714, age7plus: 1.756 }
    ],
    zoneC: [
      { max: Infinity, age5: 1.656, age7: 1.697, age7plus: 1.739 }
    ]
  }
};

/* ============================================================
   11A.  FIXED OD ADDITION for PCCV categories
        After computing Basic OD = IDV × rate/100, a fixed
        rupee amount is added depending on seating capacity.
   ============================================================ */
/* Fixed OD Addition for ALL Bus types (PCCV + School Bus + Staff Bus) —
   based on SEATING CAPACITY (not a fixed per-type amount).
   Bands: Upto 18 -> 350, 19-36 -> 450, 37-60 -> 550, >60 -> 680 */
var BUS_FIXED_OD_ADDITION = [
  { maxSeats: 18,       amount: 350 },
  { maxSeats: 36,       amount: 450 },
  { maxSeats: 60,       amount: 550 },
  { maxSeats: Infinity, amount: 680 }
];

/* ============================================================
   11B.  GCCV EXTRA GVW LOADING
        Premium loading for Goods Carrying Commercial Vehicles
        when GVW exceeds threshold.
        Default: GVW > 12,000 kg => ₹0.27 per excess kg
        Example: GVW 15,000 kg => excess 3,000 kg × ₹0.27 = ₹810
   ============================================================ */
var GCCV_EXTRA_GVW = {
  enabled: true,
  thresholdKg: 12000,
  ratePerKg: 0.27,
  label: 'Extra GVW Loading'
};

/* Helper: calculate GCCV extra GVW loading premium */
function getGCCVExtraGVWLoading(gvwKg) {
  gvwKg = parseFloat(gvwKg) || 0;
  if (!GCCV_EXTRA_GVW.enabled) return { excessKg: 0, premium: 0 };
  if (gvwKg <= GCCV_EXTRA_GVW.thresholdKg) return { excessKg: 0, premium: 0 };
  var excessKg = gvwKg - GCCV_EXTRA_GVW.thresholdKg;
  var premium = Math.round(excessKg * GCCV_EXTRA_GVW.ratePerKg);
  return { excessKg: excessKg, premium: premium };
}

/* ============================================================
   12. THIRD PARTY (TP) Premium Rates — from PDF
       Structure varies by vehicle type:
       - Pvt Car: flat per CC, separate 1-Year and 3-Year rates
       - Two Wheeler: 1-Year per CC, 5-Year bundled per CC
       - Taxi/Commercial: base + per-passenger (PP)
       - GCCV: by GVW (fixed, no PP)
   ============================================================ */
var TP_RATES = {

  /* ---------- PVT CAR — TP + CPA (Bundled Policy 3yr + CPA) ---------- */
  /* PDF shows: "TP XXXX + CPA 320" (1-yr) / "TP YYYY + CPA 900" (3-yr) */
  pvtCar: {
    annual: [            // 1-Year TP (per year)
      { max: 1000, tp: 2094, cpa: 320 },
      { max: 1500, tp: 3416, cpa: 320 },
      { max: Infinity, tp: 7897, cpa: 320 }
    ],
    threeYear: [         // 3-Year TP (Bundled)
      { max: 1000, tp: 6521, cpa: 900 },
      { max: 1500, tp: 10640, cpa: 900 },
      { max: Infinity, tp: 24596, cpa: 900 }
    ]
  },

  /* ---------- TWO WHEELER — TP + CPA (Bundled Policy 5yr + CPA) ---------- */
  twoWheeler: {
    annual: [
      { max: 75, tp: 538, cpa: 360 },
      { max: 150, tp: 714, cpa: 360 },
      { max: 350, tp: 1366, cpa: 360 },
      { max: Infinity, tp: 2804, cpa: 360 }
    ],
    /* 3-Year IRDAI standard rates */
    threeYear: [
      { max: 75, tp: 1614, cpa: 1080 },
      { max: 150, tp: 2442, cpa: 1080 },
      { max: 350, tp: 3966, cpa: 1080 },
      { max: Infinity, tp: 6711, cpa: 1080 }
    ],
    /* 5-Year Bundled Policy (from PDF) */
    fiveYear: [
      { max: 75, tp: 2901, cpa: 1607 },
      { max: 150, tp: 3851, cpa: 1607 },
      { max: 350, tp: 7365, cpa: 1607 },
      { max: Infinity, tp: 15117, cpa: 1607 }
    ]
  },

  /* ---------- ELECTRIC PVT CAR ---------- */
  evPvtCar: {
    annual: [
      { max: 30, tp: 1780, cpa: 320 },
      { max: 65, tp: 2904, cpa: 320 },
      { max: Infinity, tp: 6712, cpa: 320 }
    ],
    threeYear: [
      { max: 30, tp: 5543, cpa: 900 },
      { max: 65, tp: 9044, cpa: 900 },
      { max: Infinity, tp: 20907, cpa: 900 }
    ]
  },

  /* ---------- ELECTRIC TWO WHEELER ---------- */
  evTwoWheeler: {
    annual: [
      { max: 3, tp: 457, cpa: 360 },
      { max: 7, tp: 607, cpa: 360 },
      { max: 16, tp: 1161, cpa: 360 },
      { max: Infinity, tp: 2383, cpa: 360 }
    ],
    threeYear: [
      { max: 3, tp: 1371, cpa: 1080 },
      { max: 7, tp: 1821, cpa: 1080 },
      { max: 16, tp: 3483, cpa: 1080 },
      { max: Infinity, tp: 7149, cpa: 1080 }
    ],
    fiveYear: [
      { max: 3, tp: 2466, cpa: 1607 },
      { max: 7, tp: 3273, cpa: 1607 },
      { max: 16, tp: 6260, cpa: 1607 },
      { max: Infinity, tp: 12849, cpa: 1607 }
    ]
  },

  /* ---------- TAXI (4W Passenger < 6 seats) — TP + PP × pass ---------- */
  /* PDF: "TP XXXX + CPA-320 + PP × YY" per passenger */
  taxi: {
    annual: [
      { max: 1000, baseTp: 6040, perPassenger: 1162 },
      { max: 1500, baseTp: 7940, perPassenger: 978 },
      { max: Infinity, baseTp: 10523, perPassenger: 1117 }
    ],
    threeYear: [
      { max: 1000, baseTp: 18120, perPassenger: 3486 },
      { max: 1500, baseTp: 23820, perPassenger: 2934 },
      { max: Infinity, baseTp: 31569, perPassenger: 3351 }
    ]
  },

  /* ---------- AUTO RICKSHAW (3W < 6 seats) ---------- */
  auto: {
    annual: [
      { max: Infinity, baseTp: 2539, perPassenger: 1214 }
    ],
    threeYear: [
      { max: Infinity, baseTp: 7617, perPassenger: 3642 }
    ]
  },

  /* ---------- PCCV (6–17 seats) ---------- */
  pccvSmall: {
    annual: [
      { max: Infinity, baseTp: 14343, perPassenger: 877 }
    ],
    threeYear: [
      { max: Infinity, baseTp: 43029, perPassenger: 2631 }
    ]
  },

  /* ---------- PCCV (17–34 seats) ---------- */
  pccvMedium: {
    annual: [
      { max: Infinity, baseTp: 14343, perPassenger: 877 }
    ],
    threeYear: [
      { max: Infinity, baseTp: 43029, perPassenger: 2631 }
    ]
  },

  /* ---------- PCCV (34–60 seats) ---------- */
  pccvLarge: {
    annual: [
      { max: Infinity, baseTp: 14343, perPassenger: 877 }
    ],
    threeYear: [
      { max: Infinity, baseTp: 43029, perPassenger: 2631 }
    ]
  },

  /* ---------- PCCV (>60 seats) ---------- */
  pccvExtraLarge: {
    annual: [
      { max: Infinity, baseTp: 14343, perPassenger: 877 }
    ],
    threeYear: [
      { max: Infinity, baseTp: 43029, perPassenger: 2631 }
    ]
  },

  /* ---------- GCCV (Goods Carrying) — by GVW, fixed TP ---------- */
  gccv: {
    annual: [
      { max: 7500,  tp: 16049 },
      { max: 12000, tp: 27186 },
      { max: 20000, tp: 35313 },
      { max: 40000, tp: 43950 },
      { max: Infinity, tp: 44242 }
    ],
    threeYear: [
      { max: 7500,  tp: 48147 },
      { max: 12000, tp: 81558 },
      { max: 20000, tp: 105939 },
      { max: 40000, tp: 131850 },
      { max: Infinity, tp: 132726 }
    ]
  },

  /* ---------- MISC-D ---------- */
  miscD: {
    annual: [
      { max: Infinity, tp: 7267, cpa: 320 }
    ],
    threeYear: [
      { max: Infinity, tp: 7267 * 3, cpa: 900 }
    ]
  },

  /* ---------- AMBULANCE ---------- */
  ambulance: {
    annual: [
      { max: Infinity, tp: 7267, cpa: 320 }
    ],
    threeYear: [
      { max: Infinity, tp: 7267 * 3, cpa: 900 }
    ]
  },

  /* ---------- SCHOOL BUS ---------- */
  schoolBus: {
    annual: [
      { max: Infinity, baseTp: 12192, perPassenger: 745 }
    ],
    threeYear: [
      { max: Infinity, baseTp: 36576, perPassenger: 2235 }
    ]
  },
  staffBus: {
    annual: [
      { max: Infinity, baseTp: 12192, perPassenger: 745 }
    ],
    threeYear: [
      { max: Infinity, baseTp: 36576, perPassenger: 2235 }
    ]
  }
};

/* ============================================================
   13. NIL DEP (ND) ADD-ON COVER RATES — % of IDV
       Source: "REVISED NIL DEPRECIATION ADD ON COVER RATES W.E.F 01.01.2023"
               B.O. JAGDALPUR (192001)
       -------------------------------------------------------------
       NOTES (per circular):
         • Premium = % of IDV (NOT % of OD).
         • Max 2 claims under ND Cover per Year.
         • Pvt Car ND Cover available upto 6.5 Years only.
           • Min 20% NCB required only when vehicle age exceeds 5 years.
         • NO NCB Discount and NO Renewal Discount on ND Cover.
         • Existing Discount on ND will continue.
       -------------------------------------------------------------
       Pvt Car  -> fuel-wise (petrol / diesel / cng / lpg / ev)
                   CNG, LPG & EV  =  Petrol rates (per user mapping)
       Two Wheeler -> CC-based (Upto 150 CC / Above 150 CC).
                   EV 2W = same as Petrol 2W rates (per user mapping).
       For 7+ years, last band (6-7 Yr) rate is extended.
       Other vehicle types (Taxi/PCCV/GCCV/etc.) retain the legacy
       % of OD slab structure used elsewhere in this app.
       Use getNilDepRate(vehicleType, fuelType, ageInYears, ccOrKw)
       to fetch the correct % of IDV.
   ============================================================ */
var NIL_DEP_RATE = {
  /* ---------- PRIVATE CAR — fuel-wise, % of IDV ---------- */
  pvtCar: {
    petrol: [
      { max: 1, rate: 0.37 },     // 0-1 Year
      { max: 2, rate: 0.59 },     // 1-2 Year
      { max: 3, rate: 0.87 },     // 2-3 Year
      { max: 4, rate: 1.10 },     // 3-4 Year
      { max: 5, rate: 1.17 },     // 4-5 Year
      { max: 6, rate: 1.44 },     // 5-6 Year
      { max: 6.5, rate: 1.72 },   // 6-6.5 Year (Pvt Car ND max 6.5 yrs)
      { max: Infinity, rate: 0 }  // >6.5 Year — NOT AVAILABLE
    ],
    diesel: [
      { max: 1, rate: 0.56 },
      { max: 2, rate: 0.85 },
      { max: 3, rate: 1.13 },
      { max: 4, rate: 1.38 },
      { max: 5, rate: 1.49 },
      { max: 6, rate: 2.10 },
      { max: 6.5, rate: 2.45 },
      { max: Infinity, rate: 0 }
    ],
    cng: 'petrol',     // CNG mapped to Petrol rates
    lpg: 'petrol',     // LPG mapped to Petrol rates
    ev:  'petrol',     // EV  mapped to Petrol rates
    electric: 'petrol' // alias
  },

  /* ---------- TWO WHEELER — CC-based, % of IDV ---------- */
  /* EV 2W uses Petrol 2W rates (KW threshold ~16 KW ≈ above 150 CC) */
  twoWheeler: {
    upto150: [
      { max: 1, rate: 0.25 },
      { max: 2, rate: 0.40 },
      { max: 3, rate: 0.60 },
      { max: 4, rate: 0.70 },
      { max: 5, rate: 0.90 },
      { max: Infinity, rate: 0 }      // >5 years — NOT AVAILABLE
    ],
    above150: [
      { max: 1, rate: 0.40 },
      { max: 2, rate: 0.50 },
      { max: 3, rate: 0.70 },
      { max: 4, rate: 0.80 },
      { max: 5, rate: 1.20 },
      { max: Infinity, rate: 0 }      // >5 years — NOT AVAILABLE
    ]
  },

  /* ---------- EV PVT CAR — same as Pvt Car Petrol ---------- */
  evPvtCar: 'pvtCar',          // alias, resolved by getNilDepRate()

  /* ---------- EV TWO WHEELER — same as 2W ---------- */
  evTwoWheeler: 'twoWheeler',  // alias, resolved by getNilDepRate()

  /* Taxi / PCCV / Commercial — CAPPED at 30%, NOT AVAILABLE above 5 yrs */
  taxi: [
    { max: 0.5, rate: 10 },
    { max: 2,   rate: 20 },
    { max: 5,   rate: 30 },
    { max: Infinity, rate: 0 }            // NOT AVAILABLE
  ],
  auto: [
    { max: 0.5, rate: 10 },
    { max: 2,   rate: 20 },
    { max: 5,   rate: 30 },
    { max: Infinity, rate: 0 }
  ],
  schoolBus: [
    { max: 0.5, rate: 10 },
    { max: 2,   rate: 20 },
    { max: 5,   rate: 30 },
    { max: Infinity, rate: 0 }
  ],
  staffBus: [
    { max: 0.5, rate: 10 },
    { max: 2,   rate: 20 },
    { max: 5,   rate: 30 },
    { max: Infinity, rate: 0 }
  ],
  pccvSmall: [
    { max: 0.5, rate: 10 },
    { max: 2,   rate: 20 },
    { max: 5,   rate: 30 },
    { max: Infinity, rate: 0 }
  ],
  pccvMedium: [
    { max: 0.5, rate: 10 },
    { max: 2,   rate: 20 },
    { max: 5,   rate: 30 },
    { max: Infinity, rate: 0 }
  ],
  pccvLarge: [
    { max: 0.5, rate: 10 },
    { max: 2,   rate: 20 },
    { max: 5,   rate: 30 },
    { max: Infinity, rate: 0 }
  ],
  pccvExtraLarge: [
    { max: 0.5, rate: 10 },
    { max: 2,   rate: 20 },
    { max: 5,   rate: 30 },
    { max: Infinity, rate: 0 }
  ],
  gccv: [
    { max: 0.5, rate: 10 },
    { max: 2,   rate: 20 },
    { max: 5,   rate: 30 },
    { max: Infinity, rate: 0 }
  ],
  miscD: [
    { max: 0.5, rate: 10 },
    { max: 2,   rate: 20 },
    { max: 5,   rate: 30 },
    { max: Infinity, rate: 40 }
  ],
  ambulance: [
    { max: 0.5, rate: 10 },
    { max: 2,   rate: 20 },
    { max: 5,   rate: 30 },
    { max: Infinity, rate: 0 }
  ]
};

/* ============================================================
   14. IDV DEPRECIATION TABLE (per PDF page 3)
       "Age of Vehicle % of Dep for Fixing IDV"
   ============================================================ */
var DEPRECIATION_TABLE = [
  { max: 0.5,           factor: 0.95 },     // Upto 6 months: 5% dep
  { max: 1,             factor: 0.85 },     // 6 months - 1 Year: 15% dep
  { max: 2,             factor: 0.80 },     // 1-2 Years: 20% dep
  { max: 3,             factor: 0.70 },     // 2-3 Years: 30% dep
  { max: 4,             factor: 0.60 },     // 3-4 Years: 40% dep
  { max: 5,             factor: 0.50 },     // 4-5 Years: 50% dep
  { max: Infinity,      factor: 0.50 }      // >5 Years: 50% (or as per insurer)
];

/* ============================================================
   15. NCB SLABS (per PDF page 3)
   ============================================================ */
var NCB_SLABS = [0, 20, 25, 35, 45, 50];

/* ============================================================
   16. RTI RATES (per PDF page 3)
       Different for 2W/4W vs Commercial.
       App rule: age <=1 yr = new, >1 to <=2 yr = first renewal,
       >2 yr = second renewal rate (continues for >3 yrs because no
       separate 4th-year RTI rate is provided in this table).
   ============================================================ */
var RTI_RATES = {
  pvtCar: {
    new: 0.30,
    firstRenewal: 0.40,
    secondRenewal: 0.60
  },
  twoWheeler: {
    new: 0.30,
    firstRenewal: 0.40,
    secondRenewal: 0.60
  },
  /* Commercial & Misc vehicles */
  commercial: {
    new: 0.45,
    firstRenewal: 0.55,
    secondRenewal: 0.70
  }
};

/* ============================================================
   17. ADD-ON LOADING FACTORS (per IRDAI / OIC)
       Engine Protection and other add-ons vary by vehicle type.
   ============================================================ */
var ADDON_FACTORS = {
  /* Engine Protection — varies by vehicle age & fuel type (Petrol / Diesel) for Pvt Cars.
     Petrol group includes CNG, LPG & battery-operated vehicles.
     All rates are expressed as % of IDV.
     Pvt Car EP Disc/Load rule used in app.js (FINAL):
       DISCOUNT (stack, max 15%):
         CC ≤ 1500 → 10% ; IDV ≤ ₹10L → 10% ; both → CAP 15%
       CANCEL (0) when:
         ₹10L < IDV < ₹20L AND CC 1501–2499
         (2499 tak no loading; 2500 se loading)
       LOADING:
         IDV ≥ ₹20L + CC 1501–2499 → 10%
         ₹10L < IDV < ₹20L + CC ≥ 2500 → 10%
         IDV ≥ ₹20L + CC ≥ 2500 → 15%
         IDV ≥ ₹20L + CC ≤ 1500 → 0
       Examples:
         IDV 8L + CC 1100 → 15% disc
         IDV 6.45L + CC 1600 → 10% disc
         IDV 11L + CC 1600/1987 → 0
         IDV 11L + CC 2800 → 10% load
         IDV 23L + CC 1987 → 10% load
         IDV 23L + CC 2800 → 15% load
     NCB applies on the final loading / discount amount. GST is extra.
     Use getEngineProtRate(vehicleType, fuelType, ageInYears) to fetch the correct rate. */
  engineProt: {
    pvtCar: {
      petrol: [
        { maxAge: 0.5,  rate: 0.16 },   // Not exceeding 6 months
        { maxAge: 1.5,  rate: 0.18 },   // >6 months but <= 1.5 years
        { maxAge: 3,    rate: 0.21 },   // >1.5 years but <= 3 years
        { maxAge: 4,    rate: 0.25 },   // >3 years but <= 4 years
        { maxAge: 5,    rate: 0.30 },   // >4 years but <= 5 years
        { maxAge: 10,   rate: 0.18 }    // >5 years but <= 10 years
      ],
      diesel: [
        { maxAge: 0.5,  rate: 0.19 },   // Not exceeding 6 months
        { maxAge: 1.5,  rate: 0.22 },   // >6 months but <= 1.5 years
        { maxAge: 3,    rate: 0.25 },   // >1.5 years but <= 3 years
        { maxAge: 4,    rate: 0.30 },   // >3 years but <= 4 years
        { maxAge: 5,    rate: 0.37 },   // >4 years but <= 5 years
        { maxAge: 10,   rate: 0.22 }    // >5 years but <= 10 years
      ],
      cng:  'petrol',   // CNG/LPG treated as Petrol per chart
      lpg:  'petrol',
      ev:   'petrol'    // battery-operated included in Petrol group
    },
    twoWheeler: 0.12,
    taxi:       0.20,
    auto:       0.20,
    schoolBus:  0.20,
    staffBus:   0.20,
    pccvSmall:  0.20,
    pccvMedium: 0.20,
    pccvLarge: 0.20,
    pccvExtraLarge: 0.20,
    gccv:       0.20,
    miscD:      0.16,
    ambulance:  0.16
  },
  /* Consumables — age-based % of IDV (Private Car / 2W) */
  consumables: [
    { maxAge: 1,  rate: 0.10 },
    { maxAge: 3,  rate: 0.11 },
    { maxAge: 5,  rate: 0.14 },
    { maxAge: Infinity, rate: 0.14 }
  ],

  /* TAXI specific Consumables rates (user specified - only for TAXI)
     New (upto 2 yrs): 0.10%, 2-3 yrs: 0.11%, 3-4 yrs: 0.14%,
     upto 5 yrs: 0.14% continues. Above 5 yrs: NOT available */
  consumablesTaxi: [
    { maxAge: 1,   rate: 0.10 },   // new (0-1 yr)
    { maxAge: 3,   rate: 0.11 },   // 2nd yr / 2-3 yr (age > 1 upto 3)
    { maxAge: 5,   rate: 0.14 },
    { maxAge: Infinity, rate: 0 }   // >5 yrs — NOT AVAILABLE
  ],

  /* GCCV specific Consumables rates (user specified - only for GCCV)
     1 year: 0.15%, 1-2 years: 0.18%, 2-3 years: 0.22%,
     3-4 years: 0.25%, 4-5 years: 0.27% */
  consumablesGCCV: [
    { maxAge: 1,   rate: 0.15 },
    { maxAge: 2,   rate: 0.18 },
    { maxAge: 3,   rate: 0.22 },
    { maxAge: 4,   rate: 0.25 },
    { maxAge: 5,   rate: 0.27 },
    { maxAge: Infinity, rate: 0.27 }
  ],

  rti: {
    pvtCar: 0.30, evPvtCar: 0.30, twoWheeler: 0.30, evTwoWheeler: 0.30,
    taxi: 0.30, auto: 0.30, schoolBus: 0.30, staffBus: 0.30,
    pccvSmall: 0.30, pccvMedium: 0.30, pccvLarge: 0.30, pccvExtraLarge: 0.30,
    gccv: 0.30, miscD: 0.30, ambulance: 0.30
  },
  tyreRim: {
    pvtCar: 0.20, evPvtCar: 0.20, twoWheeler: 0.20, evTwoWheeler: 0.20,
    taxi: 0.30, auto: 0.20, schoolBus: 0.20, staffBus: 0.20,
    pccvSmall: 0.20, pccvMedium: 0.20, pccvLarge: 0.20, pccvExtraLarge: 0.20,
    gccv: 0.20, miscD: 0.20, ambulance: 0.20
  },
  altCar: {
    pvtCar: 0.10, evPvtCar: 0.10, twoWheeler: 0.10, evTwoWheeler: 0.10,
    taxi: 0.10, auto: 0.10,
    schoolBus: 0, staffBus: 0, pccvSmall: 0, pccvMedium: 0, pccvLarge: 0, pccvExtraLarge: 0,
    gccv: 0, miscD: 0, ambulance: 0
  },
  batteryProt: {
    /* Private Car + Electric Pvt Car — same age-based rates (% of Total IDV) */
    pvtCar: [
      { maxAge: 1,   rate: 0.34 },
      { maxAge: 2,   rate: 0.38 },
      { maxAge: 3,   rate: 0.45 },
      { maxAge: 4,   rate: 0.53 },
      { maxAge: 5,   rate: 0.53 },
      { maxAge: Infinity, rate: 0.53 }
    ],
    evPvtCar: [
      { maxAge: 1,   rate: 0.34 },
      { maxAge: 2,   rate: 0.38 },
      { maxAge: 3,   rate: 0.45 },
      { maxAge: 4,   rate: 0.53 },
      { maxAge: 5,   rate: 0.53 },
      { maxAge: Infinity, rate: 0.53 }
    ],
    twoWheeler: 0.10, evTwoWheeler: 0.10,
    taxi: 0.10, auto: 0.10,
    schoolBus: 0.10, staffBus: 0.10, pccvSmall: 0.10, pccvMedium: 0.10,
    pccvLarge: 0.10, pccvExtraLarge: 0.10, gccv: 0.10, miscD: 0.10, ambulance: 0.10
  },
  /* Electrical / Electronic accessories — % of declared accessories value (not full vehicle IDV) */
  elecAcc: {
    pvtCar: 4.00, evPvtCar: 4.00, twoWheeler: 4.00, evTwoWheeler: 4.00,
    taxi: 4.00, auto: 4.00, schoolBus: 4.00, staffBus: 4.00,
    pccvSmall: 4.00, pccvMedium: 4.00, pccvLarge: 4.00, pccvExtraLarge: 4.00,
    gccv: 4.00, miscD: 4.00, ambulance: 4.00
  },
  /* Non-Electrical Accessories — lower rate typically 2% */
  nonElecAcc: {
    pvtCar: 2.00, evPvtCar: 2.00, twoWheeler: 2.00, evTwoWheeler: 2.00,
    taxi: 2.00, auto: 2.00, schoolBus: 2.00, staffBus: 2.00,
    pccvSmall: 2.00, pccvMedium: 2.00, pccvLarge: 2.00, pccvExtraLarge: 2.00,
    gccv: 2.00, miscD: 2.00, ambulance: 2.00
  },
  /* Per PDF page 3: "IMT 23 — Additional premium @ 15% of Gross OD Premium For All Commercial Vehicles" */
  imt23: {
    pvtCar:     0,
    evPvtCar:   0,
    twoWheeler: 0,
    evTwoWheeler: 0,
    taxi:       0,     // Taxi: IMT-23 NOT applicable (removed as per requirement)
    auto:       15,
schoolBus: 15, staffBus: 15,
    pccvSmall:  15,
    pccvMedium: 15,
    pccvLarge:  15,
    pccvExtraLarge: 15,
    gccv:       15,    // <-- added in V26.7 – GCCV is commercial
    miscD:      15,
    ambulance:  15
  },
  cngOD:    { pctOfCNG: 0.20 },
  emiProt:  { flat: 0 },
  persBelong: {
    pvtCar: 0.05, evPvtCar: 0.05, twoWheeler: 0.05, evTwoWheeler: 0.05,
    taxi: 0.05, auto: 0.05, schoolBus: 0.05, staffBus: 0.05,
    pccvSmall: 0.05, pccvMedium: 0.05, pccvLarge: 0.05, pccvExtraLarge: 0.05,
    gccv: 0.05, miscD: 0.05, ambulance: 0.05
  },
  overturning: { flat: 0 },
  additionalTow: { flat: 0 }
};

/* ============================================================
   18. TP-SIDE FLAT RATES (per PDF, NOT for Pvt Car since CPA is in TP)
   ============================================================ */
var TP_FLAT = {
  /* For Pvt Car, CPA is included in TP — no separate rate needed */
  cpaPvtCar: { perYear: 320 },          // Owner-Driver PA Cover (SI ₹ 2 L)
  cpa2W:     { perYear: 360 },          // Owner-Driver PA for 2W
  llEmployee: { perYear: 50 },          // LL to Employees (Pvt Car)
  llEmployeeCommercial: { perYear: 100 },
  llPaidDrv: { perYear: 50 },
  llPaidDrvCommercial: { perYear: 50 },
  passPA:    { ratePerLakh: 50, defaultSI: 100000, maxSI: 200000 },
  cngTP_PerLakh: 60
};

/* ============================================================
   18B. CNG/LPG OD COVER — % of Basic OD (GCCV, Taxi, Pvt Car)
        Defined here so the rate is controlled from one place.
   ============================================================ */
var CNG_OD_PCT = 0.05;   // 5% of Basic OD

/* ============================================================
   18A. KEY REPLACEMENT COVER — IDV slab based (per uploaded PDF)
   ============================================================ */
var KEY_REPLACEMENT_RATES = [
  { max: 600000,  premium: 250, label: 'IDV upto ₹6,00,000' },
  { max: 1200000, premium: 300, label: 'IDV ₹6,00,001 – ₹12,00,000' },
  { max: 2500000, premium: 400, label: 'IDV ₹12,00,001 – ₹25,00,000' },
  { max: Infinity, premium: 500, label: 'IDV ₹25,00,001 & above' }
];

function getKeyReplacementSlab(idv) {
  idv = parseFloat(idv) || 0;
  for (var i = 0; i < KEY_REPLACEMENT_RATES.length; i++) {
    if (idv <= KEY_REPLACEMENT_RATES[i].max) return KEY_REPLACEMENT_RATES[i];
  }
  return KEY_REPLACEMENT_RATES[KEY_REPLACEMENT_RATES.length - 1];
}

function getKeyReplacementPremium(idv) {
  return getKeyReplacementSlab(idv).premium;
}

/* ============================================================
   19. ANTI-THEFT DISCOUNT
       Per PDF — "Less: Anti Theft Discount" — 2.5% of post-U/W base, cap ₹750
   ============================================================ */
var ANTI_THEFT_PCT = 2.5;
var ANTI_THEFT_CAP = 750;

/* ============================================================
   20. GST RATES
   ============================================================ */
var GST_RATES = {
  default: 18,
  evTP: 5,
  gccvTP: 5
};

/* ============================================================
   21. COMMISSION — Now in separate file: commission_rates.js
       DO NOT add commission code here. Edit commission_rates.js
       for any commission-related changes (CIRCULAR-8811 w.e.f. 01.07.2026).
   ============================================================ */

/* ============================================================
   22. HELPER FUNCTIONS
   ============================================================ */
function getZoneKey(zone) {
  if (zone === 'A') return 'zoneA';
  if (zone === 'B') return 'zoneB';
  return 'zoneC';
}

/* Consumables rate lookup by vehicle age.
   - Pvt Car / 2W: uses standard age-based table
   - GCCV: uses dedicated GCCV age-based table (user-specified rates) */
function getConsumablesRate(ageInYears, vehicleType) {
  ageInYears = parseFloat(ageInYears) || 0;

  if (vehicleType === 'gccv') {
    // GCCV specific rates (only for GCCV)
    const gccvTable = ADDON_FACTORS.consumablesGCCV || [];
    for (var k = 0; k < gccvTable.length; k++) {
      if (ageInYears <= gccvTable[k].maxAge) {
        return gccvTable[k].rate;
      }
    }
    return 0.27;
  }

  if (vehicleType === 'taxi') {
    // TAXI specific age-based rates: 0.10 (new), 0.11 (2-3), 0.14 (3-5). >5 yrs: 0
    const taxiTable = ADDON_FACTORS.consumablesTaxi || [];
    for (var t = 0; t < taxiTable.length; t++) {
      if (ageInYears <= taxiTable[t].maxAge) {
        return taxiTable[t].rate;
      }
    }
    return 0;
  }

  // Private car / 2W — standard age based
  for (var i = 0; i < ADDON_FACTORS.consumables.length; i++) {
    if (ageInYears <= ADDON_FACTORS.consumables[i].maxAge) {
      return ADDON_FACTORS.consumables[i].rate;
    }
  }
  return ADDON_FACTORS.consumables[ADDON_FACTORS.consumables.length - 1].rate;
}

/* ============================================================
   Nil Depreciation rate lookup — % of IDV (Pvt Car / 2W)
   or % of OD (legacy slab for Taxi/PCCV/GCCV/etc.)
   -------------------------------------------------------------
   Signature:
     getNilDepRate(vehicleType, fuelType, ageInYears, ccOrKw, ncbPct)
   -------------------------------------------------------------
   Eligibility rules auto-enforced (returns 0 if NOT eligible):
     • Pvt Car (incl. evPvtCar): age > 6.5 yrs     -> 0
     • Pvt Car (incl. evPvtCar): age > 5 yrs and NCB < 20% -> 0  (if ncbPct given)
     • Commercial (taxi/auto/pccv/gccv/etc.): age > 5 yrs -> 0
   The ncbPct parameter is OPTIONAL — if you don't pass it, the
   NCB rule is skipped (legacy behaviour preserved).
   -------------------------------------------------------------
   Usage:
     getNilDepRate('pvtCar',     'petrol',  2.5)            => 0.87  (% of IDV)
     getNilDepRate('pvtCar',     'diesel',  4)              => 1.49  (% of IDV)
     getNilDepRate('pvtCar',     'petrol',  3, null, 0)     => 0.87  (NCB not required upto 5 yrs)
     getNilDepRate('pvtCar',     'petrol',  5.5, null, 0)   => 0     (age >5 yrs and NCB <20%, N/A)
     getNilDepRate('pvtCar',     'petrol',  5.5, null, 20)  => 1.44  (age >5 yrs, NCB 20% OK)
     getNilDepRate('pvtCar',     'petrol',  7)              => 0     (age >6.5, N/A)
     getNilDepRate('pvtCar',     'cng',     1)              => 0.37  (uses petrol)
     getNilDepRate('evPvtCar',   'ev',      0.5)            => 0.37  (uses petrol)
     getNilDepRate('twoWheeler', 'petrol',  3, 160)         => 0.70  (above 150 CC)
     getNilDepRate('twoWheeler', 'petrol',  3, 110)         => 0.60  (upto 150 CC)
     getNilDepRate('evTwoWheeler','ev',     3, 4)           => 0.60  (4 KW ~ upto 150 CC)
     getNilDepRate('taxi',       null,      3)              => 30    (% of OD, legacy)
     getNilDepRate('taxi',       null,      6)              => 0     (>5 yrs, N/A)

   Returns 0 if ND Cover is NOT AVAILABLE for any reason above.
   ============================================================ */
function getNilDepRate(vehicleType, fuelType, ageInYears, ccOrKw, ncbPct) {
  ageInYears = parseFloat(ageInYears) || 0;
  fuelType   = (fuelType || 'petrol').toString().toLowerCase();
  if (fuelType === 'electric') fuelType = 'ev';

  /* ---------- Eligibility gate (Pvt Car / EV Pvt Car) ---------- */
  var isPvtCarFamily = (vehicleType === 'pvtCar' || vehicleType === 'evPvtCar');
  if (isPvtCarFamily) {
    if (ageInYears > 6.5) return 0;                       // age cap
    if (ageInYears > 5 && ncbPct !== undefined && ncbPct !== null) {
      var ncb = parseFloat(ncbPct) || 0;
      if (ncb < 20) return 0;                             // min 20% NCB only above 5 years
    }
  }

  var node = NIL_DEP_RATE[vehicleType];

  /* Resolve top-level vehicleType aliases (e.g. evPvtCar -> pvtCar) */
  while (typeof node === 'string') {
    vehicleType = node;
    node = NIL_DEP_RATE[node];
  }
  if (!node) return 0;

  /* ---------- Case A: Legacy flat slab array (% of OD) ----------
     Used by Taxi / Auto / PCCV / GCCV / Misc / Ambulance / SchoolBus */
  if (Array.isArray(node)) {
    for (var i = 0; i < node.length; i++) {
      if (ageInYears <= node[i].max) return node[i].rate;
    }
    return node[node.length - 1].rate;
  }

  /* ---------- Case B: Object — fuel/CC keyed (% of IDV) ---------- */
  var bucket;

  if (vehicleType === 'twoWheeler') {
    /* Two Wheeler: Dep Cap / ND is not to be picked after 5 years. */
    if (ageInYears > 5) return 0;

    /* Decide CC / KW bucket. KW threshold ≈ 16 KW (PDF parity). */
    var sz = parseFloat(ccOrKw) || 0;
    var isKw = sz > 0 && sz <= 50;          // heuristic: KW values are small
    if (isKw) {
      bucket = (sz > 16) ? node.above150 : node.upto150;
    } else {
      bucket = (sz > 150) ? node.above150 : node.upto150;
    }
  } else {
    /* Pvt Car (and aliases) — pick fuel bucket, follow string aliases */
    bucket = node[fuelType];
    while (typeof bucket === 'string') bucket = node[bucket];
    if (!bucket) bucket = node.petrol;       // safe default
  }

  if (!bucket || !Array.isArray(bucket)) return 0;

  for (var j = 0; j < bucket.length; j++) {
    if (ageInYears <= bucket[j].max) return bucket[j].rate;
  }
  return bucket[bucket.length - 1].rate;
}

/* ============================================================
   Nil Depreciation Eligibility Checker — UI friendly
   -------------------------------------------------------------
   Returns a structured object so UI can show specific message:
     {
       eligible: true|false,
       reason:   '...'         // empty string when eligible
       code:     '...'         // machine-readable reason code
       rate:     0.87          // % of IDV (or % of OD for commercial)
       basis:    'IDV' | 'OD'  // tells caller how to compute premium
     }
   -------------------------------------------------------------
   Usage:
     var r = checkNilDepEligibility('pvtCar','petrol',3,null,25);
     if (r.eligible) {
        ndPremium = idv * r.rate / 100;
     } else {
        alert(r.reason);     // e.g. "Min 20% NCB required for ND Cover only when vehicle age exceeds 5 years"
     }
   ============================================================ */
function checkNilDepEligibility(vehicleType, fuelType, ageInYears, ccOrKw, ncbPct) {
  ageInYears = parseFloat(ageInYears) || 0;
  var isPvtCarFamily = (vehicleType === 'pvtCar' || vehicleType === 'evPvtCar');
  var isTwoWheelerFamily = (vehicleType === 'twoWheeler' || vehicleType === 'evTwoWheeler');
  var isCommercial = !isPvtCarFamily && !isTwoWheelerFamily;

  /* Vehicle type known? */
  if (!NIL_DEP_RATE[vehicleType]) {
    return {
      eligible: false,
      reason: 'ND Cover not available for this vehicle type',
      code: 'UNSUPPORTED_VEHICLE',
      rate: 0,
      basis: null
    };
  }

  /* --- Pvt Car / EV Pvt Car gates --- */
  if (isPvtCarFamily) {
    if (ageInYears > 6.5) {
      return {
        eligible: false,
        reason: 'ND Cover not available — vehicle age exceeds 6.5 years',
        code: 'AGE_EXCEEDED',
        rate: 0,
        basis: 'IDV'
      };
    }
    if (ageInYears > 5 && ncbPct !== undefined && ncbPct !== null) {
      var ncb = parseFloat(ncbPct) || 0;
      if (ncb < 20) {
        return {
          eligible: false,
          reason: 'Min 20% NCB required for ND Cover only when vehicle age exceeds 5 years (current NCB: ' + ncb + '%)',
          code: 'NCB_TOO_LOW',
          rate: 0,
          basis: 'IDV'
        };
      }
    }
  }

  /* --- Two Wheeler: Dep Cap / ND not available after 5 yrs --- */
  if (isTwoWheelerFamily && ageInYears > 5) {
    return {
      eligible: false,
      reason: 'ND / Dep Cap Cover not available for two wheelers above 5 years',
      code: 'TWO_WHEELER_AGE_EXCEEDED',
      rate: 0,
      basis: 'IDV'
    };
  }

  /* --- Commercial: not available > 5 yrs --- */
  if (isCommercial && ageInYears > 5) {
    return {
      eligible: false,
      reason: 'ND Cover not available for commercial vehicles above 5 years',
      code: 'COMMERCIAL_AGE_EXCEEDED',
      rate: 0,
      basis: 'OD'
    };
  }

  /* All gates passed — fetch the actual rate */
  var rate = getNilDepRate(vehicleType, fuelType, ageInYears, ccOrKw, ncbPct);

  if (rate <= 0) {
    return {
      eligible: false,
      reason: 'ND Cover not available for the selected configuration',
      code: 'RATE_UNAVAILABLE',
      rate: 0,
      basis: (isPvtCarFamily || isTwoWheelerFamily) ? 'IDV' : 'OD'
    };
  }

  return {
    eligible: true,
    reason: '',
    code: 'OK',
    rate: rate,
    basis: (isPvtCarFamily || isTwoWheelerFamily) ? 'IDV' : 'OD'
  };
}

/* ============================================================
   Convenience: compute ND premium in one call.
   -------------------------------------------------------------
     calcNilDepPremium({
       vehicleType: 'pvtCar',
       fuelType:    'petrol',
       age:         3,
       cc:          1200,        // or kw for EVs
       ncb:         25,          // optional, only Pvt Car
       idv:         500000,      // required if basis = IDV
       odPremium:   8500         // required if basis = OD (commercial)
     });
   -------------------------------------------------------------
   Returns:
     {
       eligible: true,
       rate: 0.87,
       basis: 'IDV',
       premium: 4350,
       reason: ''
     }
   ============================================================ */
function calcNilDepPremium(opts) {
  opts = opts || {};
  var check = checkNilDepEligibility(
    opts.vehicleType,
    opts.fuelType,
    opts.age,
    opts.cc,
    opts.ncb
  );

  if (!check.eligible) {
    return {
      eligible: false,
      rate: 0,
      basis: check.basis,
      premium: 0,
      reason: check.reason,
      code: check.code
    };
  }

  var base = (check.basis === 'IDV')
              ? (parseFloat(opts.idv) || 0)
              : (parseFloat(opts.odPremium) || 0);
  var premium = Math.round(base * check.rate / 100);

  return {
    eligible: true,
    rate: check.rate,
    basis: check.basis,
    premium: premium,
    reason: '',
    code: 'OK'
  };
}

/* Engine Protection rate lookup by vehicle type, fuel and age.
   Example: getEngineProtRate('pvtCar', 'petrol', 0.4)       => 0.16
            getEngineProtRate('pvtCar', 'diesel', 2.5)       => 0.25
            getEngineProtRate('pvtCar', 'cng', 4.5)          => 0.30 (uses petrol rates)
            getEngineProtRate('pvtCar', 'Electric', 0.4)    => 0.16 (uses petrol rates)
            getEngineProtRate('evPvtCar', 'Electric', 0.4)    => 0.16
            getEngineProtRate('evTwoWheeler', 'Electric', 2) => 0.12 */
function getEngineProtRate(vehicleType, fuelType, ageInYears) {
  fuelType = (fuelType || 'petrol').toString().toLowerCase();
  ageInYears = parseFloat(ageInYears) || 0;

  /* Normalize fuel names */
  if (fuelType === 'electric') fuelType = 'ev';

  /* Map EV vehicle types to their ICE base category */
  if (vehicleType === 'evPvtCar') {
    vehicleType = 'pvtCar';
    if (fuelType === 'petrol' || fuelType === 'diesel') fuelType = 'ev';
  }
  if (vehicleType === 'evTwoWheeler') {
    vehicleType = 'twoWheeler';
    if (fuelType === 'petrol' || fuelType === 'diesel') fuelType = 'ev';
  }

  var vehicleRates = ADDON_FACTORS.engineProt[vehicleType];

  /* Flat rate (e.g., twoWheeler, taxi, etc.) */
  if (typeof vehicleRates === 'number') {
    return vehicleRates;
  }

  /* Vehicle type not found */
  if (!vehicleRates || typeof vehicleRates !== 'object') {
    return 0;
  }

  /* Resolve fuel aliases such as cng/lpg/ev -> 'petrol' */
  var fuelRates = vehicleRates[fuelType];
  while (typeof fuelRates === 'string') {
    fuelRates = vehicleRates[fuelRates];
  }

  if (fuelRates && Array.isArray(fuelRates)) {
    for (var i = 0; i < fuelRates.length; i++) {
      if (ageInYears <= fuelRates[i].maxAge) {
        return fuelRates[i].rate;
      }
    }
    /* If age exceeds all bands, return the last band's rate */
    return fuelRates[fuelRates.length - 1].rate;
  }

  return 0;
}

/* ============================================================
   23. POLICY-TYPE META
   ============================================================ */
var POLICY_META = {
  /* package      – Package Policy (OD + TP) — 1 Year for all
     bundle       – Bundle Policy (auto 3yr for cars, 5yr for 2W)
     saod         – Standard OD Only (1-Year, no TP)
     liability    – Liability Only (TP) */
  'package':     { label: 'Package Policy',                includesOD: true,  includesTP: true,  allowMultiYear: false, odYears: 1,    tpYears: 1 },
  'bundle':      { label: 'Bundle Policy (Long Term)',     includesOD: true,  includesTP: true,  allowMultiYear: false, odYears: 1,    tpYears: null },
  'saod':        { label: 'Standard OD (SAOD)',            includesOD: true,  includesTP: false, allowMultiYear: false, odYears: 1,    tpYears: null },
  'liability':   { label: 'Liability Only (TP)',           includesOD: false, includesTP: true,  allowMultiYear: false, odYears: null, tpYears: null }
};

/* ============================================================
   24. VEHICLE META
   ============================================================ */
var VEHICLE_META = {
  pvtCar:     { label: 'Private Car',           unit: 'CC',   ccHint: 'Cubic Capacity', allowFiveYear: false },
  twoWheeler: { label: 'Two Wheeler',           unit: 'CC',   ccHint: 'Cubic Capacity', allowFiveYear: true  },
  evPvtCar:   { label: 'Electric Pvt Car',      unit: 'KW',   ccHint: 'Power (KW)',     allowFiveYear: false },
  evTwoWheeler: { label: 'Electric 2-Wheeler',  unit: 'KW',   ccHint: 'Power (KW)',     allowFiveYear: true  },
  taxi:       { label: 'Taxi (≤6 seats)',       unit: 'CC',   ccHint: 'Cubic Capacity', allowFiveYear: false },
  auto:       { label: 'Auto Rickshaw (3W)',    unit: 'Seats', ccHint: 'Seating Capacity', allowFiveYear: false },
  schoolBus:  { label: 'School Bus',            unit: 'Seats', ccHint: 'Seating Capacity', allowFiveYear: false },
  staffBus:  { label: 'Staff Bus',              unit: 'Seats', ccHint: 'Seating Capacity', allowFiveYear: false },
  pccvSmall:  { label: 'PCCV (6–17 seats)',     unit: 'Seats', ccHint: 'Seating Capacity', allowFiveYear: false },
  pccvMedium: { label: 'PCCV (17–34 seats)',    unit: 'Seats', ccHint: 'Seating Capacity', allowFiveYear: false },
  pccvLarge:  { label: 'PCCV (34–60 seats)',    unit: 'Seats', ccHint: 'Seating Capacity', allowFiveYear: false },
  pccvExtraLarge:  { label: 'PCCV (>60 seats)',  unit: 'Seats', ccHint: 'Seating Capacity', allowFiveYear: false },
  gccv:       { label: 'Goods Vehicle (GCCV)',  unit: 'GVW kg', ccHint: 'Gross Vehicle Weight (kg)', allowFiveYear: false },
  miscD:      { label: 'Misc – Domestic',       unit: 'CC',   ccHint: 'Cubic Capacity', allowFiveYear: false },
  ambulance:  { label: 'Ambulance',             unit: 'CC',   ccHint: 'Cubic Capacity', allowFiveYear: false }
};

/* ============================================================
   25. U/W DISCOUNT STRUCTURE — w.e.f. 01st June 2026 (192001)
   Source: "Motor_Discount_Structure w.e.f 01st June 2026 UPDATED.pdf"
   Rules implemented:
     - "With NCB"  = NCB >= 20%
     - Brand New   = DOR same as Policy Start Date
     - SAOD column = only when Policy Type is 'saod'
     - Values are MAX ("Upto") discounts — auto-filled, user editable
   ============================================================ */
function getUWDiscountAuto(o) {
  o = o || {};
  var vt       = o.vehicleType;
  var cc       = parseFloat(o.cc) || 0;        // CC / GVW kg
  var seats    = parseFloat(o.seating) || 0;
  var idv      = parseFloat(o.idv) || 0;
  var age      = parseFloat(o.age) || 0;
  var withNCB  = (parseFloat(o.ncb) || 0) >= 20;
  var isSAOD   = (o.policyType === 'saod');
  var brandNew = !!o.brandNew;
  var isEV     = !!o.isEV;

  function res(p, note) { return { pct: p, note: note || '' }; }
  var ncbTxt = withNCB ? 'With NCB' : 'No NCB';

  /* ---------------- TWO WHEELER (incl. EV 2W) ---------------- */
  if (vt === 'twoWheeler' || vt === 'evTwoWheeler') {
    var hi2w = idv > 500000;                    // "> 5 Lac" band
    var t2;
    if (cc <= 150) {        // 0-75 & 75-150 same
      t2 = { bn:[85,85], sN:[85,80], sX:[60,50], uN:[70,60], uX:[50,50], aN:[60,60], aX:[50,50] };
    } else if (cc <= 350) {
      t2 = { bn:[85,60], sN:[75,55], sX:[55,40], uN:[70,40], uX:[50,35], aN:[60,40], aX:[50,0] };
    } else {
      t2 = { bn:[60,50], sN:[50,50], sX:[30,40], uN:[60,35], uX:[50,30], aN:[60,35], aX:[50,0] };
    }
    var i2 = hi2w ? 1 : 0;
    var hiN2 = hi2w ? ' (IDV > 5 Lac)' : '';
    if (brandNew)   return res(t2.bn[i2], '2W Brand New' + hiN2);
    if (isSAOD)     return res((withNCB ? t2.sN : t2.sX)[i2], '2W SAOD ' + ncbTxt + hiN2);
    if (age <= 10)  return res((withNCB ? t2.uN : t2.uX)[i2], '2W Upto 10 yr ' + ncbTxt + hiN2);
    return res((withNCB ? t2.aN : t2.aX)[i2], '2W Above 10 yr ' + ncbTxt + hiN2);
  }

  /* ---------------- PRIVATE CAR (incl. EV Car) ---------------- */
  if (vt === 'pvtCar' || vt === 'evPvtCar') {
    /* hi band: Brand New = >1Cr-2Cr, others = >50Lac-2Cr */
    var hiPC = brandNew ? (idv > 10000000) : (idv > 5000000);
    var over2Cr = idv > 20000000;
    var tp;
    if (cc <= 1500) {        // 0-1000 & 1001-1500 same
      tp = { bn:[90,80], sN:[90,85], sX:[75,70], uN:[90,80], uX:[70,60], aN:[75,60], aX:[60,50] };
    } else if (cc <= 2500) {
      tp = { bn:[92,80], sN:[92,85], sX:[75,70], uN:[90,80], uX:[70,50], aN:[70,60], aX:[60,50] };
    } else {
      tp = { bn:[90,80], sN:[90,85], sX:[65,50], uN:[90,80], uX:[50,50], aN:[60,50], aX:[40,40] };
    }
    var ip = hiPC ? 1 : 0;
    var hiNp = hiPC ? (brandNew ? ' (IDV >1Cr-2Cr)' : ' (IDV >50L-2Cr)') : '';
    if (over2Cr) hiNp = ' (IDV >2Cr — refer R.O.)';
    if (brandNew)   return res(tp.bn[ip], 'Pvt Car Brand New' + hiNp);
    if (isSAOD)     return res((withNCB ? tp.sN : tp.sX)[ip], 'Pvt Car SAOD ' + ncbTxt + hiNp);
    if (age <= 10)  return res((withNCB ? tp.uN : tp.uX)[ip], 'Pvt Car Upto 10 yr ' + ncbTxt + hiNp);
    return res((withNCB ? tp.aN : tp.aX)[ip], 'Pvt Car Above 10 yr ' + ncbTxt + hiNp);
  }

  /* ---------------- TAXI (PCCV upto 6 seats) ---------------- */
  if (vt === 'taxi') {
    if (age <= 10) {
      if (brandNew) return res(85, 'Taxi Brand New (Upto 10 yr) – max 85%');
      return res(withNCB ? 85 : 75, 'Taxi Upto 10 yr ' + ncbTxt);
    }
    return res(withNCB ? 80 : 40, 'Taxi Above 10 yr ' + ncbTxt);
  }

  /* ---------------- PCCV / BUSES (new vehicle = brandNew OR age < 1 yr; brand-new discount is NCB-independent) ---------------- */
  const isBus = ['pccvSmall','pccvMedium','pccvLarge','pccvExtraLarge','schoolBus','staffBus'].includes(vt);
  const isNew = brandNew || age < 1;
  if (isBus && isNew) return res(97, (VEHICLE_META[vt] ? VEHICLE_META[vt].label : 'Bus') + ' Brand New');
  if (vt === 'pccvSmall') {      // >6 to 17 seats
    if (age <= 10) return res(withNCB ? 85 : 70, 'PCCV 6-17 seats Upto 10 yr ' + ncbTxt);
    return res(withNCB ? 80 : 50, 'PCCV 6-17 seats Above 10 yr ' + ncbTxt);
  }
  if (vt === 'pccvMedium') {     // >17 to 36 seats
    if (age <= 10) return res(withNCB ? 80 : 65, 'PCCV 17-36 seats Upto 10 yr ' + ncbTxt);
    return res(withNCB ? 70 : 40, 'PCCV 17-36 seats Above 10 yr ' + ncbTxt);
  }
  if (vt === 'pccvLarge' || vt === 'pccvExtraLarge') {  // Above 36 seats
    if (age <= 10) return res(withNCB ? 75 : 60, 'PCCV >36 seats Upto 10 yr ' + ncbTxt);
    return res(withNCB ? 60 : 40, 'PCCV >36 seats Above 10 yr ' + ncbTxt);
  }
  if (vt === 'schoolBus') {      // 15-yr cutoff per PDF
    if (age <= 15) return res(withNCB ? 97 : 85, 'School Bus Upto 15 yr ' + ncbTxt);
    return res(withNCB ? 75 : 50, 'School Bus Above 15 yr ' + ncbTxt);
  }
  if (vt === 'staffBus') {       // 15-yr cutoff per PDF (mirror School Bus)
    if (age <= 15) return res(withNCB ? 97 : 85, 'Staff Bus Upto 15 yr ' + ncbTxt);
    return res(withNCB ? 75 : 50, 'Staff Bus Above 15 yr ' + ncbTxt);
  }

  /* ---------------- 3 WHEELER (Auto Rickshaw) ---------------- */
  if (vt === 'auto') {
    if (seats <= 6) {
      if (age <= 10) return res(withNCB ? 95 : 80, '3W Upto 6 seater Upto 10 yr ' + ncbTxt);
      return res(withNCB ? 75 : 50, '3W Upto 6 seater Above 10 yr ' + ncbTxt);
    }
    if (seats <= 17) {
      if (age <= 10) {
        if (isEV) return res(withNCB ? 70 : 55, '3W 6-17 seater (EV) Upto 10 yr ' + ncbTxt);
        return res(withNCB ? 90 : 85, '3W 6-17 seater Upto 10 yr ' + ncbTxt);
      }
      return res(withNCB ? 70 : 40, '3W 6-17 seater Above 10 yr ' + ncbTxt);
    }
    if (age <= 10) return res(50, '3W Above 17 seater Upto 10 yr');
    return res(withNCB ? 50 : 40, '3W Above 17 seater Above 10 yr ' + ncbTxt);
  }

  /* ---------------- GCCV / GCCV 3-Wheeler (by GVW kg) ---------------- */
  if (vt === 'gccv' || vt === 'gccv3w') {
    var G = [
      { max: 3500,  bn: 92, u5: [90,85], a5: [85,70] },
      { max: 7500,  bn: 85, u5: [80,70], a5: [70,50] },
      { max: 10000, bn: 90, u5: [90,85], a5: [85,80] },
      { max: 12000, bn: 75, u5: [75,60], a5: [60,50] },
      { max: 20000, bn: 75, u5: [75,60], a5: [60,50] },
      { max: 25000, bn: 90, u5: [90,85], a5: [85,80] },
      { max: 34000, bn: 80, u5: [75,60], a5: [70,40] },
      { max: 40000, bn: 75, u5: [75,60], a5: [70,40] },
      { max: 50000, bn: 75, u5: [75,40], a5: [70,30] },
      { max: Infinity, bn: 40, u5: [35,30], a5: [30,25] }
    ];
    var g = G[G.length - 1];
    for (var gi = 0; gi < G.length; gi++) { if (cc <= G[gi].max) { g = G[gi]; break; } }
    var gvwTxt = 'GVW ' + cc + ' kg';
    if (brandNew)  return res(g.bn, 'GCCV Brand New (' + gvwTxt + ')');
    if (age <= 5)  return res(g.u5[withNCB ? 0 : 1], 'GCCV Upto 5 yr ' + ncbTxt + ' (' + gvwTxt + ')');
    return res(g.a5[withNCB ? 0 : 1], 'GCCV Above 5 yr ' + ncbTxt + ' (' + gvwTxt + ')');
  }

  /* ---------------- MISC CLASS D ---------------- */
  if (vt === 'ambulance') {
    if (age <= 10) return res(withNCB ? 92 : 87, 'Ambulance Upto 10 yr ' + ncbTxt);
    return res(withNCB ? 80 : 70, 'Ambulance Above 10 yr ' + ncbTxt);
  }
  if (vt === 'miscD') {
    /* Other Misc D — same for all ages, IDV banded. R.O. limit 2 Cr */
    if (idv <= 10000000) return res(withNCB ? 90 : 70, 'Misc D (IDV upto 1 Cr) ' + ncbTxt);
    return res(withNCB ? 70 : 50, 'Misc D (IDV above 1 Cr) ' + ncbTxt + (idv > 20000000 ? ' — >2Cr refer R.O.' : ''));
  }

  return null;  // unknown type — no auto pick
}

/* ============================================================
   26.  GCCV 3-WHEELER (Goods Carrying 3W) — V26.10 addition
   ------------------------------------------------------------
   A 3-wheeled goods carrier. No separate IRDAI tariff was supplied,
   so it re-uses the 3-Wheeler (auto) rate tables & add-on factors
   as a sensible base. Replace OD_RATES.gccv3w / TP_RATES.gccv3w
   with official rates once notified.
   ============================================================ */
VEHICLE_META.gccv3w = { label: 'GCCV 3-Wheeler', unit: 'GVW kg', ccHint: 'Gross Vehicle Weight (kg)', allowFiveYear: false };

/* OD rates (Own Damage) — per supplied GCCV 3-Wheeler tariff.
   Age bands: ≤5 yr / 5–7 yr / >7 yr.
   Zone A mirrors Zone B (no Zone-A figure was supplied — change if different). */
OD_RATES.gccv3w = {
  zoneA: [ { max: Infinity, age5: 1.664, age7: 1.707, age7plus: 1.750 } ],
  zoneB: [ { max: Infinity, age5: 1.656, age7: 1.679, age7plus: 1.739 } ],
  zoneC: [ { max: Infinity, age5: 1.640, age7: 1.681, age7plus: 1.722 } ]
};

/* TP is ONLY 1-year (₹4492) — a goods 3W has no long-term / 3-yr concept,
   so only the annual slab exists. Owner-Driver PA (CPA) ₹320/yr. */
TP_RATES.gccv3w = {
  annual: [ { max: Infinity, tp: 4492, cpa: 320 } ]
};

/* Re-use 3W (auto) ND / commission tables */
NIL_DEP_RATE.gccv3w   = NIL_DEP_RATE.auto;
COMMISSION_PROFILES.gccv3w = COMMISSION_PROFILES.auto;

/* Add-on factors: mirror the 3W (auto) values */
ADDON_FACTORS.engineProt.gccv3w  = ADDON_FACTORS.engineProt.auto;
ADDON_FACTORS.rti.gccv3w         = ADDON_FACTORS.rti.auto;
ADDON_FACTORS.tyreRim.gccv3w     = ADDON_FACTORS.tyreRim.auto;
ADDON_FACTORS.altCar.gccv3w      = ADDON_FACTORS.altCar.auto;
ADDON_FACTORS.batteryProt.gccv3w = ADDON_FACTORS.batteryProt.auto;
ADDON_FACTORS.elecAcc.gccv3w     = ADDON_FACTORS.elecAcc.auto;
ADDON_FACTORS.nonElecAcc.gccv3w   = ADDON_FACTORS.nonElecAcc.auto;
ADDON_FACTORS.persBelong.gccv3w  = ADDON_FACTORS.persBelong.auto;
ADDON_FACTORS.imt23.gccv3w        = ADDON_FACTORS.imt23.auto;

