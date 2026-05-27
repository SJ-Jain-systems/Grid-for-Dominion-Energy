# GRID for Dominion Energy

GRID is a browser-based decision support prototype for Dominion Energy. It helps utility teams identify high-value distributed energy resource (DER) opportunities, diagnose household adoption barriers, design targeted campaigns, and estimate the utility business case behind DER deployment.

Live prototype: [GRID](https://energy-topaz.vercel.app/)

## Prototype Report

The accompanying **GRID Prototype Report** frames GRID as a bridge from DER analysis to execution. The report's core thesis is:

> GRID should identify high-value DER opportunities, translate them into standardized work packages, and help Dominion compare bids from prequalified contractors using both cost and trust metrics.

The prototype currently proves the first half of that thesis: household targeting, DER fit, campaign planning, and utility-value modeling. The recommended future direction is a controlled contractor-bidding layer for standardized DER installation and support work. The report is careful to distinguish this from a lowest-bid marketplace for utility infrastructure: GRID should keep Dominion in control by limiting bidding to qualified vendors and judging bids by risk-adjusted value, not price alone.

## What GRID Does

GRID connects three decisions that are often handled separately:

| Decision | Prototype output |
| --- | --- |
| Which households should Dominion prioritize? | Household ranking, DER pathway, and adoption barrier diagnosis |
| What should Dominion offer? | Campaign message, financing approach, incentive, timing, and intervention |
| Why does adoption matter to the utility? | Peak reduction, avoided infrastructure cost, VPP value, net savings, and ROI |
| How could Dominion execute the work? | Future prequalified bidding layer for standardized DER work packages |

## Current Application Modules

### Targeting Explorer

The Targeting Explorer ranks Virginia households by strategy-specific priority. Analysts can filter by county, income band, DER type, targeting strategy, minimum adoption score, and outreach goal.

The ranked household table includes:

- Household ID and county
- Priority score
- Recommended DER technology
- Recommended message
- Financing option and incentive type
- Contact timing
- Top adoption barrier and barrier score
- Dominion offer

Supported strategy modes include:

- Maximize Adoption
- Maximize Affordability
- Maximize Grid Flexibility
- Maximize Customer Readiness

### Map + Campaign Manager

The Map + Campaign Manager tab converts household scores into county-level planning and campaign execution guidance.

The county map summarizes:

- Households analyzed
- Average priority score
- Average energy burden
- Dominant DER pathway
- County-specific initiative guidance

The Campaign Manager groups households into actionable campaign segments and recommends interventions based on the selected objective, DER pathway, adoption barrier, and launch timing.

### Dominion Savings

The Dominion Savings tab extends the prototype from customer targeting into utility economics. It models DER adoption as a potential alternative to some infrastructure buildout by estimating:

- Peak load reduction
- Avoided infrastructure cost
- Incentive and program cost
- Net Dominion savings
- Return on investment
- Virtual power plant value
- Emergency capacity value
- Marketing efficiency
- Subsidy value
- Opportunity-cost savings

The view includes selectable infrastructure cost curve assumptions:

- Stepwise
- Linear
- Stress curve

## Methodology Summary

The report formalizes GRID as an explainable scoring and simulation system rather than a black-box model.

### Household Scoring

Each household is transformed into normalized model features and scored across several dimensions:

- **Adoption propensity**: likelihood that a household will adopt a DER offer.
- **Affordability impact**: expected benefit for households with higher energy burden or lower income.
- **Grid flexibility**: value from peak reduction, dispatchability, outage risk, and flexible load.
- **Customer readiness**: near-term ability and willingness to act.

### Barrier Diagnosis

GRID does not only rank households. It also estimates why a household may not convert. Barrier categories include issues such as cost, rebate complexity, trust, readiness, and installation friction. The highest barrier helps determine the recommended message, incentive, financing approach, and intervention.

### Utility Value

The savings model estimates whether targeted DER adoption creates enough peak reduction, reliability value, affordability value, or avoided infrastructure cost to matter for Dominion. These calculations are scenario-driven planning assumptions, not audited financial reporting.

### Future Bid Scoring

The report recommends extending GRID into a procurement layer, sometimes framed as **Dominion Open Bid** or **GRID Bid**. In that future version, GRID would:

- Convert high-value DER or reliability opportunities into standardized work packages.
- Invite only prequalified contractors to bid.
- Compare bids using cost, schedule, geography, safety, experience, insurance, and performance history.
- Flag suspiciously low bids that may create delivery or quality risk.
- Recommend a risk-adjusted shortlist while preserving Dominion's final award decision.
- Learn from completed work to improve future vendor evaluation.

## Data Model

The prototype loads household-level data from `data/virginia_sample.json`. Key input fields include:

- `id`, `county`, `income`
- `energyBurden`, `peak57`, `outageRisk`
- `engagement`, `financingAcceptance`
- `ev`, `smartThermostat`
- `solarSuitability`, `roofSuitability`
- `estimatedInstallCost`, `installerCount25mi`
- `rebateCount`, `autoMatchedRebateCount`
- `applianceAge`, `homeAge`

These inputs drive recommendation outputs such as DER technology, campaign message, financing/incentive approach, outreach timing, barrier diagnosis, and strategy-specific priority scores.

## Repository Structure

- `index.html` - tabbed dashboard layout and section scaffolding.
- `styles.css` - styling for tabs, cards, charts, tables, and map views.
- `app.js` - scoring logic, filtering, campaign planning logic, and business-case calculations.
- `data/virginia_sample.json` - sample Virginia household dataset.
- `data/GRID_for_DOMINION_ENERGY` - rendered report artifact.

## Running Locally

Serve the static app from the repo root:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Notes and Assumptions

- GRID is a decision-support demo using sample Virginia household data.
- Dominion-specific savings and value metrics are scenario-based planning assumptions.
- Outputs should be interpreted as comparative prioritization signals, not final financial guidance.
- The future bidding concept is limited to standardized, repeatable DER-related work and should remain gated by vendor prequalification, safety standards, and Dominion review.

## Next Steps

- Add methodology notes for each Dominion Savings KPI directly in the UI.
- Add CSV export for filtered household lists and county rollups.
- Add configurable assumptions for marketing, incentive, infrastructure-cost, and VPP-value inputs.
- Prototype the controlled contractor-bidding workflow described in the report.
- Add validation against historical Dominion program data, including adoption, outreach, rebate, and installation outcomes.
