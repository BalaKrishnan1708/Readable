import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { ProgressEntry } from "../types/profile";

interface ProgressChartProps {
  data: ProgressEntry[];
}

export const ProgressChart = ({ data }: ProgressChartProps) => {
  const chartData = [...data]
    .reverse()
    .map((entry, index) => ({ label: `S${index + 1}`, accuracy: entry.accuracy_trend }));

  return (
    <div className="rounded-3xl bg-white p-5 shadow-soft">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-ink">Accuracy trend</h3>
        <p className="text-sm text-slate-500">Last ten sessions across guided reading practice.</p>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
            <XAxis dataKey="label" stroke="#64748b" />
            <YAxis domain={[0, 100]} stroke="#64748b" />
            <Tooltip />
            <Line type="monotone" dataKey="accuracy" stroke="#0f766e" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
