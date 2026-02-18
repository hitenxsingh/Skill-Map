'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Plus, X, Loader2, CheckCircle2, Award, FileText, Sparkles, AlertCircle, Calendar as CalendarIcon, Link as LinkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const TYPES = [
  { id: 'certificate', label: 'Certification', icon: Award, desc: 'Professional certs' },
  { id: 'course', label: 'Course', icon: FileText, desc: 'Online courses' },
  { id: 'project', label: 'Project', icon: Sparkles, desc: 'Side projects / OSS' },
];

export default function AddAssessmentPage() {
  const router = useRouter();
  const [type, setType] = useState('certificate');
  const [title, setTitle] = useState('');
  const [provider, setProvider] = useState('');
  const [date, setDate] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills(prev => [...prev, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const handleSubmit = async () => {
    if (!title || !provider || !date) { setError('Fill in all required fields.'); return; }
    setSubmitting(true);
    setError('');
    try {
      await api.post('/assessments', {
        source: 'manual_achievement',
        category: type,
        scores: skills.map(s => ({ skill: s, score: 100, maxScore: 100 })),
        metadata: { title, provider, completionDate: date, certificateUrl: url, description, type }
      });
      setSuccess(true);
      setTimeout(() => router.push('/profile'), 1500);
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-8 pb-8">
            <div className="text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-[hsl(var(--success))] mx-auto" />
              <h3 className="text-lg font-bold">Achievement Added!</h3>
              <p className="text-sm text-muted-foreground">Your profile has been updated.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Add Achievement</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Add certifications, courses, and projects</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Type picker */}
        <div className="lg:col-span-1 space-y-2">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Type</p>
          {TYPES.map(t => (
            <button
              key={t.id}
              onClick={() => setType(t.id)}
              className={cn(
                'w-full text-left p-3 rounded-lg border transition-colors',
                type === t.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent'
              )}
            >
              <div className="flex items-center gap-2.5">
                <t.icon className={cn('w-4 h-4', type === t.id ? 'text-primary' : 'text-muted-foreground')} />
                <div>
                  <p className={cn('text-sm font-medium', type === t.id && 'text-primary')}>{t.label}</p>
                  <p className="text-[11px] text-muted-foreground">{t.desc}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Form */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Title <span className="text-destructive">*</span></Label>
              <Input placeholder="e.g. AWS Solutions Architect" value={title} onChange={e => setTitle(e.target.value)} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Provider <span className="text-destructive">*</span></Label>
                <Input placeholder="e.g. Coursera" value={provider} onChange={e => setProvider(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Date <span className="text-destructive">*</span></Label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">URL (optional)</Label>
              <Input placeholder="https://..." value={url} onChange={e => setUrl(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Skills</Label>
              <div className="flex gap-2">
                <Input placeholder="Add skill tag..." value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())} className="max-w-xs" />
                <Button onClick={addSkill} variant="secondary" size="sm">Add</Button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {skills.map((s, i) => (
                  <Badge key={i} variant="outline" className="gap-1 pr-1 text-xs">
                    {s}<button onClick={() => setSkills(prev => prev.filter(x => x !== s))} className="hover:text-destructive"><X className="w-3 h-3" /></button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Description</Label>
              <Textarea placeholder="What did you learn?" rows={3} value={description} onChange={e => setDescription(e.target.value)} />
            </div>

            {error && (
              <div className="p-2.5 bg-destructive/10 text-destructive text-sm rounded-md flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5" />{error}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => router.back()}>Cancel</Button>
              <Button size="sm" onClick={handleSubmit} disabled={submitting}>
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
