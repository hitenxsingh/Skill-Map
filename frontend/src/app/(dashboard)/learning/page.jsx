'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { GraduationCap, ExternalLink, BookOpen, Target, ArrowRight, Loader2, TrendingUp } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

export default function LearningPage() {
  const [plan, setPlan] = useState(null);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => { fetchPlan(); }, []);

  const fetchPlan = async () => {
    try {
      const res = await api.get('/learning/me');
      setPlan(res.data.plan);
      setAvailableRoles(res.data.availableRoles || []);
      if (res.data.plan) setSelectedRole(res.data.plan.targetRole);
    } catch (error) {
      console.error('Failed to fetch plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePlan = async () => {
    if (!selectedRole) return;
    setGenerating(true);
    try {
      const res = await api.post('/learning/generate', { targetRole: selectedRole });
      setPlan(res.data.plan);
    } catch (error) {
      console.error('Failed to generate plan:', error);
    } finally {
      setGenerating(false);
    }
  };

  const priorityColor = (p) => ({
    high: 'text-destructive bg-destructive/10',
    medium: 'text-[hsl(var(--warning))] bg-[hsl(var(--warning))]/10',
    low: 'text-[hsl(var(--success))] bg-[hsl(var(--success))]/10'
  }[p] || '');

  const gapChartData = plan?.gaps?.map(g => ({ skill: g.skill, current: g.currentLevel, required: g.requiredLevel })) || [];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-40 bg-muted animate-pulse rounded" />
        <Card><CardContent className="pt-6"><div className="h-72 bg-muted animate-pulse rounded" /></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Learning Plan</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Gap analysis and course recommendations</p>
      </div>

      <Card>
        <CardContent className="pt-5 pb-5">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
            <div className="flex-1 space-y-1.5 w-full sm:max-w-xs">
              <label className="text-xs font-medium flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-primary" />Target Role
              </label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger><SelectValue placeholder="Select role..." /></SelectTrigger>
                <SelectContent>
                  {availableRoles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={generatePlan} disabled={!selectedRole || generating} size="sm">
              {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <TrendingUp className="w-3.5 h-3.5 mr-1.5" />}
              {plan ? 'Regenerate' : 'Generate Plan'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {plan ? (
        <>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                Gap Analysis — {plan.targetRole}
              </CardTitle>
              <CardDescription className="text-xs">Current vs required levels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <ResponsiveContainer width="100%" height={300} minWidth={400}>
                  <BarChart data={gapChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="skill" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} angle={-25} textAnchor="end" height={60} />
                    <YAxis domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '6px', color: 'hsl(var(--foreground))', fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="current" name="Current" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="required" name="Required" fill="hsl(var(--muted-foreground))" fillOpacity={0.25} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Skill Gaps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {plan.gaps.filter(g => g.currentLevel < g.requiredLevel).map((gap, i) => (
                  <div key={i} className="p-3 rounded-lg bg-accent/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{gap.skill}</span>
                      <Badge className={`${priorityColor(gap.priority)} text-[11px] border-0`}>{gap.priority}</Badge>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="font-mono">{gap.currentLevel}%</span>
                      <ArrowRight className="w-3 h-3" />
                      <span className="text-primary font-medium font-mono">{gap.requiredLevel}%</span>
                    </div>
                    <Progress value={(gap.currentLevel / gap.requiredLevel) * 100} className="h-1" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-primary" />
                Recommended Courses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {plan.recommendations.map((rec, i) => (
                  <a
                    key={i}
                    href={rec.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block p-3 rounded-lg border border-border hover:border-primary/20 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 flex-1 min-w-0">
                        <h4 className="text-sm font-medium group-hover:text-primary transition-colors truncate">{rec.title}</h4>
                        <p className="text-xs text-muted-foreground">{rec.provider} {rec.duration && `· ${rec.duration}`}</p>
                        <div className="flex gap-1.5 mt-1.5">
                          <Badge variant="outline" className="text-[10px]">{rec.skill}</Badge>
                          <Badge variant="secondary" className="text-[10px] capitalize">{rec.level}</Badge>
                        </div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-0.5" />
                    </div>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-14">
            <div className="text-center text-muted-foreground">
              <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-15" />
              <h3 className="text-base font-semibold text-foreground mb-1">No Learning Plan Yet</h3>
              <p className="text-sm max-w-sm mx-auto">Select a target role and generate your plan.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
