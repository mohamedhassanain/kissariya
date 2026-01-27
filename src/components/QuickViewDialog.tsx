import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MapPin, 
  Share2, 
  Store, 
  ShoppingCart, 
  MessageCircle, 
  Package, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';
import { Product } from '@/types/product';
import { useProductActions } from '@/hooks/useProductActions';
import { useCart } from '@/hooks/cart-utils';

interface QuickViewDialogProps {
  product: Product | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onShare: (product: Product) => void;
}

export function QuickViewDialog({ product, isOpen, onOpenChange, onShare }: Readonly<QuickViewDialogProps>) {
  const [imageIndex, setImageIndex] = useState(0);
  const { handleWhatsAppOrder, parseImages } = useProductActions();
  const { addToCart } = useCart();

  const images = useMemo(() => (product ? parseImages(product.image_url) : []), [product, parseImages]);

  if (!product) return null;

  // Use safe, bounded regex to prevent ReDoS
  const mapQuery = /(-?\d{1,3}\.\d{1,15}),(-?\d{1,3}\.\d{1,15})/.exec(product.location_url || product.shops?.location_url || '')?.[0] || 
                   product.location_city || 
                   product.shops?.location_city || '';

  const handleAddToCart = () => {
    if (!product.shops) return;
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: images[0] || null,
      shop_id: product.shop_id,
      shop_name: product.shops.name,
      whatsapp_number: product.shops.whatsapp_number
    });
  };

  const renderMap = (isMobile = false) => {
    const hasLocation = !!(product.show_location && (product.location_url || product.shops?.location_url));
    if (!hasLocation) return null;

    return (
      <div className={`${isMobile ? 'md:hidden h-48 rounded-2xl mb-4' : 'hidden md:block h-64 w-full border-t border-slate-800'} overflow-hidden relative group/map`}>
        <iframe
          width="100%"
          height="100%"
          title={isMobile ? "Localisation mobile" : "Localisation"}
          style={{ border: 0 }}
          src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery || '')}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
          allowFullScreen
          sandbox="allow-scripts allow-same-origin allow-popups"
        ></iframe>
        <a 
          href={product.location_url || product.shops?.location_url || undefined}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 bg-black/0 group-hover/map:bg-black/10 transition-colors flex items-center justify-center"
        >
          <Button variant="secondary" size="sm" className={`shadow-lg font-bold h-8 text-xs px-3 ${!isMobile && 'opacity-0 group-hover/map:opacity-100'} transition-opacity`}>
            <MapPin className="h-3.5 w-3.5 mr-1.5 text-primary" />
            Ouvrir dans Maps
          </Button>
        </a>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) setImageIndex(0);
      onOpenChange(open);
    }}>
      <DialogContent className="max-w-5xl p-0 overflow-y-auto md:overflow-hidden rounded-3xl border-none shadow-2xl max-h-[95vh] md:max-h-[90vh] w-[95vw] md:w-full">
        <div className="grid md:grid-cols-[1.2fr,1fr] md:h-[80vh] min-h-[500px] overflow-hidden">
          <div className="bg-slate-950 md:h-full flex flex-col overflow-hidden">
            <div className="relative w-full aspect-square md:aspect-auto md:flex-1 overflow-hidden">
              <QuickViewGallery 
                images={images} 
                currentIndex={imageIndex} 
                setIndex={setImageIndex} 
                productName={product.name}
              />
              {product.is_promotion ? (
                <div className="absolute inset-block-start-4 inset-inline-start-4 md:inset-block-start-6 md:inset-inline-start-6">
                  <Badge 
                    className="bg-red-500 text-white px-3 py-1 md:px-4 md:py-1.5 text-xs md:text-sm font-black shadow-lg"
                  >
                    {product.original_price && product.original_price > product.price
                      ? `-${Math.round(((product.original_price - product.price) / product.original_price) * 100)}%`
                      : 'PROMO'}
                  </Badge>
                </div>
              ) : null}
            </div>
            {renderMap()}
          </div>

          <div className="p-5 md:p-8 flex flex-col h-full min-h-0 bg-white">
            <ScrollArea className="flex-1 md:pr-4 mb-4">
              <div className="space-y-4 md:space-y-6">
                <div>
                  {product.shops ? (
                    <Link 
                      to={`/c/${product.shops.slug}`}
                      className="text-[10px] md:text-sm font-black text-orange-600 uppercase tracking-[0.2em] block hover:underline mb-1"
                    >
                      {product.shops.name}
                    </Link>
                  ) : null}
                  <DialogTitle className="text-2xl md:text-4xl font-display font-black text-slate-900 leading-tight mb-2">
                    {product.name}
                  </DialogTitle>
                  <DialogDescription className="sr-only">
                    Détails du produit {product.name}
                  </DialogDescription>
                  {product.show_location && (product.location_city || product.shops?.location_city) ? (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-1.5 text-slate-500 text-sm font-medium">
                        <MapPin className="h-4 w-4 text-orange-500" />
                        {product.location_city || product.shops?.location_city}
                      </div>
                      {product.location_url || product.shops?.location_url ? (
                        <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-bold uppercase">Itinéraire</span>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <div className="flex items-baseline gap-2 md:gap-3">
                  <span className="text-3xl md:text-5xl font-black text-orange-600">{product.price} DH</span>
                  {product.is_promotion && product.original_price ? (
                    <span className="text-lg md:text-2xl text-slate-300 line-through font-medium">
                      {product.original_price} DH
                    </span>
                  ) : null}
                </div>

                <div className="pt-4 md:pt-6 border-t border-slate-100">
                  <h4 className="font-black text-slate-900 mb-2 md:mb-4 uppercase text-xs md:text-sm tracking-widest">Description</h4>
                  <div className="text-slate-600 leading-relaxed whitespace-pre-wrap break-words text-sm md:text-base mb-6">
                    {product.description || (product.shops ? `Découvrez ce produit exceptionnel chez ${product.shops.name}. Qualité garantie et service rapide via WhatsApp.` : 'Découvrez ce produit exceptionnel. Qualité garantie et service rapide via WhatsApp.')}
                  </div>
                  {renderMap(true)}
                </div>
              </div>
            </ScrollArea>
            
            <div className="space-y-2 md:space-y-3 pt-3 md:pt-4 border-t border-slate-100 bg-white">
              <Button 
                variant="outline"
                className="w-full h-10 md:h-12 border-2 border-slate-100 text-slate-600 hover:bg-slate-50 rounded-xl md:rounded-2xl text-sm md:text-base font-bold shadow-sm transition-all gap-2 md:gap-3"
                onClick={() => onShare(product)}
              >
                <Share2 className="h-4 w-4 md:h-5 md:w-5" />
                Partager le produit
              </Button>
              <Button 
                variant="outline"
                className="w-full h-10 md:h-12 border-2 border-orange-100 text-orange-600 hover:bg-orange-50 rounded-xl md:rounded-2xl text-sm md:text-base font-bold shadow-sm transition-all gap-2 md:gap-3"
                asChild
              >
                <Link to={`/c/${product.shops.slug}`}>
                  <Store className="h-4 w-4 md:h-5 md:w-5" />
                  Voir toute la boutique
                </Link>
              </Button>
              <div className="grid grid-cols-2 gap-3 pb-2">
                <Button 
                  variant="outline"
                  className="h-14 border-2 border-orange-500 text-orange-600 hover:bg-orange-50 rounded-2xl text-lg font-black shadow-sm transition-all gap-3"
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="h-6 w-6" />
                  Panier
                </Button>
                <Button 
                  className="h-14 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-2xl text-lg font-black shadow-sm hover:shadow-md transition-all gap-3"
                  onClick={() => handleWhatsAppOrder(product)}
                >
                  <MessageCircle className="h-6 w-6" />
                  Direct
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function QuickViewGallery({ 
  images, 
  currentIndex, 
  setIndex, 
  productName 
}: Readonly<{ 
  images: string[], 
  currentIndex: number, 
  setIndex: (i: number) => void,
  productName: string
}>) {
  if (images.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Package className="h-20 w-20 text-slate-300" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full group bg-slate-950 overflow-hidden">
      <img 
        src={images[currentIndex]} 
        alt={productName} 
        className="w-full h-full object-cover"
      />
      {images.length > 1 && (
        <>
          <div className="absolute inset-block-end-4 inset-inline-0 flex justify-center gap-2 px-4 z-30">
            {images.map((img, idx) => (
              <button 
                key={`${img}-${idx}`}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIndex(idx);
                }}
                className={`h-2 rounded-full transition-all ${idx === currentIndex ? 'w-8 bg-primary' : 'w-2 bg-white/50 hover:bg-white/80'}`}
                aria-label={`Voir l'image ${idx + 1}`}
              />
            ))}
          </div>
          <div className="absolute inset-0 flex items-center justify-between px-4 z-30 pointer-events-none">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-12 w-12 rounded-full bg-black/20 hover:bg-black/40 text-white opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity pointer-events-auto"
              onClick={(e) => {
                e.stopPropagation();
                setIndex(currentIndex === 0 ? images.length - 1 : currentIndex - 1);
              }}
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-12 w-12 rounded-full bg-black/20 hover:bg-black/40 text-white opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity pointer-events-auto"
              onClick={(e) => {
                e.stopPropagation();
                setIndex(currentIndex === images.length - 1 ? 0 : currentIndex + 1);
              }}
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
