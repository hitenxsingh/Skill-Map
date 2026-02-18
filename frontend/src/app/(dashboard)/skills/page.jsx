'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart3, Clock, Zap } from 'lucide-react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';

export default function SkillsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchSkills(); }, []);

  const fetchSkills = async () => {
    try {
      const res = await api.get('/assessments/me');
      setData(res.data);
    } catch (error) {
      console.error('Failed to fetch skills:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-40 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2].map(i => <Card key={i}><CardContent className="pt-6"><div className="h-72 bg-muted animate-pulse rounded" /></CardContent></Card>)}
        </div>
      </div>
    );
  }

  const radarData = data?.latestSkills?.map(s => ({ skill: s.skill, score: s.score, fullMark: s.maxScore })) || [];
  const barData = data?.latestSkills?.sort((a, b) => b.score - a.score)?.map(s => ({ skill: s.skill, score: s.score })) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Skill Map</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Your skill profile from assessments</p>
      </div>

      {radarData.length > 0 ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />Skill Radar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="skill" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                    <Radar name="Score" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.12} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />Score Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={barData} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <YAxis type="category" dataKey="skill" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} width={90} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '6px', color: 'hsl(var(--foreground))', fontSize: 12 }} />
                    <Bar dataKey="score" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Quick skill list */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">All Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2.5">
                {barData.map((s, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{s.skill}</span>
                      <span className="text-muted-foreground font-mono text-xs">{s.score}%</span>
                    </div>
                    <Progress value={s.score} className="h-1.5" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />Assessment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {data?.assessments?.map((a, i) => (
                  <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${a.source === 'skill_lab' ? 'bg-primary' : a.source === 'voice_ai' ? 'bg-[hsl(var(--chart-4))]' : 'bg-[hsl(var(--success))]'}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{a.category}</p>
                        <p className="text-[11px] text-muted-foreground capitalize">{a.source.replace('_', ' ')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <Badge variant="secondary" className="font-mono text-xs">{a.overallScore}%</Badge>
                      <span className="text-[11px] text-muted-foreground whitespace-nowrap">{new Date(a.completedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-14">
            <div className="text-center text-muted-foreground">
              <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-15" />
              <h3 className="text-base font-semibold text-foreground mb-1">No Skills Mapped Yet</h3>
              <p className="text-sm max-w-sm mx-auto">Complete assessments to see your skill map.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
