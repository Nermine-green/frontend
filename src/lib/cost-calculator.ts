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
  /** Total fixed costs incurred for the test in Euros (RH, Transport, Equipment Operational). */
  totalFixedCosts: number;
  /** Estimated additional cost due to factors like equipment age/condition in Euros. */
  additionalCost: number;
  /** Total cost of the test (Energy + Fixed + Additional) in Euros. */
  totalCost: number;
  /** Estimated carbon footprint of the test in kg CO₂. */
  carbonFootprintKgCO2: number;
}

/**
 * Calculates the total cost and environmental impact of a test.
 *
 * @param durationHours The total effective duration of the test in hours.
 * @param totalPowerConsumptionkW The total power consumption rate of the equipment in kW (can be sum for combined).
 * @param electricityCostEuroPerKWh The cost of electricity in Euros per kWh.
 * @param emissionFactorKgCO2PerKWh The CO₂ emission factor in kg CO₂ per kWh.
 * @param fixedCosts An object containing the fixed cost components (rh, transport, equipmentHourly).
 * @param ageFactor A multiplier (e.g., 1.05 for 5% increase) representing additional costs due to equipment age/condition. Defaults to 1.
 * @returns An object containing the calculated energy consumption, costs, and carbon footprint.
 */
export function calculateCosts(
  durationHours: number,
  totalPowerConsumptionkW: number,
  electricityCostEuroPerKWh: number,
  emissionFactorKgCO2PerKWh: number,
  fixedCosts: FixedCosts,
  ageFactor: number = 1 // Default to 1 (no additional cost)
): CostCalculationResult {
  // 1. Calculate Energy Consumption
  const energyConsumptionkWh = totalPowerConsumptionkW * durationHours;

  // 2. Calculate Base Energy Cost
  const energyCost = energyConsumptionkWh * electricityCostEuroPerKWh;

  // 3. Calculate Equipment Operational Cost (part of fixed costs calculation)
  const equipmentOperationalCost = fixedCosts.equipmentHourly * durationHours;

  // 4. Calculate Total Fixed Costs (excluding age factor here)
  const totalFixedCosts = fixedCosts.rh + fixedCosts.transport + equipmentOperationalCost;

  // 5. Calculate Additional Cost due to age/condition
  // Applied as a factor to the variable costs (energy + equipment operation)
  const variableCosts = energyCost + equipmentOperationalCost;
  // The additional cost is the increase *above* the base cost caused by the factor
  const additionalCost = variableCosts * (ageFactor - 1);

  // 6. Calculate Total Cost
  // Total Cost = Base Energy Cost + (RH + Transport) + Base Equipment Op Cost + Additional Cost
  // Which simplifies to: energyCost + totalFixedCosts + additionalCost (because totalFixedCosts includes equipmentOpCost)
  const totalCost = energyCost + totalFixedCosts + additionalCost;


  // 7. Calculate Carbon Footprint (based on energy consumption)
  const carbonFootprintKgCO2 = energyConsumptionkWh * emissionFactorKgCO2PerKWh;

  return {
    energyConsumptionkWh,
    energyCost, // Base energy cost
    totalFixedCosts, // Base fixed costs (RH + Transport + Equip Op)
    additionalCost, // Cost added due to ageFactor
    totalCost, // Overall total
    carbonFootprintKgCO2,
  };
}
