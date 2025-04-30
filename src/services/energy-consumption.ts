/**
 * Represents equipment power consumption data.
 */
export interface EquipmentPowerConsumption {
  /**
   * The equipment type (e.g., thermal_chamber, vibrating_pot).
   */
  equipment: string;
  /**
   * The specific test method (e.g., '2-1: A', '2-6: Fc(sinusoidal)').
   */
  testMethod: string;
  /**
   * The power consumption in kW for this specific method and equipment.
   */
  powerConsumptionkW: number;
}

// --- Mock Data Store ---
// Updated with new method names and potentially adjusted power values.
// In a real application, this would be loaded from a CSV file or database based on the method string.
const mockPowerData: EquipmentPowerConsumption[] = [
  // === Thermal Chamber ===
  { equipment: 'thermal_chamber', testMethod: '2-1: A', powerConsumptionkW: 5.5 }, // Cold
  { equipment: 'thermal_chamber', testMethod: '2-2: B', powerConsumptionkW: 6.0 }, // Dry Heat
  { equipment: 'thermal_chamber', testMethod: '2-14: Nb', powerConsumptionkW: 7.0 }, // Change of Temp (Ramp)
  { equipment: 'thermal_chamber', testMethod: '2-30: Db', powerConsumptionkW: 6.5 }, // Damp Heat Cyclic
  { equipment: 'thermal_chamber', testMethod: '2-38: Z/AD', powerConsumptionkW: 7.5 }, // Temp/Humidity Cyclic
  { equipment: 'thermal_chamber', testMethod: '2-78: Cab', powerConsumptionkW: 6.8 }, // Damp Heat Steady

  // === Thermal Shock Chamber ===
  { equipment: 'thermal_shock_chamber', testMethod: '2-14: Na', powerConsumptionkW: 12.0 }, // Thermal Shock

  // === Vibrating Pot ===
  { equipment: 'vibrating_pot', testMethod: '2-6: Fc(sinusoidal)', powerConsumptionkW: 8.0 }, // Sine
  { equipment: 'vibrating_pot', testMethod: '2-27: Ea(Shock)', powerConsumptionkW: 9.5 },      // Shock
  { equipment: 'vibrating_pot', testMethod: '2-64: Fh(random)', powerConsumptionkW: 8.5 },     // Random

  // === Combined Vibrating Pot + Thermal Chamber ===
  // Assume this equipment can run *either* vibration *or* thermal tests individually,
  // or *both simultaneously* (which is handled by summing in the main component).
  // Power values here represent running *only* that specific test on the combined machine.
  // Thermal Tests on Combined Machine:
  { equipment: 'combined_vibration_thermal', testMethod: '2-1: A', powerConsumptionkW: 5.8 },
  { equipment: 'combined_vibration_thermal', testMethod: '2-2: B', powerConsumptionkW: 6.3 },
  { equipment: 'combined_vibration_thermal', testMethod: '2-14: Nb', powerConsumptionkW: 7.5 },
  { equipment: 'combined_vibration_thermal', testMethod: '2-30: Db', powerConsumptionkW: 6.8 },
  { equipment: 'combined_vibration_thermal', testMethod: '2-38: Z/AD', powerConsumptionkW: 7.8 },
  { equipment: 'combined_vibration_thermal', testMethod: '2-78: Cab', powerConsumptionkW: 7.1 },
  // Vibration Tests on Combined Machine:
  { equipment: 'combined_vibration_thermal', testMethod: '2-6: Fc(sinusoidal)', powerConsumptionkW: 8.2 },
  { equipment: 'combined_vibration_thermal', testMethod: '2-27: Ea(Shock)', powerConsumptionkW: 9.8 },
  { equipment: 'combined_vibration_thermal', testMethod: '2-64: Fh(random)', powerConsumptionkW: 8.8 },
  // NOTE: Thermal shock ('2-14: Na') typically requires a dedicated chamber. Assume it cannot run on the combined one.

  // === Custom / None ===
  // For 'none' standard, power is input manually, so no mock data needed here.

];
// --- End Mock Data ---

/**
 * Asynchronously retrieves equipment power consumption for a given test method and equipment.
 * This function finds the power consumption for a *single* test method run on the specified equipment.
 * For combined tests, call this function for each part and sum the results in the calling component.
 *
 * @param testMethod The specific test method string (e.g., '2-1: A').
 * @param equipment The equipment type identifier (e.g., 'thermal_chamber').
 * @returns A promise that resolves to the equipment power consumption data.
 * @throws Error if no matching data is found.
 */
export async function getEquipmentPowerConsumption(
  testMethod: string,
  equipment: string
): Promise<EquipmentPowerConsumption> {
  // Simulate async operation (like reading a file or DB query)
  await new Promise(resolve => setTimeout(resolve, 30)); // Small delay

  // Find matching data in the mock store
  const foundData = mockPowerData.find(
    (item) => item.testMethod === testMethod && item.equipment === equipment
  );

  if (foundData) {
    return foundData;
  } else {
    // Fallback or Error Handling:
    console.error(`No power consumption data found for Equipment: ${equipment}, Method: ${testMethod}`);

    // Check common misconfigurations
    if (testMethod === '2-14: Na' && equipment === 'combined_vibration_thermal') {
         throw new Error(`Thermal Shock (2-14: Na) typically requires a dedicated 'Thermal Shock Chamber', not the combined equipment.`);
    }
    if (equipment === 'thermal_shock_chamber' && !testMethod.includes('2-14: Na')) {
         throw new Error(`The 'Thermal Shock Chamber' is primarily for method 2-14: Na.`);
    }

    // Generic error
    throw new Error(`Power consumption data not available for the selected configuration (${equipment} / ${testMethod}). Please check the data source or select compatible options.`);
  }
}

// TODO: Implement actual CSV parsing logic if required.
// The parsing logic should handle the new method strings (e.g., '2-1: A')
// and potentially map them to power values based on the equipment column.