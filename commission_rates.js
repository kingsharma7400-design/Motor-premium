/* =========================================================
   COMMISSION RATES — CIRCULAR-8811 w.e.f 01.07.2026
   =========================================================
   IMPORTANT: This is the ONLY file you need to update when
   commission rates change. Do NOT edit rates.js or app.js
   for commission-related changes.
   ========================================================= */

/* Commission tier lookup based on U/W Discount %
   Used for New Vehicle commission calculations */
function getCommTier(uwDiscount) {
  uwDiscount = parseFloat(uwDiscount) || 0;
  if (uwDiscount <= 40) return 1;  // Upto 40%
  if (uwDiscount <= 70) return 2;  // 40-70%
  return 3;                        // >70%
}

/* Map an app vehicle type to its commission profile key.
   EV variants reuse their ICE equivalents; seat-based PCCV types
   all use the generic "pccv" profile. */
function commissionVehicleKey(vt) {
  if (vt === 'evPvtCar') return 'pvtCar';
  if (vt === 'evTwoWheeler') return 'twoWheeler';
  if (['pccvSmall','pccvMedium','pccvLarge','pccvExtraLarge'].indexOf(vt) !== -1) return 'pccv';
  return vt;
}

/* Check if state is in excluded list */
function isStateExcluded(state, excludedStates) {
  if (!state || !excludedStates) return false;
  const normalizedState = state.toString().trim().toLowerCase();
  return excludedStates.some(ex => 
    ex.toLowerCase() === normalizedState
  );
}

/* GCCV commission — GVW-banded (OD% / TP% differ for Liability vs Package).
   Commission tiers based on U/W discount for new vehicles.
   w.e.f 01.07.2026 (CIRCULAR-8811) */
function gccvComm(gvw, policyType, uwDiscount, state) {
  gvw = parseFloat(gvw) || 0;
  var tier = getCommTier(uwDiscount);
  
  /* GVW-based commission structure with state exclusions */
  /* 3.a: GVW up to 2000 Kg */
  if (gvw <= 2000) {
    return { od: 55, tp: 55, note: '55% on Net Premium (OD+TP) - Pan India' };
  }
  
  /* 3.b: GVW >2000 to 3500 Kg */
  if (gvw <= 3500) {
    const excludedStates = ["Uttar Pradesh", "Madhya Pradesh", "Tamil Nadu"];
    if (isStateExcluded(state, excludedStates)) {
      return { od: 20, tp: 20, note: '20% on Net Premium (OD+TP) - Excluded State' };
    }
    return { od: 50, tp: 50, note: '50% on Net Premium (OD+TP) - Pan India except UP, MP, TN' };
  }
  
  /* 3.c: GVW >3500 to 7500 Kg */
  if (gvw <= 7500) {
    const excludedStates = ["Uttar Pradesh", "Madhya Pradesh", "Haryana", "Tamil Nadu", "Kerala"];
    if (isStateExcluded(state, excludedStates)) {
      return { od: 15, tp: 15, note: '15% on Net Premium (OD+TP) - Excluded State' };
    }
    return { od: 40, tp: 40, note: '40% on Net Premium (OD+TP) - Pan India except UP, MP, HR, TN, KL' };
  }
  
  /* 3.d: GVW >7500 to 10000 Kg */
  if (gvw <= 10000) {
    const excludedStates = ["Tamil Nadu"];
    if (isStateExcluded(state, excludedStates)) {
      return { od: 15, tp: 15, note: '15% on Net Premium (OD+TP) - Tamil Nadu' };
    }
    return { od: 20, tp: 20, note: '20% on Net Premium (OD+TP) - Pan India except TN' };
  }
  
  /* 3.e: GVW >10000 to 12500 Kg */
  if (gvw <= 12500) {
    if (policyType === 'liability') return { od: 0, tp: 2.5, note: '2.5% on TP Premium - Pan India' };
    let net = (uwDiscount <= 60) ? 5 : 2.5;
    return { od: net, tp: net, note: (uwDiscount <= 60 ? '5%' : '2.5%') + ' on Net Premium (OD+TP)' };
  }
  
  /* 3.f: GVW >12500 to 20000 Kg */
  if (gvw <= 20000) {
    if (policyType === 'liability') return { od: 0, tp: 2.5, note: '2.5% on TP Premium - Pan India' };
    let net = (uwDiscount <= 60) ? 5 : 2.5;
    return { od: net, tp: net, note: (uwDiscount <= 60 ? '5%' : '2.5%') + ' on Net Premium (OD+TP)' };
  }
  
  /* 3.g: GVW >20000 to 25000 Kg */
  if (gvw <= 25000) {
    if (policyType === 'liability') return { od: 0, tp: 10, note: '10% on TP Premium - Pan India' };
    let net = (uwDiscount <= 80) ? 15 : 10;
    return { od: net, tp: net, note: (uwDiscount <= 80 ? '15%' : '10%') + ' on Net Premium (OD+TP)' };
  }
  
  /* 3.h: GVW >25000 to 34000 Kg */
  if (gvw <= 34000) {
    const excludedStates = ["Rajasthan", "Haryana", "Madhya Pradesh", "Kerala", "Karnataka", "Assam"];
    
    if (policyType === 'liability') {
      if (isStateExcluded(state, excludedStates)) {
        return { od: 0, tp: 2.5, note: '2.5% on TP Premium - Excluded States' };
      }
      return { od: 0, tp: 5, note: '5% on TP Premium - Pan India except excluded states' };
    }
    
    if (isStateExcluded(state, excludedStates)) {
      let net = (uwDiscount <= 70) ? 5 : 2.5;
      return { od: net, tp: net, note: (uwDiscount <= 70 ? '5%' : '2.5%') + ' on Net Premium (OD+TP) - Excluded State' };
    }
    
    let net = (uwDiscount <= 70) ? 10 : 5;
    return { od: net, tp: net, note: (uwDiscount <= 70 ? '10%' : '5%') + ' on Net Premium (OD+TP)' };
  }
  
  /* 3.i: GVW >34000 to 40000 Kg */
  if (gvw <= 40000) {
    const excludedStates = ["Odisha", "Maharashtra", "Jharkhand", "Bihar"];
    
    if (policyType === 'liability') {
      if (isStateExcluded(state, excludedStates)) {
        return { od: 0, tp: 5, note: '5% on TP Premium - Excluded States' };
      }
      return { od: 0, tp: 2.5, note: '2.5% on TP Premium - Pan India except excluded states' };
    }
    
    if (isStateExcluded(state, excludedStates)) {
      let net;
      if (uwDiscount <= 60) net = 10;
      else if (uwDiscount <= 70) net = 7.5;
      else net = 5;
      return { od: net, tp: net, note: net + '% on Net Premium (OD+TP) - Excluded State' };
    }
    
    let net;
    if (uwDiscount <= 60) net = 7.5;
    else if (uwDiscount <= 70) net = 5;
    else net = 0;
    return { od: net, tp: net, note: (net === 0 ? 'NIL' : net + '%') + ' on Net Premium (OD+TP)' };
  }
  
  /* 3.j: GVW >40000 to 50000 Kg */
  if (gvw <= 50000) {
    const excludedStates = ["Odisha", "Maharashtra", "Jharkhand", "Bihar"];
    
    if (policyType === 'liability') {
      if (isStateExcluded(state, excludedStates)) {
        return { od: 0, tp: 7.5, note: '7.5% on TP Premium - Excluded States' };
      }
      return { od: 0, tp: 2.5, note: '2.5% on TP Premium - Pan India except excluded states' };
    }
    
    if (isStateExcluded(state, excludedStates)) {
      if (uwDiscount <= 50) return { od: 5, tp: 7.5, note: '5% on OD + 7.5% on TP - Excluded State' };
      if (uwDiscount <= 70) return { od: 2.5, tp: 7.5, note: '2.5% on OD + 7.5% on TP - Excluded State' };
      return { od: 0, tp: 7.5, note: 'NIL on OD + 7.5% on TP - Excluded State' };
    }
    
    if (uwDiscount <= 50) return { od: 5, tp: 2.5, note: '5% on OD + 2.5% on TP' };
    if (uwDiscount <= 70) return { od: 2.5, tp: 2.5, note: '2.5% on Net Premium (OD+TP)' };
    return { od: 0, tp: 2.5, note: 'NIL on OD + 2.5% on TP' };
  }
  
  /* 3.k: GVW >50000 Kg */
  if (policyType === 'liability') {
    return { od: 0, tp: 0, note: 'NIL Commission' };
  }
  
  let net = (uwDiscount <= 40) ? 2.5 : 0;
  return { od: net, tp: net, note: (net === 0 ? 'NIL' : net + '%') + ' on net premium' };
}

/* Commission profiles — w.e.f. 01.07.2026 (CIRCULAR-8811)
   A profile entry may be:
     • a flat object    { od, tp }
     • an age-banded array [ { maxAge, od, tp }, ... ]
     • a function(age, gvw, uwDiscount, state) returning { od, tp }
   od = OD commission %, tp = TP commission %. */
var COMMISSION_PROFILES = {
  
  /* ---------- PRIVATE CAR (w.e.f. 01.07.2026) ----------
     New Vehicle Bundled: Discount-tiered
       Tier 1 (Upto 40% disc): OD 40%, TP 60%
       Tier 2 (40-70% disc):   OD 35%, TP 55%
       Tier 3 (>70% disc):     OD 20%, TP 50%
     Package (Renewal): 20% on Net Premium (OD+TP)
     SAOD: 20% on OD (upto 10 years only)
     Liability: 20% on TP */
  pvtCar: {
    liability: { od: 0, tp: 20 },
    saod: function(age) {
      if (age > 10) return { od: 0, tp: 0, note: 'SAOD not applicable beyond 10 years' };
      return { od: 20, tp: 0 };
    },
    bundle: function(age, gvw, uwDiscount, state) {
      var tier = getCommTier(uwDiscount);
      if (age < 1) { // New vehicle
        if (tier === 1) return { od: 40, tp: 60, note: '40% OD + 60% TP (1st year) - Upto 40% disc' };
        if (tier === 2) return { od: 35, tp: 55, note: '35% OD + 55% TP (1st year) - 40-70% disc' };
        return { od: 20, tp: 50, note: '20% OD + 50% TP (1st year) - >70% disc' };
      }
      // Old vehicle - renewal
      return { od: 20, tp: 20, note: '20% on Net Premium (OD+TP)' };
    },
    package: function(age, gvw, uwDiscount, state) {
      return { od: 20, tp: 20, note: '20% on Net Premium (OD+TP)' };
    }
  },
  
  /* ---------- TWO WHEELER (w.e.f. 01.07.2026) ----------
     New Scooter: 40% OD + 90% TP (1st year only) - Pan India
     New Bike by CC range & discount tier:
       ≤150cc: Tier1(30/90), Tier2(25/85), Tier3(20/80)
       150-350cc: Tier1(25/85), Tier2(20/80), Tier3(20/60)
       >350cc: Tier1(20/50), Tier2(15/40), Tier3(10/10)
     Old Two Wheeler Package:
       Scooter ≤15yr: 50%, >15yr: 20%
       Bike ≤150cc ≤15yr: 30%, >15yr: 20%
       Bike 150-350cc ≤15yr: 20%, >15yr: 15%
       Bike >350cc ≤15yr: 10%, >15yr: 5%
     SAOD: 20%
     Liability: 20% on TP (7.5% for excluded states) */
  twoWheeler: {
    liability: function(age, gvw, uwDiscount, state) {
      const excludedStates = ["Assam", "Madhya Pradesh", "Chhattisgarh", "Tamil Nadu", "Kerala", "Karnataka"];
      if (isStateExcluded(state, excludedStates)) {
        return { od: 0, tp: 7.5, note: '7.5% on TP - Excluded State' };
      }
      return { od: 0, tp: 20, note: '20% on TP' };
    },
    saod: { od: 20, tp: 0 },
    bundle: function(age, gvw, uwDiscount, state) {
      var tier = getCommTier(uwDiscount);
      var cc = parseFloat(gvw) || 0; // CC stored in gvw param
      
      if (age < 1) {
        // New vehicle - CC-based with state exclusions
        if (cc <= 150) {
          // Bike up to 150cc
          const excludedStates = ["Madhya Pradesh", "Assam"];
          if (isStateExcluded(state, excludedStates)) {
            return { od: 5, tp: 5, note: 'Flat 5% on net First Year (OD+TP) - Excluded State' };
          }
          if (tier === 1) return { od: 30, tp: 90, note: '30% OD + 90% TP (1st year) - Upto 40% disc' };
          if (tier === 2) return { od: 25, tp: 85, note: '25% OD + 85% TP (1st year) - 40-70% disc' };
          return { od: 20, tp: 80, note: '20% OD + 80% TP (1st year) - >70% disc' };
        }
        if (cc <= 350) {
          // Bike 150-350cc
          const excludedStates = ["Kerala", "Tamil Nadu", "Karnataka", "Chhattisgarh", "Madhya Pradesh", "Assam"];
          if (isStateExcluded(state, excludedStates)) {
            return { od: 5, tp: 5, note: 'Flat 5% on net First Year (OD+TP) - Excluded State' };
          }
          if (tier === 1) return { od: 25, tp: 85, note: '25% OD + 85% TP (1st year) - Upto 40% disc' };
          if (tier === 2) return { od: 20, tp: 80, note: '20% OD + 80% TP (1st year) - 40-70% disc' };
          return { od: 20, tp: 60, note: '20% OD + 60% TP (1st year) - >70% disc' };
        }
        // Bike >350cc
        const excludedStates = ["Kerala", "Assam"];
        if (isStateExcluded(state, excludedStates)) {
          return { od: 5, tp: 5, note: 'Flat 5% on net First Year (OD+TP) - Excluded State' };
        }
        if (tier === 1) return { od: 20, tp: 50, note: '20% OD + 50% TP (1st year) - Upto 30% disc' };
        if (tier === 2) return { od: 15, tp: 40, note: '15% OD + 40% TP (1st year) - 30-60% disc' };
        return { od: 10, tp: 10, note: '10% OD + 10% TP (1st year) - >60% disc' };
      }
      
      // Old vehicle - no commission on TP in subsequent years
      return { od: 20, tp: 0, note: '20% on OD only (no TP commission for renewals)' };
    },
    package: function(age, gvw, uwDiscount, state) {
      var cc = parseFloat(gvw) || 0;
      
      if (cc <= 150) {
        const excludedStates = ["Madhya Pradesh", "Assam"];
        if (isStateExcluded(state, excludedStates)) {
          return { od: 5, tp: 5, note: 'Flat 5% on net (OD+TP) - Excluded State' };
        }
        if (age <= 15) return { od: 30, tp: 30, note: '30% on Net Premium (OD+TP)' };
        return { od: 20, tp: 20, note: '20% on Net Premium (OD+TP)' };
      }
      if (cc <= 350) {
        const excludedStates = ["Kerala", "Tamil Nadu", "Karnataka", "Assam", "Chhattisgarh"];
        if (isStateExcluded(state, excludedStates)) {
          return { od: 5, tp: 5, note: 'Flat 5% on net (OD+TP) - Excluded State' };
        }
        if (age <= 15) return { od: 20, tp: 20, note: '20% on Net Premium (OD+TP)' };
        return { od: 15, tp: 15, note: '15% on Net Premium (OD+TP)' };
      }
      // >350cc
      const excludedStates = ["Kerala", "Assam"];
      if (isStateExcluded(state, excludedStates)) {
        return { od: 2.5, tp: 2.5, note: 'Flat 2.5% on net (OD+TP) - Excluded State' };
      }
      if (age <= 15) return { od: 10, tp: 10, note: '10% on Net Premium (OD+TP)' };
      return { od: 5, tp: 5, note: '5% on Net Premium (OD+TP)' };
    }
  },
  
  /* ---------- TAXI (4W Passenger < 6 seats) (w.e.f. 01.07.2026) ---------- */
  taxi: {
    liability: { od: 0, tp: 20 },
    saod: { od: 20, tp: 0 },
    bundle: function(age, gvw, uwDiscount, state) {
      if (age < 1) return { od: 20, tp: 15, note: 'New: 20% OD + 15% TP' };
      return { od: 15, tp: 15, note: 'Old: 15% OD + 15% TP' };
    },
    package: function(age, gvw, uwDiscount, state) {
      if (age < 1) return { od: 20, tp: 15, note: 'New: 20% OD + 15% TP' };
      return { od: 15, tp: 15, note: 'Old: 15% OD + 15% TP' };
    }
  },
  
  /* ---------- SCHOOL BUS (w.e.f. 01.07.2026) ----------
     Package: 65% on net premium (upto 15 years)
     Liability Only: 45% on TP premium */
  schoolBus: {
    liability: { od: 0, tp: 45 },
    saod: { od: 65, tp: 0 },
    package: function(age) {
      if (age <= 15) return { od: 65, tp: 65, note: '65% on Net Premium (OD+TP)' };
      return { od: 0, tp: 0, note: 'No commission beyond 15 years' };
    },
    bundle: function(age) {
      if (age <= 15) return { od: 65, tp: 65, note: '65% on Net Premium (OD+TP)' };
      return { od: 0, tp: 0, note: 'No commission beyond 15 years' };
    }
  },
  
  /* ---------- STAFF BUS (w.e.f. 01.07.2026) ----------
     Package: 65% on net premium (upto 15 years)
     Liability Only: 45% on TP premium */
  staffBus: {
    liability: { od: 0, tp: 45 },
    saod: { od: 65, tp: 0 },
    package: function(age) {
      if (age <= 15) return { od: 65, tp: 65, note: '65% on Net Premium (OD+TP)' };
      return { od: 0, tp: 0, note: 'No commission beyond 15 years' };
    },
    bundle: function(age) {
      if (age <= 15) return { od: 65, tp: 65, note: '65% on Net Premium (OD+TP)' };
      return { od: 0, tp: 0, note: 'No commission beyond 15 years' };
    }
  },
  
  /* ---------- PCCV (Passenger Carrying Vehicles) (w.e.f. 01.07.2026) ----------
     3 Wheeler (≤6 seats): New 45%, Old 35%
     3 Wheeler (>6 seats): New 25%, Old 15%
     4 Wheeler Taxi (≤6 seats): New 20%, Old 15%
     4 Wheeler PCCV (6-17 seats): New 15%, Old 15%
     4 Wheeler PCCV (17-36 seats): OD 7.5% + TP 2.5%
     4 Wheeler PCCV (>36 seats): 5% (net premium)
     2 Wheeler PCCV: 10% on net premium */
  pccv: {
    liability: function(age, gvw, uwDiscount, state) {
      var seats = parseFloat(gvw) || 0;
      if (seats <= 6) {
        return age < 1 ? { od: 0, tp: 5, note: '5% on TP' } : { od: 0, tp: 5, note: '5% on TP' };
      }
      if (seats <= 17) {
        return { od: 0, tp: 5, note: '5% on TP' };
      }
      if (seats <= 36) {
        return { od: 0, tp: 0, note: '0% on TP' };
      }
      return { od: 0, tp: 0, note: '0% on TP' };
    },
    saod: function(age, gvw, uwDiscount, state) {
      var seats = parseFloat(gvw) || 0;
      if (seats <= 17) return { od: 10, tp: 0 };
      return { od: 5, tp: 0 };
    },
    bundle: function(age, gvw, uwDiscount, state) {
      var seats = parseFloat(gvw) || 0;
      if (seats <= 6) {
        return age < 1 ? { od: 45, tp: 45, note: 'New: 45%' } : { od: 35, tp: 35, note: 'Old: 35%' };
      }
      if (seats <= 17) {
        return age < 1 ? { od: 15, tp: 15, note: 'New: 15%' } : { od: 15, tp: 15, note: 'Old: 15%' };
      }
      if (seats <= 36) {
        return { od: 7.5, tp: 2.5, note: '7.5% OD + 2.5% TP' };
      }
      return { od: 5, tp: 5, note: '5% on Net Premium' };
    },
    package: function(age, gvw, uwDiscount, state) {
      var seats = parseFloat(gvw) || 0;
      if (seats <= 6) {
        return age < 1 ? { od: 45, tp: 45, note: 'New: 45%' } : { od: 35, tp: 35, note: 'Old: 35%' };
      }
      if (seats <= 17) {
        return age < 1 ? { od: 15, tp: 15, note: 'New: 15%' } : { od: 15, tp: 15, note: 'Old: 15%' };
      }
      if (seats <= 36) {
        return { od: 7.5, tp: 2.5, note: '7.5% OD + 2.5% TP' };
      }
      return { od: 5, tp: 5, note: '5% on Net Premium' };
    }
  },
  
  /* ---------- GCCV / GOODS VEHICLE (w.e.f. 01.07.2026) ----------
     Commission tiered by U/W discount and GVW ranges with state exclusions */
  gccv: {
    liability: function(age, gvw, uwDiscount, state) { 
      return gccvComm(gvw, 'liability', uwDiscount, state); 
    },
    saod: function(age, gvw, uwDiscount, state) {
      var tier = getCommTier(uwDiscount);
      var g = parseFloat(gvw) || 0;
      if (g <= 3500) return tier === 3 ? { od: 55, tp: 0 } : tier === 2 ? { od: 50, tp: 0 } : { od: 45, tp: 0 };
      if (g <= 7500) return tier === 3 ? { od: 40, tp: 0 } : tier === 2 ? { od: 37.5, tp: 0 } : { od: 32.5, tp: 0 };
      if (g <= 10000) return tier === 3 ? { od: 25, tp: 0 } : tier === 2 ? { od: 20, tp: 0 } : { od: 15, tp: 0 };
      if (g <= 12500) return tier === 3 ? { od: 12.5, tp: 0 } : tier === 2 ? { od: 10, tp: 0 } : { od: 5, tp: 0 };
      if (g <= 20000) return tier === 3 ? { od: 15, tp: 0 } : tier === 2 ? { od: 12.5, tp: 0 } : { od: 7.5, tp: 0 };
      if (g <= 25000) return tier === 3 ? { od: 17.5, tp: 0 } : tier === 2 ? { od: 15, tp: 0 } : { od: 10, tp: 0 };
      return { od: 7.5, tp: 0 };
    },
    package: function(age, gvw, uwDiscount, state) { 
      return gccvComm(gvw, 'package', uwDiscount, state); 
    },
    bundle: function(age, gvw, uwDiscount, state) { 
      return gccvComm(gvw, 'package', uwDiscount, state); 
    }
  },
  
  /* ---------- MISC. D (w.e.f. 01.07.2026) ---------- */
  miscD: {
    liability: { od: 0, tp: 20, note: '20% on TP' },
    saod: { od: 12.5, tp: 0 },
    package: function(age) {
      if (age <= 10) return { od: 12.5, tp: 8, note: '12.5% OD + 8% TP' };
      if (age <= 15) return { od: 10, tp: 8, note: '10% OD + 8% TP' };
      return { od: 10, tp: 8, note: '10% OD + 8% TP' };
    },
    bundle: function(age) {
      if (age <= 10) return { od: 12.5, tp: 8 };
      if (age <= 15) return { od: 10, tp: 8 };
      return { od: 10, tp: 8 };
    }
  },
  
  /* ---------- AMBULANCE (w.e.f. 01.07.2026) ----------
     20% on net premium / 20% on TP */
  ambulance: {
    liability: { od: 0, tp: 20, note: '20% on TP' },
    saod: { od: 20, tp: 0 },
    package: function(age) {
      if (age <= 15) return { od: 20, tp: 20, note: '20% on Net Premium (OD+TP)' };
      return { od: 0, tp: 0, note: 'No commission beyond 15 years' };
    },
    bundle: function(age) {
      if (age <= 15) return { od: 20, tp: 20, note: '20% on Net Premium (OD+TP)' };
      return { od: 0, tp: 0, note: 'No commission beyond 15 years' };
    }
  },
  
  /* ---------- AUTO RICKSHAW / 3 WHEELER (w.e.f. 01.07.2026) ---------- */
  auto: {
    liability: function(age, gvw, uwDiscount, state) {
      var seats = parseFloat(gvw) || 0;
      return seats <= 6
        ? (age < 1 ? { od: 0, tp: 45 } : { od: 0, tp: 35 })
        : (age < 1 ? { od: 0, tp: 25 } : { od: 0, tp: 15 });
    },
    saod: { od: 10, tp: 0 },
    package: function(age, gvw, uwDiscount, state) {
      var seats = parseFloat(gvw) || 0;
      return seats <= 6
        ? (age < 1 ? { od: 45, tp: 45 } : { od: 35, tp: 35 })
        : (age < 1 ? { od: 25, tp: 25 } : { od: 15, tp: 15 });
    },
    bundle: function(age, gvw, uwDiscount, state) {
      var seats = parseFloat(gvw) || 0;
      return seats <= 6
        ? (age < 1 ? { od: 45, tp: 45 } : { od: 35, tp: 35 })
        : (age < 1 ? { od: 25, tp: 25 } : { od: 15, tp: 15 });
    }
  }
};

/* Resolve commission OD%/TP% for a given quote. Returns { od, tp, note }.
   w.e.f. 01.07.2026 — uses uwDiscount for tier-based commissions 
   and state for exclusion rules */
function getCommissionRates(vehicleType, policyType, age, gvw, uwDiscount, state) {
  vehicleType = commissionVehicleKey(vehicleType || 'pvtCar');
  age = parseFloat(age) || 0;
  gvw = parseFloat(gvw) || 0;
  uwDiscount = parseFloat(uwDiscount) || 0;
  policyType = policyType || 'package';
  state = state || '';

  var profile = COMMISSION_PROFILES[vehicleType] || COMMISSION_PROFILES.pvtCar;

  // GLOBAL RULE: No commission on Package/Bundle policies with vehicle age > 15 years
  if ((policyType === 'package' || policyType === 'bundle') && age > 15) {
    return { od: 0, tp: 0, note: 'No commission – Package policy, vehicle age > 15 yrs' };
  }

  function resolveEntry(entry) {
    if (entry === undefined || entry === null) return null;
    if (typeof entry === 'function') return entry(age, gvw, uwDiscount, state) || { od: 0, tp: 0 };
    if (Array.isArray(entry)) {
      for (var i = 0; i < entry.length; i++) {
        if (age <= entry[i].maxAge) return { od: entry[i].od, tp: entry[i].tp };
      }
      var last = entry[entry.length - 1];
      return { od: last.od, tp: last.tp };
    }
    return { od: entry.od, tp: entry.tp };
  }

  var rates = resolveEntry(profile[policyType]);
  if (rates) return { od: rates.od, tp: rates.tp, note: rates.note || '' };

  // Derive sensible defaults when a profile entry is missing
  if (policyType === 'saod') {
    var pkg = resolveEntry(profile['package']);
    return { od: pkg ? pkg.od : 0, tp: 0, note: '' };
  }
  if (policyType === 'bundle') {
    var pkg2 = resolveEntry(profile['package']);
    return pkg2 ? { od: pkg2.od, tp: pkg2.tp, note: '' } : { od: 0, tp: 0, note: '' };
  }
  return { od: 0, tp: 0, note: '' };
}

/* Commission flat percentage - kept for backward compatibility */
var COMMISSION_PCT = 15;
