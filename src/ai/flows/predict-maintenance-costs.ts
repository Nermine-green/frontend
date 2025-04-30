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

const PredictMaintenanceCostsInputSchema = z.object({
  historicalMaintenanceData: z
    .string()
    .describe(
      'Historical maintenance data, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' + 
      'This data should include details about past maintenance activities, costs, and fluid replacements.'
    ),
  equipmentAgeYears: z
    .number()
    .describe('The age of the equipment in years.'),
  equipmentType: z
    .string()
    .describe('The type of equipment (e.g., thermal chamber, vibrating pot).'),
});
export type PredictMaintenanceCostsInput = z.infer<typeof PredictMaintenanceCostsInputSchema>;

const PredictMaintenanceCostsOutputSchema = z.object({
  predictedMaintenanceCost: z
    .number()
    .describe('The predicted maintenance cost for the next year in Euros.'),
  fluidReplacementCost: z
    .number()
    .describe('The predicted cost for fluid replacements in the next year in Euros.'),
  reliabilityScore: z
    .number()
    .describe("A score (0-100) representing the equipment's reliability based on historical maintenance."),
  suggestedMaintenanceActions: z
    .string()
    .describe('Suggested maintenance actions to improve reliability and reduce costs.'),
});
export type PredictMaintenanceCostsOutput = z.infer<typeof PredictMaintenanceCostsOutputSchema>;

export async function predictMaintenanceCosts(
  input: PredictMaintenanceCostsInput
): Promise<PredictMaintenanceCostsOutput> {
  return predictMaintenanceCostsFlow(input);
}

const predictMaintenanceCostsPrompt = ai.definePrompt({
  name: 'predictMaintenanceCostsPrompt',
  input: {
    schema: z.object({
      historicalMaintenanceData: z
        .string()
        .describe(
          'Historical maintenance data, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' + 
          'This data should include details about past maintenance activities, costs, and fluid replacements.'
        ),
      equipmentAgeYears: z
        .number()
        .describe('The age of the equipment in years.'),
      equipmentType: z
        .string()
        .describe('The type of equipment (e.g., thermal chamber, vibrating pot).'),
    }),
  },
  output: {
    schema: z.object({
      predictedMaintenanceCost: z
        .number()
        .describe('The predicted maintenance cost for the next year in Euros.'),
      fluidReplacementCost: z
        .number()
        .describe('The predicted cost for fluid replacements in the next year in Euros.'),
      reliabilityScore: z
        .number()
        .describe("A score (0-100) representing the equipment's reliability based on historical maintenance."),
      suggestedMaintenanceActions: z
        .string()
        .describe('Suggested maintenance actions to improve reliability and reduce costs.'),
    }),
  },
  prompt: `You are an AI assistant specializing in predicting maintenance costs for laboratory equipment. 

  Analyze the historical maintenance data provided, considering the equipment's age and type, to predict future costs. 

  Provide a reliability score based on the provided maintenance data.

  Suggest maintenance actions to improve reliability and reduce costs. 

  Historical Maintenance Data: {{media url=historicalMaintenanceData}}
  Equipment Age (Years): {{{equipmentAgeYears}}}
  Equipment Type: {{{equipmentType}}}

  Based on this data, predict the following:
  - Predicted Maintenance Cost (Euros):
  - Fluid Replacement Cost (Euros):
  - Reliability Score (0-100):
  - Suggested Maintenance Actions:
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
  async input => {
    const {output} = await predictMaintenanceCostsPrompt(input);
    return output!;
  }
);
