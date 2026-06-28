"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { stageLabels } from "@/lib/constants";
import type { LeadStage } from "@/lib/types";

const trendData = [
  { date: "7/12", followers: 118, interactions: 420, leads: 12 },
  { date: "7/15", followers: 164, interactions: 510, leads: 18 },
  { date: "7/18", followers: 201, interactions: 690, leads: 24 },
  { date: "7/21", followers: 238, interactions: 780, leads: 31 },
  { date: "7/24", followers: 286, interactions: 920, leads: 42 },
];

export function GrowthTrendChart() {
  return (
    <div className="h-[280px] max-w-full overflow-hidden">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={trendData} margin={{ left: -18, right: 12, top: 10, bottom: 0 }}>
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
          <Tooltip />
          <Area type="monotone" dataKey="interactions" name="新增互动" stroke="#2563eb" fill="#dbeafe" />
          <Area type="monotone" dataKey="followers" name="粉丝增长" stroke="#14765f" fill="#d1fae5" />
          <Area type="monotone" dataKey="leads" name="新增线索" stroke="#d97706" fill="#fef3c7" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LeadFunnelChart({ data }: { data: { stage: LeadStage; value: number }[] }) {
  const chartData = data.map((item) => ({
    name: stageLabels[item.stage],
    value: item.value,
  }));

  return (
    <div className="h-[280px] max-w-full overflow-hidden">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ left: 32, right: 18, top: 10, bottom: 0 }}>
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={72} />
          <Tooltip />
          <Bar dataKey="value" name="线索数" fill="#14765f" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
