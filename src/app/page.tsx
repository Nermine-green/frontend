// src/app/page.tsx
'use client';

import * as React from 'react';
import type { FieldPath } from 'react-hook-form'; 
import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import './page.css';
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
import { predictMaintenanceCosts, type PredictMaintenanceCostsInput, type PredictMaintenanceCostsOutput } from '@/ai/flows/predict-maintenance-costs'; // Added PredictMaintenanceCostsInput
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
import { Label } from '@/components/ui/label'; // Ensure Label is imported
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Thermometer, Zap, TrendingUp, Leaf, Euro, Wrench, Droplets, Activity, Layers, Asterisk, ShieldCheck, Settings, Sun } from 'lucide-react'; // Added ShieldCheck, Settings, Sun
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Use next/navigation for app directory

// --- Constants ---
const LOCATION = 'Tunisia';
const ELECTRICITY_COST_PER_KWH = 0.135; // euro/kWh
const EMISSION_FACTOR_KGCO2_PER_KWH = 0.58; // kg CO₂/kWh
const FIXED_COSTS_RH = 210; // euros per test
const FIXED_COSTS_TRANSPORT = 150; // euros per test
const INITIAL_RECOVERY_TEMP = 25; // °C

// --- Type Definitions ---
type TestType = 'thermal' | 'thermal_shock' | 'vibration' | 'combined';
type Standard = 'IEC 60068' | 'none';
type ThermalMethod = '2-1: A' | '2-2: B' | '2-14: Nb' | '2-30: Db' | '2-38: Z/AD' | '2-78: Cab';
type ThermalShockMethod = '2-14: Na';
type VibrationMethod = '2-6: Fc(sinusoidal)' | '2-27: Ea(Shock)' | '2-64: Fh(random)';
type CombinedMethod = ThermalMethod | ThermalShockMethod | VibrationMethod; // Simplified combined approach
type Equipment = 'thermal_chamber' | 'thermal_shock_chamber' | 'vibrating_pot' | 'combined_vibration_thermal';
type Variant = '1' | '2';
type VibrationAxis = 'horizontal' | 'vertical';


// --- Options ---
const testTypeOptions: { value: TestType; label: string; icon?: React.ReactNode }[] = [
  { value: 'thermal', label: 'Thermal', icon: <Thermometer className="h-4 w-4 text-red-500" /> },
  { value: 'thermal_shock', label: 'Thermal Shock', icon: <Thermometer className="h-4 w-4 text-yellow-500" /> },
  { value: 'vibration', label: 'Vibration', icon: <Activity className="h-4 w-4 text-purple-500" /> },
  { value: 'combined', label: 'Combined (Thermal + Vibration)', icon: <Layers className="h-4 w-4 text-blue-500" /> },
];

const standardOptions: { value: Standard; label: string }[] = [
  { value: 'IEC 60068', label: 'IEC 60068' },
  { value: 'none', label: 'None / Custom' },
];

const thermalMethods: { value: ThermalMethod; label: string }[] = [
  { value: '2-1: A', label: '2-1: A (Cold)' },
  { value: '2-2: B', label: '2-2: B (Dry Heat)' },
  { value: '2-14: Nb', label: '2-14: Nb (Change of temp.)' },
  { value: '2-30: Db', label: '2-30: Db (Damp heat, cyclic)' },
  { value: '2-38: Z/AD', label: '2-38: Z/AD (Temp/humidity cyclic)' },
  { value: '2-78: Cab', label: '2-78: Cab (Damp heat, steady)' },
];

const thermalShockMethods: { value: ThermalShockMethod; label: string }[] = [
  { value: '2-14: Na', label: '2-14: Na (Thermal Shock)' },
];

const vibrationMethods: { value: VibrationMethod; label: string }[] = [
  { value: '2-6: Fc(sinusoidal)', label: '2-6: Fc (Sinusoidal)' },
  { value: '2-27: Ea(Shock)', label: '2-27: Ea (Shock)' },
  { value: '2-64: Fh(random)', label: '2-64: Fh (Random)' },
];

// Combined methods will reuse thermal/vibration methods but will be selected twice
const combinedMethods: { value: CombinedMethod; label: string }[] = [
    ...thermalMethods, ...thermalShockMethods, ...vibrationMethods
];

const equipmentOptions: { value: Equipment; label: string }[] = [
  { value: 'thermal_chamber', label: 'Thermal Chamber' },
  { value: 'thermal_shock_chamber', label: 'Thermal Shock Chamber' },
  { value: 'vibrating_pot', label: 'Vibrating Pot' },
  { value: 'combined_vibration_thermal', label: 'Combined Vibrating Pot + Thermal Chamber' },
];

const tempOptions = (min: number, max: number, step: number) => {
  const options = [];
  for (let temp = min; temp <= max; temp += step) {
    options.push({ value: temp.toString(), label: `${temp}°C` });
  }
  return options;
};

const rateOptions = (min: number, max: number, step: number) => {
  const options = [];
  for (let rate = min; rate <= max; rate += step) {
    options.push({ value: rate.toString(), label: `${rate}°C/min` });
  }
  return options;
};

const variantOptions: { value: Variant; label: string }[] = [
  { value: '1', label: 'Variant 1' },
  { value: '2', label: 'Variant 2' },
];

const vibrationAxisOptions: { value: VibrationAxis; label: string }[] = [
    { value: 'horizontal', label: 'Horizontal'},
    { value: 'vertical', label: 'Vertical'},
];

// --- Zod Schema ---
// Base schema common to all test types
const baseSchema = z.object({
  testType: z.enum(['thermal', 'thermal_shock', 'vibration', 'combined']),
  standard: z.enum(['IEC 60068', 'none']),
  equipment: z.string({ required_error: "Please select equipment." }).min(1, "Please select equipment."),
  initialTemp: z.literal(INITIAL_RECOVERY_TEMP).optional(),
  recoveryTemp: z.literal(INITIAL_RECOVERY_TEMP).optional(),
  historicalCsvContent: z.string().optional().describe("Plain text content of the historical maintenance CSV"),
  customPowerKw: z.coerce.number().positive("Power must be positive").optional(),
  humidity: z.coerce.number().optional(), // Added humidity field
});

// Schema specific to Thermal tests
const thermalSchema = baseSchema.extend({
  testType: z.literal('thermal'),
  method: z.enum(['2-1: A', '2-2: B', '2-14: Nb', '2-30: Db', '2-38: Z/AD', '2-78: Cab'], { required_error: "Method is required" }),
  lowTemp: z.coerce.number().optional(),
  highTemp: z.coerce.number().optional(),
  rateOfChange: z.coerce.number().optional(),
  variant: z.enum(['1', '2']).optional(),
  durationHours: z.coerce.number().min(1, "Minimum duration is 1 hour").optional(),
  durationCycles: z.coerce.number().min(1, "Minimum 1 cycle").optional(),
});

// Schema specific to Thermal Shock tests
const thermalShockSchema = baseSchema.extend({
  testType: z.literal('thermal_shock'),
  method: z.literal('2-14: Na', { required_error: "Method 2-14: Na is required" }),
  lowTemp: z.coerce.number({ required_error: "Low Temperature is required" }),
  highTemp: z.coerce.number({ required_error: "High Temperature is required" }),
  durationHours: z.coerce.number().min(1, "Minimum duration is 1 hour"), // Mandatory for Na
});

// Schema specific to Vibration tests
const vibrationSchema = baseSchema.extend({
  testType: z.literal('vibration'),
  method: z.enum(['2-6: Fc(sinusoidal)', '2-27: Ea(Shock)', '2-64: Fh(random)'], { required_error: "Method is required" }),
  vibrationAxis: z.enum(['horizontal', 'vertical'], { required_error: "Vibration axis is required" }),
  durationHours: z.coerce.number().min(0.1, "Minimum duration is 0.1 hours"), // Assuming duration needed for all vibration
});

// Schema for Combined tests
const combinedSchema = baseSchema.extend({
  testType: z.literal('combined'),
  equipment: z.literal('combined_vibration_thermal', { required_error: "Combined equipment is required for combined tests" }), // Force combined equipment
  // Part 1 (e.g., Thermal)
  method1: z.string({ required_error: "First method is required" }).min(1, "First method is required"),
  lowTemp1: z.coerce.number().optional(),
  highTemp1: z.coerce.number().optional(),
  rateOfChange1: z.coerce.number().optional(),
  variant1: z.enum(['1', '2']).optional(),
  durationHours1: z.coerce.number().min(0.1).optional(), // Allow flexible min duration
  durationCycles1: z.coerce.number().min(1).optional(),
  // Part 2 (e.g., Vibration)
  method2: z.string({ required_error: "Second method is required" }).min(1, "Second method is required"),
  vibrationAxis2: z.enum(['horizontal', 'vertical']).optional(), // Axis only needed if method2 is vibration
  durationHours2: z.coerce.number().min(0.1).optional(), // Allow flexible min duration
});

// Discriminated union based on testType and refinement for method-specific fields
const formSchema = z.discriminatedUnion('testType', [
  thermalSchema,
  thermalShockSchema,
  vibrationSchema,
  combinedSchema,
]).superRefine((data, ctx) => {
    // --- Thermal Refinements ---
    if (data.testType === 'thermal' && data.standard === 'IEC 60068') {
        switch (data.method) {
            case '2-1: A':
                if (data.lowTemp === undefined || data.lowTemp === null) {
                    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Low Temperature is required", path: ['lowTemp'] });
                }
                if (!data.durationHours || data.durationHours < 1) {
                    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Duration (min 1 hour) is required", path: ['durationHours'] });
                }
                break;
            case '2-2: B':
                if (data.highTemp === undefined || data.highTemp === null) {
                    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "High Temperature is required", path: ['highTemp'] });
                }
                if (!data.durationHours || data.durationHours < 1) {
                    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Duration (min 1 hour) is required", path: ['durationHours'] });
                }
                break;
            case '2-14: Nb':
                if (data.lowTemp === undefined || data.lowTemp === null) {
                    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Low Temperature is required", path: ['lowTemp'] });
                }
                if (data.highTemp === undefined || data.highTemp === null) {
                    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "High Temperature is required", path: ['highTemp'] });
                }
                 if (data.rateOfChange === undefined || data.rateOfChange === null) {
                    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Rate of Change is required", path: ['rateOfChange'] });
                }
                if (!data.durationHours || data.durationHours < 1) {
                    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Duration (min 1 hour) is required", path: ['durationHours'] });
                }
                break;
            case '2-30: Db':
                if (![55, 40].includes(data.highTemp ?? 0)) {
                     ctx.addIssue({ code: z.ZodIssueCode.custom, message: "High Temperature must be 55°C or 40°C", path: ['highTemp'] });
                }
                if (!data.variant) {
                    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Variant is required", path: ['variant'] });
                }
                if (!data.durationCycles || data.durationCycles < 1) {
                    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Duration (min 1 cycle) is required", path: ['durationCycles'] });
                }
                break;
            case '2-38: Z/AD':
                 if (![30, 40, 65].includes(data.highTemp ?? 0)) {
                    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "High Temperature must be 30°C, 40°C or 65°C", path: ['highTemp'] });
                }
                 // Low temp is fixed, no input validation needed, but maybe set default if useful
                if (!data.durationCycles || data.durationCycles < 10) {
                    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Duration (min 10 cycles) is required", path: ['durationCycles'] });
                }
                break;
            case '2-78: Cab':
                if (![30, 40, 65].includes(data.highTemp ?? 0)) {
                     ctx.addIssue({ code: z.ZodIssueCode.custom, message: "High Temperature must be 30°C, 40°C or 65°C", path: ['highTemp'] });
                }
                 if (!data.durationHours || data.durationHours < 1) { // Assuming min 1 hour, adjust if needed
                    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Duration (min 1 hour) is required", path: ['durationHours'] });
                }
                break;
        }
    }
    // --- Thermal Shock Refinements (already handled by schema) ---
    // --- Vibration Refinements (already handled by schema) ---

    // --- Combined Refinements ---
    if (data.testType === 'combined' && data.standard === 'IEC 60068') {
        const isMethod1Vibration = vibrationMethods.some(m => m.value === data.method1);
        const isMethod2Vibration = vibrationMethods.some(m => m.value === data.method2);

        // Example: ensure vibrationAxis2 is provided if method2 is a vibration method
        if (isMethod2Vibration && !data.vibrationAxis2) {
             ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Vibration axis is required for the second method", path: ['vibrationAxis2'] });
        }
        // Add more specific refinements for combined parts based on selected methods if necessary
        // Need to know the requirements for duration calculation (concurrent? sequential?)
         if (!data.durationHours1 && !data.durationCycles1) {
             ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Duration for Method 1 is required (hours or cycles)", path: ['durationHours1'] });
        }
         if (!data.durationHours2) {
            // If method 2 requires cycles (like 2-30), this needs adjustment
             ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Duration for Method 2 (hours) is required", path: ['durationHours2'] });
        }
    }

    // --- Custom Test Refinements ---
    if (data.standard === 'none') {
        if (data.customPowerKw === undefined || data.customPowerKw === null) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Estimated Power is required for custom tests", path: ['customPowerKw'] });
        }
        if (data.testType !== 'combined' && !(data as any).durationHours) { // Check durationHours on non-combined schemas
             ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Duration (Hours) is required for custom tests", path: ['durationHours'] });
        }
         // Handle custom combined duration - needs clarification on how combined custom duration works
         if (data.testType === 'combined' && (!data.durationHours1 || !data.durationHours2)) {
             // Assuming hours are needed for both parts in custom combined
              if (!data.durationHours1) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Duration 1 (Hours) required for custom combined", path: ['durationHours1'] });
              if (!data.durationHours2) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Duration 2 (Hours) required for custom combined", path: ['durationHours2'] });
         }
    }
});


type FormValues = z.infer<typeof formSchema> & {
  lowTemp2?: number; // Add this line to support form.setValue('lowTemp2', -10)
};


// --- Component ---
export default function Home() {
  const { toast } = useToast();
  const router = useRouter();
  const [role, setRole] = useState<'user' | 'admin' | null>(null);
  const [maintenanceTasksTotal, setMaintenanceTasksTotal] = useState(0); // Add this line

  // Only ONE useForm call!
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      standard: 'IEC 60068', // Default standard
      initialTemp: INITIAL_RECOVERY_TEMP,
      recoveryTemp: INITIAL_RECOVERY_TEMP,
      // Initialize number fields that can be optional to undefined or a default number
      lowTemp: undefined,
      highTemp: undefined,
      rateOfChange: undefined,
      durationHours: undefined,
      durationCycles: undefined,
      lowTemp1: undefined,
      highTemp1: undefined,
      rateOfChange1: undefined,
      durationHours1: undefined,
      durationCycles1: undefined,
      durationHours2: undefined,
      customPowerKw: undefined,
      historicalCsvContent: undefined, // Initialize CSV content
    },
    mode: 'onChange', // Validate on change for better UX
  });

  // Watchers must come after useForm
  const method = form.watch('method' as any);
  const method1 = form.watch('method1');
  const method2 = form.watch('method2');
  const standard = form.watch('standard');

  useEffect(() => {
    if (method === '2-38: Z/AD' && standard === 'IEC 60068') {
      form.setValue('lowTemp', -10);
    }
    // For combined, handle method1/method2 if needed
    if (method1 === '2-38: Z/AD' && standard === 'IEC 60068') {
      form.setValue('lowTemp1', -10);
    }
    if (method2 === '2-38: Z/AD' && standard === 'IEC 60068') {
      form.setValue('lowTemp2', -10);
    }
  }, [method, method1, method2, standard, form]);

  // Client-side redirect if no token
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken');
      if (!token) {
        router.push('/login');
      }

      // Assume role is stored in localStorage as 'userRole'
      const userRole = localStorage.getItem('userRole') as 'user' | 'admin' | null;
      setRole(userRole || 'user'); // Default to 'user' if not set

      // Read maintenanceTasksTotal from localStorage and set state
      const maintTotal = localStorage.getItem('maintenanceTasksTotal');
      setMaintenanceTasksTotal(maintTotal ? parseFloat(maintTotal) : 0);
    }
  }, [router]);

  const [results, setResults] = useState<CostCalculationResult | null>(null);
  const [maintenancePrediction, setMaintenancePrediction] = useState<PredictMaintenanceCostsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const testType = form.watch('testType');
  // standard, method, method1, method2 already declared above
  const historicalCsvContent = form.watch('historicalCsvContent'); // Watch csv content for results display

  // Determine equipment suitability based on test type and method
  const suitableEquipmentOptions = React.useMemo(() => {
    if (!testType) return [];

    switch (testType) {
      case 'thermal':
        // All thermal methods use thermal chamber, some can use combined
        return equipmentOptions.filter(e => e.value === 'thermal_chamber' || e.value === 'combined_vibration_thermal');
      case 'thermal_shock':
        // Method 2-14 Na requires a dedicated shock chamber
        return equipmentOptions.filter(e => e.value === 'thermal_shock_chamber');
      case 'vibration':
        // All vibration methods use vibrating pot, some can use combined
        return equipmentOptions.filter(e => e.value === 'vibrating_pot' || e.value === 'combined_vibration_thermal');
      case 'combined':
        // Combined tests MUST use the combined equipment
        return equipmentOptions.filter(e => e.value === 'combined_vibration_thermal');
      default:
        return []; // Should not happen
    }
  }, [testType]);

  // Reset equipment if it becomes unsuitable when testType/method changes, or force combined
  useEffect(() => {
    const currentEquipment = form.getValues('equipment');
    const isCombined = form.getValues('testType') === 'combined';

    if (isCombined && currentEquipment !== 'combined_vibration_thermal') {
      form.setValue('equipment', 'combined_vibration_thermal');
    } else if (!isCombined && currentEquipment && !suitableEquipmentOptions.some(opt => opt.value === currentEquipment)) {
      form.resetField('equipment');
    }
  }, [suitableEquipmentOptions, form]);

  // Update fetchPowerFromCsv to return full backend response
  async function fetchPowerFromCsv(params: Record<string, any>): Promise<{ power_kw: number, energy_consumption_kwh: number, energy_cost_eur: number }> {
    // Stringify all values except duration/durationHours
    const payload: Record<string, any> = {};
    for (const [k, v] of Object.entries(params)) {
      if (k === "duration" || k === "durationHours" || k === "csv_file") {
        payload[k] = v;
      } else if (v !== undefined && v !== null) {
        payload[k] = typeof v === "string" ? v : String(v);
      }
    }
    const response = await fetch('http://localhost:8000/api/calculate-energy/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to fetch power from CSV');
    const data = await response.json();
    // Return all relevant fields
    return {
      power_kw: data.power_kw ?? 0,
      energy_consumption_kwh: data.energy_consumption_kwh ?? 0,
      energy_cost_eur: data.energy_cost_eur ?? 0,
    };
  }

  // --- Helper Functions ---
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Read file content as text and store in form state
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        form.setValue('historicalCsvContent', text, { shouldValidate: true }); // Set content and validate
      };
      reader.onerror = (e) => {
          console.error("Failed to read file:", e);
          toast({
             title: "File Read Error",
             description: "Could not read the selected CSV file.",
             variant: "destructive",
          });
          setSelectedFile(null);
          form.setValue('historicalCsvContent', undefined, { shouldValidate: true }); // Clear on error
      }
      reader.readAsText(file);
    } else {
      setSelectedFile(null);
      form.setValue('historicalCsvContent', undefined, { shouldValidate: true }); // Clear if file removed
    }
  };

  // Calculate total duration in hours based on form values
   const getDurationInHours = (values: FormValues): number => {
     if (values.standard === 'none') {
         if (values.testType === 'combined') {
            // Assume max duration for custom combined if both provided
            return Math.max(values.durationHours1 ?? 0, values.durationHours2 ?? 0);
         }
         return (values as any).durationHours ?? 0; // durationHours exists on non-combined custom
     }

     switch (values.testType) {
       case 'thermal':
         if (values.method === '2-30: Db') {
           return (values.durationCycles ?? 0) * 24; // Cycles to hours
         }
         if (values.method === '2-38: Z/AD') {
           return (values.durationCycles ?? 0) * 24; // FIX: 1 cycle = 24h, not 240h
         }
         return values.durationHours ?? 0;
       case 'thermal_shock':
         return values.durationHours ?? 0; // Always hours
       case 'vibration':
         return values.durationHours ?? 0; // Always hours
       case 'combined':
         // For combined IEC tests, calculate duration for each part and take the maximum
         let duration1 = 0;
         if (values.method1 === '2-30: Db'&& values.durationCycles1) {
             duration1 = values.durationCycles1 * 24;
         } 
         if (values.method1 === '2-38: Z/AD' && values.durationCycles1) {
             duration1 = values.durationCycles1 * 24; // FIX: 1 cycle = 24h
         } 
         else if (values.durationHours1) {
             duration1 = values.durationHours1;
         }

         let duration2 = 0;
         // Assuming method2 in combined is likely vibration (hours) or a thermal (hours/cycles)
         if (values.method2 === '2-30: Db' && (values as any).durationCycles2) {
              duration2 = (values as any).durationCycles2 * 24;
         } 
         if (values.method2 === '2-38: Z/AD' && (values as any).durationCycles2) {
              duration2 = (values as any).durationCycles2 * 24; // FIX: 1 cycle = 24h
         } 
         else if (values.durationHours2) {
              duration2 = values.durationHours2;
         }

         return Math.max(duration1, duration2); // Assume concurrent execution, take the longer duration
       default:
         return 0;
     }
   };


  // --- Form Submission ---
  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    setResults(null);
    setMaintenancePrediction(null);
    console.log("Form Values Submitted:", values); // Debug log

    // Explicitly check validation status before proceeding
    const isValid = await form.trigger(); // Trigger validation for all fields
     if (!isValid) {
        toast({
            title: "Validation Error",
            description: "Please check the form for errors before submitting.",
            variant: "destructive",
        });
        setIsLoading(false);
        return; // Stop submission if validation fails
     }

    try {
      const durationHours = getDurationInHours(values);
      if (durationHours <= 0) {
          // This validation might be redundant if the zod schema covers it, but good as a safeguard
          form.setError("root", { type: "manual", message: "Invalid test duration calculated. Check hour/cycle inputs." });
          throw new Error("Invalid test duration calculated.");
      }

      let totalPowerConsumptionkW = 0;
      let backendEnergyKwh = 0;
      let backendEnergyCost = 0;

      if (values.standard === 'none') {
        totalPowerConsumptionkW = values.customPowerKw ?? 0;
        if (totalPowerConsumptionkW <= 0) {
          form.setError("customPowerKw", { type: "manual", message: "Custom power must be positive." });
          throw new Error("Invalid custom power input.");
        }
        backendEnergyKwh = totalPowerConsumptionkW * durationHours;
        backendEnergyCost = backendEnergyKwh * ELECTRICITY_COST_PER_KWH;
      } else if (values.testType === 'combined') {
           // Fetch power for both parts and sum them up
             if (!values.method1 || !values.method2) {
                 throw new Error("Methods for combined test are not fully selected.");
             }
            const [power1Data, power2Data] = await Promise.all([
                 getEquipmentPowerConsumption(values.method1, values.equipment),
                 getEquipmentPowerConsumption(values.method2, values.equipment)
            ]);
            totalPowerConsumptionkW = power1Data.powerConsumptionkW + power2Data.powerConsumptionkW;
            backendEnergyKwh = totalPowerConsumptionkW * durationHours;
            backendEnergyCost = backendEnergyKwh * ELECTRICITY_COST_PER_KWH;
      } else {
            // Build csvParams based on selected method and test type
            let csvParams: Record<string, any> = {};
            switch (values.method) {
              case '2-1: A':
                csvParams = {
                  csv_file: '2-1_test.csv', // Only filename, backend knows the folder
                  'Test Type': 'thermal',
                  'Standard': values.standard,
                  'Method': values.method,
                  'Initial Temp (°C)': INITIAL_RECOVERY_TEMP,
                  'Recovery Temp (°C)': INITIAL_RECOVERY_TEMP,
                  'Low Temp (°C)': Number(values.lowTemp), // Ensure this is a number
                  'Power (kW)': undefined, // backend will extract this
                  duration: durationHours,
                };
                break;
              case '2-2: B':
                csvParams = {
                  csv_file: '2-2_test.csv', // Only filename, backend knows the folder
                  'Test Type': 'thermal',
                  'Standard': values.standard,
                  'Method': values.method,
                  'Initial Temp (°C)': INITIAL_RECOVERY_TEMP,
                  'Recovery Temp (°C)': INITIAL_RECOVERY_TEMP,
                  'High Temp (°C)': Number(values.highTemp),
                  'Power (kW)': undefined,
                  duration: durationHours,
                };
                break;
              case '2-14: Na':
                csvParams = {
                  csv_file: '2-14-Na_test.csv', // Only filename, backend knows the folder
                  'Test Type': 'thermal_shock',
                  'Standard': values.standard,
                  'Method': values.method,
                  'Initial Temp (°C)': INITIAL_RECOVERY_TEMP,
                  'Recovery Temp (°C)': INITIAL_RECOVERY_TEMP,
                  'Low Temp (°C)': Number(values.lowTemp),
                  'High Temp (°C)': Number(values.highTemp),
                  'Power (kW)': undefined,
                  duration: durationHours,
                };
                break;
              case '2-14: Nb':
                csvParams = {
                  csv_file: '2-14-Nb_test.csv', // Only filename, backend knows the folder
                  'Test Type': 'thermal',
                  'Standard': values.standard,
                  'Method': values.method,
                  'Initial Temp (°C)': INITIAL_RECOVERY_TEMP,
                  'Recovery Temp (°C)': INITIAL_RECOVERY_TEMP,
                  'Low Temp (°C)': Number(values.lowTemp),
                  'High Temp (°C)': Number(values.highTemp),
                  'Rate of change (°C/min)': Number(values.rateOfChange),
                  'Power (kW)': undefined,
                  duration: durationHours,
                };
                break;
              case '2-30: Db':
                csvParams = {
                  csv_file: '2-30_test.csv', // Only filename, backend knows the folder
                  'Test Type': 'thermal',
                  'Standard': values.standard,
                  'Method': values.method,
                  'Initial Temp (°C)': INITIAL_RECOVERY_TEMP,
                  'Recovery Temp (°C)': INITIAL_RECOVERY_TEMP,
                  'High Temp (°C)': Number(values.highTemp),
                  'Variant': values.variant,
                  'Power (kW) per 24h': undefined,
                  duration: durationHours,
                };
                break;
              case '2-38: Z/AD':
                csvParams = {
                  csv_file: '2-38_test.csv', // Only filename, backend knows the folder
                  'Test Type': 'thermal',
                  'Standard': values.standard,
                  'Method': values.method,
                  'Initial Temp (°C)': INITIAL_RECOVERY_TEMP,
                  'Recovery Temp (°C)': INITIAL_RECOVERY_TEMP,
                  'Low Temp (°C)': -10,
                  'High Temp (°C)': Number(values.highTemp),
                  'Power (kW) per 240h': undefined,
                  duration: durationHours,
                };
                break;
              case '2-78: Cab':
                csvParams = {
                  csv_file: '2-78_test.csv', // Only filename, backend knows the folder
                  'Test Type': 'thermal',
                  'Standard': values.standard,
                  'Method': values.method,
                  'Initial Temp (°C)': INITIAL_RECOVERY_TEMP,
                  'Recovery Temp (°C)': INITIAL_RECOVERY_TEMP,
                  'High Temp (°C)': Number(values.highTemp),
                  'Humidity (%)': Number(values.humidity),
                  'Power (kW)': undefined,
                  duration: durationHours,
                };
                break;
              default:
                throw new Error("Unknown method selected.");
            }

            // Remove undefined fields (except for Power columns, which backend expects)
            Object.keys(csvParams).forEach(
              (key) => csvParams[key] === undefined && !key.toLowerCase().includes('power') && delete csvParams[key]
            );

            // Fetch from backend and use backend's energy/cost
            const backendResult = await fetchPowerFromCsv(csvParams);
            // Log all backend values
            console.log("Backend result:", backendResult);
            totalPowerConsumptionkW = backendResult.power_kw;
            backendEnergyKwh = backendResult.energy_consumption_kwh;
            backendEnergyCost = backendResult.energy_cost_eur;
       }


      // Define fixed costs based on equipment
      let equipmentHourlyCost = 0;
      switch (values.equipment) {
        case 'thermal_chamber': equipmentHourlyCost = 5; break;
        case 'thermal_shock_chamber': equipmentHourlyCost = 7.5; break;
        case 'vibrating_pot': equipmentHourlyCost = 100; break;
        case 'combined_vibration_thermal': equipmentHourlyCost = 105; break;
        default:
          equipmentHourlyCost = 10;
      }

      // --- Use maintenanceTasksTotal from state (filled from Maintenance Task Cost interface) ---
      const fixedCosts: FixedCosts = {
        rh: FIXED_COSTS_RH,
        transport: FIXED_COSTS_TRANSPORT,
        equipmentHourly: equipmentHourlyCost,
        maintenanceTasksTotal: maintenanceTasksTotal, // <--- Use value from Maintenance Task Cost
      };

      // Placeholder for age factor - no equipmentAgeYears, so always 1
      const ageFactor = 1;

      // Use backendEnergyKwh and backendEnergyCost in results
      const calculatedResults = {
        ...calculateCosts(
          durationHours,
          totalPowerConsumptionkW,
          ELECTRICITY_COST_PER_KWH,
          EMISSION_FACTOR_KGCO2_PER_KWH,
          fixedCosts,
          ageFactor
        ),
        // Override with backend values
        energyConsumptionkWh: backendEnergyKwh,
        energyCost: backendEnergyCost,
      };

      setResults(calculatedResults);

      // --- Predictive Maintenance ---
      let maintenancePredictionResult: PredictMaintenanceCostsOutput | null = null;
      // Use only historicalCsvContent for prediction
      if (values.historicalCsvContent) {
        try {
           const equipmentLabel = equipmentOptions.find(e => e.value === values.equipment)?.label || values.equipment;

           const predictionInput: PredictMaintenanceCostsInput = {
              historicalCsvContent: values.historicalCsvContent,
              equipmentType: equipmentLabel,
              equipmentAgeYears: 1, // Provide a default or calculated value as needed
           };
           console.log("Calling AI prediction with:", predictionInput); // Log AI input
          maintenancePredictionResult = await predictMaintenanceCosts(predictionInput);
          setMaintenancePrediction(maintenancePredictionResult);
        } catch (aiError: any) {
          console.error("AI Prediction Error:", aiError);
          // Check for specific error details if available
          const errorDetails = aiError?.cause?.message || aiError.message || 'Unknown AI error';
          toast({
            title: "AI Prediction Error",
            description: `Could not predict maintenance costs: ${errorDetails}`,
            variant: "destructive",
          });
        }
      }

      toast({
        title: 'Calculation Successful',
        description: 'Costs and environmental impact have been calculated.',
      });
    } catch (error: any) {
      console.error('Calculation failed:', error);
       // Use Zod validation errors first if they exist
       const formErrors = Object.values(form.formState.errors);
       if (formErrors.length > 0) {
           // Error handled by form validation messages
       } else if (error.message) {
          // Show other errors (e.g., API fetch, calculation logic) via toast
          toast({
              title: 'Calculation Failed',
              description: error.message,
              variant: 'destructive',
          });
       } else {
           // Generic fallback
           toast({
              title: 'An Unexpected Error Occurred',
              description: 'Please try again or contact support.',
              variant: 'destructive',
           });
       }
    } finally {
      setIsLoading(false);
    }
  }

   // --- Helper function to handle number input changes ---
  const handleNumberInputChange = (
    field: any, // react-hook-form field object
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    // Allow empty string (which becomes undefined), or parse as number
    const numericValue = value === '' ? undefined : parseFloat(value);
    // Only update if it's a valid number or undefined (for clearing)
    if (value === '' || !isNaN(numericValue as number)) {
      field.onChange(numericValue);
    }
    // No 'else' needed: if input is invalid (e.g., "abc"), keep the current value.
    // The user must manually correct the input. Zod validation will catch it on submit.
  };


  // --- Conditional Rendering Logic for Method Specific Fields ---
    const renderMethodSpecificFields = (
        methodValue: string | undefined,
        isCombinedPart: boolean = false, // Flag for combined test parts
        partNumber: 1 | 2 = 1 // Indicates if it's for method1 or method2 in combined
    ) => {
        if (!methodValue || standard === 'none') return <></>;

        // Helper to generate field names dynamically for combined parts
        const name = (fieldName: string): FieldPath<FormValues> => {
             if (!isCombinedPart) return fieldName as FieldPath<FormValues>;
             // Construct field names like 'lowTemp1', 'durationHours2' etc.
             const baseName = fieldName as keyof Omit<FormValues, 'testType' | 'standard' | 'equipment' | 'initialTemp' | 'recoveryTemp' | 'historicalCsvContent' | 'customPowerKw' | 'method'>; // Type assertion might be needed
             return `${baseName}${partNumber}` as FieldPath<FormValues>;
        };

        const lowTempName = name("lowTemp");
        const highTempName = name("highTemp");
        const rateName = name("rateOfChange");
        const variantName = name("variant");
        const hoursName = name("durationHours");
        const cyclesName = name("durationCycles");
        const axisName = name("vibrationAxis"); // Needs adjustment for combined part 2 below


        // Common temperature props (fixed) - Rendered conditionally within each case for layout flexibility
        const initialTempField = (
            <FormItem key={`initialTemp-${partNumber}`}>
              <FormLabel>Initial Temperature</FormLabel>
              <FormControl>
                 <Input type="text" value={`${INITIAL_RECOVERY_TEMP}°C`} readOnly className="bg-muted cursor-default" />
              </FormControl>
            </FormItem>
        );
        const recoveryTempField = (
            <FormItem key={`recoveryTemp-${partNumber}`}>
              <FormLabel>Recovery Temperature</FormLabel>
              <FormControl>
                 <Input type="text" value={`${INITIAL_RECOVERY_TEMP}°C`} readOnly className="bg-muted cursor-default" />
              </FormControl>
            </FormItem>
        );


    switch (methodValue) {
      // --- Thermal Methods ---
      case '2-1: A':
        return (
          <>
             {initialTempField}
             {recoveryTempField}
            <FormField control={form.control} name={lowTempName} key={`${lowTempName}-${partNumber}`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Low Temperature *</FormLabel>
                  <Select onValueChange={(v) => field.onChange(Number(v))} value={field.value?.toString() ?? ''}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select Low Temp" /></SelectTrigger></FormControl>
                    <SelectContent>{tempOptions(-65, -10, 5).map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem> )} />
            <FormField control={form.control} name={hoursName} key={`${hoursName}-${partNumber}`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (Hours) *</FormLabel>
                  <FormControl><Input type="number" min="1" step="0.1" placeholder="Min 1 hour" {...field} value={field.value ?? ''} onChange={(e) => handleNumberInputChange(field, e)}/></FormControl>
                  <FormMessage />
                </FormItem> )} />
          </>
        );
      case '2-2: B':
        return (
          <>
             {initialTempField}
             {recoveryTempField}
             <FormField control={form.control} name={highTempName} key={`${highTempName}-${partNumber}`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>High Temperature *</FormLabel>
                  <Select onValueChange={(v) => field.onChange(Number(v))} value={field.value?.toString() ?? ''}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select High Temp" /></SelectTrigger></FormControl>
                    <SelectContent>{tempOptions(40, 120, 5).map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem> )} />
            <FormField control={form.control} name={hoursName} key={`${hoursName}-${partNumber}`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (Hours) *</FormLabel>
                  <FormControl><Input type="number" min="1" step="0.1" placeholder="Min 1 hour" {...field} value={field.value ?? ''} onChange={(e) => handleNumberInputChange(field, e)}/></FormControl>
                  <FormMessage />
                </FormItem> )} />
          </>
        );
        case '2-14: Nb': // Thermal change of temp
        return (
          <>
             {initialTempField}
             {recoveryTempField}
             <FormField control={form.control} name={lowTempName} key={`${lowTempName}-${partNumber}`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Low Temperature *</FormLabel>
                  <Select onValueChange={(v) => field.onChange(Number(v))} value={field.value?.toString() ?? ''}>
                     <FormControl><SelectTrigger><SelectValue placeholder="Select Low Temp" /></SelectTrigger></FormControl>
                     <SelectContent>{tempOptions(-65, 10, 5).map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem> )} />
             <FormField control={form.control} name={highTempName} key={`${highTempName}-${partNumber}`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>High Temperature *</FormLabel>
                  <Select onValueChange={(v) => field.onChange(Number(v))} value={field.value?.toString() ?? ''}>
                     <FormControl><SelectTrigger><SelectValue placeholder="Select High Temp" /></SelectTrigger></FormControl>
                     <SelectContent>{tempOptions(40, 120, 5).map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem> )} />
             <FormField control={form.control} name={rateName} key={`${rateName}-${partNumber}`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rate of Change (°C/min) *</FormLabel>
                  <Select onValueChange={(v) => field.onChange(Number(v))} value={field.value?.toString() ?? ''}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select Rate" /></SelectTrigger></FormControl>
                    <SelectContent>{rateOptions(1, 20, 1).map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem> )} />
            <FormField control={form.control} name={hoursName} key={`${hoursName}-${partNumber}`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (Hours) *</FormLabel>
                  <FormControl><Input type="number" min="1" step="0.1" placeholder="Min 1 hour" {...field} value={field.value ?? ''} onChange={(e) => handleNumberInputChange(field, e)}/></FormControl>
                  <FormMessage />
                </FormItem> )} />
          </>
        );
        case '2-14: Na': // Thermal Shock
        // Note: This case should only appear if testType is 'thermal_shock' or potentially as part of 'combined'
        // The main form structure handles rendering this under 'thermal_shock',
        // If used in 'combined', ensure `isCombinedPart` is true.
        return (
          <>
             {initialTempField}
             {recoveryTempField}
             <FormField control={form.control} name={lowTempName} key={`${lowTempName}-${partNumber}`} // Ensure key uniqueness
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Low Temperature *</FormLabel>
                   <Select onValueChange={(v) => field.onChange(Number(v))} value={field.value?.toString() ?? ''}>
                     <FormControl><SelectTrigger><SelectValue placeholder="Select Low Temp" /></SelectTrigger></FormControl>
                     <SelectContent>{tempOptions(-65, 10, 5).map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                   </Select>
                  <FormMessage />
                </FormItem> )} />
             <FormField control={form.control} name={highTempName} key={`${highTempName}-${partNumber}`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>High Temperature *</FormLabel>
                   <Select onValueChange={(v) => field.onChange(Number(v))} value={field.value?.toString() ?? ''}>
                     <FormControl><SelectTrigger><SelectValue placeholder="Select High Temp" /></SelectTrigger></FormControl>
                     <SelectContent>{tempOptions(40, 120, 5).map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                   </Select>
                  <FormMessage />
                </FormItem> )} />
            <FormField control={form.control} name={hoursName} key={`${hoursName}-${partNumber}`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (Hours) *</FormLabel>
                  <FormControl><Input type="number" min="1" step="0.1" placeholder="Min 1 hour" {...field} value={field.value ?? ''} onChange={(e) => handleNumberInputChange(field, e)}/></FormControl>
                  <FormMessage />
                </FormItem> )} />
          </>
        );
      case '2-30: Db':
        return (
          <>
             {initialTempField}
             {recoveryTempField}
            <FormField control={form.control} name={highTempName} key={`${highTempName}-${partNumber}`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>High Temperature *</FormLabel>
                  <Select onValueChange={(v) => field.onChange(Number(v))} value={field.value?.toString() ?? ''}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select High Temp" /></SelectTrigger></FormControl>
                    <SelectContent>
                        <SelectItem value="55">55°C</SelectItem>
                        <SelectItem value="40">40°C</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem> )} />
             <FormField control={form.control} name={variantName} key={`${variantName}-${partNumber}`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variant *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value !== undefined ? String(field.value) : ''}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select Variant" /></SelectTrigger></FormControl>
                    <SelectContent>{variantOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem> )} />
            <FormField control={form.control} name={cyclesName} key={`${cyclesName}-${partNumber}`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (Cycles) *</FormLabel>
                  <FormControl><Input type="number" min="1" step="1" placeholder="Min 1 cycle" {...field} value={field.value ?? ''} onChange={(e) => handleNumberInputChange(field, e)}/></FormControl>
                  <FormDescription>1 cycle = 24 hours</FormDescription>
                  <FormMessage />
                </FormItem> )} />
          </>
        );
      case '2-38: Z/AD':
        return (
          <>
             {initialTempField}
             {recoveryTempField}
             <FormField control={form.control} name={highTempName} key={`${highTempName}-${partNumber}`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>High Temperature *</FormLabel>
                  <Select onValueChange={(v) => field.onChange(Number(v))} value={field.value?.toString() ?? ''}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select High Temp" /></SelectTrigger></FormControl>
                    <SelectContent>
                        <SelectItem value="30">30°C</SelectItem>
                        <SelectItem value="40">40°C</SelectItem>
                        <SelectItem value="65">65°C</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem> )} />
            <FormItem key={`lowTempDisplay-${partNumber}`}>
                <FormLabel>Low Temperature</FormLabel>
                <FormControl>
                    <Input type="text" value="-10°C" readOnly className="bg-muted cursor-default" />
                </FormControl>
                <FormDescription>(Fixed for this method)</FormDescription>
            </FormItem>
            {/* Hidden input to store the fixed value for validation/submission */}
            <Controller
                name={lowTempName}
                control={form.control}
                defaultValue={-10}
                render={({ field }) => <input type="hidden" {...field} value={field.value ?? -10} />} // Ensure value is not undefined
            />
            <FormField control={form.control} name={cyclesName} key={`${cyclesName}-${partNumber}`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (Cycles) *</FormLabel>
                  <FormControl><Input type="number" min="10" step="1" placeholder="Min 10 cycles" {...field} value={field.value ?? ''} onChange={(e) => handleNumberInputChange(field, e)}/></FormControl>
                  <FormDescription>Min 10 cycles (5 cooling, 5 non-cooling). 1 cycle ≈ 24h.</FormDescription>
                  <FormMessage />
                </FormItem> )} />
          </>
        );
      

      case '2-78: Cab':
        return (
          <>
             {initialTempField}
             {recoveryTempField}
             <FormField control={form.control} name={highTempName} key={`${highTempName}-${partNumber}`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>High Temperature *</FormLabel>
                  <Select onValueChange={(v) => field.onChange(Number(v))} value={field.value?.toString() ?? ''}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select High Temp" /></SelectTrigger></FormControl>
                    <SelectContent>
                        <SelectItem value="30">30°C</SelectItem>
                        <SelectItem value="40">40°C</SelectItem>
                        <SelectItem value="65">65°C</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem> )} />
            <FormField control={form.control} name={hoursName} key={`${hoursName}-${partNumber}`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (Hours) *</FormLabel>
                  <FormControl><Input type="number" min="1" step="0.1" placeholder="Min 1 hour" {...field} value={field.value ?? ''} onChange={(e) => handleNumberInputChange(field, e)}/></FormControl>
                  <FormMessage />
                </FormItem> )} />
          </>
        );

       // --- Vibration Methods ---
       case '2-6: Fc(sinusoidal)':
       case '2-27: Ea(Shock)':
       case '2-64: Fh(random)':
        // Determine the correct field name for vibration axis based on context
        const currentAxisName = isCombinedPart && partNumber === 2 ? 'vibrationAxis2' : 'vibrationAxis';
        return (
            <>
                 <FormField control={form.control} name={currentAxisName as FieldPath<FormValues>} key={`${currentAxisName}-${partNumber}`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vibration Axis *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value !== undefined ? String(field.value) : ''}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select Axis" /></SelectTrigger></FormControl>
                        <SelectContent>{vibrationAxisOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem> )} />
                <FormField control={form.control} name={hoursName} key={`${hoursName}-${partNumber}`} // Duration field name based on combined part or not
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (Hours) *</FormLabel>
                      <FormControl><Input type="number" min="0.1" step="0.1" placeholder="Min 0.1 hours" {...field} value={field.value ?? ''} onChange={(e) => handleNumberInputChange(field, e)}/></FormControl>
                      <FormMessage />
                    </FormItem> )} />
            </>
        );


      default:
        return <p className="text-sm text-muted-foreground">Select a method to see specific options.</p>;
    }
  };


  // --- JSX ---
  return (
    <div
      className="container mx-auto p-4 md:p-8 min-h-screen flex flex-col page-background"
    >


      {/* Navbar */}
      {role === 'admin' ? (
        // --- Vertical Navbar for Admin ---
        <aside className="fixed left-0 top-0 h-full w-56 bg-white border-r border-b2dfdb flex flex-col z-40">
          <div className="p-6 border-b border-b2dfdb">
            <h2 className="text-2xl font-bold mb-2">Admin Panel</h2>
            <p className="text-xs text-muted-foreground">ACTIA Engineering Services</p>
          </div>
          <nav className="flex-1 flex flex-col gap-2 p-4">
            <Button variant="link" asChild className="justify-start btn-black-white">
              <Link href="/admin/dashboard">Dashboard</Link>
            </Button>
            <Button variant="link" asChild className="justify-start btn-black-white">
              <Link href="/admin/tests">Manage Tests</Link>
            </Button>
            <Button variant="link" asChild className="justify-start btn-black-white">
              <Link href="/admin/maintenance">Maintenance Records</Link>
            </Button>
            <Button variant="link" asChild className="justify-start btn-black-white">
              <Link href="/admin/users">User Management</Link>
            </Button>
            {/* Add more admin links as needed */}
            <Button
              variant="link"
              className="justify-start text-destructive"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('authToken');
                  localStorage.removeItem('userRole');
                  localStorage.removeItem('username');
                  localStorage.removeItem('email');
                }
          
                router.push('/login');
              }}
            >
              Logout
            </Button>
          </nav>
        </aside>
      ) : (
        // --- Horizontal Navbar for User ---
        <header className="mb-8 text-center">
        <h1 className="text-8xl font-bold text-primary mb-2 flex items-center justify-center gap-2">
                   IEC 60068-2 Testing Costs
          </h1>
          <p className="text-lg text-muted-foreground">
            Quantitative Assessment of Costs and Environmental Impact in Product Resilience Testing at ACTIA ES.
          </p>
          <p className="text-lg text-muted-foreground">
            Visit the "Test Preparation" page to fill all required informations there first.
          </p>
          <div className="mt-4 space-x-4 flex justify-center">
            <Button variant="link" asChild className="btn-black-white">
              <Link href="/maintenance">Test Preparation costs Calculator</Link>
            </Button>
            <Button
              variant="link"
              className="btn-black-white"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('authToken');
                  localStorage.removeItem('userRole');
                  localStorage.removeItem('username');
                  localStorage.removeItem('email');
                }
                router.push('/login');
              }}
            >
              Logout
            </Button>
          </div>
         
        </header>
      )}

      <div className={role === 'admin' ? "grid grid-cols-1 lg:grid-cols-3 gap-8 ml-56" : "grid grid-cols-1 lg:grid-cols-3 gap-8"}>
        {/* Input Form Column */}
        <div className="mt-6 flex flex-col items-center">
          <Card
            className="shadow-lg w-full max-w-xl"
            style={{
              background: '#ffffff', // white
              borderColor: '#b2dfdb', // light green border
              borderWidth: 1,
            }}
          >
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
                        <Select onValueChange={(value: TestType) => {
                            field.onChange(value);
                            // Reset fields dependent on test type
                             form.reset({
                                // Keep fields that should persist across type changes
                                historicalCsvContent: form.getValues('historicalCsvContent'),
                                // Explicitly reset fields that ARE dependent on testType
                                testType: value as FormValues['testType'], // Type assertion ensures compatibility
                                standard: 'IEC 60068',
                                initialTemp: INITIAL_RECOVERY_TEMP,
                                recoveryTemp: INITIAL_RECOVERY_TEMP,
                                equipment: undefined,
                                method: undefined,
                                method1: undefined,
                                method2: undefined,
                                lowTemp: undefined,
                                highTemp: undefined,
                                rateOfChange: undefined,
                                variant: undefined,
                                durationHours: undefined,
                                durationCycles: undefined,
                                vibrationAxis: undefined,
                                lowTemp1: undefined,
                                highTemp1: undefined,
                                rateOfChange1: undefined,
                                variant1: undefined,
                                durationHours1: undefined,
                                durationCycles1: undefined,
                                vibrationAxis2: undefined,
                                durationHours2: undefined,
                                customPowerKw: undefined,
                            } as Partial<FormValues>, {
                                keepErrors: false,
                                keepDirty: true,
                                keepValues: false,
                            });
                            setSelectedFile(null); // Clear selected file display if resetting
                        }} value={field.value ?? ''}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select test type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {testTypeOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center gap-2">
                                  {option.icon || <Asterisk className="h-4 w-4 text-muted-foreground"/>} {option.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                   {/* Standard */}
                   {testType && (
                        <FormField
                            control={form.control}
                            name="standard"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Standard</FormLabel>
                                <Select onValueChange={(value) => {
                                     field.onChange(value);
                                     // Reset method and related fields when standard changes
                                     // Keep testType, file content
                                     form.reset({
                                         testType: form.getValues('testType') as FormValues['testType'],
                                         standard: value as Standard,
                                         initialTemp: INITIAL_RECOVERY_TEMP,
                                         recoveryTemp: INITIAL_RECOVERY_TEMP,
                                         historicalCsvContent: form.getValues('historicalCsvContent'),
                                         // Reset everything else related to method/params
                                         equipment: undefined,
                                         method: undefined,
                                         method1: undefined,
                                         method2: undefined,
                                         lowTemp: undefined,
                                         highTemp: undefined,
                                         rateOfChange: undefined,
                                         variant: undefined,
                                         durationHours: undefined,
                                         durationCycles: undefined,
                                         vibrationAxis: undefined,
                                         lowTemp1: undefined,
                                         highTemp1: undefined,
                                         rateOfChange1: undefined,
                                         variant1: undefined,
                                         durationHours1: undefined,
                                         durationCycles1: undefined,
                                         vibrationAxis2: undefined,
                                         durationHours2: undefined,
                                         customPowerKw: undefined,
                                     } as Partial<FormValues>, { keepErrors: false, keepDirty: true, keepValues: false });
                                 }} value={field.value ?? ''}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select Standard" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    {standardOptions.map(option => (
                                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                    ))}
                                </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    )}

                   {/* Method Selection (Conditional) */}
                    {testType && standard === 'IEC 60068' && testType !== 'combined' && (
                        <FormField
                            control={form.control}
                            name="method" // Generic name for single method
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Method</FormLabel>
                                <Select onValueChange={(value) => {
                                     field.onChange(value);
                                     // Reset specific fields when method changes, keep others
                                      form.reset({
                                        ...form.getValues(), // Keep existing values
                                        method: value, // Set the new method
                                        // Reset only params directly tied to the method choice
                                        lowTemp: undefined,
                                        highTemp: undefined,
                                        rateOfChange: undefined,
                                        variant: undefined,
                                        durationHours: undefined,
                                        durationCycles: undefined,
                                        vibrationAxis: undefined,
                                        // Do NOT reset combined fields here
                                      } as Partial<FormValues>, { keepErrors: false, keepDirty: true, keepValues: true }); // Keep other values

                                 }} value={field.value ?? ''} >
                                    <FormControl><SelectTrigger><SelectValue placeholder={`Select ${testType} method`} /></SelectTrigger></FormControl>
                                    <SelectContent>
                                    {testType === 'thermal' && thermalMethods.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                                    {testType === 'thermal_shock' && thermalShockMethods.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                                    {testType === 'vibration' && vibrationMethods.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                         />
                    )}

                    {/* Render method-specific fields for non-combined types */}
                     {testType && testType !== 'combined' && standard === 'IEC 60068' && method && (
                         <div className="space-y-4 pl-4 border-l-2 border-border ml-1">
                             {renderMethodSpecificFields(method)}
                         </div>
                     )}


                    {/* Combined Method Selection */}
                    {testType === 'combined' && standard === 'IEC 60068' && (
                        <>
                            {/* Method 1 Group */}
                            <Card className="p-4 border rounded-md bg-muted/30">
                                <Label className="font-semibold">Part 1 Configuration</Label>
                                <Separator className="my-2"/>
                                <FormField
                                    control={form.control}
                                    name="method1"
                                    render={({ field }) => (
                                        <FormItem className="mt-2">
                                        <FormLabel>Method 1 *</FormLabel>
                                        <Select onValueChange={(value) => {
                                             field.onChange(value);
                                              // Reset Part 1 specific fields
                                              form.reset({
                                                  ...form.getValues(),
                                                  method1: value,
                                                  lowTemp1: undefined,
                                                  highTemp1: undefined,
                                                  rateOfChange1: undefined,
                                                  variant1: undefined,
                                                  durationHours1: undefined,
                                                  durationCycles1: undefined,
                                                  // Don't reset vibrationAxis1 as it doesn't exist
                                              } as Partial<FormValues>, { keepErrors: false, keepDirty: true, keepValues: true });
                                        }} value={field.value ?? ''} >
                                            <FormControl><SelectTrigger><SelectValue placeholder="Select first method (e.g., Thermal)" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                {/* Allow selection from all relevant methods */}
                                                {combinedMethods.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                 {method1 && <div className="space-y-4 pl-4 border-l-2 border-border ml-1 mt-4">
                                    {renderMethodSpecificFields(method1, true, 1)}
                                 </div>}
                            </Card>

                            {/* Method 2 Group */}
                             <Card className="p-4 border rounded-md bg-muted/30">
                                 <Label className="font-semibold">Part 2 Configuration *</Label>
                                <Separator className="my-2"/>
                                <FormField
                                    control={form.control}
                                    name="method2"
                                    render={({ field }) => (
                                        <FormItem className="mt-2">
                                        <FormLabel>Method 2 *</FormLabel>
                                        <Select onValueChange={(value) => {
                                             field.onChange(value);
                                             // Reset Part 2 specific fields
                                              form.reset({
                                                  ...form.getValues(),
                                                  method2: value,
                                                  vibrationAxis2: undefined, // Reset axis if method changes
                                                  durationHours2: undefined, // Reset duration
                                                  // Add resets for temp/rate/variant if method2 can be thermal
                                                  // Assuming method2 won't need these, adjust if necessary
                                                  // lowTemp2: undefined,
                                                  // highTemp2: undefined,
                                                  // rateOfChange2: undefined,
                                                  // variant2: undefined,
                                                  // durationCycles2: undefined,
                                              } as Partial<FormValues>, { keepErrors: false, keepDirty: true, keepValues: true });
                                        }} value={field.value ?? ''}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Select second method (e.g., Vibration)" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                {/* Allow selection from all relevant methods */}
                                                {combinedMethods.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                {method2 && <div className="space-y-4 pl-4 border-l-2 border-border ml-1 mt-4">
                                    {renderMethodSpecificFields(method2, true, 2)}
                                 </div>}
                            </Card>
                        </>
                    )}


                    {/* Custom Configuration (if standard is 'none') */}
                    {standard === 'none' && testType && ( // Ensure testType is selected
                         <div className="p-4 border rounded-md bg-muted/50 space-y-4">
                             <p className="text-sm font-medium text-center">Tests Configuration</p>
                             <FormField
                                control={form.control}
                                name="customPowerKw"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Consumed Power (kW) *</FormLabel>
                                    <FormControl><Input type="number" step="0.1" placeholder="Enter power in kW" {...field} value={field.value ?? ''} onChange={(e) => handleNumberInputChange(field, e)}/></FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              {/* Conditional Duration Input for Custom */}
                               {testType !== 'combined' && (
                                    <FormField
                                        control={form.control}
                                        name="durationHours" // Use the standard durationHours field
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Duration (Hours) *</FormLabel>
                                            <FormControl><Input type="number" min="0.1" step="0.1" placeholder="Enter duration" {...field} value={field.value ?? ''} onChange={(e) => handleNumberInputChange(field, e)}/></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                               )}
                                {testType === 'combined' && (
                                     <>
                                         <FormField control={form.control} name="durationHours1"
                                            render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Part 1 Duration (Hours) *</FormLabel>
                                                <FormControl><Input type="number" min="0.1" step="0.1" placeholder="Duration 1" {...field} value={field.value ?? ''} onChange={(e) => handleNumberInputChange(field, e)}/></FormControl>
                                                <FormMessage />
                                            </FormItem> )} />
                                         <FormField control={form.control} name="durationHours2"
                                             render={({ field }) => (
                                             <FormItem>
                                                 <FormLabel>Part 2 Duration (Hours) *</FormLabel>
                                                 <FormControl><Input type="number" min="0.1" step="0.1" placeholder="Duration 2" {...field} value={field.value ?? ''} onChange={(e) => handleNumberInputChange(field, e)}/></FormControl>
                                                 <FormMessage />
                                             </FormItem> )} />
                                             <FormDescription>Total duration assumed as the maximum of Part 1 and Part 2.</FormDescription>
                                     </>
                                )}
                         </div>
                    )}

                  {/* Equipment */}
                  {testType && (
                     <FormField
                      control={form.control}
                      name="equipment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Equipment</FormLabel>
                          <Select
                              onValueChange={field.onChange}
                              value={field.value ?? ''}
                              // Disable selection if it's a combined test (forced) or if no options are suitable
                              disabled={testType === 'combined' || suitableEquipmentOptions.length === 0}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue
                                    placeholder={
                                        testType === 'combined'
                                        ? equipmentOptions.find(e => e.value === 'combined_vibration_thermal')?.label // Show combined label directly
                                        : suitableEquipmentOptions.length > 0
                                        ? "Select equipment"
                                        : "No suitable equipment available" // Updated message
                                    }
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                               {/* Always show suitable options, Select handles disabled state */}
                               {suitableEquipmentOptions.map((option) => (
                                 <SelectItem key={option.value} value={option.value}>
                                   {option.label}
                                 </SelectItem>
                               ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}


             
              
               

                  <Button type="submit" className="w-full btn-black-white" disabled={isLoading}>
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
                   {/* Display general form error (less common now with Zod refinements) */}
                    {form.formState.errors.root && (
                        <p className="text-sm text-destructive text-center mt-2">{form.formState.errors.root.message}</p>
                    )}
                   {/* Generic message if submit fails validation (less likely needed now) */}
                   {!form.formState.isValid && form.formState.isSubmitted && Object.keys(form.formState.errors).length > 0 && !form.formState.errors.root && (
                     <p className="text-sm text-destructive text-center mt-2">Please review the form for errors.</p>
                   )}
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* View Results Report Button */}
          <div className="flex justify-center mt-8">
            <Button
              className="btn-black-white"
              onClick={() => {
                // Save results to localStorage for the results page to access
                if (results) {
                  localStorage.setItem('testResults', JSON.stringify(results));
                  window.location.href = '/results'; // Use window.location for navigation to ensure client-side routing
                } else {
                  alert('Please calculate costs first.');
                }
              }}
              disabled={!results}
            >
              View Results Report
            </Button>
          </div>
          {/* Predictive Maintenance Results and Investment Suggestion remain here */}
          {/* ...existing code for Predictive Maintenance Results and Investment Suggestion... */}
        </div>
      </div>

       {/* Footer */}
       <footer className="mt-12 text-center text-sm footer-custom-color">
            <p>
              &copy; {new Date().getFullYear()} © Copyright  2025 Testing & Qualification Laboratory | Powered by ACTIA Engineering Services Tunisia.
            </p>
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
        <div
          className="flex items-center space-x-3 p-3 rounded-md border result-item-bg"
        >
            <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center result-item-icon">
                {icon}
            </div>
            <div>
                <p className="text-sm font-medium result-item-label">{label}</p>
                <p className="text-lg font-semibold result-item-value">{value}</p>
            </div>
        </div>
    );
}
