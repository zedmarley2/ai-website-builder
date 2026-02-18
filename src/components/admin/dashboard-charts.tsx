'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const monthlyData = [
  { month: 'Ocak', gelir: 42000 },
  { month: 'Şubat', gelir: 38500 },
  { month: 'Mart', gelir: 51200 },
  { month: 'Nisan', gelir: 47800 },
  { month: 'Mayıs', gelir: 55300 },
  { month: 'Haziran', gelir: 62100 },
  { month: 'Temmuz', gelir: 58400 },
  { month: 'Ağustos', gelir: 49700 },
  { month: 'Eylül', gelir: 53600 },
  { month: 'Ekim', gelir: 61200 },
  { month: 'Kasım', gelir: 68500 },
  { month: 'Aralık', gelir: 72300 },
];

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="rounded-lg border border-[#e2e8f0] bg-white px-4 py-3 shadow-lg dark:border-[#334155] dark:bg-[#1e293b]">
      <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Gelir: <span className="font-semibold text-[#1a365d] dark:text-[#d4a843]">{Number(payload[0].value).toLocaleString('tr-TR')} &#8378;</span>
      </p>
    </div>
  );
}

export function DashboardCharts() {
  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={monthlyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:opacity-20" />
          <XAxis
            dataKey="month"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
          />
          <YAxis
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
            tickFormatter={(value: number) => `${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(26, 54, 93, 0.05)' }} />
          <Bar
            dataKey="gelir"
            fill="#1a365d"
            radius={[6, 6, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
