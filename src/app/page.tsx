'use client';

import * as React from 'react';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  calculateCosts,
  type CostCalculationResult,
  type FixedCosts,
} from '@/lib/cost-calculator';
import {
  getEquipmentPowerConsumption,
  type EquipmentPowerConsumption,
} from '@/services/energy-consumption';
import { getEmissionFactor, type EmissionFactor } from '@/services/emission-factors';
import { getElectricityCost, type ElectricityCost } from '@/services/electricity-cost';
import { predictMaintenanceCosts, type PredictMaintenanceCostsOutput } from '@/ai/flows/predict-maintenance-costs';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Thermometer, Zap, TrendingUp, Leaf, Euro, Wrench, Droplets } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Textarea } from '@/components/ui/textarea'; // Added for file upload description

// Constants
const LOCATION = 'Tunisia';
const ELECTRICITY_COST_PER_KWH = 0.135; // euro/kWh
const EMISSION_FACTOR_KGCO2_PER_KWH = 0.58; // kg CO₂/kWh
const FIXED_COSTS_RH = 210; // euros per test
const FIXED_COSTS_TRANSPORT = 150; // euros per test

// Define test methods based on type
const thermalMethods = [
  { value: 'IEC 60068-2-1', label: 'IEC 60068-2-1 (Cold)' },
  { value: 'IEC 60068-2-2', label: 'IEC 60068-2-2 (Dry Heat)' },
  { value: 'IEC 60068-2-14', label: 'IEC 60068-2-14 (Change of temperature)' },
  { value: 'IEC 60068-2-30', label: 'IEC 60068-2-30 (Damp heat, cyclic)' },
  { value: 'IEC 60068-2-38', label: 'IEC 60068-2-38 (Composite temperature/humidity cyclic)' },
  { value: 'IEC 60068-2-78', label: 'IEC 60068-2-78 (Damp heat, steady state)' },
];

const vibrationMethods = [
  { value: 'IEC 60068-2-6', label: 'IEC 60068-2-6 (Vibration, sinusoidal)' },
  { value: 'IEC 60068-2-27', label: 'IEC 60068-2-27 (Shock)' },
  { value: 'IEC 60068-2-64', label: 'IEC 60068-2-64 (Vibration, broadband random)' },
];

const equipmentOptions = [
  { value: 'thermal_chamber', label: 'Thermal Chamber' },
  { value: 'thermal_shock_chamber', label: 'Thermal Shock Chamber' },
  { value: 'vibrating_pot', label: 'Vibrating Pot' },
  { value: 'combined_vibration_thermal', label: 'Combined Vibrating Pot + Thermal Chamber' },
];

// Define Zod schema for form validation
const formSchema = z.object({
  testType: z.enum(['thermal', 'vibration'], {
    required_error: 'Please select a test type.',
  }),
  testMethod: z.string({ required_error: 'Please select a test method.' }),
  equipment: z.string({ required_error: 'Please select equipment.' }),
  durationHours: z.coerce
    .number({ invalid_type_error: 'Duration must be a number.' })
    .min(0.1, { message: 'Duration must be at least 0.1 hours.' }),
  // Add fields for maintenance cost prediction
  historicalMaintenanceData: z.string().optional().describe("Base64 encoded historical maintenance data"),
  equipmentAgeYears: z.coerce.number().optional().describe("Age of the equipment in years"),
});

type FormValues = z.infer<typeof formSchema>;

export default function Home() {
  const { toast } = useToast();
  const [results, setResults] = useState<CostCalculationResult | null>(null);
  const [maintenancePrediction, setMaintenancePrediction] = useState<PredictMaintenanceCostsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      durationHours: 1,
    },
  });

  const testType = form.watch('testType');
  const equipment = form.watch('equipment');

  const availableMethods = testType === 'thermal' ? thermalMethods : vibrationMethods;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };


  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    setResults(null);
    setMaintenancePrediction(null);

    try {
      // Simulate fetching data (replace with actual async calls)
      const equipmentPowerPromise = getEquipmentPowerConsumption(
        values.testMethod,
        values.equipment
      );
      // const emissionFactorPromise = getEmissionFactor(LOCATION);
      // const electricityCostPromise = getElectricityCost(LOCATION);

      const [equipmentPower] = await Promise.all([
        equipmentPowerPromise,
        // emissionFactorPromise,
        // electricityCostPromise,
      ]);

       // Temporary static data until services are implemented
       const emissionFactor: EmissionFactor = { location: LOCATION, emissionFactorKgCO2PerKWh: EMISSION_FACTOR_KGCO2_PER_KWH };
       const electricityCost: ElectricityCost = { location: LOCATION, electricityCostEuroPerKWh: ELECTRICITY_COST_PER_KWH };


      // Define fixed costs based on equipment
      let equipmentHourlyCost = 0;
      switch (values.equipment) {
        case 'thermal_chamber':
          equipmentHourlyCost = 5;
          break;
        case 'thermal_shock_chamber':
          equipmentHourlyCost = 7.5;
          break;
        case 'vibrating_pot':
          equipmentHourlyCost = 100;
          break;
        case 'combined_vibration_thermal':
          equipmentHourlyCost = 105;
          break;
      }

      const fixedCosts: FixedCosts = {
        rh: FIXED_COSTS_RH,
        transport: FIXED_COSTS_TRANSPORT,
        equipmentHourly: equipmentHourlyCost,
      };

      const calculatedResults = calculateCosts(
        values.durationHours,
        equipmentPower.powerConsumptionkW,
        electricityCost.electricityCostEuroPerKWh,
        emissionFactor.emissionFactorKgCO2PerKWh,
        fixedCosts,
        // TODO: Add equipment age/condition factor for additional cost
        1 // Defaulting to 1 (no additional cost) for now
      );

      setResults(calculatedResults);

      // Predictive Maintenance Cost Analysis
      let maintenancePredictionResult: PredictMaintenanceCostsOutput | null = null;
      if (selectedFile && values.equipmentAgeYears) {
        try {
            const base64Data = await convertFileToBase64(selectedFile);
             maintenancePredictionResult = await predictMaintenanceCosts({
                historicalMaintenanceData: base64Data,
                equipmentAgeYears: values.equipmentAgeYears,
                equipmentType: equipmentOptions.find(e => e.value === values.equipment)?.label || values.equipment,
              });
              setMaintenancePrediction(maintenancePredictionResult);

        } catch(aiError) {
            console.error("AI Prediction Error:", aiError);
            toast({
                title: "AI Prediction Error",
                description: "Could not predict maintenance costs. Please check the console for details.",
                variant: "destructive",
            });
        }

      } else if (values.equipmentAgeYears || selectedFile) {
          toast({
            title: "Missing Information for Maintenance Prediction",
            description: "Please provide both equipment age and historical maintenance data (CSV file) for maintenance cost prediction.",
            variant: "destructive",
          });
      }


      toast({
        title: 'Calculation Successful',
        description: 'Costs and environmental impact have been estimated.',
      });
    } catch (error) {
      console.error('Calculation failed:', error);
      toast({
        title: 'Calculation Failed',
        description: 'An error occurred while calculating the costs. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-primary mb-2">EcoTest Insight</h1>
        <p className="text-lg text-muted-foreground">
          Estimate costs and environmental impact for your product resilience tests at ACTIA.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Form Column */}
        <div className="lg:col-span-1">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Test Configuration</CardTitle>
              <CardDescription>Enter the details of your test.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Test Type */}
                  <FormField
                    control={form.control}
                    name="testType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Test Type</FormLabel>
                        <Select onValueChange={(value) => {
                          field.onChange(value);
                          form.resetField('testMethod'); // Reset method when type changes
                          form.resetField('equipment'); // Reset equipment when type changes
                        }} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select test type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="thermal">
                              <div className="flex items-center gap-2">
                                <Thermometer className="h-4 w-4 text-red-500" /> Thermal
                              </div>
                            </SelectItem>
                            <SelectItem value="vibration">
                              <div className="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-activity"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> Vibration
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Test Method */}
                  {testType && (
                    <FormField
                      control={form.control}
                      name="testMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Test Method (IEC 60068)</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!testType}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={`Select ${testType} method`} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {availableMethods.map((method) => (
                                <SelectItem key={method.value} value={method.value}>
                                  {method.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Equipment */}
                   {testType && (
                    <FormField
                      control={form.control}
                      name="equipment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Equipment</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!testType}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select equipment" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {equipmentOptions.map((option) => {
                                // Basic filtering: Allow combined only if both types might be relevant (or always show)
                                // More specific filtering could be added based on method
                                let showOption = true;
                                if (testType === 'thermal' && option.value.includes('vibrating')) showOption = option.value === 'combined_vibration_thermal';
                                if (testType === 'vibration' && !option.value.includes('vibrating')) showOption = false;

                                return showOption ? (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ) : null;
                               })}

                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                   )}


                  {/* Duration */}
                  <FormField
                    control={form.control}
                    name="durationHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Test Duration (Hours)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="Enter duration in hours" {...field} />
                        </FormControl>
                        <FormDescription>
                          Minimum 0.1 hours.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                 {/* Predictive Maintenance Section */}
                 <Separator className="my-6" />
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Predictive Maintenance (Optional)</h3>
                     <FormField
                        control={form.control}
                        name="equipmentAgeYears"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Equipment Age (Years)</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="Enter equipment age" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                     <FormItem>
                        <FormLabel>Historical Maintenance Data (CSV)</FormLabel>
                         <FormControl>
                            <Input
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                            />
                        </FormControl>
                         <FormDescription>
                          Upload a CSV file with past maintenance activities, costs, and fluid replacements.
                        </FormDescription>
                         {selectedFile && <p className="text-sm text-muted-foreground mt-1">Selected: {selectedFile.name}</p>}
                        <FormMessage />
                      </FormItem>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Calculating...
                      </>
                    ) : (
                      'Calculate Costs'
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Cost & Energy Results */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="text-primary" /> Estimated Results
              </CardTitle>
              <CardDescription>Breakdown of estimated costs and energy consumption.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading && !results && (
                <div className="space-y-4">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-6 w-2/3" />
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-8 w-1/2 mt-4" />
                </div>
              )}
              {!isLoading && !results && (
                <p className="text-muted-foreground text-center py-8">
                  Enter test details and click "Calculate Costs" to see the results.
                </p>
              )}
              {results && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ResultItem icon={<Zap className="text-yellow-500" />} label="Energy Consumption" value={`${results.energyConsumptionkWh.toFixed(2)} kWh`} />
                    <ResultItem icon={<Euro className="text-green-600" />} label="Energy Cost" value={`€${results.energyCost.toFixed(2)}`} />
                    <ResultItem icon={<Wrench className="text-gray-500" />} label="Fixed Costs" value={`€${results.totalFixedCosts.toFixed(2)}`} />
                    {/* TODO: Add additional cost display */}
                     {/* <ResultItem icon={<TrendingUp className="text-red-500" />} label="Additional Cost (Aging)" value={`€${results.additionalCost.toFixed(2)}`} /> */}
                     <ResultItem icon={<Leaf className="text-accent" />} label="Carbon Footprint" value={`${results.carbonFootprintKgCO2.toFixed(2)} kg CO₂`} />
                  </div>
                  <Separator />
                   <div className="text-center pt-4">
                     <p className="text-lg font-semibold">Total Estimated Cost</p>
                     <p className="text-3xl font-bold text-primary">€{results.totalCost.toFixed(2)}</p>
                   </div>
                </>
              )}
            </CardContent>
          </Card>

           {/* Predictive Maintenance Results */}
           {(isLoading || maintenancePrediction || (form.formState.isSubmitted && (selectedFile || form.getValues('equipmentAgeYears')))) && ( // Show card if loading, has results, or form submitted with partial maintenance inputs
            <Card className="shadow-lg">
                <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="text-primary" /> Predictive Maintenance Analysis
                </CardTitle>
                <CardDescription>Insights based on historical data (if provided).</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                 {isLoading && !maintenancePrediction && (form.getValues('equipmentAgeYears') || selectedFile) && ( // Show skeleton only when loading and maintenance inputs exist
                     <div className="space-y-4">
                        <Skeleton className="h-6 w-1/2" />
                        <Skeleton className="h-6 w-1/2" />
                        <Skeleton className="h-6 w-1/4" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                 )}
                {!isLoading && !maintenancePrediction && form.formState.isSubmitted && (selectedFile || form.getValues('equipmentAgeYears')) && !(selectedFile && form.getValues('equipmentAgeYears')) && ( // Show message if submitted but missing data
                    <p className="text-muted-foreground text-center py-4">
                      Provide both equipment age and historical data for maintenance prediction.
                    </p>
                 )}
                 {!isLoading && !maintenancePrediction && !(selectedFile || form.getValues('equipmentAgeYears')) && ( // Show message if no maintenance input provided
                    <p className="text-muted-foreground text-center py-4">
                      Provide equipment age and historical data (CSV) for predictive analysis.
                    </p>
                 )}
                {maintenancePrediction && (
                    <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <ResultItem icon={<Euro className="text-orange-500" />} label="Predicted Maintenance Cost (Next Year)" value={`€${maintenancePrediction.predictedMaintenanceCost.toFixed(2)}`} />
                        <ResultItem icon={<Droplets className="text-blue-400" />} label="Predicted Fluid Replacement Cost (Next Year)" value={`€${maintenancePrediction.fluidReplacementCost.toFixed(2)}`} />
                        <ResultItem icon={
                             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield-check h-5 w-5 text-green-600"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
                        } label="Reliability Score" value={`${maintenancePrediction.reliabilityScore}/100`} />
                    </div>
                     <Separator className="my-4" />
                      <div>
                        <h4 className="font-semibold mb-2">Suggested Maintenance Actions:</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-line">{maintenancePrediction.suggestedMaintenanceActions}</p>
                      </div>
                    </>
                )}
                </CardContent>
            </Card>
          )}

          {/* Investment Suggestion */}
           {results && (
             <Card className="bg-accent/10 border-accent shadow-lg">
                <CardHeader>
                <CardTitle className="flex items-center gap-2 text-accent">
                    <Leaf /> Investment Opportunity: Go Solar!
                </CardTitle>
                <CardDescription className="text-accent-foreground/80">
                    See how investing in photovoltaic panels could significantly reduce your testing costs and environmental impact.
                </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                 <p>
                   By installing solar panels at our lab, the energy cost for your test (estimated at <span className="font-semibold">€{results.energyCost.toFixed(2)}</span>) could be potentially eliminated.
                 </p>
                  <p>
                    This also means a reduction in the carbon footprint (<span className="font-semibold">{results.carbonFootprintKgCO2.toFixed(2)} kg CO₂</span>), contributing to a greener testing process.
                  </p>
                   <Alert className="bg-background border-primary/50">
                        <Zap className="h-4 w-4 text-primary" />
                        <AlertTitle className="text-primary">Potential Savings</AlertTitle>
                        <AlertDescription>
                         Imagine reducing your total test cost towards <span className="font-bold">€{(results.totalCost - results.energyCost).toFixed(2)}</span>!
                         Partner with us for sustainable and cost-effective testing solutions.
                        </AlertDescription>
                    </Alert>

                </CardContent>
                 <CardFooter>
                    {/* Consider adding a link or contact info */}
                     <Button variant="outline" className="border-accent text-accent hover:bg-accent/20">Learn More About Our Green Initiatives</Button>
                 </CardFooter>
             </Card>
           )}
        </div>
      </div>

       <footer className="mt-12 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} EcoTest Insight - ACTIA Engineering Services Tunisia. All rights reserved.</p>
            {/* Add links if needed */}
            {/* <Link href="/privacy" className="hover:text-primary">Privacy Policy</Link> | <Link href="/terms" className="hover:text-primary">Terms of Service</Link> */}
       </footer>
    </div>
  );
}

// Helper component for displaying results
interface ResultItemProps {
    icon: React.ReactNode;
    label: string;
    value: string | number;
}

function ResultItem({ icon, label, value }: ResultItemProps) {
    return (
        <div className="flex items-center space-x-3 p-3 bg-secondary/50 rounded-md">
            <div className="flex-shrink-0">{icon}</div>
            <div>
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                <p className="text-lg font-semibold">{value}</p>
            </div>
        </div>
    );
}
