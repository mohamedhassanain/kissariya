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
      
      const last7Days: DailyStats[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const startDate = startOfDay(date).toISOString();
        const endDate = startOfDay(subDays(date, -1)).toISOString();
        
        const { count, error } = await supabase
          .from('kissariya_views')
          .select('*', { count: 'exact', head: true })
          .eq('shop_id', shop.id)
          .gte('viewed_at', startDate)
          .lt('viewed_at', endDate);
        
        if (error) throw error;
        
        last7Days.push({
          date: format(date, 'dd/MM'),
          views: count || 0,
        });
      }
      
      return last7Days;
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
