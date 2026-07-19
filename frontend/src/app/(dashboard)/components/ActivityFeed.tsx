import React from 'react';
import { ShoppingCart, Sparkles, TrendingDown, DollarSign } from 'lucide-react';
import { FeedEvent } from '../hooks/useDashboard';

interface ActivityFeedProps {
  timelineEvents: FeedEvent[];
}

export function ActivityFeed({ timelineEvents }: ActivityFeedProps) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 rounded-3xl p-5 shadow-[0_10px_30px_rgba(0,0,0,0.015)] divide-y divide-slate-100 dark:divide-slate-800/60 hover:shadow-[0_10px_35px_rgba(79,70,229,0.04)] transition-all duration-300">
      {timelineEvents.map((event) => {
        const isNegative = event.isNegative || false;
        
        // Determinar icono apropiado
        const getIcon = () => {
          if (event.type === 'SALE') return <ShoppingCart className="h-4 w-4" />;
          if (event.type === 'ALERT') return <TrendingDown className="h-4 w-4" />;
          return <DollarSign className="h-4 w-4" />;
        };

        return (
          <div key={event.id} className="flex justify-between items-center py-3.5 first:pt-0 last:pb-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`p-2.5 rounded-xl shrink-0 ${
                event.type === 'SALE' 
                  ? 'bg-indigo-50 text-indigo-650 dark:bg-indigo-950/20 dark:text-indigo-400' 
                  : event.type === 'ALERT'
                  ? 'bg-rose-50 text-rose-500 dark:bg-rose-950/20 dark:text-rose-455'
                  : 'bg-slate-50 text-slate-505 dark:bg-slate-800'
              }`}>
                {getIcon()}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">{event.title}</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-505 block mt-0.5">{event.description}</span>
              </div>
            </div>

            <div className="text-right shrink-0 ml-4 flex flex-col items-end">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">{event.time}</span>
              {event.amount !== undefined && (
                <span className={`text-xs font-black mt-0.5 ${isNegative ? 'text-rose-505' : 'text-slate-800 dark:text-slate-250'}`}>
                  {isNegative ? '-' : '+'}${event.amount.toFixed(2)}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
