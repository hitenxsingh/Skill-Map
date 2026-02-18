'use client';

import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, Plus, X, Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Category colors for visual grouping
const categoryColors = {
  frontend: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  backend: 'bg-green-500/10 text-green-500 border-green-500/20',
  devops: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  cloud: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  data: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
  ml: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
  security: 'bg-red-500/10 text-red-500 border-red-500/20',
  mobile: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
  design: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  testing: 'bg-teal-500/10 text-teal-500 border-teal-500/20',
  leadership: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
  database: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  other: 'bg-gray-500/10 text-gray-500 border-gray-500/20'
};

export default function SkillSelect({ 
  selected = [], 
  onChange, 
  placeholder = 'Search or add skills...',
  maxSelected = 20,
  showCategories = true 
}) {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Fetch skills from database
  useEffect(() => {
    api.get('/assessments/skills')
      .then(res => setSkills(res.data.skills || []))
      .catch(err => console.error('Failed to load skills:', err))
      .finally(() => setLoading(false));
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter skills based on search
  const filteredSkills = skills.filter(skill => 
    skill.name.toLowerCase().includes(search.toLowerCase()) &&
    !selected.includes(skill.name)
  );

  // Group skills by category
  const groupedSkills = filteredSkills.reduce((acc, skill) => {
    const cat = skill.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(skill);
    return acc;
  }, {});

  // Check if search term is a new skill
  const isNewSkill = search.trim().length > 1 && 
    !skills.some(s => s.name.toLowerCase() === search.toLowerCase()) &&
    !selected.some(s => s.toLowerCase() === search.toLowerCase());

  // Select a skill
  const selectSkill = (skillName) => {
    if (selected.length >= maxSelected) return;
    onChange([...selected, skillName]);
    setSearch('');
  };

  // Remove a skill
  const removeSkill = (skillName) => {
    onChange(selected.filter(s => s !== skillName));
  };

  // Add a new skill to database
  const addNewSkill = async () => {
    if (!isNewSkill || adding) return;
    setAdding(true);
    try {
      const res = await api.post('/assessments/skills', { 
        name: search.trim(),
        category: 'other' 
      });
      // Add to local state
      setSkills(prev => [...prev, res.data.skill]);
      // Select it
      selectSkill(search.trim());
    } catch (err) {
      console.error('Failed to add skill:', err);
    } finally {
      setAdding(false);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (isNewSkill) {
        addNewSkill();
      } else if (filteredSkills.length > 0) {
        selectSkill(filteredSkills[0].name);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Selected Skills */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selected.map((skill, i) => {
            const skillData = skills.find(s => s.name === skill);
            const colorClass = categoryColors[skillData?.category] || categoryColors.other;
            return (
              <Badge 
                key={i} 
                variant="outline" 
                className={cn('gap-1 pr-1 text-xs', colorClass)}
              >
                {skill}
                <button 
                  onClick={() => removeSkill(skill)} 
                  className="hover:opacity-70 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="pl-9 pr-4"
          disabled={selected.length >= maxSelected}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Dropdown */}
      {isOpen && !loading && (
        <div className="absolute z-50 w-full mt-1 rounded-lg border border-border bg-popover shadow-lg">
          <ScrollArea className="max-h-72">
            <div className="p-1">
              {/* Add new skill option */}
              {isNewSkill && (
                <button
                  onClick={addNewSkill}
                  disabled={adding}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-left text-sm hover:bg-accent transition-colors"
                >
                  {adding ? (
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  ) : (
                    <Plus className="w-4 h-4 text-primary" />
                  )}
                  <span>Add &ldquo;<strong className="text-primary">{search}</strong>&rdquo; as new skill</span>
                </button>
              )}

              {/* Grouped skills */}
              {showCategories ? (
                Object.entries(groupedSkills).map(([category, categorySkills]) => (
                  <div key={category}>
                    <p className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      {category}
                    </p>
                    {categorySkills.map((skill, i) => (
                      <button
                        key={i}
                        onClick={() => selectSkill(skill.name)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-md text-left text-sm hover:bg-accent transition-colors"
                      >
                        <span>{skill.name}</span>
                        <Badge 
                          variant="outline" 
                          className={cn('text-[9px] py-0 h-4', categoryColors[skill.category] || categoryColors.other)}
                        >
                          {skill.category}
                        </Badge>
                      </button>
                    ))}
                  </div>
                ))
              ) : (
                filteredSkills.map((skill, i) => (
                  <button
                    key={i}
                    onClick={() => selectSkill(skill.name)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-md text-left text-sm hover:bg-accent transition-colors"
                  >
                    <span>{skill.name}</span>
                  </button>
                ))
              )}

              {/* Empty state */}
              {filteredSkills.length === 0 && !isNewSkill && (
                <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                  {search ? 'No matching skills found' : 'Start typing to search skills'}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Helper text */}
      {selected.length >= maxSelected && (
        <p className="text-[11px] text-muted-foreground mt-1">
          Maximum {maxSelected} skills allowed
        </p>
      )}
    </div>
  );
}
