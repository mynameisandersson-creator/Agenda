'use client';

import { Group } from '@visx/group';
import { Pie } from '@visx/shape';
import { scaleBand, scaleLinear, scalePoint } from '@visx/scale';
import { LinePath } from '@visx/shape';
import { Text } from '@visx/text';
import type { ReportPoint } from '@/lib/types';

const palette = ['#2563eb', '#7c3aed', '#16a34a', '#f59e0b', '#ef4444', '#06b6d4'];

export function DonutChart({ data }: { data: ReportPoint[] }) {
  const width = 310;
  const height = 230;
  const radius = Math.min(width, height) / 2;
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-64 w-full">
      <Group top={height / 2} left={width / 2}>
        <Pie data={data} pieValue={(item) => item.value} outerRadius={radius - 12} innerRadius={58} padAngle={0.02}>
          {(pie) => pie.arcs.map((arc, index) => (
            <path key={arc.data.label} d={pie.path(arc) ?? ''} fill={palette[index % palette.length]} />
          ))}
        </Pie>
        <Text textAnchor="middle" verticalAnchor="middle" className="fill-slate-900 text-3xl font-bold">
          {total}
        </Text>
        <Text dy={26} textAnchor="middle" verticalAnchor="middle" className="fill-slate-500 text-xs uppercase tracking-widest">
          eventos
        </Text>
      </Group>
    </svg>
  );
}

export function BarChart({ data }: { data: ReportPoint[] }) {
  const width = 520;
  const height = 260;
  const margin = { top: 24, right: 20, bottom: 56, left: 38 };
  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;
  const xScale = scaleBand({ domain: data.map((item) => item.label), range: [0, xMax], padding: 0.28 });
  const yScale = scaleLinear({ domain: [0, Math.max(1, ...data.map((item) => item.value))], range: [yMax, 0], nice: true });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-72 w-full">
      <Group top={margin.top} left={margin.left}>
        {data.map((item, index) => {
          const barWidth = xScale.bandwidth();
          const barHeight = yMax - yScale(item.value);
          const x = xScale(item.label) ?? 0;
          return (
            <Group key={item.label}>
              <rect x={x} y={yScale(item.value)} width={barWidth} height={barHeight} rx={10} fill={palette[index % palette.length]} />
              <Text x={x + barWidth / 2} y={yScale(item.value) - 8} textAnchor="middle" className="fill-slate-700 text-xs font-bold">
                {item.value}
              </Text>
              <Text x={x + barWidth / 2} y={yMax + 26} width={70} textAnchor="middle" className="fill-slate-500 text-[10px]">
                {item.label}
              </Text>
            </Group>
          );
        })}
      </Group>
    </svg>
  );
}

export function LineChart({ data }: { data: ReportPoint[] }) {
  const width = 520;
  const height = 250;
  const margin = { top: 24, right: 28, bottom: 44, left: 28 };
  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;
  const xScale = scalePoint({ domain: data.map((item) => item.label), range: [0, xMax], padding: 0.4 });
  const yScale = scaleLinear({ domain: [0, Math.max(1, ...data.map((item) => item.value))], range: [yMax, 0], nice: true });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-72 w-full">
      <Group top={margin.top} left={margin.left}>
        <LinePath data={data} x={(item) => xScale(item.label) ?? 0} y={(item) => yScale(item.value)} stroke="#2563eb" strokeWidth={4} />
        {data.map((item) => {
          const x = xScale(item.label) ?? 0;
          const y = yScale(item.value);
          return (
            <Group key={item.label}>
              <circle cx={x} cy={y} r={7} fill="#ffffff" stroke="#2563eb" strokeWidth={4} />
              <Text x={x} y={y - 16} textAnchor="middle" className="fill-slate-700 text-xs font-bold">
                {item.value}
              </Text>
              <Text x={x} y={yMax + 26} width={72} textAnchor="middle" className="fill-slate-500 text-[10px]">
                {item.label.slice(5)}
              </Text>
            </Group>
          );
        })}
      </Group>
    </svg>
  );
}
