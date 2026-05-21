# GRID

GRID is a browser-based decision support dashboard for targeting distributed energy resource (DER) programs across Virginia households.

## What this tool does

- Scores households for DER outreach using multiple objectives.
- Lets users filter and review top recommendations in an interactive table.
- Shows KPI summaries for quick planning.
- Provides an interactive county map with county-level DER initiative guidance.

## Scoring algorithm

Each household is transformed into a set of recommendation features and then scored across three strategy modes:

- **Maximize Adoption** (`adoptionPriority`)
- **Maximize Grid Flexibility** (`gridPriority`)
- **Maximize Affordability Impact** (`affordabilityPriority`)

### 1) Core intermediate metrics

For each household, the app calculates:

- **Adoption propensity** (`adoption`): combines income normalization, peak load, engagement, EV status, smart thermostat presence, financing acceptance, and solar suitability.
- **Grid value** (`gridValue`): emphasizes peak demand, outage risk, EV load-shifting potential, and appliance age.
- **Affordability impact** (`affordability`): based on peak load, energy burden, and inverse-income weighting.

### 2) Recommended DER pathway

Based on household conditions, the app assigns a best-fit pathway and messaging/financing package, including:

- Smart Thermostat
- Managed EV Charging
- Battery + Smart Panel
- Weatherization Bundle
- Smart Water Heater

It also maps each recommendation to an assumed incentive cost.

### 3) Strategy-specific priority scores

The final priority depends on the selected strategy:

- **Adoption priority** rewards high adoption potential and affordability/grid impact while penalizing friction and incentive cost.
- **Grid priority** emphasizes dispatch/flex potential and adoption likelihood, normalized by incentive cost.
- **Affordability priority** emphasizes bill-burden relief potential and adoption probability with cost/friction normalization.

The dashboard sorts households by the selected priority score and displays the top 50.

## Data model and feature definitions

The app loads records from `data/virginia_sample.json` and expects household-level features such as:

- `id`, `county`, `income`
- `peak57` (5–7pm peak usage proxy)
- `energyBurden`
- `engagement`
- `ev` (EV ownership flag)
- `smartThermostat` (existing device/adoption signal)
- `financingAcceptance`
- `solarSuitability`
- `outageRisk`
- `applianceAge`

These inputs are used to generate recommendation outputs:

- Selected DER technology (`tech`)
- Program message (`msg`)
- Financing and incentive recommendation
- Recommended outreach timing (`when`)
- Strategy-specific priority scores

## Dashboard features

### Filters

- County
- Income Band (Very Low, Low, Middle, Upper-middle, High)
- DER Type
- Targeting Strategy
- Minimum Adoption Score
- Outreach Goal

### KPI cards

- High-priority households
- Average energy burden
- Projected peak reduction
- Estimated annual savings
- Highest-value segment

Supporting context appears below the KPI row: `Based on X households analyzed`.

### Main Recommendations table

- Shows top 50 households by active strategy score.
- Click any row to see a detailed household explanation.

### County DER Initiatives map

- Clickable county markers.
- Displays county-level rollups:
  - households analyzed
  - average priority score
  - average energy burden
  - dominant DER pathway
- Suggests initiative guidance based on dominant county pathway.

## Running locally

Because this is a static frontend, you can serve it with any local web server and open `index.html` in your browser.

## Roadmap 
- Current action plans for the campaign manager takes average via parameter as the estimated cost value, debug, and replace with a specific plan value 
  - Average barrier severity
  - Estimated total campaign budget
  - Expected total adoption lift
- Separate Tab for Map and campaign manager 
- More on the front end 

