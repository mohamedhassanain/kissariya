import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useShop } from './useShop';
import { startOfDay, subDays, format } from 'date-fns';

export interface DailyStats {
  date: string;
  views: number;
}

export function useStats() {
  const { shop } = useShop();

  const { data: totalViews = 0, isLoading: isLoadingTotal } = useQuery({
    queryKey: ['kissariya-views-total', shop?.id],
    queryFn: async () => {
      if (!shop) return 0;
      const { count, error } = await supabase
        .from('kissariya_views')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', shop.id);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!shop,
  });

  const { data: dailyStats = [], isLoading: isLoadingDaily } = useQuery({
    queryKey: ['kissariya-views-daily', shop?.id],
    queryFn: async () => {
      if (!shop) return [];
      
      const sevenDaysAgo = startOfDay(subDays(new Date(), 6)).toISOString();
      
      const { data, error } = await supabase
        .from('kissariya_views')
        .select('viewed_at')
        .eq('shop_id', shop.id)
        .gte('viewed_at', sevenDaysAgo);
      
      if (error) throw error;

      const statsMap = new Map<string, number>();
      for (let i = 0; i < 7; i++) {
        const date = subDays(new Date(), i);
        statsMap.set(format(date, 'dd/MM'), 0);
      }

      data?.forEach(view => {
        const dateKey = format(new Date(view.viewed_at), 'dd/MM');
        if (statsMap.has(dateKey)) {
          statsMap.set(dateKey, (statsMap.get(dateKey) || 0) + 1);
        }
      });

      return Array.from(statsMap.entries())
        .map(([date, views]) => ({ date, views }))
        .reverse();
    },
    enabled: !!shop,
  });

  const { data: todayViews = 0, isLoading: isLoadingToday } = useQuery({
    queryKey: ['kissariya-views-today', shop?.id],
    queryFn: async () => {
      if (!shop) return 0;
      const today = startOfDay(new Date()).toISOString();
      
      const { count, error } = await supabase
        .from('kissariya_views')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', shop.id)
        .gte('viewed_at', today);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!shop,
  });

  return {
    totalViews,
    todayViews,
    dailyStats,
    isLoading: isLoadingTotal || isLoadingDaily || isLoadingToday,
  };
}
