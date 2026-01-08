import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Shop {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  whatsapp_number: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface ShopFormData {
  name: string;
  description?: string;
  logo_url?: string;
  whatsapp_number: string;
  slug: string;
}

export function useShop() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: shop, isLoading, error } = useQuery({
    queryKey: ['shop', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Shop | null;
    },
    enabled: !!user,
  });

  const createShop = useMutation({
    mutationFn: async (formData: ShopFormData) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('shops')
        .insert({
          user_id: user.id,
          ...formData,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as Shop;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop'] });
      toast.success('Boutique créée avec succès !');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const updateShop = useMutation({
    mutationFn: async (formData: Partial<ShopFormData>) => {
      if (!user || !shop) throw new Error('Shop not found');
      
      const { data, error } = await supabase
        .from('shops')
        .update(formData)
        .eq('id', shop.id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Shop;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop'] });
      toast.success('Boutique mise à jour !');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  return {
    shop,
    isLoading,
    error,
    createShop,
    updateShop,
    hasShop: !!shop,
  };
}