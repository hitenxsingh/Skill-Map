'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Briefcase, Save, Loader2, X, Plus, CheckCircle2 } from 'lucide-react';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    currentRole: '', yearsOfExperience: 0, techStack: [],
    desiredRole: '', department: '', bio: ''
  });
  const [techInput, setTechInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user?.profile) {
      setForm({
        currentRole: user.profile.currentRole || '',
        yearsOfExperience: user.profile.yearsOfExperience || 0,
        techStack: user.profile.techStack || [],
        desiredRole: user.profile.desiredRole || '',
        department: user.profile.department || '',
        bio: user.profile.bio || ''
      });
    }
  }, [user]);

  const addTech = () => {
    if (techInput.trim() && !form.techStack.includes(techInput.trim())) {
      setForm(prev => ({ ...prev, techStack: [...prev.techStack, techInput.trim()] }));
      setTechInput('');
    }
  };

  const removeTech = (tech) => {
    setForm(prev => ({ ...prev, techStack: prev.techStack.filter(t => t !== tech) }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put('/profile', form);
      updateUser(res.data.user);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save profile:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">My Profile</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your professional identity</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Profile card */}
        <Card className="xl:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-lg font-bold">{user?.name}</h2>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <div className="flex gap-2 justify-center mt-2">
                  <Badge variant="secondary">{user?.role === 'admin' ? 'Org Head' : 'Employee'}</Badge>
                  {form.department && <Badge variant="outline">{form.department}</Badge>}
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4 w-full">
                <div className="p-3 rounded-lg bg-accent/50 text-center">
                  <p className="text-xl font-bold">{form.yearsOfExperience}</p>
                  <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Years Exp</p>
                </div>
                <div className="p-3 rounded-lg bg-accent/50 text-center">
                  <p className="text-xl font-bold">{form.techStack.length}</p>
                  <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Skills</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-primary" />
              Professional Details
            </CardTitle>
            <CardDescription className="text-xs">Update your career information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Current Role</Label>
                <Input placeholder="e.g. Frontend Developer" value={form.currentRole} onChange={e => setForm(prev => ({ ...prev, currentRole: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Years of Experience</Label>
                <Input type="number" min="0" max="50" value={form.yearsOfExperience} onChange={e => setForm(prev => ({ ...prev, yearsOfExperience: parseInt(e.target.value) || 0 }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Target Role</Label>
                <Input placeholder="e.g. Senior Frontend Developer" value={form.desiredRole} onChange={e => setForm(prev => ({ ...prev, desiredRole: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Department</Label>
                <Input placeholder="e.g. Engineering" value={form.department} onChange={e => setForm(prev => ({ ...prev, department: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">About</Label>
              <textarea
                className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
                placeholder="Brief bio..."
                value={form.bio}
                onChange={e => setForm(prev => ({ ...prev, bio: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Skills & Tech Stack</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a skill..."
                  value={techInput}
                  onChange={e => setTechInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTech(); } }}
                  className="max-w-xs"
                />
                <Button type="button" onClick={addTech} variant="secondary" size="sm">
                  <Plus className="w-3.5 h-3.5 mr-1" />Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5 min-h-10 p-3 rounded-md border border-border bg-accent/20">
                {form.techStack.length > 0 ? form.techStack.map((tech, i) => (
                  <Badge key={i} variant="secondary" className="gap-1 pr-1">
                    {tech}
                    <button onClick={() => removeTech(tech)} className="ml-0.5 hover:text-destructive"><X className="w-3 h-3" /></button>
                  </Badge>
                )) : (
                  <p className="text-xs text-muted-foreground">No skills added yet</p>
                )}
              </div>
            </div>

            <Separator />

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving} size="sm">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> :
                 saved ? <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> :
                 <Save className="w-3.5 h-3.5 mr-1.5" />}
                {saved ? 'Saved' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
