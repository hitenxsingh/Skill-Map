'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  LayoutDashboard,
  User,
  BarChart3,
  GraduationCap,
  Search,
  BotMessageSquare,
  Users,
  PlusCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';

const employeeNav = [
  { section: 'Overview' },
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'My Profile', href: '/profile', icon: User },
  { section: 'Skills' },
  { label: 'Skill Map', href: '/skills', icon: BarChart3 },
  { label: 'Add Achievement', href: '/assessments/add', icon: PlusCircle },
  { label: 'Learning Plan', href: '/learning', icon: GraduationCap },
];

const adminNav = [
  { section: 'Overview' },
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'My Profile', href: '/profile', icon: User },
  { section: 'Skills' },
  { label: 'Skill Map', href: '/skills', icon: BarChart3 },
  { label: 'Add Achievement', href: '/assessments/add', icon: PlusCircle },
  { section: 'Organization' },
  { label: 'Command Center', href: '/admin/skills', icon: Users },
  { label: 'Matchmaker', href: '/admin/matchmaker', icon: Search },
  { label: 'AI Agent', href: '/admin/agent', icon: BotMessageSquare },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = user?.role === 'admin' ? adminNav : employeeNav;

  const logoSize = collapsed ? 30 : 26;

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r border-border bg-card flex flex-col transition-all duration-300 ease-in-out',
        collapsed ? 'w-17' : 'w-65'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center h-16 shrink-0 border-b border-border', collapsed ? 'justify-center px-2' : 'px-5 gap-3')}>
        <svg xmlns="http://www.w3.org/2000/svg" width={logoSize} height={logoSize} viewBox="0 0 200 200" fill="none">
          <rect width="200" height="200" rx="40" fill="hsl(var(--brand))" />
          <path d="M100 40L160 75V145L100 180L40 145V75L100 40Z" fill="white" fillOpacity="0.2" />
          <path d="M100 60L145 82V128L100 150L55 128V82L100 60Z" fill="white" fillOpacity="0.35" />
          <path d="M100 80L125 94V118L100 132L75 118V94L100 80Z" fill="white" />
        </svg>
        {!collapsed && (
          <span className="font-bold text-lg tracking-tight">SkillMap</span>
        )}
      </div>

      {/* Nav */}
      <ScrollArea className="flex-1 py-3">
        <nav className={cn('space-y-0.5', collapsed ? 'px-2' : 'px-3')}>
          {navItems.map((item, i) => {
            if (item.section) {
              if (collapsed) return <Separator key={i} className="my-3" />;
              return (
                <p key={i} className="px-3 pt-5 pb-1.5 text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-widest">
                  {item.section}
                </p>
              );
            }

            const isActive = pathname === item.href;
            const Icon = item.icon;

            const linkContent = (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg text-[13px] font-medium transition-colors duration-150',
                  collapsed ? 'justify-center p-2.5' : 'px-3 py-2',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                <Icon className="w-4.5 h-4.5 shrink-0" strokeWidth={isActive ? 2.2 : 1.8} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.href} delayDuration={0}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right" className="text-xs font-medium">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return <div key={item.href}>{linkContent}</div>;
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className={cn('border-t border-border', collapsed ? 'p-2' : 'p-3')}>
        {!collapsed ? (
          <div className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-accent transition-colors">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate leading-tight">{user?.name}</p>
              <p className="text-[11px] text-muted-foreground truncate">{user?.role === 'admin' ? 'Org Head' : 'Employee'}</p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={logout}
                className="flex items-center justify-center w-full p-2.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">Sign out</TooltipContent>
          </Tooltip>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full mt-1 py-1.5 rounded-md text-muted-foreground/60 hover:text-muted-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}
