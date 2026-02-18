'use client';

import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { TooltipProvider } from '@/components/ui/tooltip';

export default function DashboardLayout({ children }) {
  return (
    <TooltipProvider delayDuration={0}>
      <div className="h-screen bg-background flex overflow-hidden">
        <Sidebar />
        
        {/* Main area — offset by sidebar width, constrained to viewport */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 pl-17 lg:pl-65 transition-all duration-300">
          <TopBar />
          <main className="flex-1 min-h-0 p-4 lg:p-6 xl:p-8 overflow-x-hidden overflow-y-auto">
            <div className="w-full max-w-350 mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
