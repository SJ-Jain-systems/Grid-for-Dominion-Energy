let households = [];
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const TABLE_LIMIT = 50;

const countyFilter=document.getElementById('countyFilter');
const incomeFilter=document.getElementById('incomeFilter');
const derFilter=document.getElementById('derFilter');
const goalFilter=document.getElementById('goalFilter');
const minAdoption=document.getElementById('minAdoption');
const minValue=document.getElementById('minValue');
const strategyFilter=document.getElementById('strategyFilter');
const rowsEl=document.getElementById('rows');
const detail=document.getElementById('detail');
const kpiCards=document.getElementById('kpiCards');

function recommend(h){
  const adoption=clamp(0.2*clamp((h.income-30000)/170000,0,1)+0.2*clamp(h.peak57/12,0,1)+0.15*h.engagement+0.1*(h.ev?0.95:0.6)+0.1*(1-h.smartThermostat*0.2)+0.1*h.financingAcceptance+0.15*h.solarSuitability,0,1);
  const gridValue=h.peak57*(1+h.outageRisk*0.35)*(h.ev?1.2:1)*(1+h.applianceAge/25);
  const affordability=(h.peak57*4.5)*(1+h.energyBurden/10)*(1+((90000-Math.min(h.income,90000))/90000));
  let tech="Smart Thermostat", msg="Bill savings", financing="Instant rebate", incentive="Thermostat rebate", why="High cooling load and easy install path", friction=0.25;
  if(h.ev&&h.peak57>8.5){tech="Managed EV Charging";msg="Automation & convenience";financing="Bill financing";incentive="EV charging credit";why="Evening EV load can be shifted automatically";friction=0.4;}
  else if(h.outageRisk>0.45){tech="Battery + Smart Panel";msg="Resilience & outage protection";financing="Bill financing";incentive="Battery financing support";why="Higher outage exposure with resilience value";friction=0.6;}
  else if(h.energyBurden>7){tech="Weatherization Bundle";msg="Bill savings";financing="No-upfront-cost installation";incentive="Weatherization rebate";why="High energy burden household with strong savings upside";friction=0.45;}
  else if(h.peak57>9.5){tech="Smart Water Heater";msg="Automation & convenience";financing="Instant rebate";incentive="Peak-time bill credit";why="Water-heating flexibility supports 5-7pm load shift";friction=0.35;}
  const incentiveCost=({"Thermostat rebate":50,"Peak-time bill credit":125,"EV charging credit":125,"Weatherization rebate":300,"Battery financing support":500})[incentive];
  const adoptionPriority=((adoption*affordability*0.9*gridValue*0.5)/incentiveCost)*(1-friction);
  const gridPriority=((gridValue*adoption*1.2)/Math.sqrt(incentiveCost))*(1-friction*0.5);
  const affordabilityPriority=((affordability*adoption*1.1)/incentiveCost)*(1-friction*0.7);
  const when=h.peak57>9?"2-4 weeks before summer peak season":(h.ev?"Immediately after EV onboarding":"During monthly bill cycle");
  return {...h,adoption,gridValue,affordability,adoptionPriority,gridPriority,affordabilityPriority,tech,msg,financing,incentive,when,why};
}

function getPriorityKey(){const s=strategyFilter.value;return s==='grid'?'gridPriority':s==='affordability'?'affordabilityPriority':'adoptionPriority';}
function filters(rows){const county=countyFilter.value,income=incomeFilter.value,der=derFilter.value,goal=goalFilter.value,min=+minAdoption.value/100;return rows.filter(r=>(county==='all'||r.county===county)&&(income==='all'||(income==='low'&&r.income<60000)||(income==='mid'&&r.income>=60000&&r.income<=120000)||(income==='high'&&r.income>120000))&&(der==='all'||r.tech===der)&&(goal==='all'||(goal==='bill'&&r.msg==='Bill savings')||(goal==='automation'&&r.msg==='Automation & convenience')||(goal==='resilience'&&r.msg==='Resilience & outage protection'))&&r.adoption>=min);}

function render(){
  const key=getPriorityKey();
  const scored=households.map(recommend).sort((a,b)=>b[key]-a[key]);
  const rows=filters(scored);
  const topRows=rows.slice(0,TABLE_LIMIT);
  const high=topRows.filter(r=>r[key]>topRows[0]?.[key]*0.7).length;
  const kpis=[['Households analyzed',rows.length],['High-priority households',high],['Average energy burden',`${(topRows.reduce((s,r)=>s+r.energyBurden,0)/Math.max(topRows.length,1)).toFixed(1)}%`],['Projected peak reduction',`${(topRows.reduce((s,r)=>s+r.peak57*0.09,0)).toFixed(1)} MW`],['Estimated annual savings',`$${Math.round(topRows.reduce((s,r)=>s+r.affordability*12*0.05,0)).toLocaleString()}`],['Highest-value segment',topRows[0]?.tech || 'n/a']];
  kpiCards.innerHTML=kpis.map(([k,v])=>`<div class='card'>${k}<b>${v}</b></div>`).join('');

  rowsEl.innerHTML=topRows.map(r=>`<tr data-id='${r.id}'><td>${r.id}</td><td>${r.county}</td><td>${r[key].toFixed(2)}</td><td>${r.tech}</td><td>${r.msg}</td><td>${r.financing}</td><td>${r.incentive}</td><td>${r.when}</td></tr>`).join('');
  document.querySelectorAll('#rows tr').forEach(tr=>tr.onclick=()=>{const r=topRows.find(x=>x.id===tr.dataset.id);detail.innerHTML=`<b>${r.id} · ${r.county}</b><br/><br/>This household is currently the top recommendation because it combines ${r.peak57>9?'elevated':'moderate'} evening peak load, ${r.energyBurden>7?'high':'material'} burden, and strong savings sensitivity.<br/><br/>Recommended pathway: <b>${r.tech}</b> with <b>${r.financing}</b>.`;});

  const focus=topRows[0];
  detail.innerHTML=focus ? `<b>${focus.id} · ${focus.county}</b><br/><br/>This household is currently the top recommendation because it combines ${focus.peak57>9?'elevated':'moderate'} evening peak load, ${focus.energyBurden>7?'high':'material'} burden, and strong savings sensitivity.<br/><br/>Recommended pathway: <b>${focus.tech}</b> with <b>${focus.financing}</b>.` : 'No households match the current filters.';

}

async function init(){
  households=await (await fetch('data/virginia_sample.json')).json();
  [...new Set(households.map(h=>h.county))].sort().forEach(c=>{const o=document.createElement('option');o.value=c;o.textContent=c;countyFilter.appendChild(o);});
  minValue.textContent=`${minAdoption.value}%`;
  render();
}
['countyFilter','incomeFilter','derFilter','minAdoption','goalFilter','strategyFilter'].forEach(id=>document.getElementById(id).addEventListener('input',()=>{minValue.textContent=`${minAdoption.value}%`;render();}));
init();
