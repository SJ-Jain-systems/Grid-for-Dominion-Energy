let households = [];
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));

function recommend(h){
  const adoption=clamp(0.25*clamp((h.income-30000)/170000,0,1)+0.2*clamp(h.peak57/12,0,1)+0.15*h.engagement+0.2*(h.ev?0.9:0.6)+0.2*(1-h.smartThermostat*0.2),0,1);
  const gridValue=h.peak57*(1+h.outageRisk*0.35)*(h.ev?1.2:1);
  const welfare=(h.peak57*4.5)*(1+h.energyBurden/10)*(1+((90000-Math.min(h.income,90000))/90000));

  let tech="Smart Thermostat", msg="Bill savings", financing="Instant rebate", incentive="Thermostat rebate", why="High cooling load and easy install path", friction=0.25;
  if(h.ev&&h.peak57>8.5){tech="Managed EV Charging";msg="Automation & convenience";financing="Bill financing";incentive="EV charging credit";why="Evening EV load can be shifted automatically";friction=0.4;}
  else if(h.outageRisk>0.45){tech="Battery + Smart Panel";msg="Resilience & outage protection";financing="Bill financing";incentive="Battery financing support";why="Higher outage exposure with resilience value";friction=0.6;}
  else if(h.energyBurden>7){tech="Weatherization Bundle";msg="Bill savings";financing="No-upfront-cost installation";incentive="Weatherization rebate";why="High energy burden household with strong savings upside";friction=0.45;}
  else if(h.peak57>9.5){tech="Smart Water Heater";msg="Automation & convenience";financing="Instant rebate";incentive="Peak-time bill credit";why="Water-heating flexibility supports 5-7pm load shift";friction=0.35;}

  const incentiveCost=({"Thermostat rebate":50,"Peak-time bill credit":125,"EV charging credit":125,"Weatherization rebate":300,"Battery financing support":500})[incentive];
  const impact=((adoption*welfare*gridValue)/incentiveCost)*(1-friction);
  const when=h.peak57>9?"2-4 weeks before summer peak season":(h.ev?"Immediately after EV onboarding":"During monthly bill cycle");
  return {...h,adoption,gridValue,welfare,priority:impact,tech,msg,financing,incentive,when,why};
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

function render(){
  const scored=households.map(recommend).sort((a,b)=>b.priority-a.priority);
  const rows=filters(scored);
  const topRows=rows.slice(0,25);
  const high=topRows.filter(r=>r.priority>topRows[0]?.priority*0.7).length;
  const avgBurden=topRows.reduce((s,r)=>s+r.energyBurden,0)/Math.max(topRows.length,1);
  const peakRed=topRows.reduce((s,r)=>s+r.peak57*0.09,0);
  const annualSave=topRows.reduce((s,r)=>s+r.welfare*12*0.05,0);
  const segment=topRows[0]?.tech||'n/a';
  const kpis=[['Households analyzed',rows.length],['Shown in table',topRows.length],['High-priority households',high],['Average energy burden',`${avgBurden.toFixed(1)}%`],['Projected peak reduction',`${peakRed.toFixed(1)} MW`],['Estimated annual savings',`$${Math.round(annualSave).toLocaleString()}`],['Highest-value segment',segment]];
  document.getElementById('kpiCards').innerHTML=kpis.map(([k,v])=>`<div class='card'>${k}<b>${v}</b></div>`).join('');

  document.getElementById('rows').innerHTML=topRows.map(r=>`<tr data-id='${r.id}'><td>${r.id}</td><td>${r.county}</td><td>${r.priority.toFixed(2)}</td><td>${r.tech}</td><td>${r.msg}</td><td>${r.financing}</td><td>${r.incentive}</td><td>${r.when}</td><td>${r.why}</td></tr>`).join('');
  document.querySelectorAll('#rows tr').forEach(tr=>tr.onclick=()=>{const r=topRows.find(x=>x.id===tr.dataset.id); document.getElementById('detail').innerHTML=`<b>${r.id} · ${r.county}</b><br/>Who they are: income $${r.income.toLocaleString()}, burden ${r.energyBurden}%<br/>Why priority: ${r.why}<br/>Best-fit DER: ${r.tech}<br/>Best message: ${r.msg}<br/>Best financing: ${r.financing}<br/>Best incentive: ${r.incentive}<br/>Right moment: ${r.when}`;});

  const top = topRows.slice(0,Math.max(1,Math.floor(topRows.length/3)));
  const insight = [
    ['Who benefits most?', `${top.filter(r=>r.energyBurden>7).length} high-burden households in top tier.`],
    ['What technology fits best?', `${mode(top.map(r=>r.tech))||'Smart Thermostat'} is most frequent.`],
    ['When should outreach happen?', `${mode(top.map(r=>r.when))||'Monthly bill cycle'} is best timing.`],
    ['What message works best?', `${mode(top.map(r=>r.msg))||'Bill savings'} performs best.`],
    ['What financing helps most?', `${mode(top.map(r=>r.financing))||'Instant rebate'} is most common.`],
    ['What incentive reduces friction most?', `${mode(top.map(r=>r.incentive))||'Thermostat rebate'} appears most often.`],
  ];
  document.getElementById('insights').innerHTML=insight.map(([k,v])=>`<div class='insight'><b>${k}</b><div>${v}</div></div>`).join('');

  const geo = groupBy(topRows,'county').map(([county,list])=>`<div class='geo-card'><b>${county}</b><div>${list.length} households</div><div>Avg priority: ${(list.reduce((s,r)=>s+r.priority,0)/list.length).toFixed(2)}</div></div>`).join('');
  document.getElementById('geo').innerHTML=geo;
}

const mode=(arr)=>{const m={};arr.forEach(v=>m[v]=(m[v]||0)+1);return Object.entries(m).sort((a,b)=>b[1]-a[1])[0]?.[0];};
const groupBy=(arr,key)=>Object.entries(arr.reduce((acc,x)=>(acc[x[key]]=(acc[x[key]]||[]).concat(x),acc),{}));

async function init(){
  households=await (await fetch('data/virginia_sample.json')).json();
  [...new Set(households.map(h=>h.county))].sort().forEach(c=>{const o=document.createElement('option');o.value=c;o.textContent=c;document.getElementById('countyFilter').appendChild(o);});
  render();
}

['countyFilter','incomeFilter','derFilter','minAdoption','goalFilter'].forEach(id=>document.getElementById(id).addEventListener('input',()=>{document.getElementById('minValue').textContent=`${document.getElementById('minAdoption').value}%`;render();}));
init();
