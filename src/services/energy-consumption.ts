/**
 * Represents equipment power consumption data.
 */
export interface EquipmentPowerConsumption {
  /**
   * The equipment type (e.g., thermal chamber, vibrating pot).
   */
  equipment: string;
  /**
   * The test method (e.g., IEC 60068-2-1).
   */
  testMethod: string;
  /**
   * The power consumption in kW.
   */
  powerConsumptionkW: number;
}

// --- Mock Data Store ---
// In a real application, this would be loaded from a CSV file or database.
const mockPowerData: EquipmentPowerConsumption[] = [
  // Thermal Chamber Data (Example values - replace with actual CSV data)
  { equipment: 'thermal_chamber', testMethod: 'IEC 60068-2-1', powerConsumptionkW: 5.5 },
  { equipment: 'thermal_chamber', testMethod: 'IEC 60068-2-2', powerConsumptionkW: 6.0 },
  { equipment: 'thermal_chamber', testMethod: 'IEC 60068-2-14', powerConsumptionkW: 7.0 }, // Method 2-14 might use a different chamber or mode
  { equipment: 'thermal_chamber', testMethod: 'IEC 60068-2-30', powerConsumptionkW: 6.5 },
  { equipment: 'thermal_chamber', testMethod: 'IEC 60068-2-38', powerConsumptionkW: 7.5 },
  { equipment: 'thermal_chamber', testMethod: 'IEC 60068-2-78', powerConsumptionkW: 6.8 },

  // Thermal Shock Chamber Data
  { equipment: 'thermal_shock_chamber', testMethod: 'IEC 60068-2-14', powerConsumptionkW: 12.0 }, // Often higher power

  // Vibrating Pot Data
  { equipment: 'vibrating_pot', testMethod: 'IEC 60068-2-6', powerConsumptionkW: 8.0 },
  { equipment: 'vibrating_pot', testMethod: 'IEC 60068-2-27', powerConsumptionkW: 9.5 }, // Shock tests might spike power
  { equipment: 'vibrating_pot', testMethod: 'IEC 60068-2-64', powerConsumptionkW: 8.5 },

  // Combined Equipment Data
   { equipment: 'combined_vibration_thermal', testMethod: 'IEC 60068-2-6', powerConsumptionkW: 13.5 }, // Sum or slightly more than individual
   { equipment: 'combined_vibration_thermal', testMethod: 'IEC 60068-2-27', powerConsumptionkW: 15.0 },
   { equipment: 'combined_vibration_thermal', testMethod: 'IEC 60068-2-64', powerConsumptionkW: 14.0 },
   // Assume combined can also run thermal-only tests
   { equipment: 'combined_vibration_thermal', testMethod: 'IEC 60068-2-1', powerConsumptionkW: 5.8 }, // Potentially slightly higher idle load
   { equipment: 'combined_vibration_thermal', testMethod: 'IEC 60068-2-2', powerConsumptionkW: 6.3 },
   { equipment: 'combined_vibration_thermal', testMethod: 'IEC 60068-2-14', powerConsumptionkW: 7.5 },
   { equipment: 'combined_vibration_thermal', testMethod: 'IEC 60068-2-30', powerConsumptionkW: 6.8 },
   { equipment: 'combined_vibration_thermal', testMethod: 'IEC 60068-2-38', powerConsumptionkW: 7.8 },
   { equipment: 'combined_vibration_thermal', testMethod: 'IEC 60068-2-78', powerConsumptionkW: 7.1 },

];
// --- End Mock Data ---

/**
 * Asynchronously retrieves equipment power consumption for a given test method and equipment.
 * In a real application, this would parse a CSV or query a database.
 *
 * @param testMethod The test method.
 * @param equipment The equipment type identifier (e.g., 'thermal_chamber').
 * @returns A promise that resolves to the equipment power consumption data.
 * @throws Error if no matching data is found.
 */
export async function getEquipmentPowerConsumption(
  testMethod: string,
  equipment: string
): Promise<EquipmentPowerConsumption> {
  // Simulate async operation (like reading a file)
  await new Promise(resolve => setTimeout(resolve, 50)); // Small delay

  // Find matching data in the mock store
  const foundData = mockPowerData.find(
    (item) => item.testMethod === testMethod && item.equipment === equipment
  );

  if (foundData) {
    return foundData;
  } else {
    // Fallback or Error Handling:
    // Option 1: Return a default value
    // return { equipment, testMethod, powerConsumptionkW: 5.0 }; // Example default

    // Option 2: Throw an error
     console.error(`No power consumption data found for Equipment: ${equipment}, Method: ${testMethod}`);
     throw new Error(`Power consumption data not available for the selected configuration (${equipment} / ${testMethod}). Please check the data source or configuration.`);
  }
}

// TODO: Implement actual CSV parsing logic if required.
// Example (conceptual - would need a CSV parsing library like 'papaparse'):
// async function loadDataFromCSV() {
//   const response = await fetch('/path/to/your/power_consumption.csv');
//   const csvText = await response.text();
//   // Use a library like papaparse to parse csvText into an array of objects
//   // Store the parsed data in a variable similar to mockPowerData
// }
// Call loadDataFromCSV() when the application starts or when needed.
