let households = [];
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const TABLE_LIMIT = 50;

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

function filters(rows){
  const county=document.getElementById('countyFilter').value, income=document.getElementById('incomeFilter').value, der=document.getElementById('derFilter').value, goal=document.getElementById('goalFilter').value, min=+document.getElementById('minAdoption').value/100;
  return rows.filter(r=>{
    const c=county==='all'||r.county===county;
    const i=income==='all'||(income==='low'&&r.income<60000)||(income==='mid'&&r.income>=60000&&r.income<=120000)||(income==='high'&&r.income>120000);
    const d=der==='all'||r.tech===der;
    const g=goal==='all'||(goal==='bill'&&r.msg==='Bill savings')||(goal==='automation'&&r.msg==='Automation & convenience')||(goal==='resilience'&&r.msg==='Resilience & outage protection');
    return c&&i&&d&&g&&r.adoption>=min;
  });
}

function getPriorityKey(){
  const strategy=document.getElementById('strategyFilter').value;
  if(strategy==='grid') return 'gridPriority';
  if(strategy==='affordability') return 'affordabilityPriority';
  return 'adoptionPriority';
}

function buildCampaign(candidates){
  if(!candidates.length){
    return '<div class="insight">No campaign output for current filters.</div>';
  }
  const topTier=candidates.slice(0,Math.max(10,Math.floor(candidates.length*0.3)));
  const topCounties=groupBy(topTier,'county').sort((a,b)=>b[1].length-a[1].length).slice(0,2).map(([name])=>name);
  const campaign = {
    name: topTier[0].peak57>9?'Summer Peak Relief':'Year-Round Bill Relief',
    audience: `${mode(topTier.map(r=>r.peak57>8.5?'High peak-load households':'Cost-sensitive households'))} in ${topCounties.join(' and ') || mode(topTier.map(r=>r.county))}`,
    product: mode(topTier.map(r=>r.tech)),
    message: mode(topTier.map(r=>r.msg==='Automation & convenience'?'Lower bills automatically during peak hours':'Reduce monthly bill pressure with simple upgrades')),
    offer: mode(topTier.map(r=>r.incentive)),
    financing: mode(topTier.map(r=>r.financing)),
    timing: mode(topTier.map(r=>r.when)),
    lift: `${(8+Math.min(22,Math.round(topTier.reduce((s,r)=>s+r.adoption,0)/topTier.length*20))).toFixed(0)}%`
  };

  return [
    ['Campaign',campaign.name],['Audience segment',campaign.audience],['Recommended DER product',campaign.product],['Message theme',campaign.message],['Incentive',campaign.offer],['Financing',campaign.financing],['Outreach timing',campaign.timing],['Expected conversion lift',campaign.lift]
  ].map(([k,v])=>`<div class='insight'><b>${k}</b><div>${v}</div></div>`).join('');
}

function renderGeo(candidates, priorityKey){
  if(!candidates.length){
    return '<div class="geo-card"><b>No matching households</b><div>Adjust filters to see county opportunities.</div></div>';
  }
  return groupBy(candidates,'county')
    .sort((a,b)=>b[1].length-a[1].length)
    .map(([county,list])=>`<div class='geo-card'><b>${county}</b><div>${list.length} households</div><div>Avg priority: ${(list.reduce((s,r)=>s+r[priorityKey],0)/list.length).toFixed(2)}</div><div>Top DER: ${mode(list.map(r=>r.tech))}</div></div>`)
    .join('');
}

function render(){
  const priorityKey=getPriorityKey();
  const scored=households.map(recommend).sort((a,b)=>b[priorityKey]-a[priorityKey]);
  const rows=filters(scored);
  const topRows=rows.slice(0,TABLE_LIMIT);
  const high=topRows.filter(r=>r[priorityKey]>topRows[0]?.[priorityKey]*0.7).length;
  const avgBurden=topRows.reduce((s,r)=>s+r.energyBurden,0)/Math.max(topRows.length,1);
  const peakRed=topRows.reduce((s,r)=>s+r.peak57*0.09,0);
  const annualSave=topRows.reduce((s,r)=>s+r.affordability*12*0.05,0);
  const segment = topRows[0] ? `${topRows[0].energyBurden>7?'High energy burden':'Moderate burden'} households with ${topRows[0].peak57>8.8?'high':'moderate'} peak usage` : 'n/a';
  const pathway = topRows[0] ? `${topRows[0].tech} + ${topRows[0].financing}` : 'n/a';
  const kpis=[['Households analyzed',rows.length],['High-priority households',high],['Average energy burden',`${avgBurden.toFixed(1)}%`],['Projected peak reduction',`${peakRed.toFixed(1)} MW`],['Estimated annual savings',`$${Math.round(annualSave).toLocaleString()}`],['Top segment',segment],['Recommended pathway',pathway]];
  document.getElementById('kpiCards').innerHTML=kpis.map(([k,v])=>`<div class='card'>${k}<b>${v}</b></div>`).join('');

  document.getElementById('rows').innerHTML=topRows.map(r=>`<tr data-id='${r.id}'><td>${r.id}</td><td>${r.county}</td><td>${r[priorityKey].toFixed(2)}</td><td>${r.tech}</td><td>${r.msg}</td><td>${r.financing}</td><td>${r.incentive}</td><td>${r.when}</td></tr>`).join('');
  document.querySelectorAll('#rows tr').forEach(tr=>tr.onclick=()=>{const r=topRows.find(x=>x.id===tr.dataset.id); document.getElementById('detail').innerHTML=`<b>${r.id} · ${r.county}</b><br/><br/>This household is a high-priority target because it combines ${r.peak57>9?'elevated':'moderate'} evening peak usage, ${r.energyBurden>7?'high':'material'} energy burden, and strong estimated savings sensitivity.<br/><br/>A <b>${r.tech}</b> pathway is recommended because ${r.why.toLowerCase()}.<br/><br/><b>${r.financing}</b> is recommended because financing friction is likely a core adoption barrier for this customer profile.<br/><br/>Executive summary: expected adoption score ${Math.round(r.adoption*100)}%, energy burden ${r.energyBurden.toFixed(1)}%, county ${r.county}.`;});

  document.getElementById('campaign').innerHTML = buildCampaign(rows);
  document.getElementById('geo').innerHTML = renderGeo(rows, priorityKey);
}

const mode=(arr)=>{const m={};arr.forEach(v=>m[v]=(m[v]||0)+1);return Object.entries(m).sort((a,b)=>b[1]-a[1])[0]?.[0];};
const groupBy=(arr,key)=>Object.entries(arr.reduce((acc,x)=>(acc[x[key]]=(acc[x[key]]||[]).concat(x),acc),{}));

async function init(){
  households=await (await fetch('data/virginia_sample.json')).json();
  [...new Set(households.map(h=>h.county))].sort().forEach(c=>{const o=document.createElement('option');o.value=c;o.textContent=c;document.getElementById('countyFilter').appendChild(o);});
  render();
}

['countyFilter','incomeFilter','derFilter','minAdoption','goalFilter','strategyFilter'].forEach(id=>document.getElementById(id).addEventListener('input',()=>{document.getElementById('minValue').textContent=`${document.getElementById('minAdoption').value}%`;render();}));
init();
