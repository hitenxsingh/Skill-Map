'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  AlertTriangle, TrendingDown, GraduationCap, Users, ExternalLink,
  BookOpen, Target, ChevronRight, BarChart3, Zap
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell
} from 'recharts';

const severityColors = {
  critical: 'hsl(0, 84%, 60%)',
  high: 'hsl(38, 92%, 50%)',
  medium: 'hsl(199, 89%, 48%)'
};

const severityBadge = {
  critical: 'bg-red-500/10 text-red-500 border-red-500/20',
  high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  medium: 'bg-blue-500/10 text-blue-500 border-blue-500/20'
};

function StatCard({ title, value, subtitle, icon: Icon, variant = 'default' }) {
  return (
    <Card className={variant === 'danger' ? 'border-red-500/20 bg-red-500/5' : ''}>
      <CardContent className="pt-5 pb-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
            <p className={`text-2xl font-bold mt-1 ${variant === 'danger' ? 'text-red-500' : ''}`}>{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          <div className={`p-2.5 rounded-lg ${variant === 'danger' ? 'bg-red-500/10' : 'bg-primary/10'}`}>
            <Icon className={`w-4 h-4 ${variant === 'danger' ? 'text-red-500' : 'text-primary'}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function GapsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/assessments/gaps')
      .then(res => setData(res.data))
      .catch(err => console.error('Failed to load gaps:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-52 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}><CardContent className="pt-5 pb-5"><div className="h-16 bg-muted animate-pulse rounded" /></CardContent></Card>
          ))}
        </div>
        <Card><CardContent className="pt-6"><div className="h-80 bg-muted animate-pulse rounded" /></CardContent></Card>
      </div>
    );
  }

  const chartData = data?.gaps?.slice(0, 15).map(g => ({
    skill: g.skill,
    avgScore: g.avgScore,
    fill: severityColors[g.severity]
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight">Training & Gaps Analysis</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Identify skill gaps across the organization and get training recommendations
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Skill Gaps"
          value={data?.summary?.totalGaps || 0}
          subtitle="Skills below 60%"
          icon={TrendingDown}
        />
        <StatCard
          title="Critical Gaps"
          value={data?.summary?.criticalGaps || 0}
          subtitle="Below 40% avg score"
          icon={AlertTriangle}
          variant="danger"
        />
        <StatCard
          title="Weakest Category"
          value={data?.summary?.weakestCategory || 'N/A'}
          subtitle="Needs most attention"
          icon={Target}
        />
        <StatCard
          title="Needs Training"
          value={data?.summary?.employeesNeedingTraining || 0}
          subtitle="Employees"
          icon={Users}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Skill Gaps Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Skill Gaps by Score
            </CardTitle>
            <CardDescription className="text-xs">
              Skills with average score below 60%
            </CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <YAxis type="category" dataKey="skill" width={100} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={(value) => [`${value}%`, 'Avg Score']}
                  />
                  <Bar dataKey="avgScore" radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Zap className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No significant skill gaps found</p>
                  <p className="text-xs mt-1">Your organization is doing great!</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Analysis */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Category Breakdown
            </CardTitle>
            <CardDescription className="text-xs">
              Average scores by skill category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data?.categoryAnalysis?.map((cat, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium capitalize">{cat.category}</span>
                      <Badge variant="secondary" className="text-[10px] h-5">{cat.skillCount} skills</Badge>
                    </div>
                    <span className={`text-sm font-mono ${cat.avgScore < 40 ? 'text-red-500' : cat.avgScore < 50 ? 'text-orange-500' : 'text-muted-foreground'}`}>
                      {cat.avgScore}%
                    </span>
                  </div>
                  <Progress
                    value={cat.avgScore}
                    className="h-2"
                    style={{
                      '--progress-background': cat.avgScore < 40 ? 'hsl(0, 84%, 60%)' : cat.avgScore < 50 ? 'hsl(38, 92%, 50%)' : 'hsl(var(--primary))'
                    }}
                  />
                </div>
              ))}
              {(!data?.categoryAnalysis || data.categoryAnalysis.length === 0) && (
                <div className="py-10 text-center text-muted-foreground">
                  <Target className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No category data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Skill Gaps with Course Recommendations */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-primary" />
            Recommended Training
          </CardTitle>
          <CardDescription className="text-xs">
            Courses to address the most critical skill gaps
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data?.gaps?.length > 0 ? (
            <div className="space-y-4">
              {data.gaps.slice(0, 10).map((gap, i) => (
                <div key={i} className="p-4 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        gap.severity === 'critical' ? 'bg-red-500/10' : gap.severity === 'high' ? 'bg-orange-500/10' : 'bg-blue-500/10'
                      }`}>
                        <AlertTriangle className={`w-5 h-5 ${
                          gap.severity === 'critical' ? 'text-red-500' : gap.severity === 'high' ? 'text-orange-500' : 'text-blue-500'
                        }`} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">{gap.skill}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">Avg: {gap.avgScore}%</span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">{gap.employeeCount} employees</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className={severityBadge[gap.severity]}>
                      {gap.severity}
                    </Badge>
                  </div>
                  
                  {gap.courses?.length > 0 && (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {gap.courses.map((course, j) => (
                        <a
                          key={j}
                          href={course.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 rounded-md bg-background border border-border hover:border-primary/30 transition-colors group"
                        >
                          <BookOpen className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate group-hover:text-primary">{course.title}</p>
                            <p className="text-[10px] text-muted-foreground">{course.provider} • {course.duration} • {course.level}</p>
                          </div>
                          <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-14 text-center text-muted-foreground">
              <GraduationCap className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <h3 className="font-semibold text-foreground mb-1">No Training Gaps Found</h3>
              <p className="text-sm">All skills are above the 60% threshold</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Employees Needing Training */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            Employees Needing Development
          </CardTitle>
          <CardDescription className="text-xs">
            Team members with average scores below 50%
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data?.trainingNeeds?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Employee</th>
                    <th className="text-left py-3 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Department</th>
                    <th className="text-left py-3 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Avg Score</th>
                    <th className="text-left py-3 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Weak Skills</th>
                    <th className="text-left py-3 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Focus Areas</th>
                  </tr>
                </thead>
                <tbody>
                  {data.trainingNeeds.map((emp, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{emp.name}</p>
                            <p className="text-[11px] text-muted-foreground">{emp.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-muted-foreground">{emp.department}</td>
                      <td className="py-3 px-3">
                        <Badge variant="secondary" className={`font-mono ${emp.avgScore < 30 ? 'bg-red-500/10 text-red-500' : 'bg-orange-500/10 text-orange-500'}`}>
                          {emp.avgScore}%
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-muted-foreground">{emp.weakSkillCount}</td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1">
                          {emp.topWeakSkills.slice(0, 3).map((skill, j) => (
                            <Badge key={j} variant="outline" className="text-[10px] py-0">{skill}</Badge>
                          ))}
                          {emp.topWeakSkills.length > 3 && (
                            <Badge variant="outline" className="text-[10px] py-0">+{emp.topWeakSkills.length - 3}</Badge>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-14 text-center text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <h3 className="font-semibold text-foreground mb-1">Great News!</h3>
              <p className="text-sm">No employees currently need urgent development support</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
