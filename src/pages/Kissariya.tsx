import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Store, MessageCircle, Search, Tag, Package, X, ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { CartSheet } from '@/components/CartSheet';

interface Shop {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  whatsapp_number: string;
  slug: string;
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
}

export default function Catalog() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [shop, setShop] = useState<any | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!slug) return;

      try {
        // Fetch shop
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

        // Track view only if visitor is not the owner
        if (!user || user.id !== shopData.user_id) {
          await supabase.from('kissariya_views').insert({
            shop_id: shopData.id,
          });
        }

        // Fetch categories
        const { data: categoriesData } = await supabase
          .from('categories')
          .select('*')
          .eq('shop_id', shopData.id)
          .order('sort_order', { ascending: true });

        if (categoriesData) setCategories(categoriesData);

        // Fetch subcategories
        const { data: subcategoriesData } = await supabase
          .from('subcategories')
          .select('*')
          .order('sort_order', { ascending: true });

        if (subcategoriesData) setSubcategories(subcategoriesData);

        // Fetch products
        const { data: productsData } = await supabase
          .from('products')
          .select('*')
          .eq('shop_id', shopData.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (productsData) setProducts(productsData);
      } catch (error) {
        console.error('Error fetching kissariya:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

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

  const getSubcategoriesForCategory = (categoryId: string) => {
    return subcategories.filter(s => s.category_id === categoryId);
  };

  const handleWhatsAppOrder = async (product: Product) => {
    if (!shop) return;

    // Track product view if not owner
    if (!user || user.id !== shop.user_id) {
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

    const whatsappUrl = `https://wa.me/${shop.whatsapp_number.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
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
      {/* Header */}
      <header className="gradient-primary text-primary-foreground py-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          {shop.logo_url ? (
            <img 
              src={shop.logo_url} 
              alt={shop.name}
              className="h-20 w-20 mx-auto rounded-2xl object-cover mb-4 shadow-lg border-4 border-primary-foreground/20"
            />
          ) : (
            <div className="h-20 w-20 mx-auto rounded-2xl bg-primary-foreground/20 flex items-center justify-center mb-4">
              <Store className="h-10 w-10" />
            </div>
          )}
          <h1 className="text-3xl font-display font-bold">{shop.name}</h1>
          {shop.description && (
            <p className="mt-2 opacity-90">{shop.description}</p>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un produit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Active Filters */}
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

        {/* Promotions Section */}
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
                />
              ))}
            </div>
          </section>
        )}

        {/* Categories Navigation */}
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

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
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
            {filteredProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onOrder={() => handleWhatsAppOrder(product)}
                addToCart={addToCart}
                shop={shop}
              />
            ))}
          </div>
        )}
      </main>

      {/* Floating Cart Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <CartSheet />
      </div>

      {/* Footer */}
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
  shop
}: { 
  product: Product;
  onOrder: () => void;
  addToCart: (item: any) => void;
  shop: any;
}) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
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

  return (
    <Card className="border-2 overflow-hidden hover:shadow-lg transition-all group">
      {/* Product Image */}
      <div className="aspect-square bg-muted overflow-hidden relative">
        {images.length > 0 ? (
          <>
            <img 
              src={images[currentImageIndex]} 
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {images.length > 1 && (
              <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 px-2">
                {images.map((_, idx) => (
                  <div 
                    key={idx}
                    className={`h-1 rounded-full transition-all ${idx === currentImageIndex ? 'w-4 bg-primary' : 'w-1 bg-white/50'}`}
                  />
                ))}
              </div>
            )}
            {images.length > 1 && (
              <div className="absolute inset-0 flex items-center justify-between px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 rounded-full bg-black/20 hover:bg-black/40 text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 rounded-full bg-black/20 hover:bg-black/40 text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        {product.is_promotion && (
          <Badge className="absolute top-2 right-2 bg-promotion text-promotion-foreground">
            Promo
          </Badge>
        )}
      </div>

      <CardContent className="p-3">
        <h3 className="font-semibold text-sm truncate">{product.name}</h3>
        
        <div className="mt-1 mb-3">
          {product.is_promotion && product.original_price ? (
            <div className="flex items-center gap-2">
              <span className="font-bold text-promotion">{product.price} DH</span>
              <span className="text-xs text-muted-foreground line-through">
                {product.original_price} DH
              </span>
            </div>
          ) : (
            <span className="font-bold">{product.price} DH</span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button 
            onClick={() => {
              const images = product.image_url?.startsWith('[') 
                ? JSON.parse(product.image_url) 
                : [product.image_url];
              addToCart({
                id: product.id,
                name: product.name,
                price: product.price,
                image_url: images[0] || null,
                shop_id: shop.id,
                shop_name: shop.name,
                whatsapp_number: shop.whatsapp_number
              });
            }}
            size="sm"
            variant="outline"
            className="border-primary text-primary hover:bg-primary hover:text-white"
          >
            <ShoppingCart className="h-4 w-4 mr-1" />
            Panier
          </Button>
          <Button 
            onClick={onOrder}
            size="sm"
            className="bg-whatsapp hover:bg-whatsapp/90 text-whatsapp-foreground"
          >
            <MessageCircle className="h-4 w-4 mr-1" />
            Direct
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
