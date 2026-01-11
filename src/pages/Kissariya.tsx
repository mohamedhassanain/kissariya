import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Store, MessageCircle, Search, Tag, Package, X, ChevronLeft, ChevronRight, ShoppingCart, Eye, Share2, MapPin } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { CartSheet } from '@/components/CartSheet';
import { toast } from 'sonner';

interface Shop {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  whatsapp_number: string;
  slug: string;
  location_city: string | null;
  location_url: string | null;
  show_location: boolean;
}

interface Category {
  id: string;
  name: string;
  sort_order: number;
}

interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  sort_order: number;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  original_price: number | null;
  is_promotion: boolean;
  image_url: string | null;
  category_id: string | null;
  subcategory_id: string | null;
  location_city: string | null;
  location_url: string | null;
  show_location: boolean;
}

export default function Catalog() {
  const { slug } = useParams<{ slug: string }>();
  const { user, loading: authLoading } = useAuth();
  const [shop, setShop] = useState<any | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quickViewImageIndex, setQuickViewImageIndex] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      if (!slug) return;

      try {
        const { data: shopData, error: shopError } = await supabase
          .from('shops')
          .select('*')
          .eq('slug', slug)
          .maybeSingle();

        if (shopError || !shopData) {
          setLoading(false);
          return;
        }

        setShop(shopData);

        // Track shop view if not owner and auth is determined
        if (!authLoading && (!user || user.id !== shopData.user_id)) {
          await supabase.from('kissariya_views').insert({
            shop_id: shopData.id,
          });
        }

        const { data: categoriesData } = await supabase
          .from('categories')
          .select('*')
          .eq('shop_id', shopData.id)
          .order('sort_order', { ascending: true });

        if (categoriesData) setCategories(categoriesData);

        const { data: subcategoriesData } = await supabase
          .from('subcategories')
          .select('*')
          .order('sort_order', { ascending: true });

        if (subcategoriesData) setSubcategories(subcategoriesData);

        const { data: productsData } = await supabase
          .from('products')
          .select('*')
          .eq('shop_id', shopData.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (productsData) setProducts(productsData as any);
      } catch (error) {
        console.error('Error fetching kissariya:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug, user]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !selectedCategory || product.category_id === selectedCategory;
      const matchesSubcategory = !selectedSubcategory || product.subcategory_id === selectedSubcategory;
      return matchesSearch && matchesCategory && matchesSubcategory;
    });
  }, [products, search, selectedCategory, selectedSubcategory]);

  const promotionProducts = useMemo(() => {
    return products.filter(p => p.is_promotion);
  }, [products]);

  const displayProducts = useMemo(() => {
    if (!selectedCategory && !search && promotionProducts.length > 0) {
      const promoIds = promotionProducts.slice(0, 3).map(p => p.id);
      return filteredProducts.filter(p => !promoIds.includes(p.id));
    }
    return filteredProducts;
  }, [filteredProducts, promotionProducts, selectedCategory, search]);

  const getSubcategoriesForCategory = (categoryId: string) => {
    return subcategories.filter(s => s.category_id === categoryId);
  };

  const handleWhatsAppOrder = async (product: Product) => {
    if (!shop) return;

    // Track product view if not owner and auth is determined
    if (!authLoading && (!user || user.id !== shop.user_id)) {
      await supabase.from('product_views').insert({
        product_id: product.id,
        shop_id: shop.id,
      });
    }

    const message = `Bonjour! Je suis intéressé(e) par ce produit:
    
📦 *${product.name}*
💰 Prix: ${product.price} DH
${product.is_promotion && product.original_price ? `🏷️ (Au lieu de ${product.original_price} DH)` : ''}

Pouvez-vous me donner plus d'informations?`;

    const whatsappUrl = `https://wa.me/${shop.whatsapp_number.replace(/[^0-9]/g, '') || ''}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleShare = (product: Product | null) => {
    if (!product) return;
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('Lien du produit copié !');
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setSearch('');
  };

  const { addToCart } = useCart();

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-24 mb-6" />
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Store className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Boutique introuvable</h1>
          <p className="text-muted-foreground">Cette boutique n'existe pas ou a été supprimée.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <header className="relative text-primary-foreground overflow-hidden">
        {shop.cover_url ? (
          <div className="absolute inset-0 z-0">
            <img 
              src={shop.cover_url} 
              alt="" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
          </div>
        ) : (
          <div className="absolute inset-0 gradient-primary z-0" />
        )}
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 py-12 text-center">
          {shop.logo_url ? (
            <img 
              src={shop.logo_url} 
              alt={shop.name}
              className="h-24 w-24 mx-auto rounded-3xl object-cover mb-4 shadow-2xl border-4 border-white/20"
            />
          ) : (
            <div className="h-24 w-24 mx-auto rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-4 border-4 border-white/10">
              <Store className="h-12 w-12" />
            </div>
          )}
          <h1 className="text-4xl font-display font-bold drop-shadow-lg">{shop.name}</h1>
          {shop.description && (
            <p className="mt-3 opacity-90 max-w-2xl mx-auto text-lg font-medium drop-shadow-md line-clamp-2">
              {shop.description}
            </p>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un produit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {(selectedCategory || selectedSubcategory || search) && (
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedCategory && (
              <Badge variant="secondary" className="gap-1">
                {categories.find(c => c.id === selectedCategory)?.name}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => {
                    setSelectedCategory(null);
                    setSelectedSubcategory(null);
                  }}
                />
              </Badge>
            )}
            {selectedSubcategory && (
              <Badge variant="outline" className="gap-1">
                {subcategories.find(s => s.id === selectedSubcategory)?.name}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => setSelectedSubcategory(null)}
                />
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Effacer les filtres
            </Button>
          </div>
        )}

        {promotionProducts.length > 0 && !selectedCategory && !search && (
          <section className="mb-8">
            <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
              <Tag className="h-5 w-5 text-promotion" />
              Promotions
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {promotionProducts.slice(0, 3).map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onOrder={() => handleWhatsAppOrder(product)}
                  addToCart={addToCart}
                  shop={shop}
                  onQuickView={() => setSelectedProduct(product)}
                  onShare={() => handleShare(product)}
                />
              ))}
            </div>
          </section>
        )}

        {categories.length > 0 && (
          <Accordion type="single" collapsible className="mb-6">
            <AccordionItem value="categories" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <span className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Catégories
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <div className="space-y-2">
                  {categories.map((category) => {
                    const subs = getSubcategoriesForCategory(category.id);
                    return (
                      <div key={category.id}>
                        <Button
                          variant={selectedCategory === category.id ? "default" : "ghost"}
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => {
                            setSelectedCategory(
                              selectedCategory === category.id ? null : category.id
                            );
                            setSelectedSubcategory(null);
                          }}
                        >
                          {category.name}
                          <span className="ml-auto text-xs opacity-70">
                            {products.filter(p => p.category_id === category.id).length}
                          </span>
                        </Button>
                        {selectedCategory === category.id && subs.length > 0 && (
                          <div className="ml-4 mt-1 space-y-1">
                            {subs.map((sub) => (
                              <Button
                                key={sub.id}
                                variant={selectedSubcategory === sub.id ? "secondary" : "ghost"}
                                size="sm"
                                className="w-full justify-start text-sm"
                                onClick={() => setSelectedSubcategory(
                                  selectedSubcategory === sub.id ? null : sub.id
                                )}
                              >
                                {sub.name}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        {displayProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">Aucun produit trouvé</h3>
            <p className="text-muted-foreground">
              {search || selectedCategory
                ? 'Essayez de modifier votre recherche ou vos filtres'
                : 'Cette boutique n\'a pas encore de produits'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {displayProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onOrder={() => handleWhatsAppOrder(product)}
                addToCart={addToCart}
                shop={shop}
                onQuickView={() => setSelectedProduct(product)}
                onShare={() => handleShare(product)}
              />
            ))}
          </div>
        )}
      </main>

      <Dialog open={!!selectedProduct} onOpenChange={(open) => {
        if (!open) {
          setSelectedProduct(null);
          setQuickViewImageIndex(0);
        }
      }}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
          {selectedProduct && (
            <div className="grid md:grid-cols-2">
              <div className="flex flex-col bg-slate-100">
                <div className="aspect-square relative">
                  <QuickViewGallery 
                    product={selectedProduct} 
                    currentIndex={quickViewImageIndex} 
                    setIndex={setQuickViewImageIndex} 
                  />
                  {selectedProduct.is_promotion && (
                    <Badge className="absolute top-6 left-6 bg-red-500 text-white px-4 py-1.5 text-sm font-black shadow-lg">
                      PROMO
                    </Badge>
                  )}
                </div>

                {/* Map Integration */}
                {(selectedProduct.location_url || shop.location_url) && (
                  <div className="h-48 w-full border-t border-slate-200 overflow-hidden relative group/map">
                    <iframe
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      style={{ border: 0 }}
                      src={`https://maps.google.com/maps?q=${
                        (selectedProduct.location_url || shop.location_url)?.match(/(-?\d+\.\d+),(-?\d+\.\d+)/)?.[0] || 
                        selectedProduct.location_city || 
                        shop.location_city
                      }&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                      allowFullScreen
                    ></iframe>
                    <a 
                      href={selectedProduct.location_url || shop.location_url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 bg-black/0 group-hover/map:bg-black/10 transition-colors flex items-center justify-center"
                    >
                      <Button variant="secondary" size="sm" className="opacity-0 group-hover/map:opacity-100 shadow-lg scale-90 group-hover/map:scale-100 transition-all font-bold">
                        <MapPin className="h-4 w-4 mr-2 text-primary" />
                        Ouvrir Google Maps
                      </Button>
                    </a>
                  </div>
                )}
              </div>
              <div className="p-8 flex flex-col h-[500px] md:h-[600px]">
                <ScrollArea className="flex-1 pr-4 mb-6">
                  <div className="space-y-4">
                    <DialogTitle className="text-3xl font-display font-black text-slate-900">
                      {selectedProduct.name}
                    </DialogTitle>
                    {(selectedProduct.show_location || shop.show_location) && (selectedProduct.location_city || shop.location_city) && (
                      <a 
                        href={selectedProduct.location_url || shop.location_url || '#'} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={`flex items-center gap-1.5 text-slate-500 text-sm font-medium hover:text-orange-600 transition-colors ${!(selectedProduct.location_url || shop.location_url) && 'pointer-events-none'}`}
                        onClick={(e) => !(selectedProduct.location_url || shop.location_url) && e.preventDefault()}
                      >
                        <MapPin className="h-4 w-4 text-orange-500" />
                        {selectedProduct.location_city || shop.location_city}
                        {(selectedProduct.location_url || shop.location_url) && <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full ml-1">Itinéraire</span>}
                      </a>
                    )}
                    <div className="flex items-baseline gap-3">
                      <span className="text-4xl font-black text-primary">{selectedProduct.price} DH</span>
                      {selectedProduct.is_promotion && selectedProduct.original_price && (
                        <span className="text-xl text-slate-400 line-through font-medium">
                          {selectedProduct.original_price} DH
                        </span>
                      )}
                    </div>
                    <div className="text-slate-600 leading-relaxed pt-4 border-t">
                      {selectedProduct.description ? (
                        <div className="whitespace-pre-wrap text-base">
                          {selectedProduct.description}
                        </div>
                      ) : (
                        <p className="italic text-slate-400 text-sm">
                          Découvrez ce produit exceptionnel chez {shop.name}. Qualité garantie et service rapide via WhatsApp.
                        </p>
                      )}
                    </div>
                  </div>
                </ScrollArea>
                
                <div className="space-y-3">
                  <Button 
                    variant="outline"
                    className="w-full h-12 border-2 border-slate-200 text-slate-600 hover:bg-slate-50 rounded-2xl text-base font-black shadow-sm transition-all gap-3"
                    onClick={() => handleShare(selectedProduct)}
                  >
                    <Share2 className="h-5 w-5" />
                    Partager le produit
                  </Button>
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline"
                      className="h-14 border-2 border-orange-500 text-orange-600 hover:bg-orange-50 rounded-2xl text-lg font-black shadow-lg transition-all gap-3"
                      onClick={() => {
                        const images = selectedProduct.image_url?.startsWith('[') 
                          ? JSON.parse(selectedProduct.image_url) 
                          : [selectedProduct.image_url];
                        addToCart({
                          id: selectedProduct.id,
                          name: selectedProduct.name,
                          price: selectedProduct.price,
                          image_url: images[0] || null,
                          shop_id: shop.id,
                          shop_name: shop.name,
                          whatsapp_number: shop.whatsapp_number
                        });
                      }}
                    >
                      <ShoppingCart className="h-6 w-6" />
                      Panier
                    </Button>
                    <Button 
                      className="h-14 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-2xl text-lg font-black shadow-lg hover:shadow-xl transition-all gap-3"
                      onClick={() => handleWhatsAppOrder(selectedProduct)}
                    >
                      <MessageCircle className="h-6 w-6" />
                      Direct
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="fixed bottom-6 right-6 z-50">
        <CartSheet />
      </div>

      <footer className="mt-12 py-6 border-t bg-card">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            Kissariya propulsée par CatalogueMaroc
          </p>
        </div>
      </footer>
    </div>
  );
}

function ProductCard({ 
  product, 
  onOrder,
  addToCart,
  shop,
  onQuickView,
  onShare
}: { 
  product: Product;
  onOrder: () => void;
  addToCart: (item: any) => void;
  shop: Shop;
  onQuickView: () => void;
  onShare: () => void;
}) {
  const { user, loading: authLoading } = useAuth();
  const images = useMemo(() => {
    if (!product.image_url) return [];
    try {
      if (product.image_url.startsWith('[')) {
        return JSON.parse(product.image_url) as string[];
      }
      return [product.image_url];
    } catch (e) {
      return [product.image_url];
    }
  }, [product.image_url]);

  const displayImage = images[0];

  // Priorité à la localisation du produit, sinon celle de la boutique
  const showLoc = product.show_location || shop.show_location;
  const locCity = product.location_city || shop.location_city;
  const locUrl = product.location_url || shop.location_url;

  return (
    <Card className="group border-none bg-white hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden rounded-2xl shadow-sm cursor-pointer" onClick={onQuickView}>
      <div className="aspect-square relative overflow-hidden">
        {displayImage ? (
          <img 
            src={displayImage} 
            alt={product.name} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
          />
        ) : (
          <div className="w-full h-full bg-slate-100 flex items-center justify-center">
            <Package className="h-12 w-12 text-slate-300" />
          </div>
        )}
        
        {/* Overlay Actions */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          <Button 
            size="icon" 
            variant="secondary" 
            className="rounded-full h-12 w-12 shadow-xl hover:scale-110 transition-transform"
            onClick={(e) => {
              e.stopPropagation();
              onQuickView();
            }}
          >
            <Eye className="h-5 w-5" />
          </Button>
          <Button 
            size="icon" 
            variant="secondary" 
            className="rounded-full h-12 w-12 shadow-xl hover:scale-110 transition-transform"
            onClick={(e) => {
              e.stopPropagation();
              onShare();
            }}
          >
            <Share2 className="h-5 w-5" />
          </Button>
        </div>

        {product.is_promotion && (
          <div className="absolute top-3 left-3">
            <Badge className="bg-red-500 hover:bg-red-600 border-none px-3 py-1 shadow-lg">
              PROMO
            </Badge>
          </div>
        )}
      </div>
      
      <CardContent className="p-4">
        <div className="mb-3">
          <h3 className="font-bold text-slate-800 text-sm line-clamp-2 h-10 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
        </div>
        
        <div className="flex items-baseline gap-2 mb-1">
          <span className="font-black text-lg text-slate-900">{product.price} DH</span>
          {product.is_promotion && product.original_price && (
            <span className="text-xs text-slate-400 line-through">
              {product.original_price} DH
            </span>
          )}
        </div>

        {showLoc && locCity && (
          <a 
            href={locUrl || '#'} 
            target="_blank" 
            rel="noopener noreferrer"
            className={`flex items-center gap-1 text-[10px] text-slate-500 font-medium mb-3 hover:text-orange-600 transition-colors ${!locUrl && 'pointer-events-none'}`}
            onClick={(e) => {
              e.stopPropagation();
              if (!locUrl) e.preventDefault();
            }}
          >
            <MapPin className="h-3 w-3 text-orange-500" />
            {locCity}
          </a>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant="outline"
            className="w-full border-primary text-primary hover:bg-primary hover:text-white rounded-xl h-10 shadow-sm transition-all gap-2"
            onClick={async (e) => {
              e.stopPropagation();
              // Track product view if not owner and auth is determined
              if (!authLoading && (!user || user.id !== shop.user_id)) {
                await supabase.from('product_views').insert({
                  product_id: product.id,
                  shop_id: shop.id,
                });
              }

              addToCart({
                id: product.id,
                name: product.name,
                price: product.price,
                image_url: displayImage,
                shop_id: shop.id,
                shop_name: shop.name,
                whatsapp_number: shop.whatsapp_number
              });
            }}
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="text-[10px] font-bold">Panier</span>
          </Button>
          <Button 
            className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-xl h-10 shadow-sm hover:shadow-md transition-all gap-2"
            onClick={(e) => {
              e.stopPropagation();
              onOrder();
            }}
          >
            <MessageCircle className="h-4 w-4" />
            <span className="text-[10px] font-bold">Direct</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickViewGallery({ product, currentIndex, setIndex }: { product: any, currentIndex: number, setIndex: (i: number) => void }) {
  const images = useMemo(() => {
    if (!product.image_url) return [];
    try {
      if (product.image_url.startsWith('[')) return JSON.parse(product.image_url);
      return [product.image_url];
    } catch (e) {
      return [product.image_url];
    }
  }, [product.image_url]);

  if (images.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Package className="h-20 w-20 text-slate-300" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full group">
      <img 
        src={images[currentIndex]} 
        alt={product.name} 
        className="w-full h-full object-cover"
      />
      {images.length > 1 && (
        <>
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 px-4 z-10">
            {images.map((_, idx) => (
              <button 
                key={idx}
                onClick={() => setIndex(idx)}
                className={`h-2 rounded-full transition-all ${idx === currentIndex ? 'w-8 bg-primary' : 'w-2 bg-white/50 hover:bg-white/80'}`}
              />
            ))}
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/20 hover:bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              setIndex(currentIndex === 0 ? images.length - 1 : currentIndex - 1);
            }}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/20 hover:bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              setIndex(currentIndex === images.length - 1 ? 0 : currentIndex + 1);
            }}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </>
      )}
    </div>
  );
}
