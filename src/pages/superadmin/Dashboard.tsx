import { useState } from 'react';
import { StatsCard } from '@/components/StatsCard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { companies, branches, users } from '@/lib/mock-data';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { InsufficientDataOverlay } from '@/components/InsufficientDataOverlay';

type Period = '7d' | '30d' | '90d' | '1y';

const periodLabels: Record<Period, string> = {
  '7d': '1 hafta',
  '30d': '1 oy',
  '90d': '3 oy',
  '1y': '1 yil',
};

function generateSalesData(days: number) {
  const data: { date: string; sotilgan: number }[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    data.push({
      date: d.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit' }),
      sotilgan: Math.floor(1 + Math.random() * 5),
    });
  }
  return data;
}

const periodDays: Record<Period, number> = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };

const COLORS = ['hsl(160, 60%, 45%)', 'hsl(40, 10%, 80%)'];

export default function SuperAdminDashboard() {
  const [period, setPeriod] = useState<Period>('30d');

  const totalManagers = users.filter(u => u.role === 'MANAGER').length;
  const totalStaff = users.filter(u => u.role !== 'SUPERADMIN').length;
  const activeBranches = branches.filter(b => b.status === 'ACTIVE').length;
  const inactiveBranches = branches.filter(b => b.status === 'INACTIVE').length;

  const salesData = generateSalesData(periodDays[period]);
  const pieData = [
    { name: 'Faol', value: activeBranches },
    { name: 'Arxiv', value: inactiveBranches },
  ];

  const isDataInsufficient = companies.length === 0 && branches.length === 0 && totalStaff === 0;

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-6">Bosh sahifa</h2>

      {isDataInsufficient && (
        <div className="mb-6">
          <InsufficientDataOverlay
            title="Ma'lumot kam"
            description="Hozircha statistikani ko'rsatish uchun yetarli ma'lumot to'planmagan. Kompaniyalar, filiallar va xodimlar qo'shilgandan so'ng grafiklar paydo bo'ladi."
          />
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <StatsCard title="Kompaniyalar" value={companies.length} />
        <StatsCard title="Filiallar" value={branches.length} subtitle={`${activeBranches} ta faol`} />
        <StatsCard title="Menejerlar" value={totalManagers} />
        <StatsCard title="Jami xodimlar" value={totalStaff} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Sales Chart */}
        <Card className="lg:col-span-2 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <h3 className="text-base font-semibold text-foreground">Sotilgan kompaniyalar</h3>
            <div className="flex gap-1">
              {(Object.keys(periodLabels) as Period[]).map(p => (
                <Button
                  key={p}
                  variant={period === p ? 'default' : 'ghost'}
                  size="sm"
                  className="text-xs h-7 px-2.5"
                  onClick={() => setPeriod(p)}
                >
                  {periodLabels[p]}
                </Button>
              ))}
            </div>
          </div>
          <div className="h-[260px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 12%, 90%)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: 'hsl(222, 10%, 46%)' }}
                  tickLine={false}
                  axisLine={false}
                  interval={Math.max(0, Math.floor(salesData.length / 8))}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'hsl(222, 10%, 46%)' }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(0, 0%, 100%)',
                    border: '1px solid hsl(222, 12%, 90%)',
                    borderRadius: '8px',
                    fontSize: '13px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="sotilgan"
                  stroke="hsl(32, 95%, 52%)"
                  fill="hsl(32, 95%, 52%)"
                  fillOpacity={0.15}
                  strokeWidth={2}
                  name="Sotilgan"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Pie Chart */}
        <Card className="p-4 sm:p-6">
          <h3 className="text-base font-semibold text-foreground mb-4">Filiallar holati</h3>
          <div className="h-[260px] sm:h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={85}
                  dataKey="value"
                  paddingAngle={4}
                  strokeWidth={0}
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Legend
                  verticalAlign="bottom"
                  formatter={(value: string) => (
                    <span style={{ color: 'hsl(222, 25%, 12%)', fontSize: '13px' }}>{value}</span>
                  )}
                />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(0, 0%, 100%)',
                    border: '1px solid hsl(222, 12%, 90%)',
                    borderRadius: '8px',
                    fontSize: '13px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
