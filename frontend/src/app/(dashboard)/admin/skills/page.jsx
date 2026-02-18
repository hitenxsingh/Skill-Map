'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, BarChart3, TrendingUp, Award } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell
} from 'recharts';

const COLORS = [
  'hsl(199, 89%, 48%)', 'hsl(160, 84%, 39%)', 'hsl(38, 92%, 50%)',
  'hsl(280, 68%, 60%)', 'hsl(346, 77%, 60%)', 'hsl(199, 89%, 38%)',
  'hsl(160, 84%, 49%)', 'hsl(38, 92%, 60%)'
];

function StatCard({ title, value, icon: Icon }) {
  return (
    <Card>
      <CardContent className="pt-5 pb-5 flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className="p-2.5 rounded-lg bg-primary/10"><Icon className="w-4 h-4 text-primary" /></div>
      </CardContent>
    </Card>
  );
}

export default function AdminSkillsPage() {
  const [distribution, setDistribution] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/assessments/distribution')
      .then(res => setDistribution(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-52 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2].map(i => <Card key={i}><CardContent className="pt-6"><div className="h-72 bg-muted animate-pulse rounded" /></CardContent></Card>)}
        </div>
      </div>
    );
  }

  const skillData = distribution?.distribution?.map(d => ({ skill: d.skill, avgScore: d.avgScore, employees: d.employeeCount })) || [];
  const categoryData = distribution?.categoryDistribution?.map(d => ({ name: d.category, value: d.count, avgScore: d.avgScore })) || [];
  const avgOrg = skillData.length > 0 ? Math.round(skillData.reduce((a, s) => a + s.avgScore, 0) / skillData.length) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Command Center</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Organization-wide skill analytics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Skills Tracked" value={skillData.length} icon={BarChart3} />
        <StatCard title="Categories" value={categoryData.length} icon={Award} />
        <StatCard title="Org Avg" value={`${avgOrg}%`} icon={TrendingUp} />
      </div>

      {skillData.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Skill Distribution</CardTitle>
              <CardDescription className="text-xs">Average scores across the org</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <ResponsiveContainer width="100%" height={350} minWidth={400}>
                  <BarChart data={skillData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="skill" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} angle={-30} textAnchor="end" height={70} />
                    <YAxis domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '6px', color: 'hsl(var(--foreground))', fontSize: 12 }} />
                    <Bar dataKey="avgScore" name="Avg Score" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Assessment Categories</CardTitle>
              <CardDescription className="text-xs">Distribution by type</CardDescription>
            </CardHeader>
            <CardContent>
              {categoryData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={categoryData} cx="50%" cy="50%" innerRadius={65} outerRadius={110} paddingAngle={3} dataKey="value">
                        {categoryData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '6px', color: 'hsl(var(--foreground))', fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center mt-2">
                    {categoryData.map((cat, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        {cat.name}: {cat.value}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">No data</div>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Detailed Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {['Skill', 'Avg', 'Min', 'Max', 'Employees', 'Tests'].map(h => (
                        <th key={h} className="text-left py-2.5 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {distribution?.distribution?.map((d, i) => (
                      <tr key={i} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                        <td className="py-2.5 px-3 font-medium">{d.skill}</td>
                        <td className="py-2.5 px-3"><Badge variant="secondary" className="font-mono text-xs">{d.avgScore}%</Badge></td>
                        <td className="py-2.5 px-3 text-muted-foreground font-mono">{d.minScore}%</td>
                        <td className="py-2.5 px-3 text-muted-foreground font-mono">{d.maxScore}%</td>
                        <td className="py-2.5 px-3">{d.employeeCount}</td>
                        <td className="py-2.5 px-3 text-muted-foreground">{d.totalAssessments}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="py-14">
            <div className="text-center text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-15" />
              <h3 className="text-base font-semibold text-foreground mb-1">No Data Yet</h3>
              <p className="text-sm">Assessment data will appear once employees complete them.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
