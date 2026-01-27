import { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/auth-utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Store, Search, Tag, X } from 'lucide-react';
import { CartSheet } from '@/components/CartSheet';
import { ShareDialog } from '@/components/ShareDialog';
import { ProductGrid } from '@/components/ProductGrid';
import { QuickViewDialog } from '@/components/QuickViewDialog';
import { useProductActions } from '@/hooks/useProductActions';
import { Product, Shop } from '@/types/product';

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

export default function Catalog() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { getShareData } = useProductActions();
  const [shop, setShop] = useState<Shop | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [shareData, setShareData] = useState({ url: '', title: '' });

  useEffect(() => {
    const fetchData = async () => {
      if (!slug) return;

      try {
        const { data: rawShopData, error: shopError } = await supabase
          .from('shops')
          .select('*')
          .eq('slug', slug)
          .maybeSingle();

        if (shopError || !rawShopData) {
          setLoading(false);
          return;
        }

        const shopData = rawShopData as unknown as Shop;
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

        if (categoriesData) setCategories(categoriesData as unknown as Category[]);

        const { data: subcategoriesData } = await supabase
          .from('subcategories')
          .select('*')
          .order('sort_order', { ascending: true });

        if (subcategoriesData) setSubcategories(subcategoriesData as unknown as Subcategory[]);

        const { data: productsData } = await supabase
          .from('products')
          .select('*')
          .eq('shop_id', shopData.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (productsData) {
          const productsWithShop = productsData.map(p => ({
            ...p,
            shops: shopData
          }));
          const allProducts = productsWithShop as unknown as Product[];
          setProducts(allProducts);

          // Open product from URL if present
          const productId = searchParams.get('product');
          if (productId) {
            const product = allProducts.find(p => p.id === productId);
            if (product) {
              setSelectedProduct(product);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching kissariya:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug, user, authLoading, searchParams]);

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
      const promoIds = new Set(promotionProducts.slice(0, 3).map(p => p.id));
      return filteredProducts.filter(p => !promoIds.has(p.id));
    }
    return filteredProducts;
  }, [filteredProducts, promotionProducts, selectedCategory, search]);

  const getSubcategoriesForCategory = (categoryId: string) => {
    return subcategories.filter(s => s.category_id === categoryId);
  };

  const handleShare = (product: Product | null) => {
    if (!product) return;
    setShareData(getShareData(product));
    setIsShareDialogOpen(true);
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setSearch('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-24 mb-6" />
          <div className="grid grid-cols-2 gap-4">
            {['ks-1', 'ks-2', 'ks-3', 'ks-4'].map((key) => (
              <Skeleton key={key} className="h-48" />
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
      <header className="relative text-primary-foreground overflow-hidden min-h-[240px] md:min-h-[320px]">
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
              <Badge variant="secondary" className="gap-1 uppercase">
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
              <Badge variant="outline" className="gap-1 lowercase">
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
            <ProductGrid 
              products={promotionProducts.slice(0, 3)}
              loading={false}
              onQuickView={(product) => setSelectedProduct(product)}
              onShare={handleShare}
              columns={{ default: 2, md: 3, lg: 3, xl: 3 }}
            />
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
                          className="w-full justify-start uppercase"
                          onClick={() => {
                            setSelectedCategory(
                              selectedCategory === category.id ? null : category.id
                            );
                            setSelectedSubcategory(null);
                          }}
                        >
                          {category.name}
                          <span className="ml-auto text-xs opacity-70 normal-case">
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
                                className="w-full justify-start text-sm lowercase"
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

        <ProductGrid 
          products={displayProducts}
          loading={loading}
          onQuickView={(product) => setSelectedProduct(product)}
          onShare={handleShare}
          onResetFilters={clearFilters}
          emptyMessage={search || selectedCategory ? "Aucun produit trouvé" : "Cette boutique n'a pas encore de produits"}
          columns={{ default: 2, md: 3, lg: 3, xl: 3 }}
        />
      </main>

      {/* Quick View Dialog */}
      <QuickViewDialog 
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onOpenChange={(open) => !open && setSelectedProduct(null)}
        onShare={handleShare}
      />

      <div className="fixed bottom-20 md:bottom-6 right-6 z-50">
        <CartSheet />
      </div>

      <ShareDialog
        isOpen={isShareDialogOpen}
        onOpenChange={setIsShareDialogOpen}
        url={shareData.url}
        title={shareData.title}
      />

      <footer className="mt-12 py-6 border-t bg-card relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <p className="text-sm text-muted-foreground">
            Kissariya propulsée par CatalogueMaroc
          </p>
        </div>
      </footer>
    </div>
  );
}
