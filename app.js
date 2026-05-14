let households = [];
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const TABLE_LIMIT = 50;

const countyShapes={
  Roanoke:{x:120,y:170,w:85,h:48},
  Loudoun:{x:300,y:70,w:90,h:48},
  Fairfax:{x:400,y:95,w:90,h:48},
  'Prince William':{x:340,y:140,w:120,h:48},
  Arlington:{x:500,y:85,w:80,h:42},
  Alexandria:{x:500,y:130,w:90,h:42},
  'Richmond City':{x:515,y:170,w:115,h:48},
  Henrico:{x:455,y:220,w:90,h:48},
  Chesterfield:{x:565,y:220,w:115,h:48},
  'Newport News':{x:665,y:165,w:125,h:48},
  Norfolk:{x:700,y:220,w:90,h:48},
  'Virginia Beach':{x:800,y:220,w:95,h:48}
};

const countyFilter=document.getElementById('countyFilter');
const incomeFilter=document.getElementById('incomeFilter');
const derFilter=document.getElementById('derFilter');
const goalFilter=document.getElementById('goalFilter');
const minAdoption=document.getElementById('minAdoption');
const minValue=document.getElementById('minValue');
const strategyFilter=document.getElementById('strategyFilter');
const detail=document.getElementById('detail');
const geo=document.getElementById('geo');
const kpiCards=document.getElementById('kpiCards');
const vaMap=document.getElementById('vaMap');

const mode=(arr)=>{const m={};arr.forEach(v=>m[v]=(m[v]||0)+1);return Object.entries(m).sort((a,b)=>b[1]-a[1])[0]?.[0];};
const groupBy=(arr,key)=>Object.entries(arr.reduce((acc,x)=>(acc[x[key]]=(acc[x[key]]||[]).concat(x),acc),{}));

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

function renderMap(countyStats){
  vaMap.replaceChildren();
  if(!countyStats.length) return;

  const vals=countyStats.map(c=>c.vulnerability);
  const min=vals.length?Math.min(...vals):0;
  const max=vals.length?Math.max(...vals):1;
  const color=v=>{const t=(v-min)/(max-min||1);return t>0.66?'#cb2b3e':t>0.33?'#f39c3d':'#5e9df6';};
  const NS='http://www.w3.org/2000/svg';

  const outline=document.createElementNS(NS,'path');
  outline.setAttribute('d','M40,220 L120,150 L240,130 L360,80 L520,140 L700,170 L860,210 L810,250 L620,250 L470,235 L320,250 L160,270 L80,250 Z');
  outline.setAttribute('fill','#eef4ff');
  outline.setAttribute('stroke','#b4c6ea');
  outline.setAttribute('stroke-width','2');
  vaMap.appendChild(outline);

  countyStats.forEach(c=>{
    const shape=countyShapes[c.county];
    if(!shape) return;

    const group=document.createElementNS(NS,'g');
    group.setAttribute('class','county');
    group.setAttribute('tabindex','0');

    const title=document.createElementNS(NS,'title');
    title.textContent=`${c.county}: Vulnerability ${c.vulnerability.toFixed(1)} | Households ${c.count}`;

    const rect=document.createElementNS(NS,'rect');
    rect.setAttribute('x',String(shape.x));
    rect.setAttribute('y',String(shape.y));
    rect.setAttribute('width',String(shape.w));
    rect.setAttribute('height',String(shape.h));
    rect.setAttribute('rx','8');
    rect.setAttribute('fill',color(c.vulnerability));
    rect.setAttribute('stroke','#1b3f87');
    rect.setAttribute('stroke-width','1.5');

    const text=document.createElementNS(NS,'text');
    text.setAttribute('x',String(shape.x+shape.w/2));
    text.setAttribute('y',String(shape.y+shape.h/2+4));
    text.setAttribute('text-anchor','middle');
    text.setAttribute('font-size','11');
    text.setAttribute('fill','#fff');
    text.textContent=c.county;

    group.append(title,rect,text);
    vaMap.appendChild(group);
  });
}

function render(){
  const key=getPriorityKey();
  const scored=households.map(recommend).sort((a,b)=>b[key]-a[key]);
  const rows=filters(scored);
  const topRows=rows.slice(0,TABLE_LIMIT);
  const high=topRows.filter(r=>r[key]>topRows[0]?.[key]*0.7).length;
  const kpis=[['Households analyzed',rows.length],['High-priority households',high],['Average energy burden',`${(topRows.reduce((s,r)=>s+r.energyBurden,0)/Math.max(topRows.length,1)).toFixed(1)}%`],['Projected peak reduction',`${(topRows.reduce((s,r)=>s+r.peak57*0.09,0)).toFixed(1)} MW`],['Estimated annual savings',`$${Math.round(topRows.reduce((s,r)=>s+r.affordability*12*0.05,0)).toLocaleString()}`],['Highest-value segment',topRows[0]?.tech || 'n/a']];
  kpiCards.innerHTML=kpis.slice(0,6).map(([k,v])=>`<div class='card'>${k}<b>${v}</b></div>`).join('');

  const focus=topRows[0];
  detail.innerHTML=focus ? `<b>${focus.id} · ${focus.county}</b><br/><br/>This household is currently the top recommendation because it combines ${focus.peak57>9?'elevated':'moderate'} evening peak load, ${focus.energyBurden>7?'high':'material'} burden, and strong savings sensitivity.<br/><br/>Recommended pathway: <b>${focus.tech}</b> with <b>${focus.financing}</b>.` : 'No households match the current filters.';

  const mapSource = rows.length ? rows : scored;
  const countyStats=groupBy(mapSource,'county').map(([county,list])=>({county,count:list.length,avgPriority:list.reduce((s,r)=>s+r[key],0)/list.length,vulnerability:list.reduce((s,r)=>s+r.energyBurden+r.outageRisk*10+r.peak57*0.5,0)/list.length,topTech:mode(list.map(r=>r.tech))})).sort((a,b)=>b.vulnerability-a.vulnerability);
  renderMap(countyStats);
  geo.innerHTML=countyStats.map((c,i)=>`<div class='geo-card ${i<3?'high':''}'><b>${i+1}. ${c.county}</b><div>Vulnerability index: ${c.vulnerability.toFixed(1)}</div><div>Households: ${c.count}</div><div>Avg priority: ${c.avgPriority.toFixed(2)}</div><div>Best pathway: ${c.topTech}</div></div>`).join('');
}

async function init(){
  households=await (await fetch('data/virginia_sample.json')).json();
  [...new Set(households.map(h=>h.county))].sort().forEach(c=>{const o=document.createElement('option');o.value=c;o.textContent=c;countyFilter.appendChild(o);});
  minValue.textContent=`${minAdoption.value}%`;
  render();
}
['countyFilter','incomeFilter','derFilter','minAdoption','goalFilter','strategyFilter'].forEach(id=>document.getElementById(id).addEventListener('input',()=>{minValue.textContent=`${minAdoption.value}%`;render();}));
init();
