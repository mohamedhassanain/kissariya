import { Link } from 'react-router-dom';
import { Eye, Share2, ArrowRight, Store, ShoppingCart, MessageCircle, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Product } from '@/types/product';
import { useProductActions } from '@/hooks/useProductActions';
import { useCart } from '@/hooks/cart-utils';
import { ProductImageGallery } from './ProductImageGallery';

interface ProductCardProps {
  product: Product;
  onQuickView: () => void;
  onShare: (product: Product) => void;
  showShop?: boolean;
}

export function ProductCard({ product, onQuickView, onShare, showShop = true }: Readonly<ProductCardProps>) {
  const { handleWhatsAppOrder, parseImages } = useProductActions();
  const { addToCart } = useCart();

  const images = parseImages(product.image_url);
  const displayImage = images[0];

  const locCity = product.location_city || product.shops?.location_city;
  const locUrl = product.location_url || product.shops?.location_url;
  const showLoc = product.show_location || (product.shops?.show_location && !product.location_city);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!product.shops) return;
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: displayImage || null,
      shop_id: product.shop_id,
      shop_name: product.shops.name,
      whatsapp_number: product.shops.whatsapp_number
    });
  };

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleWhatsAppOrder(product);
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShare(product);
  };

  return (
    <Card 
      className="group border-none bg-white hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden rounded-2xl shadow-sm"
    >
      <div className="aspect-square relative overflow-hidden w-full rounded-t-2xl">
        <ProductImageGallery product={product} />
        
        {/* Native button for QuickView - avoids nested buttons while maintaining A11y */}
        <button 
          type="button"
          className="absolute inset-0 w-full h-full cursor-pointer border-none bg-transparent z-0 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
          onClick={onQuickView}
          aria-label={`Voir les détails de ${product.name}`}
        />
        
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 pointer-events-none z-10">
          <Button 
            type="button"
            size="icon"
            className="rounded-full h-12 w-12 bg-teal-500 hover:bg-teal-600 text-white shadow-xl hover:scale-110 transition-transform pointer-events-auto border-none"
            onClick={(e) => {
              e.stopPropagation();
              onQuickView();
            }}
          >
            <Eye className="h-5 w-5" />
          </Button>
          <Button 
            type="button"
            size="icon" 
            className="rounded-full h-12 w-12 bg-teal-500 hover:bg-teal-600 text-white shadow-xl hover:scale-110 transition-transform pointer-events-auto border-none"
            onClick={handleShareClick}
          >
            <Share2 className="h-5 w-5" />
          </Button>
          {showShop && product.shops ? (
            <Button 
              type="button"
              size="icon" 
              className="rounded-full h-12 w-12 bg-orange-500 hover:bg-orange-600 text-white shadow-xl hover:scale-110 transition-transform pointer-events-auto border-none"
              asChild
            >
              <Link to={`/c/${product.shops.slug}`} onClick={(e) => e.stopPropagation()}>
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          ) : null}
        </div>

        {product.is_promotion && (
          <div className="absolute top-3 left-3 z-20">
            <Badge className="bg-red-500 hover:bg-red-600 border-none px-3 py-1 shadow-lg">
              {product.original_price && product.original_price > product.price
                ? `-${Math.round(((product.original_price - product.price) / product.original_price) * 100)}%`
                : 'PROMO'}
            </Badge>
          </div>
        )}
      </div>
      
      <CardContent className="p-4">
        <div className="mb-3">
          {showShop && product.shops ? (
            <Link 
              to={`/c/${product.shops.slug}`}
              className="text-[10px] uppercase tracking-wider font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-1 mb-1"
              onClick={(e) => e.stopPropagation()}
            >
              <Store className="h-3 w-3" />
              {product.shops.name}
            </Link>
          ) : null}
          <button
            type="button"
            className="font-bold text-slate-800 text-sm line-clamp-2 h-10 group-hover:text-primary transition-colors cursor-pointer text-left p-0 border-none bg-transparent w-full"
            onClick={onQuickView}
          >
            {product.name}
          </button>
        </div>
        
        <div className="flex items-baseline gap-2 mb-1">
          <span className="font-black text-lg text-slate-900">{product.price} DH</span>
          {product.is_promotion && product.original_price ? (
            <span className="text-xs text-slate-400 line-through">
              {product.original_price} DH
            </span>
          ) : null}
        </div>

        {showLoc && locCity && locUrl ? (
          <a 
            href={locUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[10px] text-slate-500 font-medium mb-3 hover:text-orange-600 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <MapPin className="h-3 w-3 text-orange-500" />
            <span>{locCity}</span>
          </a>
        ) : null}

        <div className="grid grid-cols-2 gap-2">
          <Button 
            type="button"
            variant="outline"
            className="w-full border-primary text-primary hover:bg-primary hover:text-white rounded-xl h-10 shadow-sm transition-all gap-2"
            onClick={handleAddToCart}
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="text-[10px] font-bold">Panier</span>
          </Button>
          <Button 
            type="button"
            className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-xl h-10 shadow-sm hover:shadow-md transition-all gap-2"
            onClick={handleWhatsAppClick}
          >
            <MessageCircle className="h-4 w-4" />
            <span className="text-[10px] font-bold">Direct</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
