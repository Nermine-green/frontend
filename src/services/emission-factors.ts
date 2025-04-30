/**
 * Represents emission factor data.
 */
export interface EmissionFactor {
  /**
   * The country or location.
   */
  location: string;
  /**
   * The emission factor in kg CO2/kWh.
   */
  emissionFactorKgCO2PerKWh: number;
}

// --- Mock Data Store ---
// In a real application, this might be loaded from a config file or an external API/database.
const emissionFactors: { [key: string]: number } = {
  'Tunisia': 0.58,
  // Add other locations if needed in the future
  // 'France': 0.05,
  // 'Germany': 0.40,
};
// --- End Mock Data ---


/**
 * Asynchronously retrieves emission factor for a given location.
 *
 * @param location The location (e.g., 'Tunisia'). Case-insensitive matching.
 * @returns A promise that resolves to the emission factor.
 * @throws Error if the location is not found in the dataset.
 */
export async function getEmissionFactor(location: string): Promise<EmissionFactor> {
   // Simulate async operation
   await new Promise(resolve => setTimeout(resolve, 20)); // Small delay

   const normalizedLocation = location.charAt(0).toUpperCase() + location.slice(1).toLowerCase(); // Simple normalization

   const factor = emissionFactors[normalizedLocation];

   if (factor !== undefined) {
     return {
       location: normalizedLocation, // Return the normalized name
       emissionFactorKgCO2PerKWh: factor,
     };
   } else {
     console.error(`Emission factor not found for location: ${location}`);
     throw new Error(`Emission factor data is not available for ${location}.`);
   }
}

// TODO: Implement loading from a configuration file or API if needed.
