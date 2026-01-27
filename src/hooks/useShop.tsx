import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './auth-utils';
import { toast } from 'sonner';
import { Shop } from '@/types/product';
import { shopSchema, ShopInput } from '@/lib/schemas';

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
    mutationFn: async (formData: ShopInput) => {
      if (!user) throw new Error('User not authenticated');
      
      const validatedData = shopSchema.parse(formData);
      
      const { data, error } = await supabase
        .from('shops')
        .insert({
          user_id: user.id,
          name: validatedData.name,
          slug: validatedData.slug,
          whatsapp_number: validatedData.whatsapp_number,
          description: validatedData.description,
          logo_url: validatedData.logo_url,
          cover_url: validatedData.cover_url,
          location_city: validatedData.location_city,
          location_url: validatedData.location_url,
          show_location: validatedData.show_location,
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
    mutationFn: async (formData: Partial<ShopInput>) => {
      if (!user || !shop) throw new Error('Shop not found');
      
      const validatedData = shopSchema.partial().parse(formData);
      
      const { data, error } = await supabase
        .from('shops')
        .update(validatedData)
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
