'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { BarChart3, Users, GraduationCap, TrendingUp, Target, Award, Zap, BookOpen, ArrowRight, ChevronUp, ChevronDown, Sparkles } from 'lucide-react';
import Link from 'next/link';
import {
  BarChart, Bar, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

function StatCard({ title, value, subtitle, icon: Icon }) {
  return (
    <Card>
      <CardContent className="pt-5 pb-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className="p-2.5 rounded-lg bg-primary/10">
            <Icon className="w-4 h-4 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      if (user?.role === 'admin') {
        const [empRes, assessRes, distRes] = await Promise.all([
          api.get('/profile/employees'),
          api.get('/assessments'),
          api.get('/assessments/distribution')
        ]);

        // Skill distribution from assessment aggregation (no chat sessions created)
        const skillDistribution = (distRes.data.distribution || [])
          .map(d => ({
            skill: d.skill,
            employees: d.employeeCount,
            avgScore: Math.round(d.avgScore)
          }))
          .sort((a, b) => b.employees - a.employees)
          .slice(0, 15);

        // Department distribution
        const deptCounts = {};
        empRes.data.employees?.forEach(emp => {
          const dept = emp.profile?.department || 'Unassigned';
          deptCounts[dept] = (deptCounts[dept] || 0) + 1;
        });

        const deptDistribution = Object.entries(deptCounts)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value);

        setStats({
          totalEmployees: empRes.data.count,
          totalAssessments: assessRes.data.count,
          recentAssessments: assessRes.data.assessments?.slice(0, 8) || []
        });

        setAnalytics({
          skillDistribution,
          deptDistribution
        });
      } else {
        const assessRes = await api.get('/assessments/me');
        setStats({
          totalAssessments: assessRes.data.count,
          latestSkills: assessRes.data.latestSkills || []
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      setStats({});
      setAnalytics({ skillDistribution: [], deptDistribution: [] });
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-40 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}><CardContent className="pt-5 pb-5"><div className="h-16 bg-muted animate-pulse rounded" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {user?.role === 'admin' ? 'Organization overview' : 'Your skill development overview'}
        </p>
      </div>

      {user?.role === 'admin' ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Employees" value={stats?.totalEmployees || 0} subtitle="Active team members" icon={Users} />
            <StatCard title="Assessments" value={stats?.totalAssessments || 0} subtitle="Total completed" icon={BarChart3} />
            <StatCard title="Avg Score" value={stats?.recentAssessments?.length > 0 ? Math.round(stats.recentAssessments.reduce((a, b) => a + b.overallScore, 0) / stats.recentAssessments.length) + '%' : '—'} subtitle="Organization avg" icon={Target} />
            <StatCard title="This Month" value={stats?.recentAssessments?.filter(a => new Date(a.completedAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length || 0} subtitle="New assessments" icon={TrendingUp} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Skill Distribution Chart */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  Top Skills Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analytics?.skillDistribution?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.skillDistribution}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="skill" 
                        angle={-45} 
                        textAnchor="end" 
                        height={100} 
                        className="text-xs text-muted-foreground"
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis yAxisId="left" className="text-xs text-muted-foreground" tick={{ fontSize: 10 }} label={{ value: 'Employees', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }} />
                      <YAxis yAxisId="right" orientation="right" domain={[0, 100]} className="text-xs text-muted-foreground" tick={{ fontSize: 10 }} label={{ value: 'Avg Score %', angle: 90, position: 'insideRight', style: { fontSize: 10 } }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Bar yAxisId="left" dataKey="employees" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Employees" />
                      <Bar yAxisId="right" dataKey="avgScore" fill="hsl(var(--primary) / 0.4)" radius={[4, 4, 0, 0]} name="Avg Score %" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">Loading analytics...</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Department Distribution Chart */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  Department Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analytics?.deptDistribution?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analytics.deptDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {analytics.deptDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`hsl(${(index * 45) % 360}, 70%, 50%)`} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">Loading departments...</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-primary" />
                Recent Assessments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.recentAssessments?.length > 0 ? (
                <div className="space-y-1">
                  {stats.recentAssessments.map((a, i) => (
                    <div key={i} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                            {a.userId?.name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{a.userId?.name || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground truncate">{a.category} · {a.userId?.profile?.department || ''}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-3">
                        <Badge variant="secondary" className="font-mono text-xs">{a.overallScore}%</Badge>
                        <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                          {new Date(a.completedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No assessments yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Assessments" value={stats?.totalAssessments || 0} subtitle="Completed" icon={BarChart3} />
            <StatCard title="Skills" value={stats?.latestSkills?.length || 0} subtitle="Tracked" icon={Zap} />
            <StatCard title="Top Score" value={stats?.latestSkills?.length > 0 ? Math.max(...stats.latestSkills.map(s => s.score)) + '%' : '—'} subtitle="Best performance" icon={Award} />
            <StatCard title="Avg Score" value={stats?.latestSkills?.length > 0 ? Math.round(stats.latestSkills.reduce((a, s) => a + s.score, 0) / stats.latestSkills.length) + '%' : '—'} subtitle="Overall average" icon={Target} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Skills Radar Chart */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Skill Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats?.latestSkills?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={stats.latestSkills.slice(0, 8).map(s => ({ skill: s.skill.length > 12 ? s.skill.slice(0, 12) + '...' : s.skill, score: s.score, fullMark: 100 }))}>
                      <PolarGrid className="stroke-muted" />
                      <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Radar name="Score" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} strokeWidth={2} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">Complete assessments to see your skill map</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Highlights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {stats?.latestSkills?.length > 0 ? (
                  <>
                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                      <div className="flex items-center gap-2 mb-1">
                        <ChevronUp className="w-4 h-4 text-green-600" />
                        <span className="text-xs font-medium text-green-600">Top Skill</span>
                      </div>
                      <p className="font-semibold text-sm">{stats.latestSkills.sort((a, b) => b.score - a.score)[0]?.skill}</p>
                      <p className="text-xs text-muted-foreground">{stats.latestSkills.sort((a, b) => b.score - a.score)[0]?.score}% proficiency</p>
                    </div>
                    
                    <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                      <div className="flex items-center gap-2 mb-1">
                        <ChevronDown className="w-4 h-4 text-orange-600" />
                        <span className="text-xs font-medium text-orange-600">Needs Focus</span>
                      </div>
                      <p className="font-semibold text-sm">{stats.latestSkills.sort((a, b) => a.score - b.score)[0]?.skill}</p>
                      <p className="text-xs text-muted-foreground">{stats.latestSkills.sort((a, b) => a.score - b.score)[0]?.score}% proficiency</p>
                    </div>

                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <div className="flex items-center gap-2 mb-1">
                        <Target className="w-4 h-4 text-primary" />
                        <span className="text-xs font-medium text-primary">Progress</span>
                      </div>
                      <p className="font-semibold text-sm">{stats.latestSkills.filter(s => s.score >= 70).length} of {stats.latestSkills.length}</p>
                      <p className="text-xs text-muted-foreground">Skills above 70%</p>
                    </div>

                    <Link href="/learning">
                      <Button variant="outline" size="sm" className="w-full mt-2">
                        <BookOpen className="w-3.5 h-3.5 mr-2" />
                        View Learning Plan
                      </Button>
                    </Link>
                  </>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Target className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">No data yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* All Skills List */}
          <Card>
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                All Skills
              </CardTitle>
              <Link href="/skills">
                <Button variant="ghost" size="sm" className="text-xs gap-1">
                  View All <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {stats?.latestSkills?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {stats.latestSkills.sort((a, b) => b.score - a.score).slice(0, 10).map((skill, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg border bg-card hover:bg-accent/30 transition-colors">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${
                        skill.score >= 80 ? 'bg-green-500/10 text-green-600' :
                        skill.score >= 60 ? 'bg-blue-500/10 text-blue-600' :
                        skill.score >= 40 ? 'bg-orange-500/10 text-orange-600' :
                        'bg-red-500/10 text-red-600'
                      }`}>
                        {skill.score}%
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{skill.skill}</p>
                        <Progress value={skill.score} className="h-1 mt-1.5" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No skills tracked yet</p>
                  <p className="text-xs mt-1">Complete assessments to see your skill map</p>
                  <Link href="/assessments/add">
                    <Button variant="outline" size="sm" className="mt-4">
                      <GraduationCap className="w-3.5 h-3.5 mr-2" />
                      Add Achievement
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
