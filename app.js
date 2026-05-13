let households=[];

const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));

function score(h,rebate){
  const adoption=clamp(0.25*clamp((h.income-30000)/170000,0,1)+0.2*clamp(h.peak57/12,0,1)+0.15*h.engagement+0.2*(h.ev?0.9:0.6)+0.2*(1-h.smartThermostat*0.2),0,1);
  const gridValue=h.peak57*(1+h.outageRisk*0.35)*(h.ev?1.25:1);
  const burdenWeight=1+h.energyBurden/10;
  const incomeUtility=1+((90000-Math.min(h.income,90000))/90000);
  const welfare=(h.peak57*4.5)*burdenWeight*incomeUtility;

  let der="Smart Thermostat", message="Lower your monthly bill with no upfront stress.", financing="Instant rebate", incentive=`$${rebate} rebate`, friction=0.25;
  if(h.ev&&h.peak57>8.5){der="Managed EV Charging";message="Charge when power is cheaper and cleaner.";financing="Bill credit + auto-enroll";incentive="$125 + annual credit";friction=0.4;}
  else if(h.outageRisk>0.45){der="Battery + Smart Panel";message="Keep essential devices powered during outages.";financing="0% monthly financing";incentive="$500 + resilience bonus";friction=0.6;}
  else if(h.energyBurden>7){der="Weatherization + Smart Thermostat";message="We handle setup, rebates, and installation.";financing="No-upfront-cost installation";incentive="$300 + thermostat rebate";friction=0.45;}
  else if(h.peak57>9.5){der="Smart Water Heater";message="Cut peak-hour summer costs automatically.";financing="Instant rebate";incentive="$125 rebate";friction=0.35;}

  const cost=parseInt(incentive.match(/\d+/)?.[0]||"100",10);
  const impactPerDollar=((adoption*welfare*gridValue)/cost)*(1-friction);
  const when=h.peak57>9?"2-4 weeks before summer peaks":(h.ev?"Right after EV enrollment":"Bill-cycle week");

  return {...h,adoption,gridValue,welfare,impactPerDollar,der,message,financing,incentive,when};
}

function render(){
  const rebate=+document.getElementById('rebate').value;
  const scored=households.map(h=>score(h,rebate)).sort((a,b)=>b.impactPerDollar-a.impactPerDollar);

  const k=[
    ["Households analyzed",scored.length],
    ["High-burden households",scored.filter(h=>h.energyBurden>7).length],
    ["Top DER opportunity",scored[0]?.der||"n/a"],
    ["Avg adoption",`${(scored.reduce((s,h)=>s+h.adoption,0)/scored.length*100).toFixed(1)}%`],
    ["Peak reduction estimate",`${(scored.reduce((s,h)=>s+h.peak57*0.09,0)).toFixed(1)} MW`]
  ];
  document.getElementById('kpis').innerHTML=k.map(([a,b])=>`<div class='kpi'>${a}<b>${b}</b></div>`).join('');

  document.getElementById('rows').innerHTML=scored.map((h,i)=>`<tr data-id='${h.id}'><td>${i+1}</td><td>${h.id}</td><td>${h.county}</td><td>${h.der}</td><td>${(h.adoption*100).toFixed(1)}%</td><td>${h.impactPerDollar.toFixed(2)}</td><td>${h.when}</td><td>${h.message}</td><td>${h.financing}</td><td>${h.incentive}</td></tr>`).join('');

  document.querySelectorAll('#rows tr').forEach(tr=>tr.onclick=()=>{
    const h=scored.find(x=>x.id===tr.dataset.id);
    document.getElementById('detail').innerHTML=`<b>${h.id} (${h.county})</b><br/>Who benefits most: ${h.energyBurden>7?'High-energy-burden household':'Standard-benefit household'}<br/>Best technology: ${h.der}<br/>Right moment: ${h.when}<br/>Best message: ${h.message}<br/>Financing structure: ${h.financing}<br/>Incentive likely to convert: ${h.incentive}<br/>Why selected: energy burden ${h.energyBurden}%, peak 5–7pm ${h.peak57}kWh, impact-per-dollar ${h.impactPerDollar.toFixed(2)}.`;
  });
}

async function init(){
  const res=await fetch('data/virginia_sample.json');
  households=await res.json();
  render();
}

document.getElementById('runBtn').addEventListener('click',render);
init();
