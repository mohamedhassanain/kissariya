import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useShop } from './useShop';
import { toast } from 'sonner';

export interface Category {
  id: string;
  shop_id: string;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export function useCategories() {
  const { shop } = useShop();
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories', shop?.id],
    queryFn: async () => {
      if (!shop) return [];
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('shop_id', shop.id)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data as Category[];
    },
    enabled: !!shop,
  });

  const createCategory = useMutation({
    mutationFn: async (name: string) => {
      if (!shop) throw new Error('Shop not found');
      
      const maxOrder = categories.length > 0 
        ? Math.max(...categories.map(c => c.sort_order)) + 1 
        : 0;
      
      const { data, error } = await supabase
        .from('categories')
        .insert({
          shop_id: shop.id,
          name,
          sort_order: maxOrder,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as Category;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Catégorie créée !');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { data, error } = await supabase
        .from('categories')
        .update({ name })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Category;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Catégorie mise à jour !');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['subcategories'] });
      toast.success('Catégorie supprimée !');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  return {
    categories,
    isLoading,
    createCategory,
    updateCategory,
    deleteCategory,
  };
}

export function useSubcategories(categoryId?: string) {
  const queryClient = useQueryClient();

  const { data: subcategories = [], isLoading } = useQuery({
    queryKey: ['subcategories', categoryId],
    queryFn: async () => {
      if (!categoryId) return [];
      const { data, error } = await supabase
        .from('subcategories')
        .select('*')
        .eq('category_id', categoryId)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data as Subcategory[];
    },
    enabled: !!categoryId,
  });

  const createSubcategory = useMutation({
    mutationFn: async ({ categoryId, name }: { categoryId: string; name: string }) => {
      const maxOrder = subcategories.length > 0 
        ? Math.max(...subcategories.map(s => s.sort_order)) + 1 
        : 0;
      
      const { data, error } = await supabase
        .from('subcategories')
        .insert({
          category_id: categoryId,
          name,
          sort_order: maxOrder,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as Subcategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcategories'] });
      toast.success('Sous-catégorie créée !');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const updateSubcategory = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { data, error } = await supabase
        .from('subcategories')
        .update({ name })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Subcategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcategories'] });
      toast.success('Sous-catégorie mise à jour !');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const deleteSubcategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('subcategories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcategories'] });
      toast.success('Sous-catégorie supprimée !');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  return {
    subcategories,
    isLoading,
    createSubcategory,
    updateSubcategory,
    deleteSubcategory,
  };
}