import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Store, 
  MessageCircle, 
  Smartphone, 
  ArrowRight, 
  Package, 
  ChevronRight,
  ShoppingCart,
  Search,
  MapPin,
  X,
  PlusSquare,
  User,
  Car,
  Home,
  Shirt,
  Gamepad2,
  MoreHorizontal,
  Star,
  Eye,
  Share2,
  ChevronLeft,
  Clock
} from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { CartSheet } from '@/components/CartSheet';
import Logo from '@/components/Logo';
import { toast } from 'sonner';

export default function Index() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { addToCart } = useCart();
  const [topShops, setTopShops] = useState<any[]>([]);
  const [shopsLoading, setShopsLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [quickViewImageIndex, setQuickViewImageIndex] = useState(0);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return products.filter(product => 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.shops?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.categories?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  useEffect(() => {
    const fetchCategories = async () => {
      // Récupérer les catégories et sous-catégories des produits actifs
      const { data } = await supabase
        .from('products')
        .select('categories(id, name), subcategories(id, name)')
        .eq('is_active', true)
        .not('category_id', 'is', null);
      
      if (data) {
        const categoryMap: Record<string, { name: string, subcategories: Set<string> }> = {};
        
        data.forEach((p: any) => {
          if (p.categories) {
            if (!categoryMap[p.categories.name]) {
              categoryMap[p.categories.name] = {
                name: p.categories.name,
                subcategories: new Set()
              };
            }
            if (p.subcategories) {
              categoryMap[p.categories.name].subcategories.add(p.subcategories.name);
            }
          }
        });

        const formattedCategories = Object.values(categoryMap).map(cat => ({
          name: cat.name,
          subcategories: Array.from(cat.subcategories)
        }));

        setCategories(formattedCategories);
      }
    };
    fetchCategories();

    const fetchTopShops = async () => {
      const { data } = await supabase
        .from('shops')
        .select('id, name, slug, logo_url, product_views(id)');
      
      if (data) {
        const sorted = [...data].sort((a: any, b: any) => {
          const viewsA = a.product_views?.length || 0;
          const viewsB = b.product_views?.length || 0;
          return viewsB - viewsA;
        }).slice(0, 8);
        setTopShops(sorted);
      }
      setShopsLoading(false);
    };
    fetchTopShops();

    const fetchAllProducts = async () => {
      const { data } = await supabase
        .from('products')
        .select('*, shops(name, slug, whatsapp_number, logo_url, location_city, location_url, show_location), categories(name)')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (data) {
        setProducts(data);
      }
      setProductsLoading(false);
    };
    fetchAllProducts();
  }, []);

  const handleShare = (product: any) => {
    const url = `${window.location.origin}/c/${product.shops.slug}`;
    navigator.clipboard.writeText(url);
    toast.success('Lien copié !');
  };

  const handleWhatsAppOrder = (product: any) => {
    const message = `Bonjour! J'ai vu votre produit *${product.name}* sur Kissariya. Est-il toujours disponible?`;
    const whatsappUrl = `https://wa.me/${product.shops.whatsapp_number?.replace(/[^0-9]/g, '') || ''}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <Logo className="h-8 w-8 rounded-lg" />
            <span className="font-display font-bold text-xl text-orange-600 hidden sm:block">Kissariya</span>
          </Link>

          <div className="flex-1 max-w-2xl relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-orange-500 transition-colors" />
            <Input 
              placeholder="Rechercher un produit, une marque ou une boutique..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 bg-slate-100 border-none focus-visible:ring-2 focus-visible:ring-orange-500 h-11 rounded-full"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 sm:gap-4">
            {loading ? null : user ? (
              <Button asChild variant="ghost" size="sm" className="flex items-center gap-2 font-bold">
                <Link to="/dashboard">
                  <User className="h-5 w-5" />
                  <span className="hidden sm:inline">Mon compte</span>
                </Link>
              </Button>
            ) : (
              <Button asChild variant="ghost" size="sm" className="flex items-center gap-2 font-bold">
                <Link to="/auth">
                  <User className="h-5 w-5" />
                  <span className="hidden sm:inline">Se connecter</span>
                </Link>
              </Button>
            )}

            <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl h-11 px-6 shadow-sm">
              <Link to={user ? "/products/new" : "/auth"} className="flex items-center gap-2">
                <PlusSquare className="h-5 w-5" />
                <span className="hidden lg:inline">Déposer une annonce</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Catégories Rapides - Uniquement les catégories réelles des vendeurs */}
      {categories.length > 0 && (
        <div className="border-b bg-white overflow-x-auto scrollbar-hide">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-center gap-8 min-w-max">
            {categories.map((cat) => (
              <Link key={cat.name} to={`/explore?category=${encodeURIComponent(cat.name)}`}>
                <CategoryItem 
                  icon={getCategoryIcon(cat.name)} 
                  label={cat.name} 
                />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Featured Shops Section */}
      <section className="py-12 px-4 bg-white border-b">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Boutiques à la une</h2>
            <Link to="/shops" className="text-orange-600 font-bold flex items-center gap-1 hover:underline text-sm">
              Voir toutes les boutiques
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {shopsLoading ? (
            <div className="flex gap-4 overflow-hidden">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-48 rounded-xl shrink-0" />
              ))}
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {topShops.map((shop) => (
                <Link 
                  key={shop.id} 
                  to={`/c/${shop.slug}`} 
                  className="group shrink-0 flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-orange-200 hover:bg-orange-50/30 transition-all min-w-[200px]"
                >
                  <div className="h-12 w-12 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                    {shop.logo_url ? (
                      <img src={shop.logo_url} alt={shop.name} className="w-full h-full object-cover" />
                    ) : (
                      <Store className="h-6 w-6 m-auto mt-3 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate group-hover:text-orange-600 transition-colors">
                      {shop.name}
                    </p>
                    <div className="flex items-center gap-1">
                      <div className="flex text-orange-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-2 w-2 fill-current" />
                        ))}
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">Top Vendeur</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Main Content */}
      <main className="py-12 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          {searchQuery ? (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Résultats de recherche</h2>
                  <p className="text-slate-500">
                    {filteredProducts.length} {filteredProducts.length > 1 ? 'produits trouvés' : 'produit trouvé'} pour "{searchQuery}"
                  </p>
                </div>
                <Button variant="ghost" onClick={() => setSearchQuery('')} className="text-orange-600">
                  Effacer la recherche
                </Button>
              </div>

              {productsLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="space-y-3">
                      <Skeleton className="aspect-square rounded-2xl" />
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-24 bg-slate-50 rounded-3xl border-2 border-dashed">
                  <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <Package className="h-10 w-10 text-slate-300" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Aucun produit trouvé</h2>
                  <p className="text-slate-500 mb-6">Nous n'avons pas trouvé de produits correspondant à "{searchQuery}".</p>
                  <Button onClick={() => setSearchQuery('')} variant="outline" className="rounded-full">
                    Voir tous les produits
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {filteredProducts.map((product) => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      onQuickView={() => setSelectedProduct(product)} 
                      onShare={handleShare}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-slate-900 mb-12">En ce moment sur Kissariya</h2>
              <CategorySections onQuickView={(p: any) => setSelectedProduct(p)} onShare={handleShare} />
            </>
          )}
        </div>
      </main>

      {/* Quick View Dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={(open) => {
        if (!open) {
          setSelectedProduct(null);
          setQuickViewImageIndex(0);
        }
      }}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden rounded-3xl border-none shadow-2xl max-h-[95vh]">
          {selectedProduct && (
            <div className="grid md:grid-cols-2 h-full overflow-hidden">
              <div className="flex flex-col bg-slate-100 h-full">
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
                {(selectedProduct.location_url || selectedProduct.shops?.location_url) && (
                  <div className="h-48 w-full border-t border-slate-200 overflow-hidden relative group/map">
                    <iframe
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      style={{ border: 0 }}
                      src={`https://maps.google.com/maps?q=${
                        (selectedProduct.location_url || selectedProduct.shops?.location_url)?.match(/(-?\d+\.\d+),(-?\d+\.\d+)/)?.[0] || 
                        selectedProduct.location_city || 
                        selectedProduct.shops?.location_city
                      }&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                      allowFullScreen
                    ></iframe>
                    <a 
                      href={selectedProduct.location_url || selectedProduct.shops?.location_url || '#'}
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
              <div className="p-8 flex flex-col h-full max-h-[95vh]">
                <ScrollArea className="flex-1 pr-4 mb-6">
                  <div className="space-y-6">
                    <div>
                      <Link 
                        to={`/c/${selectedProduct.shops.slug}`}
                        className="text-xs font-black text-primary uppercase tracking-[0.2em] block hover:underline mb-2"
                      >
                        {selectedProduct.shops.name}
                      </Link>
                      <DialogTitle className="text-3xl font-display font-black text-slate-900 leading-tight">
                        {selectedProduct.name}
                      </DialogTitle>
                      {(selectedProduct.show_location || selectedProduct.shops?.show_location) && (selectedProduct.location_city || selectedProduct.shops?.location_city) && (
                        <a 
                          href={selectedProduct.location_url || selectedProduct.shops?.location_url || '#'} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className={`flex items-center gap-1.5 text-slate-500 text-sm font-medium mt-2 hover:text-orange-600 transition-colors ${!(selectedProduct.location_url || selectedProduct.shops?.location_url) && 'pointer-events-none'}`}
                          onClick={(e) => !(selectedProduct.location_url || selectedProduct.shops?.location_url) && e.preventDefault()}
                        >
                          <MapPin className="h-4 w-4 text-orange-500" />
                          {selectedProduct.location_city || selectedProduct.shops?.location_city}
                          {(selectedProduct.location_url || selectedProduct.shops?.location_url) && <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full ml-1">Itinéraire</span>}
                        </a>
                      )}
                    </div>

                    <div className="flex items-baseline gap-3">
                      <span className="text-4xl font-black text-orange-600">{selectedProduct.price} DH</span>
                      {selectedProduct.is_promotion && selectedProduct.original_price && (
                        <span className="text-xl text-slate-400 line-through font-medium">
                          {selectedProduct.original_price} DH
                        </span>
                      )}
                    </div>

                    <div className="pt-6 border-t">
                      <h4 className="font-bold text-slate-900 mb-4 uppercase text-xs tracking-widest">Description</h4>
                      <div className="text-slate-600 leading-relaxed whitespace-pre-wrap break-words text-base">
                        {selectedProduct.description || `Découvrez ce produit exceptionnel chez ${selectedProduct.shops.name}. Qualité garantie et service rapide via WhatsApp.`}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
                
                <div className="space-y-3 pt-4 border-t bg-white">
                  <Button 
                    variant="outline"
                    className="w-full h-12 border-2 border-slate-200 text-slate-600 hover:bg-slate-50 rounded-2xl text-base font-black shadow-sm transition-all gap-3"
                    onClick={() => handleShare(selectedProduct)}
                  >
                    <Share2 className="h-5 w-5" />
                    Partager le produit
                  </Button>
                  <Button 
                    variant="outline"
                    className="w-full h-12 border-2 border-orange-100 text-orange-600 hover:bg-orange-50 rounded-2xl text-base font-black shadow-sm transition-all gap-3"
                    asChild
                  >
                    <Link to={`/c/${selectedProduct.shops.slug}`}>
                      <Store className="h-5 w-5" />
                      Voir toute la boutique
                    </Link>
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
                          shop_id: selectedProduct.shop_id,
                          shop_name: selectedProduct.shops.name,
                          whatsapp_number: selectedProduct.shops.whatsapp_number
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

      {/* Floating Cart Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <CartSheet />
      </div>

      {/* Annuaire des catégories style Le Bon Coin */}
      {categories.length > 0 && (
        <section className="py-12 px-4 bg-slate-50/50 border-t border-b">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-8 uppercase tracking-wider">Top catégories</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-10">
              {categories.map((cat) => (
                <div key={cat.name} className="space-y-4">
                  <Link 
                    to={`/explore?category=${encodeURIComponent(cat.name)}`}
                    className="block font-bold text-slate-900 hover:text-orange-600 transition-colors border-b border-slate-200 pb-2 uppercase text-sm tracking-tight"
                  >
                    {cat.name}
                  </Link>
                  <ul className="space-y-2">
                    {cat.subcategories.map((sub: string) => (
                      <li key={sub}>
                        <Link 
                          to={`/explore?category=${encodeURIComponent(cat.name)}&subcategory=${encodeURIComponent(sub)}`}
                          className="text-sm text-slate-600 hover:text-orange-500 transition-colors"
                        >
                          {sub}
                        </Link>
                      </li>
                    ))}
                    {cat.subcategories.length === 0 && (
                      <li className="text-xs text-slate-400 italic">Aucune sous-catégorie</li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-2 md:col-span-1">
              <Link to="/" className="flex items-center gap-2 mb-6">
                <Logo className="h-8 w-8 rounded-lg brightness-0 invert" />
                <span className="font-display font-bold text-xl text-white">Kissariya</span>
              </Link>
              <p className="text-sm leading-relaxed text-slate-400">
                La plateforme de référence pour les petites annonces au Maroc. 
                Simple, rapide et efficace.
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6">À propos</h4>
              <ul className="space-y-4 text-sm">
                <li><Link to="#" className="hover:text-orange-500 transition-colors">Qui sommes-nous ?</Link></li>
                <li><Link to="#" className="hover:text-orange-500 transition-colors">Nous rejoindre</Link></li>
                <li><Link to="#" className="hover:text-orange-500 transition-colors">Impact écologique</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6">Informations</h4>
              <ul className="space-y-4 text-sm">
                <li><Link to="#" className="hover:text-orange-500 transition-colors">Conditions générales</Link></li>
                <li><Link to="#" className="hover:text-orange-500 transition-colors">Vie privée</Link></li>
                <li><Link to="#" className="hover:text-orange-500 transition-colors">Aide</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6">Suivez-nous</h4>
              <div className="flex gap-4">
                <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-orange-500 transition-all cursor-pointer">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-orange-500 transition-all cursor-pointer">
                  <MessageCircle className="h-5 w-5" />
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-xs text-slate-500">
            <p>© 2026 KissariyaMaroc. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function CategorySections({ onQuickView, onShare }: { onQuickView: (p: any) => void, onShare: (p: any) => void }) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllProducts = async () => {
      const { data } = await supabase
        .from('products')
        .select('*, shops(name, slug, whatsapp_number, logo_url, location_city, location_url, show_location), categories(name)')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (data) {
        setProducts(data);
      }
      setLoading(false);
    };
    fetchAllProducts();
  }, []);

  const groupedProducts = useMemo(() => {
    const groups: Record<string, any[]> = {};
    products.forEach(product => {
      const catName = product.categories?.name || 'Autres';
      if (!groups[catName]) groups[catName] = [];
      groups[catName].push(product);
    });
    return groups;
  }, [products]);

  if (loading) return (
    <div className="space-y-12">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="space-y-6">
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, j) => (
              <div key={j} className="space-y-3">
                <Skeleton className="aspect-[4/5] w-full rounded-xl" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-16">
      {Object.entries(groupedProducts).map(([categoryName, categoryProducts]) => (
        <section key={categoryName} className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-slate-900">{categoryName}</h3>
            <Link 
              to={`/explore?category=${encodeURIComponent(categoryName)}`} 
              className="text-sm font-bold text-slate-900 hover:underline flex items-center gap-1"
            >
              Voir plus d'annonces
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <Carousel opts={{ align: "start", dragFree: true }} className="w-full">
            <CarouselContent className="-ml-4">
              {categoryProducts.slice(0, 10).map((product) => (
                <CarouselItem key={product.id} className="pl-4 basis-1/2 md:basis-1/3 lg:basis-1/5">
                  <ProductCard 
                    product={product} 
                    onQuickView={() => onQuickView(product)} 
                    onShare={onShare}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex -left-4 bg-white shadow-lg border-none hover:bg-slate-50" />
            <CarouselNext className="hidden md:flex -right-4 bg-white shadow-lg border-none hover:bg-slate-50" />
          </Carousel>
        </section>
      ))}
    </div>
  );
}

function ProductCard({ product, onQuickView, onShare }: { product: any, onQuickView: () => void, onShare: (p: any) => void }) {
  const { addToCart } = useCart();
  const images = useMemo(() => {
    if (!product.image_url) return [];
    try {
      if (product.image_url.startsWith('[')) return JSON.parse(product.image_url);
      return [product.image_url];
    } catch (e) {
      return [product.image_url];
    }
  }, [product.image_url]);
  
  const displayImage = images[0];

  const showLoc = product.show_location || product.shops?.show_location;
  const locCity = product.location_city || product.shops?.location_city;
  const locUrl = product.location_url || product.shops?.location_url;

  const handleWhatsAppOrder = (e: React.MouseEvent) => {
    e.stopPropagation();
    const message = `Bonjour! J'ai vu votre produit *${product.name}* sur Kissariya. Est-il toujours disponible?`;
    const whatsappUrl = `https://wa.me/${product.shops.whatsapp_number?.replace(/[^0-9]/g, '') || ''}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: displayImage,
      shop_id: product.shop_id,
      shop_name: product.shops.name,
      whatsapp_number: product.shops.whatsapp_number
    });
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShare(product);
  };

  return (
    <div className="group border-none bg-white hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden rounded-2xl shadow-sm cursor-pointer" onClick={onQuickView}>
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
            onClick={handleShareClick}
          >
            <Share2 className="h-5 w-5" />
          </Button>
          <Button 
            size="icon" 
            variant="default" 
            className="rounded-full h-12 w-12 shadow-xl hover:scale-110 transition-transform bg-orange-500 border-none text-white"
            asChild
          >
            <Link to={`/c/${product.shops.slug}`} onClick={(e) => e.stopPropagation()}>
              <ArrowRight className="h-5 w-5" />
            </Link>
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
      
      <div className="p-4">
        <div className="mb-3">
          <Link 
            to={`/c/${product.shops.slug}`}
            className="text-[10px] uppercase tracking-wider font-bold text-orange-600 hover:text-orange-700 transition-colors flex items-center gap-1 mb-1"
            onClick={(e) => e.stopPropagation()}
          >
            <Store className="h-3 w-3" />
            {product.shops.name}
          </Link>
          <h3 className="font-bold text-slate-800 text-sm line-clamp-2 h-10 group-hover:text-orange-600 transition-colors">
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
            className="w-full border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white rounded-xl h-10 shadow-sm transition-all gap-2"
            onClick={handleAddToCart}
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="text-[10px] font-bold">Panier</span>
          </Button>
          <Button 
            className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-xl h-10 shadow-sm hover:shadow-md transition-all gap-2"
            onClick={handleWhatsAppOrder}
          >
            <MessageCircle className="h-4 w-4" />
            <span className="text-[10px] font-bold">Direct</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

function CategoryItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 group cursor-pointer">
      <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 group-hover:bg-orange-50 group-hover:text-orange-600 transition-all">
        {icon}
      </div>
      <span className="text-xs font-bold text-slate-600 group-hover:text-orange-600 transition-colors">{label}</span>
    </div>
  );
}

function getCategoryIcon(name: string) {
  // Normalisation pour ignorer les accents et la casse (ex: VETEMENT -> vetement)
  const n = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (n.includes('vehicule') || n.includes('voiture') || n.includes('auto')) return <Car className="h-6 w-6" />;
  if (n.includes('immo') || n.includes('maison') || n.includes('appart')) return <Home className="h-6 w-6" />;
  if (n.includes('tel') || n.includes('phone') || n.includes('multimedia') || n.includes('tech')) return <Smartphone className="h-6 w-6" />;
  if (n.includes('mode') || n.includes('vetement') || n.includes('habit')) return <Shirt className="h-6 w-6" />;
  if (n.includes('jeu') || n.includes('loisir') || n.includes('sport')) return <Gamepad2 className="h-6 w-6" />;
  if (n.includes('meuble') || n.includes('deco') || n.includes('cuisine')) return <Package className="h-6 w-6" />;
  return <MoreHorizontal className="h-6 w-6" />;
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
