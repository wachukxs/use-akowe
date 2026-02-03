'use client';

import { useState } from 'react';
import LeadsTab from './LeadsTab';
import AttributionTab from './AttributionTab';
import { Mail, TrendingUp } from 'lucide-react';

type MarketingSubSection = 'leads' | 'attribution';

export default function MarketingTab() {
  const [activeSection, setActiveSection] = useState<MarketingSubSection>('leads');

  return (
    <div className="space-y-6">
      {/* Sub-section Navigation */}
      <div className="flex items-center gap-2 border-b-2 border-[hsl(var(--border-strong))]">
        <button
          onClick={() => setActiveSection('leads')}
          className={`px-3 sm:px-6 py-2.5 sm:py-3 min-h-[44px] text-xs sm:text-sm font-semibold uppercase tracking-[0.16em] border-b-2 -mb-[2px] transition-colors flex items-center gap-1 sm:gap-2 cursor-pointer whitespace-nowrap touch-manipulation ${
            activeSection === 'leads'
              ? 'border-[hsl(var(--primary))] text-[hsl(var(--primary))]'
              : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
          }`}
        >
          <Mail size={14} className="sm:w-4 sm:h-4" />
          <span>Leads</span>
        </button>
        <button
          onClick={() => setActiveSection('attribution')}
          className={`px-3 sm:px-6 py-2.5 sm:py-3 min-h-[44px] text-xs sm:text-sm font-semibold uppercase tracking-[0.16em] border-b-2 -mb-[2px] transition-colors flex items-center gap-1 sm:gap-2 cursor-pointer whitespace-nowrap touch-manipulation ${
            activeSection === 'attribution'
              ? 'border-[hsl(var(--primary))] text-[hsl(var(--primary))]'
              : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
          }`}
        >
          <TrendingUp size={14} className="sm:w-4 sm:h-4" />
          <span>Attribution</span>
        </button>
      </div>

      {/* Content */}
      {activeSection === 'leads' ? <LeadsTab /> : <AttributionTab />}
    </div>
  );
}
