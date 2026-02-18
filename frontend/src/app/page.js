'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight, BarChart3, Users, Target, Zap, GraduationCap,
  BotMessageSquare, TrendingUp, CheckCircle2, ChevronRight, Sparkles
} from 'lucide-react';

const Logo = ({ size = 32 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 200 200" fill="none">
    <rect width="200" height="200" rx="40" fill="hsl(199, 89%, 48%)" />
    <path d="M100 40L160 75V145L100 180L40 145V75L100 40Z" fill="white" fillOpacity="0.2" />
    <path d="M100 60L145 82V128L100 150L55 128V82L100 60Z" fill="white" fillOpacity="0.35" />
    <path d="M100 80L125 94V118L100 132L75 118V94L100 80Z" fill="white" />
  </svg>
);

const features = [
  { icon: BarChart3, title: 'Skill Analytics', description: 'Real-time visibility into your workforce capabilities with detailed skill breakdowns.' },
  { icon: BotMessageSquare, title: 'AI-Powered Insights', description: 'Natural language queries to find top performers and build teams instantly.' },
  { icon: Target, title: 'Gap Analysis', description: 'Automatically identify skill gaps and get actionable training recommendations.' },
  { icon: GraduationCap, title: 'Learning Paths', description: 'Personalized course recommendations based on skill gaps and career goals.' },
  { icon: Users, title: 'Team Building', description: 'Intelligently compose project teams based on skill requirements.' },
  { icon: TrendingUp, title: 'Progress Tracking', description: 'Monitor skill development over time with assessment history and metrics.' }
];

const stats = [
  { value: '500+', label: 'Employees' },
  { value: '145', label: 'Skills' },
  { value: '98%', label: 'Accuracy' },
  { value: '2x', label: 'Faster' }
];

const benefits = [
  'Reduce skill assessment time by 80%',
  'Data-driven team composition',
  'Identify training needs proactively',
  'Close skill gaps systematically'
];

export default function LandingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!loading && user) router.push('/dashboard');
  }, [user, loading, router]);

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Logo size={48} />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2.5">
              <Logo size={28} />
              <span className="font-bold text-lg tracking-tight">SkillMap</span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Get Started <ArrowRight className="w-3.5 h-3.5 ml-1.5" /></Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 text-xs px-3 py-1">
              <Sparkles className="w-3 h-3 mr-1.5" />
              Enterprise Skill Intelligence
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-[1.1]">
              Map, Measure & Grow
              <span className="text-primary block mt-1">Your Team's Skills</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Track employee competencies, identify skill gaps, and build high-performance teams with AI-powered insights.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto h-11 px-6">
                  Start Free Trial <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto h-11 px-6">
                  Sign In to Dashboard
                </Button>
              </Link>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="mt-16 rounded-xl border border-border bg-card shadow-2xl overflow-hidden">
            <div className="h-8 bg-muted/50 border-b border-border flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
              <span className="ml-3 text-xs text-muted-foreground">SkillMap Dashboard</span>
            </div>
            <div className="p-6 bg-gradient-to-br from-card to-muted/20">
              <div className="grid grid-cols-4 gap-4 mb-6">
                {stats.map((stat, i) => (
                  <div key={i} className="p-4 rounded-lg bg-background/80 border border-border/50">
                    <p className="text-2xl font-bold text-primary">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 h-40 rounded-lg bg-background/80 border border-border/50 flex items-center justify-center">
                  <BarChart3 className="w-8 h-8 text-primary/30" />
                </div>
                <div className="h-40 rounded-lg bg-background/80 border border-border/50 flex items-center justify-center">
                  <Users className="w-8 h-8 text-primary/30" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-y border-border bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl font-bold text-primary mb-1">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Everything You Need</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Comprehensive tools to understand and develop your workforce capabilities.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <Card key={i} className="border-border/60 hover:border-primary/20 transition-colors">
                <CardContent className="pt-6 pb-6">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <f.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4 sm:px-6 bg-muted/30 border-y border-border">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-4">Why Choose SkillMap</h2>
            <p className="text-muted-foreground mb-8">
              Transform how you understand your team's capabilities. Make data-driven decisions about hiring and training.
            </p>
            <div className="space-y-3">
              {benefits.map((b, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <span className="text-sm">{b}</span>
                </div>
              ))}
            </div>
          </div>
          <Card>
            <CardContent className="pt-6 pb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <BotMessageSquare className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">AI Assistant</p>
                  <p className="text-xs text-muted-foreground">Ask anything about your team</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-muted/50 text-sm">"Who are our top React developers?"</div>
                <div className="p-3 rounded-lg bg-primary/10 text-sm">Found 12 React experts. Top 3: Sarah Chen (95%), Mike Johnson (92%)...</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Role Features */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Built for Everyone</h2>
            <p className="text-muted-foreground">Different views for different roles in your organization.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="pt-6 pb-6">
                <Badge variant="secondary" className="mb-4">For Employees</Badge>
                <h3 className="text-xl font-bold mb-3">Personal Skill Dashboard</h3>
                <p className="text-muted-foreground text-sm mb-4">Track your skills and get personalized recommendations.</p>
                <ul className="space-y-2">
                  {['Skill visualization', 'Learning recommendations', 'Assessment history', 'Career tracking'].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <ChevronRight className="w-4 h-4 text-primary" />{item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 pb-6">
                <Badge variant="secondary" className="mb-4">For Admins</Badge>
                <h3 className="text-xl font-bold mb-3">Command Center</h3>
                <p className="text-muted-foreground text-sm mb-4">Bird's eye view with powerful analytics and AI tools.</p>
                <ul className="space-y-2">
                  {['Org-wide analytics', 'Gap analysis', 'AI team builder', 'Employee comparison'].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <ChevronRight className="w-4 h-4 text-primary" />{item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 border-t border-border bg-muted/30">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join organizations that use SkillMap to make smarter decisions about their people.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto h-11 px-8">
                Get Started Free <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto h-11 px-8">Sign In</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 border-t border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo size={20} />
            <span className="font-semibold text-sm">SkillMap</span>
          </div>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} SkillMap</p>
        </div>
      </footer>
    </div>
  );
}
