import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ProgressChartProps {
  data: { label?: string; date?: string; accuracy: number; accuracy_trend?: number }[];
}

export const ProgressChart = ({ data }: ProgressChartProps) => {
  const chartData = [...data].map((entry, index) => ({
    label: entry.label || entry.date || `S${index + 1}`,
    accuracy: entry.accuracy_trend ?? entry.accuracy,
  }));

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="label" 
              stroke="#94a3b8" 
              tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis 
              domain={[60, 100]} 
              stroke="#94a3b8"
              tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }}
              tickLine={false}
              axisLine={false}
              dx={-10}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '1rem', border: '2px solid #e2e8f0', fontWeight: 'bold', color: '#334155', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ color: '#0ea5e9', fontWeight: 900 }}
            />
            <Area 
              type="monotone" 
              dataKey="accuracy" 
              stroke="#0ea5e9" 
              strokeWidth={4}
              fillOpacity={1} 
              fill="url(#colorAccuracy)" 
              activeDot={{ r: 6, fill: "#0ea5e9", stroke: "#fff", strokeWidth: 3 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
