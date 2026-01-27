import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { formatWhatsAppNumber } from '@/lib/utils';
import { toast } from 'sonner';
import { Product } from '@/types/product';
import { useAuth } from './auth-utils';

export function useProductActions() {
  const { user } = useAuth();

  const parseImages = useCallback((imageUrl: string | null): string[] => {
    if (!imageUrl) return [];
    try {
      if (imageUrl.startsWith('[')) {
        return JSON.parse(imageUrl);
      }
      return [imageUrl];
    } catch {
      return [imageUrl];
    }
  }, []);

  const handleWhatsAppOrder = useCallback(async (product: Product) => {
    try {
      if (!product.shops?.whatsapp_number?.trim()) {
        toast.error('Numéro WhatsApp non disponible pour ce produit');
        return;
      }

      // Track product view if not owner
      if (user?.id !== product.shops?.user_id) {
        const { error: viewError } = await supabase.from('product_views').insert({
          product_id: product.id,
          shop_id: product.shop_id,
        });
        if (viewError) console.error('Error tracking product view:', viewError);
      }

      const productUrl = `${globalThis.location.origin}/c/${product.shops.slug}?product=${product.id}`;

      const message = `${productUrl}\n\nBonjour! J'ai vu votre produit *${product.name}* sur Kissariya. Est-il toujours disponible?`;

      const whatsappUrl = `https://wa.me/${formatWhatsAppNumber(product.shops.whatsapp_number)}?text=${encodeURIComponent(message)}`;
      globalThis.open(whatsappUrl, '_blank');
    } catch (error) {
      console.error('Error handling WhatsApp order:', error);
      toast.error('Erreur lors de l\'ouverture de WhatsApp');
    }
  }, [user]);

  const getShareData = useCallback((product: Product) => {
    const slug = product.shops?.slug;
    if (!slug) {
      // Fallback to product ID if slug is missing
      const url = `${globalThis.location.origin}/product/${product.id}`;
      return {
        url,
        title: product.name || 'Produit',
      };
    }
    const url = `${globalThis.location.origin}/c/${slug}?product=${product.id}`;
    return {
      url,
      title: product.name || 'Produit',
    };
  }, []);

  return {
    parseImages,
    handleWhatsAppOrder,
    getShareData,
  };
}
