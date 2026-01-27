import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Filter, 
  TrendingUp,
  ChevronRight,
  Sparkles,
  X,
  MapPin
} from 'lucide-react';
import { ShareDialog } from '@/components/ShareDialog';
import { useAuth } from '@/hooks/auth-utils';
import { CartSheet } from '@/components/CartSheet';
import Logo from '@/components/Logo';
import { ProductGrid } from '@/components/ProductGrid';
import { QuickViewDialog } from '@/components/QuickViewDialog';
import { Footer } from '@/components/Footer';
import { useProductActions } from '@/hooks/useProductActions';
import { useCategoryExtraction, normalizeCategoryText } from '@/hooks/useCategoryExtraction';
import { Product } from '@/types/product';

interface Shop {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  product_views?: { id: string }[];
}

export default function Explore() {
  const { user } = useAuth();
  const { getShareData } = useProductActions();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(searchParams.get('category')?.toUpperCase() || null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(searchParams.get('subcategory')?.toLowerCase() || null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('newest');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [shareData, setShareData] = useState({ url: '', title: '' });

  // Synchroniser l'état avec les paramètres d'URL
  useEffect(() => {
    const cat = searchParams.get('category');
    const sub = searchParams.get('subcategory');
    
    if (cat) {
      setSelectedCategory(cat.toUpperCase());
    } else {
      setSelectedCategory(null);
    }
    
    if (sub) {
      setSelectedSubcategory(sub.toLowerCase());
    } else {
      setSelectedSubcategory(null);
    }
  }, [searchParams]);

  useEffect(() => {
    let isMounted = true;

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
            ),
            subcategories (
              name
            )
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(40);

        if (productsError) throw productsError;
        if (isMounted) {
          setProducts((productsData as unknown as Product[]) || []);
        }

        // Fetch shops with their product views to calculate popularity
        const { data: shopsData, error: shopsError } = await supabase
          .from('shops')
          .select('id, name, slug, logo_url, user_id, product_views(id)');
        
        if (shopsError) throw shopsError;

        if (shopsData && isMounted) {
          // Sort shops by total product views descending
          const sortedShops = [...shopsData].sort((a, b) => {
            const viewsA = Array.isArray(a.product_views) ? a.product_views.length : 0;
            const viewsB = Array.isArray(b.product_views) ? b.product_views.length : 0;
            return viewsB - viewsA;
          }).slice(0, 10); // Take top 10 popular shops
          
          setShops(sortedShops as unknown as Shop[]);
        }

      } catch (error) {
        console.error('Error fetching explore data:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchExploreData();
    return () => {
      isMounted = false;
    };
  }, []);

  const categories = useCategoryExtraction(products);

  const cities = useMemo(() => {
    const citySet = new Set<string>();
    products.forEach(p => {
      const city = p.location_city || p.shops?.location_city;
      if (city) {
        citySet.add(city.trim());
      }
    });
    return Array.from(citySet).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const filteredAndSortedProducts = useMemo(() => {
    const query = search.toLowerCase();
    
    const filtered = products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(query) ||
        (product.shops?.name || '').toLowerCase().includes(query);
      
      const productCatNormalized = product.categories?.name ? normalizeCategoryText(product.categories.name) : null;
      const productSubNormalized = product.subcategories?.name ? product.subcategories.name.toLowerCase().trim() : null;
        
      const matchesCategory = !selectedCategory || productCatNormalized === selectedCategory;
      const matchesSubcategory = !selectedSubcategory || productSubNormalized === selectedSubcategory;
      
      const productCity = product.location_city || product.shops?.location_city;
      const matchesCity = !selectedCity || productCity === selectedCity;
      
      return matchesSearch && matchesCategory && matchesSubcategory && matchesCity;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return 0;
    });
  }, [products, search, selectedCategory, selectedSubcategory, selectedCity, sortBy]);

  const handleShare = (product: Product) => {
    setShareData(getShareData(product));
    setIsShareDialogOpen(true);
  };

  const isDefaultFilter = selectedCategory === null && selectedSubcategory === null;

  return (
    <div className="min-h-screen bg-[#F8F9FC]">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-md sticky inset-block-start-0 z-50">
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
            <Button asChild variant="ghost" className="hidden md:flex rounded-full">
              <Link to={user ? "/products/new" : "/auth"}>Vendre</Link>
            </Button>
            <Button asChild className="hidden md:flex gradient-primary text-white rounded-full px-6 shadow-md hover:shadow-lg transition-all">
              <Link to={user ? "/dashboard" : "/auth"}>{user ? "Mon compte" : "Commencer"}</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Explore Hero */}
        <section className="mb-12 relative overflow-hidden rounded-[2rem] bg-slate-900 text-white p-8 md:p-12 shadow-2xl">
          <div className="absolute inset-block-start-0 inset-inline-end-0 w-1/2 h-full opacity-20 pointer-events-none">
            <div className="absolute -inset-block-start-[20%] -inset-inline-end-[10%] w-[80%] h-[80%] bg-primary rounded-full blur-[100px] animate-pulse" />
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
              {cities.length > 0 && (
                <div className="flex items-center gap-2 bg-white p-1 rounded-lg border shadow-sm">
                  <Select value={selectedCity || 'all'} onValueChange={(val) => setSelectedCity(val === 'all' ? null : val)}>
                    <SelectTrigger className="w-[140px] border-none focus:ring-0 h-9">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="Ville" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les villes</SelectItem>
                      {cities.map(city => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
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
              variant={isDefaultFilter ? "default" : "outline"}
              size="sm"
              className={`rounded-full px-6 ${isDefaultFilter ? 'gradient-primary border-none' : 'bg-white'}`}
              onClick={() => {
                setSelectedCategory(null);
                setSelectedSubcategory(null);
                setSearchParams({});
              }}
            >
              Tous les produits
            </Button>
            {categories.map(cat => {
              const normalized = normalizeCategoryText(cat.name);
              return (
                <Button 
                  key={`category-btn-${normalized}`}
                  variant={selectedCategory === normalized ? "default" : "outline"}
                  size="sm"
                  className={`rounded-full px-6 whitespace-nowrap uppercase ${selectedCategory === normalized ? 'gradient-primary border-none' : 'bg-white'}`}
                  onClick={() => {
                    setSelectedCategory(normalized);
                    setSelectedSubcategory(null);
                    setSearchParams({ category: cat.name });
                  }}
                >
                  {cat.name}
                </Button>
              );
            })}
          </div>

          {!!selectedSubcategory && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="pl-3 pr-1 py-1 gap-2 bg-primary/10 text-primary border-primary/20">
                Sous-catégorie : <span className="font-bold uppercase">{selectedSubcategory}</span>
                <Button 
                  type="button"
                  variant="ghost" 
                  size="icon" 
                  className="h-5 w-5 rounded-full hover:bg-primary/20"
                  onClick={() => {
                    setSelectedSubcategory(null);
                    const newParams = new URLSearchParams(searchParams);
                    newParams.delete('subcategory');
                    setSearchParams(newParams);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            </div>
          )}
        </div>

        {/* Products Grid */}
        {!loading && filteredAndSortedProducts.length > 0 && (
          <div className="flex items-center gap-2 mb-4 text-sm text-slate-500">
            <span className="font-medium text-slate-900">{filteredAndSortedProducts.length}</span> produits trouvés
          </div>
        )}
        
        <ProductGrid 
          products={filteredAndSortedProducts}
          loading={loading}
          onQuickView={(product) => setSelectedProduct(product)}
          onShare={handleShare}
          onResetFilters={() => {
            setSearch('');
            setSelectedCategory(null);
            setSelectedSubcategory(null);
            setSearchParams({});
          }}
        />
      </main>

      {/* Floating Cart Button */}
      <div className="fixed bottom-20 md:bottom-6 right-6 z-50">
        <CartSheet />
      </div>

      <ShareDialog
        isOpen={isShareDialogOpen}
        onOpenChange={setIsShareDialogOpen}
        url={shareData.url}
        title={shareData.title}
      />

      {/* Quick View Dialog */}
      <QuickViewDialog 
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onOpenChange={(open) => !open && setSelectedProduct(null)}
        onShare={handleShare}
      />

      {/* Annuaire des catégories */}
      {categories.length > 0 ? (
        <section className="py-12 px-4 bg-white border-t border-b mt-12">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-8 uppercase tracking-wider">Top catégories</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-10 text-left">
              {categories.map((cat) => (
                <div key={cat.name} className="space-y-4">
                  <button 
                    onClick={() => {
                      const normalized = normalizeCategoryText(cat.name);
                      setSelectedCategory(normalized);
                      setSelectedSubcategory(null);
                      setSearchParams({ category: cat.name });
                      globalThis.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="block w-full text-left font-bold text-slate-900 hover:text-primary transition-colors border-b border-slate-200 pb-2 uppercase text-sm tracking-tight"
                  >
                    {cat.name}
                  </button>
                  <ul className="space-y-2">
                    {cat.subcategories.map((sub: string) => (
                      <li key={sub}>
                        <button 
                          onClick={() => {
                            const normalized = normalizeCategoryText(cat.name);
                            setSelectedCategory(normalized);
                            setSelectedSubcategory(sub.toLowerCase().trim());
                            setSearchParams({ category: cat.name, subcategory: sub });
                            globalThis.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="text-sm text-slate-600 hover:text-primary transition-colors text-left block w-full"
                        >
                          {sub}
                        </button>
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
      ) : null}

      <Footer />
    </div>
  );
}
