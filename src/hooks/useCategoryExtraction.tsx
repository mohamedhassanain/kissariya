import { useMemo } from 'react';
import { Product } from '@/types/product';

export function useCategoryExtraction(products: Product[]) {
  return useMemo(() => {
    const categoryMap = new Map<string, { name: string, subcategories: Set<string> }>();
    
    products.forEach((p) => {
      if (p.categories?.name) {
        const normalizedName = p.categories.name
          .normalize("NFD")
          .replaceAll(/[\u0300-\u036f]/g, "")
          .toUpperCase()
          .trim();
        
        let cat = categoryMap.get(normalizedName);
        if (!cat) {
          cat = {
            name: p.categories.name,
            subcategories: new Set()
          };
          categoryMap.set(normalizedName, cat);
        }
        
        if (p.subcategories?.name) {
          cat.subcategories.add(
            p.subcategories.name.toLowerCase().trim()
          );
        }
      }
    });

    return Array.from(categoryMap.values()).map(cat => ({
      name: cat.name,
      subcategories: Array.from(cat.subcategories).sort((a, b) => a.localeCompare(b))
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);
}

export const normalizeCategoryText = (text: string) => 
  text.normalize("NFD").replaceAll(/[\u0300-\u036f]/g, "").toUpperCase().trim();
