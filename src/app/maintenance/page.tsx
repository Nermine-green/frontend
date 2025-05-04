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
const HUMAN_COST_PER_HOUR = 26;
const TRANSPORT_COST_PER_TEST = 150;

interface Machine {
  id: string;
  name: string;
  costPerHour: number;
}

const machines: Machine[] = [
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

const maintenanceTasks = [
    "Visual inspection and proper functioning check (Start)", // Renamed slightly for clarity
    "Assembly + Wiring",
    "Programming + Simulated test",
    "Real test",
    "Disassembly + Unwiring",
    "Visual inspection and proper functioning check (End)" // Renamed slightly for clarity
];

export default function MaintenancePage() {
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [durationHours, setDurationHours] = useState<string>('');
  const [taskType, setTaskType] = useState<'human' | 'machine' | null>(null);
  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null);
  const [totalCost, setTotalCost] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTaskSelect = (task: string) => {
    setSelectedTask(task);
    // Reset subsequent steps when a new task is selected
    setDurationHours('');
    setTaskType(null);
    setSelectedMachineId(null);
    setTotalCost(null);
    setError(null);
  };

    const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Allow only numbers and a single decimal point
        if (/^\d*\.?\d*$/.test(value)) {
            setDurationHours(value);
            setTotalCost(null); // Reset cost when duration changes
            setError(null);
        }
    };

   const handleTaskTypeChange = (value: 'human' | 'machine') => {
        setTaskType(value);
        setSelectedMachineId(null); // Reset machine if switching type
        setTotalCost(null); // Reset cost
        setError(null);
   };

   const handleMachineChange = (value: string) => {
       setSelectedMachineId(value);
       setTotalCost(null); // Reset cost
       setError(null);
   };

  const calculateMaintenanceCost = () => {
    setError(null); // Clear previous errors
    const duration = parseFloat(durationHours);

    if (!selectedTask) {
        setError("Please select a maintenance task.");
        return;
    }
    if (isNaN(duration) || duration <= 0) {
      setError('Please enter a valid positive duration in hours.');
      setTotalCost(null);
      return;
    }
    if (!taskType) {
      setError('Please select if the task is done by Human or Machine.');
      setTotalCost(null);
      return;
    }

    let taskCost = 0;

    if (taskType === 'human') {
      taskCost = HUMAN_COST_PER_HOUR * duration;
    } else if (taskType === 'machine') {
      if (!selectedMachineId) {
        setError('Please select a machine.');
        setTotalCost(null);
        return;
      }
      const machine = machines.find(m => m.id === selectedMachineId);
      if (!machine) {
        setError('Selected machine data not found.');
        setTotalCost(null);
        return;
      }
      taskCost = machine.costPerHour * duration;
    }

    const finalCost = taskCost + TRANSPORT_COST_PER_TEST;
    setTotalCost(finalCost);
  };

  return (
    <div className="container mx-auto p-4 md:p-8 min-h-screen flex flex-col">
      {/* Header */}
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-primary mb-2 flex items-center justify-center gap-2">
            <Settings /> Maintenance Task Cost Calculator
        </h1>
        <p className="text-lg text-muted-foreground">
          Estimate the cost for specific maintenance tasks performed at ACTIA.
        </p>
         {/* Navigation Links */}
         <div className="mt-4">
             <Button variant="link" asChild>
                <Link href="/">Go to Test Cost Calculator</Link>
            </Button>
             <Button variant="link" asChild>
                <Link href="/login">Logout (Placeholder)</Link>
            </Button>
         </div>
      </header>

      <div className="flex-grow">
        <Card className="w-full max-w-2xl mx-auto shadow-lg">
          <CardHeader>
            <CardTitle>1. Select Maintenance Task</CardTitle>
            <CardDescription>Choose the maintenance task you want to estimate.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {maintenanceTasks.map((task) => (
              <Button
                key={task}
                variant={selectedTask === task ? 'default' : 'outline'}
                onClick={() => handleTaskSelect(task)}
                className="justify-start text-left h-auto py-3" // Adjust button style for text wrapping
              >
                {task}
                {selectedTask === task && <Check className="ml-auto h-4 w-4" />}
              </Button>
            ))}
          </CardContent>

          {selectedTask && (
            <>
              <Separator className="my-6" />
              <CardHeader>
                <CardTitle>2. Task Details for: <span className="text-primary">{selectedTask}</span></CardTitle>
                <CardDescription>Specify the duration and resource type for this task.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Duration */}
                <div className="space-y-2">
                  <Label htmlFor="duration" className="flex items-center gap-2"><Clock className="h-4 w-4"/> Duration (Hours)</Label>
                  <Input
                    id="duration"
                    type="text" // Use text to allow intermediate states like "1."
                    placeholder="e.g., 2.5"
                    value={durationHours}
                    onChange={handleDurationChange}
                    min="0" // HTML5 min attribute for number input type, but good to keep for context
                    step="0.1" // HTML5 step attribute
                  />
                   {durationHours && isNaN(parseFloat(durationHours)) && (
                       <p className="text-sm text-destructive">Please enter a valid number.</p>
                   )}
                </div>

                {/* Task Type */}
                <div className="space-y-2">
                   <Label className="flex items-center gap-2"><User className="h-4 w-4"/>/<Bot className="h-4 w-4"/> Task performed by:</Label>
                    <RadioGroup
                        value={taskType ?? ''}
                        onValueChange={handleTaskTypeChange}
                        className="flex flex-col sm:flex-row gap-4 pt-2"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="human" id="human" />
                            <Label htmlFor="human" className="font-normal">Human</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="machine" id="machine" />
                            <Label htmlFor="machine" className="font-normal">Machine</Label>
                        </div>
                    </RadioGroup>
                </div>


                {/* Machine Selection (Conditional) */}
                {taskType === 'machine' && (
                  <div className="space-y-2">
                    <Label htmlFor="machine-select" className="flex items-center gap-2"><Bot className="h-4 w-4"/> Select Machine</Label>
                    <Select
                      value={selectedMachineId ?? ''}
                      onValueChange={handleMachineChange}
                    >
                      <SelectTrigger id="machine-select">
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
              </CardContent>

              <CardFooter className="flex-col items-start space-y-4">
                <Button
                    onClick={calculateMaintenanceCost}
                    disabled={!selectedTask || !durationHours || !taskType || (taskType === 'machine' && !selectedMachineId) || isNaN(parseFloat(durationHours))}
                    className="w-full sm:w-auto"
                 >
                    Calculate Task Cost
                 </Button>

                 {error && (
                    <Alert variant="destructive">
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                 )}

                 {totalCost !== null && (
                   <Alert variant="default" className="w-full bg-green-50 border-green-200">
                     <Euro className="h-4 w-4 text-green-700" />
                     <AlertTitle className="text-green-800">Estimated Cost for this Task Flow</AlertTitle>
                     <AlertDescription className="text-green-700 font-semibold text-lg">
                       €{totalCost.toFixed(2)}
                        <span className="text-sm font-normal block text-muted-foreground">(Includes €{TRANSPORT_COST_PER_TEST} transport cost)</span>
                     </AlertDescription>
                   </Alert>
                 )}
              </CardFooter>
            </>
          )}
        </Card>
      </div>

      {/* Footer */}
      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} EcoTest Insight - ACTIA Engineering Services Tunisia. All rights reserved.</p>
      </footer>
    </div>
  );
}
