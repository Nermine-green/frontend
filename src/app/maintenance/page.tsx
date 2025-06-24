// src/app/maintenance/page.tsx
'use client';

import * as React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  RadioGroup,
  RadioGroupItem
} from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Check, ChevronRight, Circle, Euro, Settings, User, Clock, Bot } from 'lucide-react'; // Added icons
import Link from 'next/link';

// --- Constants ---
const EXTERN_HUMAN_COST_PER_HOUR = 26;
const INTERN_HUMAN_COST_PER_HOUR = 21.5;
const TRANSPORT_COST_PER_TEST = 150;

interface Machine {
  id: string;
  name: string;
  costPerHour: number;
}

const EXTERN_MACHINES: Machine[] = [
  { id: 'bs_350', name: 'BS chamber 350', costPerHour: 5 },
  { id: 'ts_120_ctr', name: 'Thermal shock chamber 120 CTR', costPerHour: 7.5 },
  { id: 'old_clim_1000', name: 'Old climatic chamber 1000', costPerHour: 5 },
  { id: 'excal_clim_1000', name: 'Excal climatic chamber 1000', costPerHour: 5 },
  { id: 'clim_512', name: 'climatic chamber 512', costPerHour: 5 },
  { id: 'clim_770', name: 'climatic chamber 770', costPerHour: 7.5 },
  { id: 'bia_chamber', name: 'BIA chamber', costPerHour: 5 },
  { id: 'votsh', name: 'Votsh', costPerHour: 5 },
  { id: 'excal_clim_514', name: 'Excal climatic chamber 514', costPerHour: 5 },
  { id: 'vib_40kn', name: 'Vibration pot 40KN', costPerHour: 105 },
  { id: 'vib_30kn', name: 'Vibration pot 30KN', costPerHour: 100 },
];

const INTERN_MACHINES: Machine[] = [
  { id: 'bs_350', name: 'BS chamber 350', costPerHour: 3 },
  { id: 'ts_120_ctr', name: 'Thermal shock chamber 120 CTR', costPerHour: 5.5 },
  { id: 'old_clim_1000', name: 'Old climatic chamber 1000', costPerHour: 3 },
  { id: 'excal_clim_1000', name: 'Excal climatic chamber 1000', costPerHour: 3 },
  { id: 'clim_512', name: 'climatic chamber 512', costPerHour: 3 },
  { id: 'clim_770', name: 'climatic chamber 770', costPerHour: 5.5 },
  { id: 'bia_chamber', name: 'BIA chamber', costPerHour: 3 },
  { id: 'votsh', name: 'Votsh', costPerHour: 3 },
  { id: 'excal_clim_514', name: 'Excal climatic chamber 514', costPerHour: 3 },
  { id: 'vib_40kn', name: 'Vibration pot 40KN', costPerHour: 45 },
  { id: 'vib_30kn', name: 'Vibration pot 30KN', costPerHour: 40 },
];

const maintenanceTasks = [
    "Visual inspection and proper functioning check (Start)", // Renamed slightly for clarity
    "Assembly + Wiring",
    "Programming + Simulated test",
    "Real test",
    "Disassembly + Unwiring",
    "Visual inspection and proper functioning check (End)" // Renamed slightly for clarity
];

export default function MaintenancePage() {
  // State for each task's details
  const [tasks, setTasks] = useState(
    maintenanceTasks.map(() => ({
      durationHours: '',
      taskType: null as 'human' | 'machine' | null,
      selectedMachineId: null as string | null,
      cost: null as number | null,
      error: null as string | null,
    }))
  );
  const [totalCost, setTotalCost] = useState<number | null>(null);
  const [includeTransport, setIncludeTransport] = useState<boolean>(true);
  // Add client type state: 'intern' | 'extern'
  const [clientType, setClientType] = useState<'intern' | 'extern'>('extern');

  // Handlers for each task
  const handleTaskDetailChange = (index: number, field: string, value: any) => {
    setTasks(prev =>
      prev.map((task, i) =>
        i === index ? { ...task, [field]: value, cost: null, error: null } : task
      )
    );
    setTotalCost(null);
  };

  const calculateAllCosts = () => {
    let sum = 0;
    const updatedTasks = tasks.map((task, idx) => {
      const duration = parseFloat(task.durationHours);
      let error = null;
      let cost = null;
      if (!task.durationHours || isNaN(duration) || duration <= 0) {
        error = 'Please enter a valid positive duration in hours.';
      } else if (!task.taskType) {
        error = 'Please select if the task is done by Human or Machine.';
      } else if (task.taskType === 'machine' && !task.selectedMachineId) {
        error = 'Please select a machine.';
      } else {
        if (task.taskType === 'human') {
          cost = HUMAN_COST_PER_HOUR * duration;
        } else if (task.taskType === 'machine') {
          const machine = machines.find(m => m.id === task.selectedMachineId);
          if (!machine) {
            error = 'Selected machine data not found.';
          } else {
            cost = machine.costPerHour * duration;
          }
        }
      }
      if (cost !== null) sum += cost;
      return { ...task, cost, error };
    });
    setTasks(updatedTasks);
    // Add transport cost only if selected
    const total = sum + (includeTransport ? TRANSPORT_COST_PER_TEST : 0);
    setTotalCost(total);

    // --- Save total to localStorage for EnerLab interface to use as fixed cost ---
    localStorage.setItem('maintenanceTasksTotal', total.toString());
    // Set a cookie to indicate maintenance is done (expires in 1 day)
    document.cookie = `maintenanceDone=true; path=/; max-age=86400`;
  };

  // Use machines and human cost based on clientType
  const machines = clientType === 'intern' ? INTERN_MACHINES : EXTERN_MACHINES;
  const HUMAN_COST_PER_HOUR = clientType === 'intern' ? INTERN_HUMAN_COST_PER_HOUR : EXTERN_HUMAN_COST_PER_HOUR;

  return (
    <div
      className="container mx-auto p-4 md:p-8 min-h-screen flex flex-col"
      style={{
        backgroundImage: "url('/assets/images/actia.webp')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Header */}
      <header className="mb-8 text-center">
        <h1 className="text-6xl font-bold text-primary mb-2 flex items-center justify-center gap-2">
            <Settings /> Tests Prepartion
        </h1>
        <p className="text-lg text-muted-foreground">
          Calculate the cost for specific Preparation tasks performed at ACTIA ES.
        </p>
        {/* Navigation Links */}
        <div className="mt-4 flex flex-col md:flex-row items-center justify-center gap-4">
         
          <Button variant="link" asChild className="btn-black-white">
            <Link href="/login">Logout</Link>
          </Button>
        </div>
      </header>
      
      {/* Project Description Field in a Card */}
      <div className="mt-6 flex flex-col items-center">
        <Card
          className="shadow-lg w-full max-w-xl"
          style={{
            background: '#ffffff',
            borderColor: '#b2dfdb',
            borderWidth: 1,
          }}
        >
          <CardHeader>
            <CardTitle className="text-lg">Project Description</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              id="test-description"
              className="w-full min-h-[80px] border rounded-md p-2 text-base"
              placeholder="Describe your project and its requirements...."
              // Optionally, you can add state to store this value if you want to use it elsewhere
            />
          </CardContent>
        </Card>
      </div>
      <div className="flex-grow">
        <Card className="w-full max-w-2xl mx-auto shadow-lg">
          <CardHeader>
            <CardTitle>Preparation Tasks Cost</CardTitle>
            <CardDescription>
              Fill in the details for all 6 tasks below. 
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Transport Cost Toggle */}
            <div className="mb-4 flex items-center gap-4">
              <Label htmlFor="transport-toggle" className="flex items-center gap-2">
                <input
                  id="transport-toggle"
                  type="checkbox"
                  checked={includeTransport}
                  onChange={e => setIncludeTransport(e.target.checked)}
                  className="mr-2"
                  title="Include transport cost"
                />
                Include Transport Cost (€{TRANSPORT_COST_PER_TEST}) 
                <span className="ml-2 text-xs text-muted-foreground">
                  (Uncheck if you don't need transport service)
                </span>
              </Label>
            </div>
            {/* Client Type Selection - moved here */}
            <div className="mb-6 flex flex-row items-center justify-center gap-8">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={clientType === 'intern'}
                  onChange={() => setClientType('intern')}
                  className="accent-primary"
                />
                <span className="font-bold">Intern Client</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={clientType === 'extern'}
                  onChange={() => setClientType('extern')}
                  className="accent-primary"
                />
                <span className="font-bold">Extern Client</span>
              </label>
            </div>
            {/* End Client Type Selection */}
            {maintenanceTasks.map((taskName, idx) => (
              <div key={taskName} className="border rounded-lg p-4 mb-2 bg-muted/50">
                <div className="font-semibold mb-2 flex items-center gap-2">
                  <Circle className="h-4 w-4 text-primary" /> Task {idx + 1}: {taskName}
                </div>
                {/* Duration */}
                <div className="space-y-2 mb-2">
                  <Label htmlFor={`duration-${idx}`} className="flex items-center gap-2">
                    <Clock className="h-4 w-4"/> Duration (Hours)
                  </Label>
                  <Input
                    id={`duration-${idx}`}
                    type="text"
                    placeholder="e.g., 2.5"
                    value={tasks[idx].durationHours}
                    onChange={e => handleTaskDetailChange(idx, 'durationHours', e.target.value)}
                  />
                </div>
                {/* Task Type */}
                <div className="space-y-2 mb-2">
                  <Label className="flex items-center gap-2">
                    <User className="h-4 w-4"/>/<Bot className="h-4 w-4"/> Task performed by:
                  </Label>
                  <RadioGroup
                    value={tasks[idx].taskType ?? ''}
                    onValueChange={val => handleTaskDetailChange(idx, 'taskType', val as 'human' | 'machine')}
                    className="flex flex-row gap-4 pt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="human" id={`human-${idx}`} />
                      <Label htmlFor={`human-${idx}`} className="font-normal">Human</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="machine" id={`machine-${idx}`} />
                      <Label htmlFor={`machine-${idx}`} className="font-normal">Machine</Label>
                    </div>
                  </RadioGroup>
                </div>
                {/* Machine Selection */}
                {tasks[idx].taskType === 'machine' && (
                  <div className="space-y-2 mb-2">
                    <Label htmlFor={`machine-select-${idx}`} className="flex items-center gap-2">
                      <Bot className="h-4 w-4"/> Select Machine
                    </Label>
                    <Select
                      value={tasks[idx].selectedMachineId ?? ''}
                      onValueChange={val => handleTaskDetailChange(idx, 'selectedMachineId', val)}
                    >
                      <SelectTrigger id={`machine-select-${idx}`}>
                        <SelectValue placeholder="Choose the machine used" />
                      </SelectTrigger>
                      <SelectContent>
                        {machines.map((machine) => (
                          <SelectItem key={machine.id} value={machine.id}>
                            {machine.name} (€{machine.costPerHour.toFixed(2)}/hour)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {/* Error */}
                {tasks[idx].error && (
                  <Alert variant="destructive" className="my-2">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{tasks[idx].error}</AlertDescription>
                  </Alert>
                )}
                {/* Cost for this task */}
                {tasks[idx].cost !== null && !tasks[idx].error && (
                  <div className="text-green-700 font-semibold">
                    Cost for this task: €{tasks[idx].cost.toFixed(2)}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
          <CardFooter className="flex-col items-start space-y-4">
            <Button
              onClick={calculateAllCosts}
              className="w-full btn-black-white"
              // disabled={isLoading} // Uncomment if you want to disable during loading
            >
              Total Test Preparation Cost
            </Button>
            {totalCost !== null && (
              <Alert variant="default" className="w-full bg-green-50 border-green-200">
                <Euro className="h-4 w-4 text-green-700" />
                <AlertTitle className="text-green-800">The Client has to pay </AlertTitle>
                <AlertDescription className="text-green-700 font-semibold text-lg">
                  €{totalCost.toFixed(2)}
                  <span className="text-sm font-normal block text-muted-foreground">
                    {includeTransport
                      ? `(Includes €${TRANSPORT_COST_PER_TEST} transport cost.)`
                      : `(No transport cost included.)`}
                  </span>
                  
                </AlertDescription>
                 
              </Alert>
            )}
          </CardFooter>
               {/* Show Test Configuration button after totalCost is calculated */}
      {totalCost !== null && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }} className="mb-2 mr-2">
          <Button variant="link" asChild className="btn-black-white ">
            <Link href="/">Continue to IEC 60068-2 Tests selection</Link>
          </Button>
        </div>
      )}
        </Card>
      

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
