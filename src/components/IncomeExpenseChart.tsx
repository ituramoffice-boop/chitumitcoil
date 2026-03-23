import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const data = [
  { month: "אוק׳", income: 18500, expenses: 12300 },
  { month: "נוב׳", income: 18500, expenses: 11800 },
  { month: "דצמ׳", income: 19200, expenses: 14500 },
  { month: "ינו׳", income: 18500, expenses: 12100 },
  { month: "פבר׳", income: 18500, expenses: 13200 },
  { month: "מרץ", income: 21000, expenses: 12800 },
];

export function IncomeExpenseChart() {
  return (
    <div className="glass-card p-6 space-y-4">
      <h3 className="text-lg font-semibold text-foreground">הכנסות מול הוצאות (6 חודשים)</h3>
      <div className="h-[280px]" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 18%)" />
            <XAxis dataKey="month" tick={{ fill: "hsl(215 15% 55%)", fontSize: 12 }} />
            <YAxis tick={{ fill: "hsl(215 15% 55%)", fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(220 25% 10%)",
                border: "1px solid hsl(220 20% 18%)",
                borderRadius: "8px",
                color: "hsl(210 20% 92%)",
              }}
              formatter={(value: number) => `₪${value.toLocaleString()}`}
            />
            <Legend />
            <Bar dataKey="income" name="הכנסות" fill="hsl(160 84% 39%)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" name="הוצאות" fill="hsl(217 91% 60%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
