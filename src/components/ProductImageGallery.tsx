import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Product } from '@/types/product';
import { useProductActions } from '@/hooks/useProductActions';

interface ProductImageGalleryProps {
  product: Product;
  className?: string;
}

export function ProductImageGallery({ product, className }: Readonly<ProductImageGalleryProps>) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { parseImages } = useProductActions();
  
  const images = useMemo(() => parseImages(product.image_url), [product.image_url, parseImages]);

  if (images.length === 0) {
    return (
      <div className={`w-full h-full bg-slate-100 flex items-center justify-center ${className}`}>
        <Package className="h-12 w-12 text-slate-300" />
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full group/gallery ${className}`}>
      <img
        src={images[currentIndex]}
        alt={product.name}
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
      />
      {images.length > 1 && (
        <>
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 px-2 z-30">
            {images.map((img, idx) => (
              <button 
                key={`${img}-${idx}`}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                className={`h-1 rounded-full transition-all ${idx === currentIndex ? 'w-4 bg-primary' : 'w-1 bg-white/50 hover:bg-white/80'}`}
                aria-label={`Voir l'image ${idx + 1}`}
              />
            ))}
          </div>
          <div className="absolute inset-0 flex items-center justify-between px-2 md:opacity-0 md:group-hover/gallery:opacity-100 transition-opacity z-30 pointer-events-none">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-full bg-black/20 hover:bg-black/40 text-white pointer-events-auto"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setCurrentIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
              }}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-full bg-black/20 hover:bg-black/40 text-white pointer-events-auto"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setCurrentIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
              }}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
