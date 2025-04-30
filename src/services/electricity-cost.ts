/**
 * Represents electricity cost data.
 */
export interface ElectricityCost {
  /**
   * The country or location.
   */
  location: string;
  /**
   * The electricity cost in euro/kWh.
   */
  electricityCostEuroPerKWh: number;
}

// --- Mock Data Store ---
// In a real application, this might be loaded from a config file or an external API/database.
const electricityCosts: { [key: string]: number } = {
  'Tunisia': 0.135,
  // Add other locations if needed in the future
  // 'France': 0.22,
  // 'Germany': 0.45,
};
// --- End Mock Data ---


/**
 * Asynchronously retrieves electricity cost for a given location.
 *
 * @param location The location (e.g., 'Tunisia'). Case-insensitive matching.
 * @returns A promise that resolves to the electricity cost.
 * @throws Error if the location is not found in the dataset.
 */
export async function getElectricityCost(location: string): Promise<ElectricityCost> {
    // Simulate async operation
   await new Promise(resolve => setTimeout(resolve, 20)); // Small delay

   const normalizedLocation = location.charAt(0).toUpperCase() + location.slice(1).toLowerCase(); // Simple normalization

   const cost = electricityCosts[normalizedLocation];

   if (cost !== undefined) {
     return {
       location: normalizedLocation, // Return the normalized name
       electricityCostEuroPerKWh: cost,
     };
   } else {
     console.error(`Electricity cost not found for location: ${location}`);
     throw new Error(`Electricity cost data is not available for ${location}.`);
   }
}

// TODO: Implement loading from a configuration file or API if needed.
