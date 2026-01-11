import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Search, 
  Store, 
  Package, 
  MessageCircle, 
  ArrowRight, 
  Filter, 
  TrendingUp,
  Clock,
  ChevronLeft,
  ChevronRight,
  Share2,
  Sparkles,
  Eye,
  X,
  ShoppingCart,
  MapPin
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { CartSheet } from '@/components/CartSheet';
import Logo from '@/components/Logo';

interface ProductWithShop {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_promotion: boolean;
  original_price: number | null;
  location_city: string | null;
  location_url: string | null;
  show_location: boolean;
  shop_id: string;
  created_at: string;
  shops: {
    name: string;
    slug: string;
    whatsapp_number: string;
    logo_url: string | null;
    user_id: string;
    location_city: string | null;
    location_url: string | null;
    show_location: boolean;
  };
  categories: {
    name: string;
  } | null;
}

interface Shop {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
}

export default function Explore() {
  const { user } = useAuth();
  const [products, setProducts] = useState<ProductWithShop[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('newest');
  const [selectedProduct, setSelectedProduct] = useState<ProductWithShop | null>(null);
  const [quickViewImageIndex, setQuickViewImageIndex] = useState(0);
  const { addToCart } = useCart();

  const shuffleProducts = () => {
    setProducts(prev => [...prev].sort(() => Math.random() - 0.5));
    toast.success('Kissariya mélangée !');
  };

  useEffect(() => {
    const fetchExploreData = async () => {
      try {
        // Fetch products
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select(`
            *,
            shops (
              name,
              slug,
              whatsapp_number,
              logo_url,
              user_id,
              location_city,
              location_url,
              show_location
            ),
            categories (
              name
            )
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(40);

        if (productsError) throw productsError;
        setProducts(productsData as any);

        // Fetch shops with their product views to calculate popularity
        const { data: shopsData, error: shopsError } = await supabase
          .from('shops')
          .select('id, name, slug, logo_url, user_id, product_views(id)');
        
        if (shopsData) {
          // Sort shops by total product views descending
          const sortedShops = [...shopsData].sort((a: any, b: any) => {
            const viewsA = a.product_views?.length || 0;
            const viewsB = b.product_views?.length || 0;
            return viewsB - viewsA;
          }).slice(0, 10); // Take top 10 popular shops
          
          setShops(sortedShops);
        }

      } catch (error) {
        console.error('Error fetching explore data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExploreData();
  }, []);

  const categories = useMemo(() => {
    return Array.from(new Set(products.map(p => p.categories?.name).filter(Boolean))) as string[];
  }, [products]);

  const filteredAndSortedProducts = useMemo(() => {
    let result = products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.shops.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !selectedCategory || product.categories?.name === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }

    return result;
  }, [products, search, selectedCategory, sortBy]);

  const handleWhatsAppOrder = async (product: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Track product view if not owner
      if (!user || user.id !== product.shops?.user_id) {
        await supabase.from('product_views').insert({
          product_id: product.id,
          shop_id: product.shop_id,
        });
      }

      const message = `Bonjour! J'ai vu votre produit *${product.name}* sur KissariyaMaroc. Est-il toujours disponible?`;
      const whatsappNumber = product.shops?.whatsapp_number?.replace(/[^0-9]/g, '') || '';
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    } catch (error) {
      console.error('Error handling WhatsApp order:', error);
      toast.error('Erreur lors de l\'ouverture de WhatsApp');
    }
  };

  const handleShare = (product: ProductWithShop) => {
    const url = `${window.location.origin}/c/${product.shops.slug}`;
    navigator.clipboard.writeText(url);
    toast.success('Lien de la boutique copié !');
  };

  return (
    <div className="min-h-screen bg-[#F8F9FC]">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <Logo className="h-10 w-10 rounded-xl shadow-sm" />
            <span className="font-display font-bold text-xl hidden md:inline bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
              KissariyaMaroc
            </span>
          </Link>
          
          <div className="flex-1 max-w-2xl relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Rechercher un produit, une marque ou une boutique..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-muted/50 border-none focus-visible:ring-2 focus-visible:ring-primary/20 h-11 rounded-full"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button asChild variant="ghost" className="hidden sm:flex rounded-full">
              <Link to={user ? "/products/new" : "/auth"}>Vendre</Link>
            </Button>
            <Button asChild className="gradient-primary text-white rounded-full px-6 shadow-md hover:shadow-lg transition-all">
              <Link to={user ? "/dashboard" : "/auth"}>{user ? "Mon compte" : "Commencer"}</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Explore Hero */}
        <section className="mb-12 relative overflow-hidden rounded-[2rem] bg-slate-900 text-white p-8 md:p-12 shadow-2xl">
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 pointer-events-none">
            <div className="absolute top-[-20%] right-[-10%] w-[80%] h-[80%] bg-primary rounded-full blur-[100px] animate-pulse" />
          </div>
          
          <div className="relative z-10 max-w-2xl">
            <Badge className="mb-4 bg-primary/20 text-primary border-primary/30 backdrop-blur-md px-4 py-1">
              ✨ Shopping Local & Digital
            </Badge>
            <h1 className="text-4xl md:text-5xl font-display font-black mb-6 leading-tight">
              Découvrez les pépites de nos <span className="text-primary">commerçants locaux</span>
            </h1>
            <p className="text-slate-400 text-lg mb-8 leading-relaxed">
              Explorez des milliers de produits, comparez les prix et commandez directement sur WhatsApp. Le meilleur du commerce marocain est ici.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span className="text-sm font-bold">Tendances du jour</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2">
                <Sparkles className="h-5 w-5 text-orange-400" />
                <span className="text-sm font-bold">Nouveautés</span>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Shops */}
        {!search && !selectedCategory && shops.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-display font-bold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Boutiques à la une
              </h2>
              <Button variant="ghost" size="sm" className="text-primary" asChild>
                <Link to="/shops">
                  Voir tout <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {shops.map((shop) => (
                <Link 
                  key={shop.id} 
                  to={`/c/${shop.slug}`}
                  className="flex-shrink-0 group"
                >
                  <div className="flex flex-col items-center gap-2 w-24">
                    <div className="h-20 w-20 rounded-2xl bg-white border-2 border-transparent group-hover:border-primary transition-all p-1 shadow-sm overflow-hidden">
                      {shop.logo_url ? (
                        <img src={shop.logo_url} alt={shop.name} className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center rounded-xl">
                          <Store className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-medium text-center line-clamp-1 group-hover:text-primary transition-colors">
                      {shop.name}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Filters & Sort */}
        <div className="flex flex-col gap-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-display font-bold text-slate-900">Découvrir</h1>
              <p className="text-slate-500">Trouvez les meilleures pépites des commerçants locaux</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white p-1 rounded-lg border shadow-sm">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[160px] border-none focus:ring-0 h-9">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Trier par" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Nouveautés</SelectItem>
                    <SelectItem value="price-asc">Prix croissant</SelectItem>
                    <SelectItem value="price-desc">Prix décroissant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {/* Categories Scroll */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <Button 
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              className={`rounded-full px-6 ${selectedCategory === null ? 'gradient-primary border-none' : 'bg-white'}`}
              onClick={() => setSelectedCategory(null)}
            >
              Tous les produits
            </Button>
            {categories.map(cat => (
              <Button 
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                size="sm"
                className={`rounded-full px-6 whitespace-nowrap ${selectedCategory === cat ? 'gradient-primary border-none' : 'bg-white'}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square rounded-2xl" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredAndSortedProducts.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed">
            <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Aucun produit trouvé</h2>
            <p className="text-slate-500 mb-6">Nous n'avons pas trouvé de produits correspondant à vos critères.</p>
            <Button onClick={() => {setSearch(''); setSelectedCategory(null);}} variant="outline" className="rounded-full">
              Réinitialiser les filtres
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-4 text-sm text-slate-500">
              <span className="font-medium text-slate-900">{filteredAndSortedProducts.length}</span> produits trouvés
            </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredAndSortedProducts.map((product) => (
                <Card key={product.id} className="group border-none bg-white hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden rounded-2xl shadow-sm">
                  <div className="aspect-square relative overflow-hidden">
                    <ProductImageGallery product={product} />
                    
                    {/* Overlay Actions */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <Button 
                        size="icon" 
                        variant="secondary" 
                        className="rounded-full h-12 w-12 shadow-xl hover:scale-110 transition-transform"
                        onClick={() => setSelectedProduct(product)}
                      >
                        <Eye className="h-5 w-5" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="secondary" 
                        className="rounded-full h-12 w-12 shadow-xl hover:scale-110 transition-transform"
                        onClick={() => handleShare(product)}
                      >
                        <Share2 className="h-5 w-5" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="default" 
                        className="rounded-full h-12 w-12 shadow-xl hover:scale-110 transition-transform gradient-primary border-none text-white"
                        asChild
                      >
                        <Link to={`/c/${product.shops.slug}`}>
                          <ArrowRight className="h-5 w-5" />
                        </Link>
                      </Button>
                    </div>

                    {product.is_promotion && (
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-red-500 hover:bg-red-600 border-none px-3 py-1 shadow-lg">
                          -{Math.round(((product.original_price! - product.price) / product.original_price!) * 100)}%
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  <CardContent className="p-4">
                    <div className="mb-3">
                      <Link 
                        to={`/c/${product.shops.slug}`}
                        className="text-[10px] uppercase tracking-wider font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-1 mb-1"
                      >
                        <Store className="h-3 w-3" />
                        {product.shops.name}
                      </Link>
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

                    {(product.show_location || product.shops?.show_location) && (product.location_city || product.shops?.location_city) && (
                      <a 
                        href={product.location_url || product.shops?.location_url || '#'} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={`flex items-center gap-1 text-[10px] text-slate-500 font-medium mb-3 hover:text-orange-600 transition-colors ${!(product.location_url || product.shops?.location_url) && 'pointer-events-none'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!(product.location_url || product.shops?.location_url)) e.preventDefault();
                        }}
                      >
                        <MapPin className="h-3 w-3 text-orange-500" />
                        {product.location_city || product.shops?.location_city}
                      </a>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant="outline"
                        className="w-full border-primary text-primary hover:bg-primary hover:text-white rounded-xl h-10 shadow-sm transition-all gap-2"
                        onClick={() => {
                          const images = product.image_url?.startsWith('[') 
                            ? JSON.parse(product.image_url) 
                            : [product.image_url];
                          addToCart({
                            id: product.id,
                            name: product.name,
                            price: product.price,
                            image_url: images[0] || null,
                            shop_id: product.shop_id,
                            shop_name: product.shops.name,
                            whatsapp_number: product.shops.whatsapp_number
                          });
                        }}
                      >
                        <ShoppingCart className="h-4 w-4" />
                        <span className="text-[10px] font-bold">Panier</span>
                      </Button>
                      <Button 
                        className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-xl h-10 shadow-sm hover:shadow-md transition-all gap-2"
                        onClick={() => handleWhatsAppOrder(product)}
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span className="text-[10px] font-bold">Direct</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Floating Cart Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <CartSheet />
      </div>

      {/* Quick View Dialog */}
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
                      <span className="text-4xl font-black text-primary">{selectedProduct.price} DH</span>
                      {selectedProduct.is_promotion && selectedProduct.original_price && (
                        <span className="text-xl text-slate-400 line-through font-medium">
                          {selectedProduct.original_price} DH
                        </span>
                      )}
                    </div>

                    <div className="pt-6 border-t">
                      {selectedProduct.categories?.name && (
                        <Badge variant="outline" className="mb-4 block w-fit">
                          Catégorie: {selectedProduct.categories.name}
                        </Badge>
                      )}
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
                    className="w-full h-14 border-2 border-primary text-primary hover:bg-primary hover:text-white rounded-2xl text-lg font-black shadow-lg transition-all gap-3"
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
                    Ajouter au panier
                  </Button>
                  <Button 
                    className="w-full h-14 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-2xl text-lg font-black shadow-lg hover:shadow-xl transition-all gap-3"
                    onClick={() => handleWhatsAppOrder(selectedProduct)}
                  >
                    <MessageCircle className="h-6 w-6" />
                    Commander Direct
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full h-14 rounded-2xl font-bold border-2"
                    asChild
                  >
                    <Link to={`/c/${selectedProduct.shops.slug}`}>
                      Voir la boutique complète
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="mt-20 py-12 bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Logo className="h-8 w-8 rounded-lg" />
            <span className="font-display font-bold text-lg">KissariyaMaroc</span>
          </div>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            La plateforme n°1 pour découvrir et commander chez vos commerçants locaux préférés au Maroc.
          </p>
          <div className="mt-8 pt-8 border-t text-xs text-slate-400">
            © 2024 KissariyaMaroc. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  );
}

function ProductImageGallery({ product }: { product: any }) {
  const [currentIndex, setCurrentIndex] = useState(0);
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
      <div className="w-full h-full bg-slate-100 flex items-center justify-center">
        <Package className="h-12 w-12 text-slate-300" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full group/gallery">
      <img
        src={images[currentIndex]}
        alt={product.name}
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
      />
      {images.length > 1 && (
        <>
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 px-2 z-10">
            {images.map((_, idx) => (
              <div 
                key={idx}
                className={`h-1 rounded-full transition-all ${idx === currentIndex ? 'w-4 bg-primary' : 'w-1 bg-white/50'}`}
              />
            ))}
          </div>
          <div className="absolute inset-0 flex items-center justify-between px-2 opacity-0 group-hover/gallery:opacity-100 transition-opacity">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 rounded-full bg-black/20 hover:bg-black/40 text-white"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setCurrentIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 rounded-full bg-black/20 hover:bg-black/40 text-white"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setCurrentIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </div>
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
            onClick={() => setIndex(currentIndex === 0 ? images.length - 1 : currentIndex - 1)}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/20 hover:bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => setIndex(currentIndex === images.length - 1 ? 0 : currentIndex + 1)}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </>
      )}
    </div>
  );
}
