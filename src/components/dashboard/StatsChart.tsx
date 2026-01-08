import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DailyStats {
  date: string;
  views: number;
}

interface StatsChartProps {
  data: DailyStats[];
}

export default function StatsChart({ data }: StatsChartProps) {
  if (data.length === 0 || data.every(d => d.views === 0)) {
    return (
      <div className="flex items-center justify-center h-[200px] text-muted-foreground">
        <p>Pas encore de données</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis 
          dataKey="date" 
          className="text-xs" 
          tick={{ fill: 'hsl(var(--muted-foreground))' }}
        />
        <YAxis 
          className="text-xs" 
          tick={{ fill: 'hsl(var(--muted-foreground))' }}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
          labelStyle={{ color: 'hsl(var(--foreground))' }}
        />
        <Bar 
          dataKey="views" 
          fill="hsl(var(--primary))" 
          radius={[4, 4, 0, 0]}
          name="Vues"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}