// src/ai/flows/predict-maintenance-costs.ts
'use server';
/**
 * @fileOverview Predicts future maintenance and fluid replacement costs based on historical data.
 *
 * - predictMaintenanceCosts - A function that predicts maintenance costs.
 * - PredictMaintenanceCostsInput - The input type for the predictMaintenanceCosts function.
 * - PredictMaintenanceCostsOutput - The return type for the predictMaintenanceCosts function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

// Define a maximum character limit for the CSV content to prevent excessively large inputs
const MAX_CSV_CHARS = 5000;


const PredictMaintenanceCostsInputSchema = z.object({
  historicalCsvContent: z
    .string()
    .describe(
      'The content of the historical maintenance CSV file as a plain text string. ' +
      'The CSV should contain details like dates, maintenance activities performed, costs incurred (specify currency if possible), parts replaced, and fluid replacements.'
    ),
  equipmentAgeYears: z
    .number()
    .describe('The age of the equipment in years.'),
  equipmentType: z
    .string()
    .describe('The type of equipment (e.g., Thermal Chamber, Vibrating Pot).'),
   // Optional: Add more context if available and useful for the AI
   // averageUsageHoursPerWeek: z.number().optional().describe('Estimated average weekly usage hours.'),
   // lastMajorOverhaulDate: z.string().optional().describe('Date of the last major overhaul (YYYY-MM-DD).'),
});
export type PredictMaintenanceCostsInput = z.infer<typeof PredictMaintenanceCostsInputSchema>;

const PredictMaintenanceCostsOutputSchema = z.object({
  predictedMaintenanceCost: z
    .number()
    .describe('The predicted total maintenance cost (excluding fluids) for the next year in Euros.'),
  fluidReplacementCost: z
    .number()
    .describe('The predicted cost specifically for fluid replacements in the next year in Euros.'),
  reliabilityScore: z
    .number()
    .min(0).max(100) // Ensure score is within range
    .describe("A score from 0 (very unreliable) to 100 (very reliable) representing the equipment's predicted reliability based on historical maintenance patterns and age."),
  suggestedMaintenanceActions: z
    .string()
    .describe('Specific, actionable maintenance suggestions to improve reliability and potentially reduce future costs (e.g., "Inspect vibration dampers quarterly", "Replace coolant filter based on usage").'),
});
export type PredictMaintenanceCostsOutput = z.infer<typeof PredictMaintenanceCostsOutputSchema>;

export async function predictMaintenanceCosts(
  input: PredictMaintenanceCostsInput
): Promise<PredictMaintenanceCostsOutput> {
  // Add basic validation or logging if needed before calling the flow
  console.log("Predicting maintenance costs for:", input.equipmentType, "Age:", input.equipmentAgeYears);
  // Log a snippet of the CSV content for debugging, avoiding excessively large logs
  console.log("CSV Content Snippet (Original Length:", input.historicalCsvContent.length, "):", input.historicalCsvContent.substring(0, 200) + (input.historicalCsvContent.length > 200 ? '...' : ''));
  return predictMaintenanceCostsFlow(input);
}

const predictMaintenanceCostsPrompt = ai.definePrompt({
  name: 'predictMaintenanceCostsPrompt',
  input: { schema: PredictMaintenanceCostsInputSchema }, // Use the full schema here
  output: { schema: PredictMaintenanceCostsOutputSchema }, // Use the full schema here
  prompt: `You are an AI expert specializing in predictive maintenance for laboratory testing equipment, focusing on cost prediction and reliability assessment.

  Analyze the provided historical maintenance data (CSV format), considering the equipment's specific type and age. Your goal is to predict future costs and provide actionable insights.
  If the provided historical data is truncated due to length limits, base your analysis on the available portion.

  **Input Data:**
  - Equipment Type: {{{equipmentType}}}
  - Equipment Age: {{{equipmentAgeYears}}} years
  - Historical Maintenance Data (CSV Content - may be truncated):
  \`\`\`csv
  {{{historicalCsvContent}}}
  \`\`\`

  **Analysis Task:**
  1.  **Predict Costs for Next Year:** Estimate the likely total maintenance cost (excluding fluid replacements) and the specific cost for fluid replacements in Euros (€).
  2.  **Assess Reliability:** Based on the frequency and nature of past issues, and the equipment's age, calculate a reliability score between 0 (very unreliable) and 100 (very reliable).
  3.  **Suggest Actions:** Provide concrete, specific maintenance actions tailored to this equipment type and its history. Focus on actions that enhance reliability or prevent costly failures. Examples: "Inspect [Specific Part] every X months," "Consider replacing [Component] proactively due to age/failure pattern," "Calibrate [Sensor] based on usage."

  **Output Format:**
  Provide the results strictly according to the defined output schema.
  `,
});


const predictMaintenanceCostsFlow = ai.defineFlow<
  typeof PredictMaintenanceCostsInputSchema,
  typeof PredictMaintenanceCostsOutputSchema
>(
  {
    name: 'predictMaintenanceCostsFlow',
    inputSchema: PredictMaintenanceCostsInputSchema,
    outputSchema: PredictMaintenanceCostsOutputSchema,
  },
  async (input) => {
    // Potential pre-processing: Could analyze the CSV data here first if needed,
    // e.g., calculate average time between failures, before sending to the LLM.

    // Truncate the CSV content if it exceeds the maximum character limit
    let truncatedCsvContent = input.historicalCsvContent;
    if (truncatedCsvContent.length > MAX_CSV_CHARS) {
        console.warn(`Historical CSV content exceeds ${MAX_CSV_CHARS} characters. Truncating input to AI model.`);
        truncatedCsvContent = truncatedCsvContent.substring(0, MAX_CSV_CHARS) + "\n... (data truncated)";
    }

    const processedInput = {
        ...input,
        historicalCsvContent: truncatedCsvContent,
    };


    // Pass the potentially truncated input to the prompt.
    const {output} = await predictMaintenanceCostsPrompt(processedInput);

    if (!output) {
        throw new Error("AI model failed to generate a valid prediction.");
    }

    // Potential post-processing: Validate or sanitize the output if necessary
    // e.g., ensure costs are non-negative. Zod schema handles basic type checks.

    return output;
  }
);
