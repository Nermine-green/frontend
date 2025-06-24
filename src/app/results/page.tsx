'use client';

import * as React from 'react';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Zap, Euro, Wrench, TrendingUp, Leaf, FileText, Droplet, CheckCircleIcon } from 'lucide-react';

export default function ResultsReportPage() {
  const [results, setResults] = useState<any>(null);
  const router = useRouter();
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Get results from localStorage
    const stored = localStorage.getItem('testResults');
    if (stored) {
      setResults(JSON.parse(stored));
    }
  }, []);

  const handleSavePDF = () => {
    if (!reportRef.current) return;
    // Use browser print dialog for PDF export
    window.print();
  };

  if (!results) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-lg">No results found. Please calculate costs first.</p>
        <Button className="mt-4" onClick={() => router.push('/')}>Back to Test Configuration</Button>
      </div>
    );
  }

  return (
    <div className="results-bg min-h-screen">
      <div className="container mx-auto p-4 md:p-8 min-h-screen flex flex-col items-center">
        <Card className="w-full max-w-2xl shadow-lg mb-6" ref={reportRef}>
        {/* Logos Row - visible in print and screen */}
        <div className="flex justify-between items-center py-2 px-4 print:flex print:justify-between print:items-center print:py-2 print:px-4">
          <img
            src="/assets/images/logo_IEC.png"
            alt="IEC Logo"
            style={{ height: 48, width: 'auto' }}
            className="iec-logo"
          />
          <img
            src="/assets/images/logo.png"
            alt="ACTIA Logo"
            style={{ height: 48, width: 'auto' }}
            className="actia-logo"
          />
          <img
            src="/assets/images/logo_ISO.png"
            alt="ISO Logo"
            style={{ height: 48, width: 'auto' }}
            className="iso-logo"
          />
        </div>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 justify-center">
            <FileText className="text-green-700" /> <span className="text-gray-700">Results Report</span>
          </CardTitle>     
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Show Client Reference if present */}
{results.clientReference && results.clientReference.trim() !== '' && (
  <div className="mb-4 p-4 rounded bg-muted border">
    <p className="font-semibold mb-1">Client Reference:</p>
    <p className="text-lg font-mono">{results.clientReference}</p>
  </div>
)}
{/* Show Project Description if present */}
{results.testDescription && results.testDescription.trim() !== '' && (
  <div className="mb-4 p-4 rounded bg-muted border">
    <p className="font-semibold mb-1">Project Description:</p>
    <p className="whitespace-pre-line">{results.testDescription}</p>
  </div>
)}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Energy Consumption per hour */}
            <ResultItem
              icon={<Zap className="text-yellow-500" />}
              label="Energy Consumption per hour"
              value={
                results.energyConsumptionkWh && results.durationHours && results.durationHours > 0
                  ? `${(results.energyConsumptionkWh / results.durationHours).toFixed(2)} kWh`
                  : 'N/A'
              }
            />
            {/* Energy Cost per hour */}
            <ResultItem
              icon={<Euro className="text-red-600" />}
              label="Energy Cost per hour"
              value={
                results.energyCost && results.durationHours && results.durationHours > 0
                  ? `€${(results.energyCost / results.durationHours).toFixed(2)}`
                  : 'N/A'
              }
            />
            {/* Total Energy Consumption */}
            <ResultItem icon={<Zap className="text-yellow-500" />} label="Total Energy Consumption" value={`${results.energyConsumptionkWh?.toFixed(2)} kWh`} />
            {/* Total Energy Cost */}
            <ResultItem icon={<Euro className="text-red-600" />} label="Total Energy Cost" value={`€${results.energyCost?.toFixed(2)}`} />
            <ResultItem icon={<CheckCircleIcon className="text-purple-700" />} label="Preparation Costs" value={`€${results.totalFixedCosts?.toFixed(2)}`} />
            <ResultItem icon={<Wrench className="text-gray-500" />} label="Maintenance Costs" value={`€${results.maintenanceCost?.toFixed(2)}`} />
            <ResultItem icon={<Droplet className="text-blue-600" />} label="Water Use Cost" value={`€${results.additionalCost?.toFixed(2)}`} />
            <ResultItem icon={<Leaf className="text-green-500" />} label="Carbon Footprint Emission" value={`${results.carbonFootprintKgCO2?.toFixed(2)} kg CO₂`} />
          </div>
          <div className="text-center pt-4">
            <p className="text-lg font-semibold">Total Cost</p>
            <p className="text-3xl font-bold text-primary">€{results.totalCost?.toFixed(2)}</p>
          </div>
        </CardContent>
      </Card>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => router.push('/')}>Back to Calculator</Button>
          <Button onClick={handleSavePDF}>Save as PDF</Button>
        </div>
      </div>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .container, .container * { visibility: visible; }
          .container { position: absolute; left: 0; top: 0; width: 100vw; }
          button, .btn-black-white { display: none !important; }
          .iec-logo, .actia-logo, .iso-logo { display: inline !important; }
        }
        /* Add background image for screen only */
        .results-bg {
          background-image: url('/assets/images/actia.png');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          background-attachment: fixed;
          width: 100vw;
          min-height: 100vh;
          position: relative;
        }
      `}</style>
    </div>
  );
}

function ResultItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="flex items-center space-x-3 p-3 rounded-md border result-item-bg">
      <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center result-item-icon">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium result-item-label">{label}</p>
        <p className="text-lg font-semibold result-item-value">{value}</p>
      </div>
       <style>{`
        @media print {
          body * { visibility: hidden; }
          .container, .container * { visibility: visible; }
          .container { position: absolute; left: 0; top: 0; width: 100vw; }
          button, .btn-black-white { display: none !important; }
        }
        /* Add background image for screen only */
        .results-bg {
          background-image: url('/assets/images/actia.png');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          background-attachment: fixed;
          width: 100vw;
          min-height: 100vh;
          position: relative;
        }
      `}</style>
    </div>
  );
}
