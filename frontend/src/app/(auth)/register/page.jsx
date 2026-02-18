'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2, Mail, Lock, UserRound, Shield, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const LogoSvg = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 200 200" fill="none">
    <rect width="200" height="200" rx="40" fill="hsl(199, 89%, 48%)" />
    <path d="M100 40L160 75V145L100 180L40 145V75L100 40Z" fill="white" fillOpacity="0.2" />
    <path d="M100 60L145 82V128L100 150L55 128V82L100 60Z" fill="white" fillOpacity="0.35" />
    <path d="M100 80L125 94V118L100 132L75 118V94L100 80Z" fill="white" />
  </svg>
);

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('employee');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await register(name, email, password, role);
      router.push('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Mobile logo */}
      <div className="flex items-center gap-3 lg:hidden">
        <LogoSvg />
        <span className="text-lg font-bold tracking-tight">SkillMap</span>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
        <p className="text-muted-foreground text-sm">Join SkillMap and start mapping your skills</p>
      </div>

      <Card className="border-border shadow-xl shadow-black/5 bg-card">
        <CardContent className="pt-6 pb-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
              <div className="relative">
                <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 h-11"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-11"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">I am a</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('employee')}
                  className={cn(
                    "flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all duration-200 text-left",
                    role === 'employee'
                      ? "border-[hsl(var(--brand))] bg-[hsl(var(--brand))]/8 shadow-sm"
                      : "border-border hover:border-muted-foreground/30"
                  )}
                >
                  <UserCheck className={cn("w-5 h-5 shrink-0", role === 'employee' ? "text-[hsl(var(--brand))]" : "text-muted-foreground")} />
                  <div>
                    <p className={cn("text-sm font-semibold", role === 'employee' ? "text-[hsl(var(--brand))]" : "text-muted-foreground")}>Employee</p>
                    <p className="text-[11px] text-muted-foreground">Team member</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={cn(
                    "flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all duration-200 text-left",
                    role === 'admin'
                      ? "border-[hsl(var(--brand))] bg-[hsl(var(--brand))]/8 shadow-sm"
                      : "border-border hover:border-muted-foreground/30"
                  )}
                >
                  <Shield className={cn("w-5 h-5 shrink-0", role === 'admin' ? "text-[hsl(var(--brand))]" : "text-muted-foreground")} />
                  <div>
                    <p className={cn("text-sm font-semibold", role === 'admin' ? "text-[hsl(var(--brand))]" : "text-muted-foreground")}>Org Head</p>
                    <p className="text-[11px] text-muted-foreground">Administrator</p>
                  </div>
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-[hsl(var(--brand))] hover:bg-[hsl(199,89%,42%)] text-white font-semibold shadow-lg shadow-[hsl(var(--brand))]/20 transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="text-[hsl(var(--brand))] hover:underline font-medium transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}
