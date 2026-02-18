'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, X, Users, Plus, Loader2 } from 'lucide-react';

export default function MatchmakerPage() {
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState([]);
  const [maxResults, setMaxResults] = useState(10);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !skills.includes(s)) {
      setSkills([...skills, s]);
      setSkillInput('');
    }
  };

  const removeSkill = (skill) => setSkills(skills.filter(s => s !== skill));

  const search = async () => {
    if (skills.length === 0) return;
    setLoading(true);
    try {
      const res = await api.post('/mobility/match', { skills, limit: maxResults });
      setResults(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const initials = (name) => name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '??';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Project Matchmaker</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Find the best candidates by skill requirements</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Search Criteria</CardTitle>
          <CardDescription className="text-xs">Add required skills and find matching employees</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Type a skill (e.g. React, Python)..."
              value={skillInput}
              onChange={e => setSkillInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
              className="text-sm"
            />
            <Button size="sm" variant="outline" onClick={addSkill} disabled={!skillInput.trim()}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add
            </Button>
          </div>

          {skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {skills.map(s => (
                <Badge key={s} variant="secondary" className="text-xs gap-1 pr-1">
                  {s}
                  <button onClick={() => removeSkill(s)} className="ml-0.5 hover:text-destructive transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          <div className="flex items-end gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Max Results</label>
              <Input type="number" min={1} max={50} value={maxResults} onChange={e => setMaxResults(parseInt(e.target.value) || 10)} className="w-24 mt-1 text-sm" />
            </div>
            <Button onClick={search} disabled={skills.length === 0 || loading} size="sm">
              {loading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Search className="w-3.5 h-3.5 mr-1.5" />}
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {results && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">{results.count} candidate{results.count !== 1 ? 's' : ''} found</h2>
          </div>

          {results.candidates && results.candidates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {results.candidates.map((c, i) => (
                <Card key={i} className="hover:border-primary/30 transition-colors">
                  <CardContent className="pt-5 pb-5">
                    <div className="flex items-start gap-3 mb-3">
                      <Avatar className="h-9 w-9 text-xs">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">{initials(c.user?.name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm font-semibold truncate">{c.user?.name || 'Unknown'}</h3>
                          <Badge variant={c.matchPercentage >= 80 ? 'default' : c.matchPercentage >= 50 ? 'secondary' : 'outline'} className="text-[10px] shrink-0">
                            {c.matchPercentage}% match
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{c.user?.profile?.currentRole || c.user?.email}</p>
                        {c.user?.profile?.department && (
                          <p className="text-[11px] text-muted-foreground">{c.user.profile.department}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {c.skills?.map((sk, j) => (
                        <div key={j}>
                          <div className="flex justify-between text-xs mb-0.5">
                            <span className="text-muted-foreground">{sk.skill}</span>
                            <span className="font-medium">{sk.score}%</span>
                          </div>
                          <Progress value={sk.score} className="h-1.5" />
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
                      <span className="text-[11px] text-muted-foreground">{c.matchedSkillCount}/{c.totalRequired} skills</span>
                      <span className="text-[11px] text-muted-foreground">Avg: {c.avgScore}%</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-14 text-center text-muted-foreground">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-15" />
                <h3 className="text-base font-semibold text-foreground mb-1">No Matches Found</h3>
                <p className="text-sm">Try adjusting your skill requirements or adding fewer skills.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
