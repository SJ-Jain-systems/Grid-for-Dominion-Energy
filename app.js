let households = [];
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const TABLE_LIMIT = 25;

const countyFilter=document.getElementById('countyFilter');
const incomeFilter=document.getElementById('incomeFilter');
const derFilter=document.getElementById('derFilter');
const goalFilter=document.getElementById('goalFilter');
const minAdoption=document.getElementById('minAdoption');
const minValue=document.getElementById('minValue');
const strategyFilter=document.getElementById('strategyFilter');
const campaignObjective=document.getElementById('campaignObjective');
const exportCampaignPlanBtn=document.getElementById('exportCampaignPlanBtn');
const rowsEl=document.getElementById('rows');
const detail=document.getElementById('detail');
const kpiCards=document.getElementById('kpiCards');
const campaignCards=document.getElementById('campaignCards');
const campaignKpiCards=document.getElementById('campaignKpiCards');
let displayedCampaigns = [];

const countyMap=document.getElementById('countyMap');
const countyDetail=document.getElementById('countyDetail');
const VA_BOUNDS = {
  minLon: -83.75,
  maxLon: -75.10,
  minLat: 36.45,
  maxLat: 39.55
};

function projectVA(lon, lat) {
  const width = 860;
  const height = 280;
  const padX = 20;
  const padY = 20;

  const x = padX + ((lon - VA_BOUNDS.minLon) / (VA_BOUNDS.maxLon - VA_BOUNDS.minLon)) * width;
  const y = padY + ((VA_BOUNDS.maxLat - lat) / (VA_BOUNDS.maxLat - VA_BOUNDS.minLat)) * height;

  return [x, y];
}

const countyPos = {
  Roanoke: [355, 225],
  Charlottesville: [465, 175],

  Loudoun: [575, 70],
  Fairfax: [615, 95],
  "Prince William": [600, 120],
  Arlington: [635, 88],
  Alexandria: [648, 105],

  "Richmond City": [610, 220],
  Henrico: [620, 205],
  Chesterfield: [600, 235],

  "Newport News": [720, 245],
  Norfolk: [745, 270],
  "Virginia Beach": [770, 265]
};

const labelOffset = {
  Roanoke: [16, 4],
  Charlottesville: [16, 4],

  Loudoun: [14, -8],
  Fairfax: [14, 4],
  "Prince William": [14, 16],
  Arlington: [14, -10],
  Alexandria: [14, 14],

  "Richmond City": [14, 4],
  Henrico: [14, -10],
  Chesterfield: [14, 16],

  "Newport News": [14, -8],
  Norfolk: [14, 4],
  "Virginia Beach": [14, 16]
};

const VA_MAINLAND_OUTLINE = [
  [-83.67, 36.60],
  [-82.90, 36.58],
  [-82.20, 36.59],
  [-81.40, 36.58],
  [-80.55, 36.56],
  [-79.70, 36.55],
  [-78.80, 36.55],
  [-77.95, 36.55],
  [-77.20, 36.55],
  [-76.70, 36.55],
  [-76.25, 36.58],
  [-75.95, 36.75],
  [-76.10, 36.95],
  [-76.35, 37.10],
  [-76.45, 37.28],
  [-76.62, 37.42],
  [-76.35, 37.62],
  [-76.22, 37.82],
  [-76.40, 38.00],
  [-76.65, 38.12],
  [-76.92, 38.28],
  [-77.18, 38.50],
  [-77.38, 38.72],
  [-77.75, 38.95],
  [-78.05, 39.18],
  [-78.35, 39.45],
  [-78.70, 39.25],
  [-79.05, 39.05],
  [-79.25, 38.78],
  [-79.55, 38.55],
  [-79.85, 38.42],
  [-80.18, 38.28],
  [-80.50, 38.00],
  [-80.85, 37.82],
  [-81.20, 37.60],
  [-81.55, 37.35],
  [-81.95, 37.18],
  [-82.30, 36.98],
  [-82.72, 36.82],
  [-83.20, 36.68],
  [-83.67, 36.60]
];

const VA_EASTERN_SHORE_OUTLINE = [
  [-75.95, 38.05],
  [-75.70, 37.88],
  [-75.58, 37.55],
  [-75.66, 37.22],
  [-75.88, 37.02],
  [-76.04, 37.18],
  [-76.02, 37.55],
  [-75.95, 38.05]
];

function pathFromLonLat(points) {
  return points
    .map(([lon, lat], i) => {
      const [x, y] = projectVA(lon, lat);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ") + " Z";
}




const barrierLabelMap = {
  upfrontCostFriction: 'Upfront Cost Friction',
  installerTrustIssues: 'Installer Trust Issues',
  decisionFatigue: 'Decision Fatigue',
  rebateConfusion: 'Rebate Confusion',
  lowROIClarity: 'Low ROI Clarity',
  lowUrgency: 'Low Urgency',
  highEnergyBurden: 'High Energy Burden',
  chargingAccessBarrier: 'Charging Access Barrier',
  homeSuitabilityBarrier: 'Home Suitability Barrier',
  ratePlanConfusion: 'Rate Plan Confusion'
};

function getDominantBarrier(barriers){
  const entries = Object.entries(barriers || {});
  if(!entries.length){
    return {
      barrierKey: null,
      barrierLabel: null,
      barrierScore: 0
    };
  }
  const [barrierKey, barrierScore] = entries.reduce((maxEntry, entry) =>
    entry[1] > maxEntry[1] ? entry : maxEntry
  );
  return {
    barrierKey,
    barrierLabel: barrierLabelMap[barrierKey] || barrierKey,
    barrierScore
  };
}


const barrierOfferMap = {
  upfrontCostFriction: '0% on-bill financing',
  installerTrustIssues: 'Dominion-vetted installer marketplace',
  decisionFatigue: 'Switching concierge',
  rebateConfusion: 'Automatic rebate matching',
  lowROIClarity: 'Personalized savings estimate',
  lowUrgency: 'Limited-time bill credit',
  highEnergyBurden: 'Income-qualified upgrade package',
  chargingAccessBarrier: 'EV charging access program',
  homeSuitabilityBarrier: 'Smart panel/assessment package',
  ratePlanConfusion: 'Off-peak enrollment recommendation'
};

const offeringExplanationMap = {
  upfrontCostFriction: '0% on-bill financing removes upfront payment pressure by spreading costs into predictable monthly bill amounts.',
  installerTrustIssues: 'A Dominion-vetted installer marketplace reduces perceived risk by emphasizing trusted quality standards and accountability.',
  decisionFatigue: 'A switching concierge reduces complexity by guiding households through choices, steps, and paperwork end to end.',
  rebateConfusion: 'Automatic rebate matching lowers confusion by identifying and applying relevant rebates without manual searching.',
  lowROIClarity: 'A personalized savings estimate improves confidence by translating household characteristics into clear expected savings.',
  lowUrgency: 'A limited-time bill credit creates an immediate reason to act, helping overcome procrastination and low perceived urgency.',
  highEnergyBurden: 'An income-qualified upgrade package targets high-burden households with affordability-focused support for impactful upgrades.',
  chargingAccessBarrier: 'An EV charging access program addresses charging constraints with practical options for households lacking easy home charging.',
  homeSuitabilityBarrier: 'A smart panel/assessment package identifies technical constraints early and defines a feasible upgrade pathway.',
  ratePlanConfusion: 'An off-peak enrollment recommendation simplifies rate decisions by pointing households to the most relevant time-based option.'
};

function scoreBarriers(h){
  const owner = h.renterOwner === 'owner';
  const renterPenalty = owner ? 0 : 1;
  const multifamilyPenalty = h.multifamily ? 1 : 0;
  const noDrivewayPenalty = h.garageOrDriveway ? 0 : 1;

  const installerQualityGap = clamp(5 - h.installerAvgRating, 0, 2);
  const complaintIntensity = clamp(h.installerComplaintCount / Math.max(h.installerCount25mi, 1), 0, 3);
  const programComplexity = clamp((h.requiredStepCount - 2) / 8, 0, 1);
  const rebateAutomationGap = clamp((h.rebateCount - h.autoMatchedRebateCount) / Math.max(h.rebateCount, 1), 0, 1);

  const financingGap = clamp(1 - h.financingAcceptance, 0, 1);
  const incomePressure = clamp((90000 - h.income) / 90000, 0, 1);
  const installCostPressure = clamp((h.estimatedInstallCost - 12000) / 20000, 0, 1);
  const lowHomeValueBuffer = clamp((350000 - h.homeValue) / 350000, 0, 1);

  const roiUncertainty = clamp(1 - h.savingsEstimateConfidence, 0, 1);
  const suitabilityGap = clamp(1 - ((h.roofSuitability + h.solarSuitability) / 2), 0, 1);
  const panelConstraint = clamp((150 - h.panelCapacityProxy) / 90, 0, 1);

  const burdenLow = clamp((6 - h.energyBurden) / 6, 0, 1);
  const burdenHigh = clamp((h.energyBurden - 4) / 6, 0, 1);
  const efficientHomeSignal = clamp((10 - h.applianceAge) / 10, 0, 1);

  const offPeakAvailable = h.offPeakEligible ? 1 : 0;
  const offPeakNotEnrolled = h.offPeakEligible && !h.offPeakEnrolled ? 1 : 0;
  const complexity = clamp((h.usageComplexity - 1) / 4, 0, 1);

  return {
    upfrontCostFriction: clamp(100 * (
      0.34 * financingGap +
      0.24 * incomePressure +
      0.22 * installCostPressure +
      0.12 * lowHomeValueBuffer +
      0.08 * renterPenalty
    ), 0, 100),

    installerTrustIssues: clamp(100 * (
      0.40 * (installerQualityGap / 2) +
      0.35 * (complaintIntensity / 3) +
      0.15 * clamp((40 - h.installerCount25mi) / 40, 0, 1) +
      0.10 * (h.priorEnrollment ? 0 : clamp(h.priorEligibilityCount / 4, 0, 1))
    ), 0, 100),

    decisionFatigue: clamp(100 * (
      0.42 * programComplexity +
      0.24 * complexity +
      0.18 * clamp(h.eligibleProgramCount / 7, 0, 1) +
      0.16 * clamp(h.priorEligibilityCount / 5, 0, 1)
    ), 0, 100),

    rebateConfusion: clamp(100 * (
      0.45 * rebateAutomationGap +
      0.30 * clamp(h.rebateCount / 5, 0, 1) +
      0.15 * programComplexity +
      0.10 * (h.priorEnrollment ? 0 : 1)
    ), 0, 100),

    lowROIClarity: clamp(100 * (
      0.50 * roiUncertainty +
      0.22 * suitabilityGap +
      0.16 * panelConstraint +
      0.12 * clamp((h.homeAge - 25) / 35, 0, 1)
    ), 0, 100),

    lowUrgency: clamp(100 * (
      0.55 * burdenLow +
      0.20 * efficientHomeSignal +
      0.15 * (h.ev ? 0 : 1) +
      0.10 * (offPeakAvailable ? 0.5 : 0)
    ), 0, 100),

    highEnergyBurden: clamp(100 * (
      0.75 * burdenHigh +
      0.15 * incomePressure +
      0.10 * clamp((h.peak57 - 7) / 6, 0, 1)
    ), 0, 100),

    chargingAccessBarrier: clamp(100 * (
      0.30 * noDrivewayPenalty +
      0.23 * renterPenalty +
      0.20 * multifamilyPenalty +
      0.17 * clamp(h.publicChargerDistance / 6, 0, 1) +
      0.10 * (h.ev ? 0 : 0.5)
    ), 0, 100),

    homeSuitabilityBarrier: clamp(100 * (
      0.36 * suitabilityGap +
      0.22 * panelConstraint +
      0.18 * multifamilyPenalty +
      0.14 * renterPenalty +
      0.10 * clamp((h.homeAge - 30) / 30, 0, 1)
    ), 0, 100),

    ratePlanConfusion: clamp(100 * (
      0.32 * offPeakNotEnrolled +
      0.25 * complexity +
      0.18 * programComplexity +
      0.15 * clamp(h.eligibleProgramCount / 7, 0, 1) +
      0.10 * (h.priorEnrollment ? 0 : 1)
    ), 0, 100)
  };
}

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
  const barriers = scoreBarriers(h);
  const dominantBarrier = getDominantBarrier(barriers);
  const recommendedOffering = barrierOfferMap[dominantBarrier.barrierKey] || 'Standard energy advisor outreach';
  const recommendedOfferingExplanation = offeringExplanationMap[dominantBarrier.barrierKey] || "This offering is selected to reduce the household's highest adoption barrier.";
  return {
    ...h,
    adoption,
    gridValue,
    affordability,
    adoptionPriority,
    gridPriority,
    affordabilityPriority,
    tech,
    msg,
    financing,
    incentive,
    when,
    why,
    barriers,
    dominantBarrier,
    dominantBarrierLabel: dominantBarrier.barrierLabel,
    dominantBarrierScore: dominantBarrier.barrierScore,
    recommendedOffering,
    recommendedOfferingExplanation
  };
}

function getPriorityKey(){const s=strategyFilter.value;return s==='grid'?'gridPriority':s==='affordability'?'affordabilityPriority':'adoptionPriority';}
function filters(rows){const county=countyFilter.value,income=incomeFilter.value,der=derFilter.value,goal=goalFilter.value,min=+minAdoption.value/100;return rows.filter(r=>(county==='all'||r.county===county)&&(income==='all'||(income==='very-low'&&r.income<40000)||(income==='low'&&r.income>=40000&&r.income<80000)||(income==='mid'&&r.income>=80000&&r.income<=120000)||(income==='upper-mid'&&r.income>120000&&r.income<=180000)||(income==='high'&&r.income>180000))&&(der==='all'||r.tech===der)&&(goal==='all'||(goal==='bill'&&r.msg==='Bill savings')||(goal==='automation'&&r.msg==='Automation & convenience')||(goal==='resilience'&&r.msg==='Resilience & outage protection'))&&r.adoption>=min);}

function buildCampaigns(rows){
  const campaignRows = Array.isArray(rows) ? rows : [];
  const objective = campaignObjective?.value || 'adoption';
  const grouped = {};

  campaignRows.forEach((r) => {
    const barrier = r.dominantBarrier?.barrierKey || r.dominantBarrierKey || 'unknownBarrier';
    const tech = r.tech || 'General DER';
    const key = `${barrier}__${tech}`;
    (grouped[key] ??= []).push(r);
  });

  const campaigns = Object.entries(grouped).map(([_, list]) => {
    const audienceSize = list.length;
    const avgPriorityScore = list.reduce((sum, r) => sum + (r.adoptionPriority || 0), 0) / audienceSize;
    const avgAffordabilityPriority = list.reduce((sum, r) => sum + (r.affordabilityPriority || 0), 0) / audienceSize;
    const avgGridPriority = list.reduce((sum, r) => sum + (r.gridPriority || 0), 0) / audienceSize;
    const avgBarrierScore = list.reduce((sum, r) => sum + (r.dominantBarrierScore || 0), 0) / audienceSize;
    const avgEnergyBurden = list.reduce((sum, r) => sum + (r.energyBurden || 0), 0) / audienceSize;
    const avgPeak57 = list.reduce((sum, r) => sum + (r.peak57 || 0), 0) / audienceSize;
    const avgEngagement = list.reduce((sum, r) => sum + (r.engagement || 0), 0) / audienceSize;
    const avgFinancingAcceptance = list.reduce((sum, r) => sum + (r.financingAcceptance || 0), 0) / audienceSize;
    const avgBarrierSeverity = avgBarrierScore / 100;
    const evLoadShare = list.filter((r) => r.ev).length / audienceSize;
    const smartWaterShare = list.filter((r) => r.tech === 'Smart Water Heater').length / audienceSize;
    const batteryOrSmartPanelShare = list.filter((r) => r.tech === 'Battery + Smart Panel').length / audienceSize;
    const incomeQualifiedShare = list.filter((r) => (r.income || 0) < 80000).length / audienceSize;

    const barrier = list[0]?.dominantBarrier?.barrierKey || list[0]?.dominantBarrierKey || 'unknownBarrier';
    const barrierLabel = list[0]?.dominantBarrierLabel || barrierLabelMap[barrier] || barrier;
    const tech = list[0]?.tech || 'General DER';
    const recommendedOffering = list[0]?.recommendedOffering || barrierOfferMap[barrier] || 'Standard energy advisor outreach';

    const countyCounts = list.reduce((acc, r) => {
      acc[r.county] = (acc[r.county] || 0) + 1;
      return acc;
    }, {});
    const dominantCounty = Object.entries(countyCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';

    const messageCounts = list.reduce((acc, r) => {
      acc[r.msg] = (acc[r.msg] || 0) + 1;
      return acc;
    }, {});
    const recommendedMessage = Object.entries(messageCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Bill savings';

    const timingCounts = list.reduce((acc, r) => {
      acc[r.when] = (acc[r.when] || 0) + 1;
      return acc;
    }, {});
    const recommendedTiming = Object.entries(timingCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'During monthly bill cycle';

    const estimatedCampaignCost = (1400 + (audienceSize * 120) + (avgBarrierScore * 11) + (avgEnergyBurden * 35));
    const expectedAdoptionLift = clamp(
      0.08 +
      (avgPriorityScore * 0.06) +
      ((avgBarrierScore / 100) * 0.14) +
      (Math.log10(audienceSize + 1) * 0.05),
      0.03,
      0.45
    );

    // Objective-based campaign scoring model:
    // - Adoption mode: prioritize adoptionPriority + expected lift + audience scale.
    // - Affordability mode: prioritize affordabilityPriority + high energy burden + income-qualified share.
    // - Grid mode: prioritize gridPriority + peak57 + EV load + smart water heater + battery/smart panel pathways.
    // - Readiness mode: prioritize engagement + financing acceptance + lower barrier severity.
    const campaignScoreByObjective = {
      adoption:
        (avgPriorityScore * 45) +
        (expectedAdoptionLift * 140) +
        (Math.log10(audienceSize + 1) * 18) +
        ((avgBarrierScore / 100) * 10) -
        (estimatedCampaignCost / 1300),
      affordability:
        (avgAffordabilityPriority * 50) +
        (clamp(avgEnergyBurden / 12, 0, 1) * 34) +
        (incomeQualifiedShare * 26) +
        (expectedAdoptionLift * 35) -
        (estimatedCampaignCost / 1700),
      grid:
        (avgGridPriority * 50) +
        (clamp(avgPeak57 / 20, 0, 1) * 28) +
        (evLoadShare * 18) +
        (smartWaterShare * 12) +
        (batteryOrSmartPanelShare * 14) -
        (estimatedCampaignCost / 1750),
      readiness:
        (clamp(avgEngagement / 100, 0, 1) * 42) +
        (avgFinancingAcceptance * 35) +
        ((1 - avgBarrierSeverity) * 28) +
        (expectedAdoptionLift * 20) +
        (Math.log10(audienceSize + 1) * 10) -
        (estimatedCampaignCost / 1900)
    };
    const campaignScore = campaignScoreByObjective[objective] ?? campaignScoreByObjective.adoption;

    return {
      campaignName: `${barrierLabel} · ${tech}`,
      barrier,
      barrierLabel,
      tech,
      recommendedOffering,
      audienceSize,
      avgPriorityScore,
      avgAffordabilityPriority,
      avgGridPriority,
      avgBarrierScore,
      avgEnergyBurden,
      dominantCounty,
      estimatedCampaignCost,
      expectedAdoptionLift,
      campaignScore,
      recommendedMessage,
      recommendedTiming
    };
  });

  return campaigns.sort((a,b)=>b.campaignScore-a.campaignScore);
}

function campaignTimingReason(timing, campaign){
  const reasons = {
    'Before summer peak': `this segment shows elevated summer load risk and can capture demand reduction before peak-season system stress`,
    'Before winter heating season': `winter bill pressure is highest for this segment, so pre-season enrollment improves readiness before heating demand rises`,
    'During monthly bill cycle': `bill statements create a predictable decision window when households are most attentive to energy costs and enrollment options`,
    'After outage events': `recent outage awareness increases receptivity to resilience-focused upgrades and faster enrollment follow-through`,
    'At equipment replacement moments': `customers are more likely to adopt when a replacement decision is already underway`
  };
  return reasons[timing] || `this window aligns with observed customer decision timing across the segment`;
}

function toCsvField(value){
  const text = value == null ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function exportCampaignPlanCsv(campaigns){
  const rows = Array.isArray(campaigns) ? campaigns : [];
  if(!rows.length) return;

  const columns = [
    'campaignName',
    'audienceSize',
    'dominantBarrier',
    'recommendedOffering',
    'tech',
    'avgPriorityScore',
    'avgBarrierScore',
    'avgEnergyBurden',
    'dominantCounty',
    'estimatedCampaignCost',
    'expectedAdoptionLift',
    'recommendedMessage',
    'recommendedTiming'
  ];

  const csvLines = [columns.join(',')];
  rows.forEach((c) => {
    const values = [
      c.campaignName,
      c.audienceSize,
      c.barrierLabel,
      c.recommendedOffering,
      c.tech,
      Number(c.avgPriorityScore || 0).toFixed(2),
      Number(c.avgBarrierScore || 0).toFixed(1),
      Number(c.avgEnergyBurden || 0).toFixed(1),
      c.dominantCounty,
      Math.round(c.estimatedCampaignCost || 0),
      Number(c.expectedAdoptionLift || 0).toFixed(4),
      c.recommendedMessage,
      c.recommendedTiming
    ];
    csvLines.push(values.map(toCsvField).join(','));
  });

  const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const timestamp = new Date().toISOString().slice(0, 10);
  const link = document.createElement('a');
  link.href = url;
  link.download = `campaign-plan-${timestamp}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function renderCampaigns(rows){
  if(!campaignCards) return;
  const objectiveLabel = campaignObjective?.options?.[campaignObjective.selectedIndex]?.text || 'Maximize Adoption';
  const allCampaigns = buildCampaigns(rows);
  const campaigns = allCampaigns.slice(0, 6);
  displayedCampaigns = campaigns;
  renderCampaignKPIs(allCampaigns);
  if(!campaigns.length){
    campaignCards.innerHTML = "<div class='card'>No campaign candidates for the current filters.</div>";
    return;
  }

  campaignCards.innerHTML = `
    <div class="card"><b>Ranking objective:</b> ${objectiveLabel}</div>
  ` + campaigns.map((c, idx) => `
    <article class="card campaign-card">
      <div class="campaign-card-head">
        <h3>${c.campaignName}</h3>
        ${idx < 3 ? '<span class="launch-badge">Launch Candidate</span>' : ''}
      </div>
      <div class="campaign-rows">
        <p class="campaign-row"><span>Audience</span><b>${c.audienceSize.toLocaleString()}</b></p>
        <p class="campaign-row"><span>Barrier</span><b>${c.barrierLabel}</b></p>
        <p class="campaign-row"><span>Dominion Offer</span><b>${c.recommendedOffering}</b></p>
        <p class="campaign-row"><span>Best-fit DER</span><b>${c.tech}</b></p>
        <p class="campaign-row"><span>Expected Lift</span><b>${(c.expectedAdoptionLift * 100).toFixed(1)}%</b></p>
        <p class="campaign-row"><span>Timing</span><b>${c.recommendedTiming}</b></p>
      </div>
      <p class="campaign-explanation">
        This campaign targets <b>${c.audienceSize.toLocaleString()}</b> households whose main adoption barrier is <b>${c.barrierLabel}</b>. The recommended DER pathway is <b>${c.tech}</b>, and the best Dominion intervention is <b>${c.recommendedOffering}</b>. This campaign should use <b>${c.recommendedMessage}</b> messaging and launch <b>${c.recommendedTiming}</b> because ${campaignTimingReason(c.recommendedTiming, c)}.
      </p>
    </article>
  `).join('');
}

function renderCampaignKPIs(campaigns){
  if(!campaignKpiCards) return;
  const list = Array.isArray(campaigns) ? campaigns : [];
  if(!list.length){
    campaignKpiCards.innerHTML = '';
    return;
  }

  const totalCampaignableHouseholds = list.reduce((sum, c) => sum + (c.audienceSize || 0), 0);
  const numberOfCampaignSegments = list.length;
  const topRecommendedCampaign = list[0]?.campaignName || 'n/a';
  const averageBarrierSeverity = list.reduce((sum, c) => sum + (c.avgBarrierScore || 0), 0) / numberOfCampaignSegments;
  const estimatedTotalCampaignBudget = list.reduce((sum, c) => sum + (c.estimatedCampaignCost || 0), 0);
  const expectedTotalAdoptionLift = list.reduce((sum, c) => sum + ((c.expectedAdoptionLift || 0) * (c.audienceSize || 0)), 0) / Math.max(totalCampaignableHouseholds, 1);

  const kpis = [
    ['Total campaignable households', totalCampaignableHouseholds.toLocaleString()],
    ['Number of campaign segments', numberOfCampaignSegments.toLocaleString()],
    ['Top recommended campaign', topRecommendedCampaign],
    ['Average barrier severity', `${averageBarrierSeverity.toFixed(1)}`],
    ['Estimated total campaign budget', `$${Math.round(estimatedTotalCampaignBudget).toLocaleString()}`],
    ['Expected total adoption lift', `${(expectedTotalAdoptionLift * 100).toFixed(1)}%`]
  ];
  campaignKpiCards.innerHTML = kpis.map(([k,v])=>`<div class='card'>${k}<b>${v}</b></div>`).join('');
}


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
  countyMap.innerHTML += `
  <path
    d="${pathFromLonLat(VA_MAINLAND_OUTLINE)}"
    fill="#eef4ff"
    stroke="#1e3a8a"
    stroke-width="3"
    stroke-linejoin="round"
  />

  <path
    d="${pathFromLonLat(VA_EASTERN_SHORE_OUTLINE)}"
    fill="#eef4ff"
    stroke="#1e3a8a"
    stroke-width="3"
    stroke-linejoin="round"
  />
`;
  stats.forEach((c,i)=>{
    const p = countyPos[c.county] || [90 + ((i * 60) % 760), 80 + ((i * 35) % 180)];

    const offset = labelOffset[c.county] || [16, 4];

    countyMap.innerHTML += `
  <g class="county-marker" data-county="${c.county}" tabindex="0">
    <circle cx="${p[0]}" cy="${p[1]}" r="12"></circle>
    <text x="${p[0] + offset[0]}" y="${p[1] + offset[1]}">${c.county}</text>
  </g>
`;
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

  const renderDetail = (r) => `
    <b>${r.id} · ${r.county}</b><br/><br/>
    <b>Why this household is a good target:</b> ${r.why}, with ${r.peak57 > 9 ? 'elevated' : 'moderate'} 5-7pm demand and an estimated priority score of ${r[key].toFixed(2)}.<br/><br/>
    <b>Dominant adoption barrier:</b> ${r.dominantBarrierLabel || 'Not identified'} (${(r.dominantBarrierScore || 0).toFixed(1)}).<br/><br/>
    <b>Why this Dominion offering fits:</b> <b>${r.recommendedOffering}</b> — ${r.recommendedOfferingExplanation}<br/><br/>
    <b>Recommended campaign message:</b> ${r.msg}.
  `;

  rowsEl.innerHTML=topRows.map(r=>`<tr data-id='${r.id}'><td>${r.id}</td><td>${r.county}</td><td>${r[key].toFixed(2)}</td><td>${r.tech}</td><td>${r.msg}</td><td>${r.financing}</td><td>${r.incentive}</td><td>${r.when}</td><td>${r.dominantBarrierLabel || 'n/a'}</td><td>${(r.dominantBarrierScore || 0).toFixed(1)}</td><td>${r.recommendedOffering}</td></tr>`).join('');
  document.querySelectorAll('#rows tr').forEach(tr=>tr.onclick=()=>{const r=topRows.find(x=>x.id===tr.dataset.id);detail.innerHTML=renderDetail(r);});

  const focus=topRows[0];
  detail.innerHTML=focus ? renderDetail(focus) : 'No households match the current filters.';
  renderCampaigns(rows);
  renderCountyMap(rows,key);

}

async function init(){
  households=await (await fetch('data/virginia_sample.json')).json();
  [...new Set(households.map(h=>h.county))].sort().forEach(c=>{const o=document.createElement('option');o.value=c;o.textContent=c;countyFilter.appendChild(o);});
  minValue.textContent=`${minAdoption.value}%`;
  render();
}
['countyFilter','incomeFilter','derFilter','minAdoption','goalFilter','strategyFilter'].forEach(id=>document.getElementById(id).addEventListener('input',()=>{minValue.textContent=`${minAdoption.value}%`;render();}));
campaignObjective?.addEventListener('input', render);
exportCampaignPlanBtn?.addEventListener('click', ()=>exportCampaignPlanCsv(displayedCampaigns));
init();
