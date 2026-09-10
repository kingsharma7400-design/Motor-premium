/* Loads BOTH the pre-fix and post-fix rates.js in separate vm contexts and
   compares every ND call for every vehicle type — proves only 2W rows moved. */
const fs=require('fs'), vm=require('vm'), path=require('path');
function load(file){
  const ctx={console,window:{},document:{getElementById:()=>null},alert:()=>{},localStorage:{getItem:()=>null,setItem(){}}};
  ctx.globalThis=ctx; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname,'..','uploads','commission_rates.js'),'utf8'),ctx);
  vm.runInContext(fs.readFileSync(file,'utf8'),ctx);
  return ctx;
}
const oldF=load(path.join(__dirname,'rates.before-fix.js'));
const newF=load(path.join(__dirname,'..','uploads','rates.js'));
const vts=['pvtCar','evPvtCar','twoWheeler','evTwoWheeler','taxi','auto','schoolBus','staffBus','pccvSmall','pccvMedium','pccvLarge','gccv','miscD','ambulance'];
const fuels=['petrol','diesel','cng','ev'];
const ages=[0.4,1,1.5,2,2.5,3,3.5,4,4.5,5,5.5,6,6.5,7,7.5,8,10];
const ccs=[75,110,150,151,200,350,351,650,1200,2000];
const ncbs=[undefined,null,0,20,50];
let same=0, diff=0; const byVt={};
for(const vt of vts){ byVt[vt]=0;
  for(const fu of fuels) for(const ag of ages) for(const cc of ccs) for(const nc of ncbs){
    const a=oldF.getNilDepRate(vt,fu,ag,cc,nc), b=newF.getNilDepRate(vt,fu,ag,cc,nc);
    const ea=JSON.stringify(oldF.checkNilDepEligibility(vt,fu,ag,cc,nc)), eb=JSON.stringify(newF.checkNilDepEligibility(vt,fu,ag,cc,nc));
    if(a===b && ea===eb) same++; else { diff++; byVt[vt]++; }
  }
}
console.log(`combinations checked: ${same+diff}`);
console.log(`unchanged: ${same}   changed: ${diff}`);
console.log('changed by vehicle type:', Object.entries(byVt).filter(([,n])=>n>0).map(([k,n])=>`${k}=${n}`).join(', ') || 'none');
const others=Object.entries(byVt).filter(([k,n])=>n>0 && k!=='twoWheeler' && k!=='evTwoWheeler');
console.log(others.length? '❌ NON-2W REGRESSION: '+JSON.stringify(others) : '✅ zero change for every non-2W vehicle type (Pvt Car, EV Car, Taxi, Auto, Buses, PCCV, GCCV, Misc-D, Ambulance)');
