import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: shop } = await supabase
        .from('shops')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!shop) return [];

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('shop_id', shop.id)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as Category[];
    },
  });

  const createCategory = useMutation({
    mutationFn: async (name: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data: shop } = await supabase
        .from('shops')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!shop) throw new Error('Boutique non trouvée');

      const { data, error } = await supabase
        .from('categories')
        .insert([{ name, shop_id: shop.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Catégorie créée avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de la création de la catégorie');
      console.error(error);
    },
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { data, error } = await supabase
        .from('categories')
        .update({ name, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Catégorie mise à jour');
    },
    onError: (error) => {
      toast.error('Erreur lors de la mise à jour');
      console.error(error);
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
      toast.success('Catégorie supprimée');
    },
    onError: (error) => {
      toast.error('Erreur lors de la suppression');
      console.error(error);
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
      const { data, error } = await supabase
        .from('subcategories')
        .insert([{ category_id: categoryId, name }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcategories', categoryId] });
      toast.success('Sous-catégorie créée');
    },
    onError: (error) => {
      toast.error('Erreur lors de la création');
      console.error(error);
    },
  });

  const updateSubcategory = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { data, error } = await supabase
        .from('subcategories')
        .update({ name, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcategories', categoryId] });
      toast.success('Sous-catégorie mise à jour');
    },
    onError: (error) => {
      toast.error('Erreur lors de la mise à jour');
      console.error(error);
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
      queryClient.invalidateQueries({ queryKey: ['subcategories', categoryId] });
      toast.success('Sous-catégorie supprimée');
    },
    onError: (error) => {
      toast.error('Erreur lors de la suppression');
      console.error(error);
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
