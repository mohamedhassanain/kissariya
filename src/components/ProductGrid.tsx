import { Product } from '@/types/product';
import { ProductCard } from './ProductCard';
import { Skeleton } from './ui/skeleton';
import { Package } from 'lucide-react';
import { Button } from './ui/button';

interface ProductGridProps {
  products: Product[];
  loading: boolean;
  onQuickView: (product: Product) => void;
  onShare: (product: Product) => void;
  emptyMessage?: string;
  onResetFilters?: () => void;
  columns?: {
    default?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
}

export function ProductGrid({ 
  products, 
  loading, 
  onQuickView, 
  onShare, 
  emptyMessage = "Aucun produit trouvé",
  onResetFilters,
  columns = { default: 2, md: 3, lg: 4, xl: 5 }
}: Readonly<ProductGridProps>) {
  if (loading) {
    return (
      <div className={`grid grid-cols-${columns.default} md:grid-cols-${columns.md} lg:grid-cols-${columns.lg} xl:grid-cols-${columns.xl} gap-6`}>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={`skeleton-${crypto.randomUUID()}`} className="space-y-3">
            <Skeleton className="aspect-square rounded-2xl" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed">
        <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <Package className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">{emptyMessage}</h2>
        <p className="text-slate-500 mb-6">Nous n'avons pas trouvé de produits correspondant à vos critères.</p>
        {onResetFilters && (
          <Button onClick={onResetFilters} variant="outline" className="rounded-full">
            Réinitialiser les filtres
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-${columns.default} md:grid-cols-${columns.md} lg:grid-cols-${columns.lg} xl:grid-cols-${columns.xl} gap-6`}>
      {products.map((product) => (
        <ProductCard 
          key={product.id} 
          product={product} 
          onQuickView={() => onQuickView(product)} 
          onShare={onShare}
        />
      ))}
    </div>
  );
}
