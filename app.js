let uploadedData = null;
const datasets = { 2024: buildSynthetic(false), 2026: buildSynthetic(true) };

function buildSynthetic(future){return Array.from({length:120}).map((_,i)=>genHousehold(i+1,future));}
function genHousehold(id,future){
  const income=rand(32000,190000), peak=rand(4,future?14:11), burden=rand(1.5,future?12:10), ev=Math.random()<(future?0.35:0.2), smart=Math.random()<0.45, oldHome=Math.random()<0.5;
  return {id:`HH-${id.toString().padStart(5,"0")}`,income,peak,burden,ev,smart,oldHome,rebateHistory:rand(0,1),financeAcceptance:rand(0.2,0.95),outageRisk:rand(0,1),zip:`23${Math.floor(rand(100,999))}`};
}
function rand(min,max){return +(Math.random()*(max-min)+min).toFixed(2)}
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));

function recommend(h,thermostatRebate){
  const incomeReadiness=clamp((h.income-30000)/170000,0,1), energySavings=clamp(h.peak/14,0,1), techFit=h.ev?0.9:(!h.smart?0.8:0.6);
  const adoption=clamp(0.25*incomeReadiness+0.2*(1-h.oldHome*0.2)+0.2*energySavings+0.15*h.rebateHistory+0.1*h.financeAcceptance+0.1*techFit,0,1);
  const gridValue=h.peak*(h.ev?1.3:1)*(h.burden>7?1.2:1)*(1+h.outageRisk*0.3);
  const welfare=(h.peak*4.2)*(1+h.burden/12)*(1+((90000-Math.min(h.income,90000))/90000));

  let der="Smart Thermostat", incentive=`$${thermostatRebate} rebate`, message="Lower your monthly bill with no upfront cost.", friction=0.2;
  if(h.ev&&h.peak>7){der="Managed EV Charging";incentive="$125 + annual credit";message="Charge when electricity is cheaper and cleaner.";friction=0.45;}
  else if(h.outageRisk>0.7&&h.income>90000){der="Battery + Smart Panel";incentive="$500 + financing";message="Keep critical devices powered during outages.";friction=0.62;}
  else if(h.oldHome&&h.burden>7){der="Weatherization Bundle";incentive="$300 + financing";message="We handle setup, rebates, and installation.";friction=0.5;}
  else if(h.peak>10){der="Smart Water Heater";incentive="$125 rebate";message="Cut summer bills automatically during high-cost hours.";friction=0.35;}

  const incentiveCost=parseInt(incentive.match(/\d+/)?.[0]||"100",10);
  const impactPerDollar=((adoption*welfare*gridValue)/incentiveCost)*(1-friction);
  const segment=h.burden>7&&h.peak>8?"High energy burden + high peak usage":(adoption>0.65?"Low-friction adopter":(h.ev?"EV-ready but charger-constrained":"Standard outreach"));
  const whenToContact=h.peak>9?"2-4 weeks before summer peak alerts":(h.ev?"Immediately after EV program announcement":"Monthly bill cycle week");
  const financing=h.burden>7?"No-upfront-cost installation":"Instant rebate";

  return {...h,adoption,gridValue,welfare,impactPerDollar,der,incentive,message,segment,whenToContact,financing};
}

function parseCsv(text){
  const [header,...lines]=text.trim().split(/\r?\n/); const cols=header.split(",").map(s=>s.trim());
  return lines.map((line,idx)=>{const vals=line.split(","); const row={id:vals[0]||`UP-${idx+1}`}; cols.slice(1).forEach((c,i)=>row[c]=isNaN(Number(vals[i+1]))?vals[i+1]:Number(vals[i+1])); return row;});
}

function getSourceData(){return uploadedData||datasets[document.getElementById("datasetSelect").value];}

function applyFilters(rows){
  const band=document.getElementById("incomeFilter").value, der=document.getElementById("derFilter").value, minA=+document.getElementById("minAdoption").value/100;
  return rows.filter(r=>{
    const incomeOk=band==="all"||(band==="low"&&r.income<60000)||(band==="mid"&&r.income>=60000&&r.income<=120000)||(band==="high"&&r.income>120000);
    const derOk=der==="all"||r.der===der; const adOk=r.adoption>=minA; return incomeOk&&derOk&&adOk;
  });
}

function render(){
  const rebate=+document.getElementById("thermostatRebate").value, budget=+document.getElementById("budget").value;
  const scored=getSourceData().map(h=>recommend(h,rebate)).sort((a,b)=>b.impactPerDollar-a.impactPerDollar);
  const filtered=applyFilters(scored);
  const avgBurden=filtered.reduce((s,h)=>s+h.burden,0)/Math.max(filtered.length,1);
  const peakReduction=filtered.reduce((s,h)=>s+(h.der.includes("Smart")?0.18:0.1)*h.peak,0);
  const annualSavings=filtered.reduce((s,h)=>s+h.welfare*12*0.06,0);
  const welfareWeighted=filtered.reduce((s,h)=>s+h.welfare*h.adoption,0);
  const topDer=(filtered[0]?.der)||"n/a";

  const kpis=[["Households analyzed",filtered.length],["Average energy burden",`${avgBurden.toFixed(1)}%`],["Top DER opportunity",topDer],["Projected peak reduction",`${peakReduction.toFixed(2)} MW`],["Projected annual savings",`$${Math.round(annualSavings).toLocaleString()}`],["Welfare-weighted impact",welfareWeighted.toFixed(0)],["Incentive budget",`$${budget.toLocaleString()}`]];
  document.getElementById("kpiGrid").innerHTML=kpis.map(([k,v])=>`<div class='kpi'><h3>${k}</h3><p>${v}</p></div>`).join("");

  document.getElementById("rows").innerHTML=filtered.map((h,i)=>`<tr data-id='${h.id}'><td>${i+1}</td><td>${h.id}</td><td>${h.segment}</td><td>${h.der}</td><td>${(h.adoption*100).toFixed(1)}%</td><td>${h.gridValue.toFixed(1)}</td><td>${h.welfare.toFixed(1)}</td><td>${h.impactPerDollar.toFixed(2)}</td><td>${h.incentive}</td><td>${h.message}</td><td>${h.whenToContact}</td></tr>`).join("");

  document.querySelectorAll("#rows tr").forEach(tr=>tr.onclick=()=>{const h=filtered.find(x=>x.id===tr.dataset.id); document.getElementById("detailCard").innerHTML=`<strong>${h.id}</strong><br/>Segment: ${h.segment}<br/>Recommended DER: ${h.der}<br/>Why: Above-average peak usage (${h.peak}), burden (${h.burden}%), and financing acceptance (${h.financeAcceptance}).<br/>Recommended message: ${h.message}<br/>Recommended financing: ${h.financing}<br/>Recommended incentive: ${h.incentive}<br/>When to contact: ${h.whenToContact}`;});

  const targetSegment="High energy burden + high peak usage", tone=document.getElementById("outreachTone").value, financingType=document.getElementById("financingType").value;
  const segmentRows=filtered.filter(h=>h.segment===targetSegment);
  const enroll=Math.min(0.35,segmentRows.reduce((s,h)=>s+h.adoption,0)/Math.max(segmentRows.length,1)*0.28);
  const mw=segmentRows.reduce((s,h)=>s+h.peak*0.06,0);
  const avgSave=segmentRows.reduce((s,h)=>s+h.welfare,0)/Math.max(segmentRows.length,1);
  document.getElementById("scenarioCard").innerHTML=`<strong>Campaign: Summer Peak Relief Program</strong><br/>Target segment: ${targetSegment}<br/>Technology: Smart thermostat<br/>Offer: $${rebate} instant rebate + peak-time bill credit<br/>Message strategy: ${tone}<br/>Financing: ${financingType}<br/><br/>Expected outcomes:<br/>- ${segmentRows.length} households targeted<br/>- ${(enroll*100).toFixed(1)}% predicted enrollment<br/>- ${mw.toFixed(1)} MW peak reduction<br/>- $${avgSave.toFixed(0)} average annual household savings`;
}

document.getElementById("runBtn").addEventListener("click",render);
document.querySelectorAll("#incomeFilter,#derFilter,#minAdoption,#datasetSelect,#budget,#thermostatRebate,#financingType,#outreachTone").forEach(el=>el.addEventListener("change",render));
document.getElementById("csvUpload").addEventListener("change",async(e)=>{const file=e.target.files[0]; if(!file) return; const text=await file.text(); uploadedData=parseCsv(text); render();});
render();
