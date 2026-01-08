import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useShop } from './useShop';
import { toast } from 'sonner';

export interface Product {
  id: string;
  shop_id: string;
  category_id: string | null;
  subcategory_id: string | null;
  name: string;
  description: string | null;
  price: number;
  original_price: number | null;
  is_promotion: boolean;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductFormData {
  name: string;
  description?: string;
  price: number;
  original_price?: number;
  is_promotion?: boolean;
  category_id?: string;
  subcategory_id?: string;
  image_url?: string;
  is_active?: boolean;
}

export function useProducts() {
  const { shop } = useShop();
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', shop?.id],
    queryFn: async () => {
      if (!shop) return [];
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', shop.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Product[];
    },
    enabled: !!shop,
  });

  const createProduct = useMutation({
    mutationFn: async (formData: ProductFormData) => {
      if (!shop) throw new Error('Shop not found');
      
      const { data, error } = await supabase
        .from('products')
        .insert({
          shop_id: shop.id,
          ...formData,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as Product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produit ajouté !');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const updateProduct = useMutation({
    mutationFn: async ({ id, ...formData }: ProductFormData & { id: string }) => {
      const { data, error } = await supabase
        .from('products')
        .update(formData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produit mis à jour !');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produit supprimé !');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const promotionProducts = products.filter(p => p.is_promotion);
  const activeProducts = products.filter(p => p.is_active);

  return {
    products,
    promotionProducts,
    activeProducts,
    isLoading,
    createProduct,
    updateProduct,
    deleteProduct,
  };
}