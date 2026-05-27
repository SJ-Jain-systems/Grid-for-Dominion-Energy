# GRID

GRID is a browser-based decision support dashboard for targeting distributed energy resource (DER) programs across Virginia households.

## Project status

This project has moved beyond a basic recommendation table and now includes:

- A **3-tab experience** for targeting, execution planning, and utility business-case modeling.
- A **Campaign Manager** with strategy-specific launch planning and export support.
- A **Dominion Savings** view with scenario-based economics, grid-value framing, and infrastructure cost curve modeling.
- A **county map + guidance workflow** for county-level initiative planning.

## Current application modules

### 1) Targeting Explorer tab

The Targeting Explorer focuses on household-level prioritization and intervention fit.

- Strategy options:
  - Maximize Adoption
  - Maximize Affordability
  - Maximize Grid Flexibility
  - Maximize Customer Readiness
- Filter controls:
  - County
  - Income Band
  - DER Type
  - Targeting Strategy
  - Minimum Adoption Score
  - Outreach Goal
- Outputs:
  - KPI summary cards
  - Ranked table of the **Top 25 target homes**
  - Household explanation panel with top barrier context

## 2) Map + Campaign Manager tab

This tab supports planning and execution.

### County DER Initiatives Map

- Interactive Virginia county markers.
- County-level rollups include:
  - households analyzed
  - average priority score
  - average energy burden
  - dominant DER pathway
- County-specific initiative guidance appears when a marker is selected.

### Campaign Manager

- Strategy-aligned campaign objective selector.
- Campaign KPI cards and recommended intervention cards.
- Export action for campaign plan artifacts.
- Strategy profile tuning (adoption, affordability, grid, readiness) is centralized in code for maintainability.

## 3) Dominion Savings tab

This executive-facing view frames a scenario-based utility business case (not audited financial reporting):

- Dominion savings KPI cards
- Modeled results summary and business-case lens
- DER Revenue and Grid Value section
- Marketing Efficiency comparison
- Policy and Subsidy assumptions section
- Opportunity Cost analysis
- Infrastructure Cost Curve with selectable models:
  - Stepwise (default)
  - Linear
  - Stress curve (exponential)

## Scoring algorithm

Each household is transformed into recommendation features and then scored across strategy modes.

### Core intermediate metrics

For each household, the app calculates:

- **Adoption propensity** (`adoption`): combines income normalization, peak load, engagement, EV status, smart thermostat presence, financing acceptance, and solar suitability.
- **Grid value** (`gridValue`): emphasizes peak demand, outage risk, EV load-shifting potential, and appliance age.
- **Affordability impact** (`affordability`): based on peak load, energy burden, and inverse-income weighting.

### Recommended DER pathway

Based on household conditions, the app assigns a best-fit pathway and messaging/financing package, including:

- Smart Thermostat
- Managed EV Charging
- Battery + Smart Panel
- Weatherization Bundle
- Smart Water Heater

Each recommendation is mapped to an assumed incentive cost and implementation framing.

### Strategy-specific priority scoring

The app computes strategy priorities such as:

- `adoptionPriority`
- `gridPriority`
- `affordabilityPriority`

The ranked household list is sorted by the selected active strategy.

## Data model

The app loads records from `data/virginia_sample.json` and expects household-level features such as:

- `id`, `county`, `income`
- `peak57`, `energyBurden`, `engagement`
- `ev`, `smartThermostat`
- `financingAcceptance`, `solarSuitability`
- `outageRisk`, `applianceAge`

These inputs drive recommendation outputs including DER technology, message, financing/incentive approach, outreach timing, and strategy priority scores.

## Repository structure

- `index.html` — tabbed dashboard layout and section scaffolding.
- `styles.css` — styling for tabs, cards, charts, tables, and map views.
- `app.js` — scoring logic, filtering, campaign planning logic, and business-case calculations.
- `data/virginia_sample.json` — sample Virginia household dataset.

## Running locally

Serve the static app from the repo root:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Notes and assumptions

- This is a **decision-support demo** with scenario-driven calculations.
- Dominion-specific savings and value metrics are modeled assumptions for planning exploration.
- Outputs should be interpreted as comparative prioritization signals, not final financial guidance.

## Suggested next enhancements

- Add methodology notes for each Dominion Savings KPI directly in the UI.
- Add CSV export for filtered Top 25 households and county rollups.
- Add configurable assumptions panel for marketing, incentive, and infrastructure-cost inputs.
