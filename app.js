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
  countyMap.innerHTML += `<path d="M95,248 L103,238 L116,228 L130,223 L147,221 L163,214 L178,206 L196,202 L214,195 L231,189 L247,182 L264,173 L281,165 L301,156 L321,145 L338,135 L354,127 L373,121 L394,119 L414,121 L434,124 L456,128 L478,132 L502,135 L526,138 L550,142 L575,147 L600,152 L626,160 L652,168 L677,178 L701,188 L724,199 L747,210 L767,220 L785,232 L801,245 L814,257 L822,270 L828,284 L836,296 L846,304 L856,306 L865,301 L872,292 L878,281 L884,268 L889,255 L894,243 L898,233 L900,226 L893,223 L884,227 L874,236 L862,247 L850,258 L840,270 L833,282 L828,293 L824,304 L819,315 L811,324 L801,329 L789,331 L776,331 L760,328 L744,323 L727,318 L709,313 L690,309 L671,307 L652,308 L632,311 L611,316 L589,322 L567,328 L545,333 L522,336 L499,337 L476,335 L453,332 L429,328 L405,325 L381,324 L357,326 L334,331 L310,338 L286,346 L262,353 L239,359 L216,362 L195,361 L176,357 L159,350 L144,341 L131,331 L120,321 L111,310 L104,298 L99,286 Z" fill="#eef4ff" stroke="#b4c6ea" stroke-width="2"/>`;
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
