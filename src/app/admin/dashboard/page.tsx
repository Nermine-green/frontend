"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer
} from "recharts";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Use next/navigation for app directory

const barData = [
  { name: 'Chamber 1', consumption: 7 },
  { name: 'Chamber 2', consumption: 5 },
  { name: 'Chamber 3', consumption: 6 }
];

const pieData = [
  { name: 'Chamber 1', value: 400 },
  { name: 'Chamber 2', value: 300 },
  { name: 'Chamber 3', value: 300 }
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

export default function Dashboard() {
    const router = useRouter();
    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Overview</h2>
                <div className="relative">
                    <button className="bg-white px-4 py-2 rounded shadow">Admin ▾</button>
                    {/* dropdown would be placed here */}
                </div>
            </div>

            <div className="mb-6">
                <label className="block text-sm font-medium mb-1">Create Chart or Widget</label>
                <input
                    type="text"
                    placeholder="e.g. 'Total power consumption by month'"
                    className="w-full border px-4 py-2 rounded shadow-sm"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-4 shadow">
                    <h3 className="font-semibold mb-2">Total Power Consumption by Equipment</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={barData}>
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="consumption" fill="#8884d8" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-xl p-4 shadow">
                    <h3 className="font-semibold mb-2">Power Consumption by Equipment</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={100}>
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
