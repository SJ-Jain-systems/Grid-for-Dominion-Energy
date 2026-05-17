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

const countyMap=document.getElementById('countyMap');
const countyDetail=document.getElementById('countyDetail');
const countyPos={Roanoke:[110,180],Loudoun:[330,90],Fairfax:[390,110],'Prince William':[360,135],Arlington:[410,95],Alexandria:[430,105],'Richmond City':[520,170],Henrico:[500,165],Chesterfield:[505,195],'Newport News':[700,195],Norfolk:[745,215],'Virginia Beach':[790,225]};

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
function filters(rows){const county=countyFilter.value,income=incomeFilter.value,der=derFilter.value,goal=goalFilter.value,min=+minAdoption.value/100;return rows.filter(r=>(county==='all'||r.county===county)&&(income==='all'||(income==='very-low'&&r.income<40000)||(income==='low'&&r.income>=40000&&r.income<80000)||(income==='mid'&&r.income>=80000&&r.income<=120000)||(income==='upper-mid'&&r.income>120000&&r.income<=180000)||(income==='high'&&r.income>180000))&&(der==='all'||r.tech===der)&&(goal==='all'||(goal==='bill'&&r.msg==='Bill savings')||(goal==='automation'&&r.msg==='Automation & convenience')||(goal==='resilience'&&r.msg==='Resilience & outage protection'))&&r.adoption>=min);}


function countyInitiative(topTech){
  return ({
    'Managed EV Charging':'Expand off-peak charging enrollment and TOU incentives for EV owners.',
    'Battery + Smart Panel':'Prioritize resilience rebates and outage-prep customer journeys.',
    'Weatherization Bundle':'Scale no-upfront weatherization outreach with bill-saving messaging.',
    'Smart Water Heater':'Deploy peak-time credits tied to automated water heater dispatch.',
    'Smart Thermostat':'Increase thermostat instant-rebate campaigns before summer peak.'
  })[topTech] || 'Bundle targeted rebate + financing pathways based on household need.';
}

function renderCountyMap(rows,key){
  const grouped={};
  rows.forEach(r=>{(grouped[r.county]??=[]).push(r);});
  const stats=Object.entries(grouped).map(([county,list])=>({
    county,
    households:list.length,
    avgPriority:list.reduce((a,r)=>a+r[key],0)/list.length,
    avgBurden:list.reduce((a,r)=>a+r.energyBurden,0)/list.length,
    topTech:list.reduce((acc,r)=>{acc[r.tech]=(acc[r.tech]||0)+1;return acc;},{}),
  })).map(c=>({
    ...c,
    topTech:Object.entries(c.topTech).sort((a,b)=>b[1]-a[1])[0]?.[0]||'Smart Thermostat'
  })).sort((a,b)=>b.avgPriority-a.avgPriority);

  countyMap.innerHTML='';
  countyMap.innerHTML += `<path d="M84,202 L98,189 L117,178 L139,170 L166,162 L197,153 L230,146 L265,140 L302,135 L340,131 L377,129 L414,129 L452,131 L491,136 L531,143 L570,151 L607,160 L642,170 L674,180 L704,190 L731,201 L753,210 L770,219 L782,227 L790,236 L797,245 L803,253 L809,258 L816,257 L822,251 L828,243 L833,233 L839,222 L845,210 L851,199 L857,191 L864,186 L871,185 L876,190 L878,198 L876,208 L871,221 L864,234 L855,246 L844,256 L830,264 L813,270 L792,274 L768,276 L741,276 L711,274 L679,271 L645,267 L611,262 L576,257 L542,253 L507,250 L472,249 L437,250 L402,253 L367,258 L333,264 L299,271 L267,277 L237,282 L210,285 L185,286 L162,284 L142,279 L124,271 L109,261 L97,249 L88,236 L83,222 Z" fill="#eef4ff" stroke="#b4c6ea" stroke-width="2"/>`;
  stats.forEach((c,i)=>{
    const p=countyPos[c.county]||[90+((i*60)%760),80+((i*35)%180)];
    countyMap.innerHTML += `<g class="county-marker" data-county="${c.county}" tabindex="0"><circle cx="${p[0]}" cy="${p[1]}" r="12"></circle><text x="${p[0]+16}" y="${p[1]+4}">${c.county}</text></g>`;
  });
  const showCounty=(county)=>{
    const c=stats.find(x=>x.county===county);
    if(!c) return;
    countyDetail.innerHTML=`<b>${c.county}</b><br/>Households analyzed: ${c.households}<br/>Average priority score: ${c.avgPriority.toFixed(2)}<br/>Average energy burden: ${c.avgBurden.toFixed(1)}%<br/>Primary DER pathway: <b>${c.topTech}</b><br/>Initiative recommendation: ${countyInitiative(c.topTech)}`;
    document.querySelectorAll('.county-marker').forEach(el=>el.classList.toggle('active',el.dataset.county===county));
  };
  document.querySelectorAll('.county-marker').forEach(el=>{
    el.addEventListener('click',()=>showCounty(el.dataset.county));
    el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();showCounty(el.dataset.county);}});
  });
  if(stats[0]) showCounty(stats[0].county);
}

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
  renderCountyMap(topRows,key);

}

async function init(){
  households=await (await fetch('data/virginia_sample.json')).json();
  [...new Set(households.map(h=>h.county))].sort().forEach(c=>{const o=document.createElement('option');o.value=c;o.textContent=c;countyFilter.appendChild(o);});
  minValue.textContent=`${minAdoption.value}%`;
  render();
}
['countyFilter','incomeFilter','derFilter','minAdoption','goalFilter','strategyFilter'].forEach(id=>document.getElementById(id).addEventListener('input',()=>{minValue.textContent=`${minAdoption.value}%`;render();}));
init();
