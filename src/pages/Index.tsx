import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/auth-utils';
import { useShop } from '@/hooks/useShop';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { 
  Store, 
  Smartphone, 
  Package, 
  ChevronRight,
  Search,
  X,
  PlusSquare,
  User,
  LogOut,
  Car,
  Home,
  Shirt,
  Gamepad2,
  MoreHorizontal,
  TrendingUp
} from 'lucide-react';
import { CartSheet } from '@/components/CartSheet';
import Logo from '@/components/Logo';
import { ShareDialog } from '@/components/ShareDialog';
import { ProductCard } from '@/components/ProductCard';
import { ProductGrid } from '@/components/ProductGrid';
import { QuickViewDialog } from '@/components/QuickViewDialog';
import { Footer } from '@/components/Footer';
import { useProductActions } from '@/hooks/useProductActions';
import { useCategoryExtraction } from '@/hooks/useCategoryExtraction';
import { Product } from '@/types/product';

interface Shop {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  product_views?: { id: string }[];
}

export default function Index() {
  const { user, loading, signOut } = useAuth();
  const { hasShop } = useShop();
  const { getShareData } = useProductActions();
  const [topShops, setTopShops] = useState<Shop[]>([]);
  const [shopsLoading, setShopsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [shareData, setShareData] = useState({ url: '', title: '' });

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return products.filter(product => 
      product.name.toLowerCase().includes(query) ||
      (product.shops?.name || '').toLowerCase().includes(query) ||
      (product.categories?.name || '').toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  useEffect(() => {
    let isMounted = true;

    const fetchTopShops = async () => {
      try {
        const { data, error } = await supabase
          .from('shops')
          .select('id, name, slug, logo_url, product_views(id)');
        
        if (error) throw error;
        
        if (data && isMounted) {
          const sorted = [...data].sort((a, b) => {
            const viewsA = Array.isArray(a.product_views) ? a.product_views.length : 0;
            const viewsB = Array.isArray(b.product_views) ? b.product_views.length : 0;
            return viewsB - viewsA;
          }).slice(0, 10);
          setTopShops(sorted);
        }
      } catch (error) {
        console.error('Error fetching top shops:', error);
      } finally {
        if (isMounted) {
          setShopsLoading(false);
        }
      }
    };

    const fetchAllProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*, shops(name, slug, whatsapp_number, logo_url, location_city, location_url, show_location), categories(name), subcategories(name)')
          .eq('is_active', true)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (data && isMounted) {
          setProducts(data as unknown as Product[]);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        if (isMounted) {
          setProductsLoading(false);
        }
      }
    };

    fetchTopShops();
    fetchAllProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  const categories = useCategoryExtraction(products);

  const handleShare = (product: Product) => {
    setShareData(getShareData(product));
    setIsShareDialogOpen(true);
  };

  const renderAuthButton = () => {
    if (loading) return null;
    if (user) {
      return (
        <div className="flex items-center gap-2">
          {!hasShop && (
            <Button asChild variant="outline" size="sm" className="hidden md:flex items-center gap-2 font-bold border-orange-200 text-orange-600 hover:bg-orange-50 hover:text-orange-700">
              <Link to="/setup">
                <Store className="h-4 w-4" />
                <span>Créer ma boutique</span>
              </Link>
            </Button>
          )}
          <Button asChild variant="ghost" size="sm" className="hidden md:flex items-center gap-2 font-bold">
            <Link to="/dashboard">
              <User className="h-5 w-5" />
              <span className="hidden sm:inline">Mon compte</span>
            </Link>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={signOut} 
            className="hidden md:flex items-center gap-2 font-bold text-muted-foreground hover:text-destructive"
            title="Déconnexion"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      );
    }
    return (
      <Button asChild variant="ghost" size="sm" className="hidden md:flex items-center gap-2 font-bold">
        <Link to="/auth">
          <User className="h-5 w-5" />
          <span className="hidden sm:inline">Se connecter</span>
        </Link>
      </Button>
    );
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
            {!!searchQuery && (
              <button 
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 sm:gap-4">
            {renderAuthButton()}

            <Button asChild className="hidden sm:flex bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl h-11 px-6 shadow-sm">
              <Link to={user ? "/products/new" : "/auth"} className="flex items-center gap-2">
                <PlusSquare className="h-5 w-5" />
                <span className="hidden lg:inline">Déposer une annonce</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Catégories Rapides */}
      {categories.length > 0 ? (
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
      ) : null}

      {/* Featured Shops Section - Bubble Style */}
      <section className="py-12 px-4 bg-white border-b">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-display font-bold flex items-center gap-2 text-slate-900">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              Boutiques à la une
            </h2>
            <Button variant="ghost" size="sm" className="text-orange-600 font-bold hover:text-orange-700" asChild>
              <Link to="/shops">
                Voir tout <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>

          {shopsLoading ? (
            <div className="flex gap-4 overflow-hidden">
              {['sh-sk-1', 'sh-sk-2', 'sh-sk-3', 'sh-sk-4', 'sh-sk-5', 'sh-sk-6'].map((key) => (
                <Skeleton key={key} className="h-24 w-24 rounded-2xl shrink-0" />
              ))}
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {topShops.map((shop) => (
                <Link 
                  key={shop.id} 
                  to={`/c/${shop.slug}`}
                  className="flex-shrink-0 group"
                >
                  <div className="flex flex-col items-center gap-2 w-24">
                    <div className="h-20 w-20 rounded-2xl bg-white border-2 border-transparent group-hover:border-orange-500 transition-all p-1 shadow-sm overflow-hidden">
                      {shop.logo_url ? (
                        <img src={shop.logo_url} alt={shop.name} className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center rounded-xl">
                          <Store className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-bold text-center line-clamp-1 group-hover:text-orange-600 transition-colors">
                      {shop.name}
                    </span>
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

              <ProductGrid 
                products={filteredProducts}
                loading={productsLoading}
                onQuickView={(product) => setSelectedProduct(product)}
                onShare={handleShare}
                onResetFilters={() => setSearchQuery('')}
                emptyMessage={`Aucun produit trouvé pour "${searchQuery}"`}
              />
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-slate-900 mb-12">En ce moment sur Kissariya</h2>
              <CategorySections 
                products={products} 
                loading={productsLoading} 
                onQuickView={(p) => setSelectedProduct(p)} 
                onShare={handleShare} 
              />
            </>
          )}
        </div>
      </main>

      {/* Quick View Dialog */}
      <QuickViewDialog 
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onOpenChange={(open) => !open && setSelectedProduct(null)}
        onShare={handleShare}
      />

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

      {/* Annuaire des catégories */}
      {categories.length > 0 ? (
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
      ) : null}

      <Footer />
    </div>
  );
}

function CategorySections({ 
  products, 
  loading, 
  onQuickView, 
  onShare 
}: Readonly<{ 
  products: Product[], 
  loading: boolean,
  onQuickView: (p: Product) => void, 
  onShare: (p: Product) => void 
}>) {
  const groupedProducts = useMemo(() => {
    const groups = new Map<string, { displayName: string, items: Product[] }>();
    
    products.forEach(product => {
      const rawName = product.categories?.name || 'Autres';
      const normalizedKey = rawName
        .normalize("NFD")
        .replaceAll(/[\u0300-\u036f]/g, "")
        .toUpperCase()
        .trim();
      
      let group = groups.get(normalizedKey);
      if (!group) {
        group = {
          displayName: rawName,
          items: []
        };
        groups.set(normalizedKey, group);
      }
      group.items.push(product);
    });
    
    return Array.from(groups.values());
  }, [products]);

  if (loading) {
    return (
      <div className="space-y-12">
        {['cat-sk-1', 'cat-sk-2', 'cat-sk-3'].map((catKey) => (
          <div key={catKey} className="space-y-6">
            <div className="flex justify-between items-center">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {['cp-sk-1', 'cp-sk-2', 'cp-sk-3', 'cp-sk-4', 'cp-sk-5'].map((prodKey) => (
                <div key={prodKey} className="space-y-3">
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
  }

  return (
    <div className="space-y-16">
      {groupedProducts.map((group) => (
        <section key={group.displayName} className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-slate-900">{group.displayName}</h3>
            <Link 
              to={`/explore?category=${encodeURIComponent(group.displayName)}`} 
              className="text-sm font-bold text-slate-900 hover:underline flex items-center gap-1"
            >
              Voir plus d'annonces
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <Carousel opts={{ align: "start", dragFree: true }} className="w-full">
            <CarouselContent className="-ml-4">
              {group.items.slice(0, 10).map((product) => (
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

function CategoryItem({ icon, label }: Readonly<{ icon: React.ReactNode; label: string }>) {
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
  const n = name.toLowerCase().normalize("NFD").replaceAll(/[\u0300-\u036f]/g, "");
  if (n.includes('vehicule') || n.includes('voiture') || n.includes('auto')) return <Car className="h-6 w-6" />;
  if (n.includes('immo') || n.includes('maison') || n.includes('appart')) return <Home className="h-6 w-6" />;
  if (n.includes('tel') || n.includes('phone') || n.includes('multimedia') || n.includes('tech')) return <Smartphone className="h-6 w-6" />;
  if (n.includes('mode') || n.includes('vetement') || n.includes('habit')) return <Shirt className="h-6 w-6" />;
  if (n.includes('jeu') || n.includes('loisir') || n.includes('sport')) return <Gamepad2 className="h-6 w-6" />;
  if (n.includes('meuble') || n.includes('deco') || n.includes('cuisine')) return <Package className="h-6 w-6" />;
  return <MoreHorizontal className="h-6 w-6" />;
}
