/* Runs the REAL functions from rates.js (loaded in a vm context) for a list of
   vehicles and prints an eligibility/premium table.  Usage:
     node tools/verify-2w-depcap.js uploads/rates.js
     node tools/verify-2w-depcap.js tools/rates.patched.sample.js        */
const fs=require('fs'), vm=require('vm'), path=require('path');
const file = process.argv[2] || path.join(__dirname,'..','uploads','rates.js');
const ctx={console, window:{}, document:{getElementById:()=>null}, alert:()=>{}, localStorage:{getItem:()=>null,setItem(){}}};
ctx.globalThis=ctx; vm.createContext(ctx);
const dir = path.dirname(file);
/* commission_rates.js must load FIRST: rates.js assigns to COMMISSION_PROFILES */
for (const f of [path.join(dir,'commission_rates.js'), path.join(__dirname,'..','uploads','commission_rates.js'), file]) {
  if (!fs.existsSync(f)) continue;
  try { vm.runInContext(fs.readFileSync(f,'utf8'), ctx); } catch(e){ if (f===file) throw e; }
}
const row=(vt,fuel,age,cc,ncb,idv)=>{
  const chk=ctx.checkNilDepEligibility(vt,fuel,age,cc,ncb);
  const nd=ctx.calcNilDepPremium({vehicleType:vt,fuelType:fuel,age,cc,idv,odPremium:10000,ncb});
  return `${vt.padEnd(13)} age=${String(age).padEnd(4)} NCB=${String(ncb).padEnd(3)} cc=${String(cc).padEnd(4)} -> `
       + `${chk.eligible?'ELIGIBLE':'BLOCKED '} rate=${String(chk.rate).padEnd(5)} prem=₹${String(nd.premium).padEnd(6)} ${chk.code}`;
};
console.log('FILE: '+file+'\n');
console.log('--- TWO WHEELER (petrol 150cc, IDV ₹1,00,000) ---');
[4,5,5.1,5.5,6,6.5,7,7.1].forEach(a=>console.log(row('twoWheeler','petrol',a,150,20,100000)));
console.log('--- TWO WHEELER, NCB 0 (should be blocked only above 5 yrs) ---');
[4,5,5.1,6,7].forEach(a=>console.log(row('twoWheeler','petrol',a,150,0,100000)));
console.log('--- TWO WHEELER above 150cc, NCB 50 ---');
[5.5,6.5,7].forEach(a=>console.log(row('twoWheeler','petrol',a,220,50,150000)));
console.log('--- EV TWO WHEELER (6 KW = upto150 bucket), NCB 20 ---');
[5.5,6.5,7.2].forEach(a=>console.log(row('evTwoWheeler','ev',a,6,20,100000)));
console.log('--- CONTROL: PVT CAR (must be identical to before) ---');
[5,5.5,6,6.5,7].forEach(a=>console.log(row('pvtCar','petrol',a,1200,20,800000)));
[5.5,6].forEach(a=>console.log(row('pvtCar','petrol',a,1200,0,800000)));
console.log('--- CONTROL: TAXI commercial (must be identical to before) ---');
[2,4.9,5.1,6].forEach(a=>console.log(row('taxi','petrol',a,1200,20,800000)));
