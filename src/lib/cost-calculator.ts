/**
 * Interface for fixed cost components.
 */
export interface FixedCosts {
  /** Cost related to RH (Relative Humidity) setup or similar fixed procedural cost per test. */
  rh: number;
  /** Cost for transport and packaging per test. */
  transport: number;
  /** Hourly operational cost of the specific equipment used. */
  equipmentHourly: number;
}

/**
 * Interface for the results of the cost calculation.
 */
export interface CostCalculationResult {
  /** Total energy consumed during the test in kWh. */
  energyConsumptionkWh: number;
  /** Cost of the energy consumed in Euros. */
  energyCost: number;
  /** Total fixed costs incurred for the test in Euros. */
  totalFixedCosts: number;
  /** Total cost of the test (Energy Cost + Fixed Costs + Additional Costs) in Euros. */
  totalCost: number;
  /** Estimated carbon footprint of the test in kg CO₂. */
  carbonFootprintKgCO2: number;
   /** Estimated additional cost due to equipment age/condition. */
  additionalCost: number;
}

/**
 * Calculates the total cost and environmental impact of a test.
 *
 * @param durationHours The duration of the test in hours.
 * @param powerConsumptionkW The power consumption rate of the equipment in kW.
 * @param electricityCostEuroPerKWh The cost of electricity in Euros per kWh.
 * @param emissionFactorKgCO2PerKWh The CO₂ emission factor in kg CO₂ per kWh.
 * @param fixedCosts An object containing the fixed cost components (rh, transport, equipmentHourly).
 * @param ageFactor A multiplier (>= 1) representing additional costs due to equipment age/condition.
 * @returns An object containing the calculated energy consumption, costs, and carbon footprint.
 */
export function calculateCosts(
  durationHours: number,
  powerConsumptionkW: number,
  electricityCostEuroPerKWh: number,
  emissionFactorKgCO2PerKWh: number,
  fixedCosts: FixedCosts,
  ageFactor: number = 1 // Default to 1, meaning no additional cost
): CostCalculationResult {
  // 1. Calculate Energy Consumption
  const energyConsumptionkWh = powerConsumptionkW * durationHours;

  // 2. Calculate Energy Cost
  const energyCost = energyConsumptionkWh * electricityCostEuroPerKWh;

  // 3. Calculate Equipment Operational Cost (part of fixed costs calculation)
  const equipmentOperationalCost = fixedCosts.equipmentHourly * durationHours;

  // 4. Calculate Total Fixed Costs
  const totalFixedCosts = fixedCosts.rh + fixedCosts.transport + equipmentOperationalCost;

   // 5. Calculate Additional Cost due to age/condition
   // This is a simple model; could be more complex (e.g., apply factor only to energy or maintenance)
   // Here, we apply it as a percentage increase on the base energy and fixed operational costs
   const baseOperationalCost = energyCost + totalFixedCosts;
   const additionalCost = (baseOperationalCost * (ageFactor - 1)); // Only the increase amount

  // 6. Calculate Total Cost
  const totalCost = energyCost + totalFixedCosts + additionalCost;


  // 7. Calculate Carbon Footprint
  const carbonFootprintKgCO2 = energyConsumptionkWh * emissionFactorKgCO2PerKWh;

  return {
    energyConsumptionkWh,
    energyCost,
    totalFixedCosts,
    totalCost,
    carbonFootprintKgCO2,
    additionalCost,
  };
}
