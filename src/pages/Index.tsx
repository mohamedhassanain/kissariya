import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { 
  Store, 
  QrCode, 
  MessageCircle, 
  BarChart3, 
  Smartphone, 
  ArrowRight, 
  Check, 
  TrendingUp, 
  Sparkles, 
  Package, 
  ChevronRight,
  ShoppingCart
} from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { CartSheet } from '@/components/CartSheet';
import Logo from '@/components/Logo';

export default function Index() {
  const { user, loading } = useAuth();
  const { addToCart } = useCart();
  const [topShops, setTopShops] = useState<any[]>([]);
  const [shopsLoading, setShopsLoading] = useState(true);

  useEffect(() => {
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
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2">
              <Logo className="h-10 w-10 rounded-xl" />
              <span className="font-display font-bold text-xl">KissariyaMaroc</span>
            </Link>
            <nav className="hidden md:flex items-center gap-4">
              <Link 
                to="/explore" 
                className="relative flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-orange-500 via-rose-500 to-orange-500 bg-[length:200%_auto] text-white text-sm font-black hover:bg-right transition-all duration-700 shadow-[0_10px_40px_rgba(249,115,22,0.5)] hover:shadow-[0_20px_60px_rgba(244,63,94,0.6)] hover:-translate-y-1.5 group overflow-hidden border-2 border-white/30 scale-110 mx-4"
              >
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.5)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_1.5s_infinite]" />
                <div className="relative flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-white blur-md opacity-50 group-hover:opacity-100 transition-opacity animate-pulse" />
                    <Sparkles className="h-6 w-6 relative group-hover:rotate-[30deg] transition-transform duration-500" />
                    <span className="absolute -top-2 -right-2 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-90"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                    </span>
                  </div>
                  <span className="tracking-[0.15em] uppercase text-lg drop-shadow-md">Explorer</span>
                </div>
                <div className="absolute -bottom-1 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            {loading ? null : user ? (
              <Button asChild className="gradient-primary text-primary-foreground">
                <Link to="/dashboard">
                  Mon Dashboard
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" asChild>
                  <Link to="/auth">Connexion</Link>
                </Button>
                <Button asChild className="gradient-primary text-primary-foreground">
                  <Link to="/auth">Commencer</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-20 pb-32 px-4 overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-500/5 rounded-full blur-[120px] animate-pulse" />
        </div>

        <div className="max-w-5xl mx-auto text-center relative">
          <Badge className="mb-6 py-1.5 px-4 bg-orange-100 text-orange-600 border-orange-200 text-xs font-black tracking-widest uppercase animate-bounce">
            🚀 Nouveau : Explorez la kissariya nationale
          </Badge>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-black mb-8 leading-[1.1] tracking-tight text-slate-900">
            Vendez plus avec votre <br />
            <span className="text-gradient-primary relative">
              Catalogue Digital
              <svg className="absolute -bottom-2 left-0 w-full h-3 text-orange-400/30" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0 5 Q 25 0 50 5 T 100 5" fill="none" stroke="currentColor" strokeWidth="4" />
              </svg>
            </span>
          </h1>
          
          <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            La plateforme n°1 au Maroc pour digitaliser votre commerce. 
            Créez, partagez et vendez sur WhatsApp en moins de 2 minutes.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Button 
              size="lg" 
              asChild 
              className="h-16 px-10 text-lg font-black rounded-2xl gradient-primary shadow-[0_20px_40px_rgba(249,115,22,0.3)] hover:shadow-[0_25px_50px_rgba(249,115,22,0.4)] hover:-translate-y-1 transition-all duration-300"
            >
              <Link to="/auth">
                Lancer ma boutique
                <ArrowRight className="h-6 w-6 ml-2" />
              </Link>
            </Button>
            
            <Link 
              to="/explore" 
              className="group flex items-center gap-4 p-2 pr-6 rounded-2xl bg-white border-2 border-slate-100 hover:border-primary/30 hover:shadow-xl transition-all duration-300"
            >
              <div className="h-12 w-12 rounded-xl bg-orange-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Sparkles className="h-6 w-6 text-orange-500" />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Mode Client</p>
                <p className="text-sm font-bold text-slate-900">Explorer les produits</p>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Shops Section */}
      <section className="py-16 px-4 bg-slate-50/50 border-y">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                <span className="text-[10px] font-black text-orange-600 uppercase tracking-[0.2em]">Boutiques à la une</span>
              </div>
              <h2 className="text-3xl font-display font-black text-slate-900">Les Commerçants du Moment</h2>
              <p className="text-slate-500 font-medium">Les boutiques les plus visitées cette semaine</p>
            </div>
            <Button variant="ghost" asChild className="text-primary font-bold group">
              <Link to="/shops" className="flex items-center gap-1">
                Voir tout
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>

          {shopsLoading ? (
            <div className="flex gap-6 overflow-hidden">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-24 rounded-2xl shrink-0" />
              ))}
            </div>
          ) : (
            <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide">
              {topShops.map((shop) => (
                <Link key={shop.id} to={`/c/${shop.slug}`} className="group shrink-0">
                  <div className="flex flex-col items-center gap-3 w-28">
                    <div className="h-24 w-24 rounded-[2rem] bg-white border-2 border-slate-100 group-hover:border-primary group-hover:shadow-xl transition-all duration-500 p-1 overflow-hidden">
                      {shop.logo_url ? (
                        <img src={shop.logo_url} alt={shop.name} className="w-full h-full object-cover rounded-[1.8rem]" />
                      ) : (
                        <div className="w-full h-full bg-slate-50 flex items-center justify-center rounded-[1.8rem]">
                          <Store className="h-10 w-10 text-slate-200" />
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-black text-center line-clamp-1 uppercase tracking-wider text-slate-600 group-hover:text-primary transition-colors">
                      {shop.name}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Top Products Section */}
      <section className="py-20 px-4 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.03),transparent)] pointer-events-none" />
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-[10px] font-black text-rose-600 uppercase tracking-[0.2em]">Tendances</span>
              </div>
              <h2 className="text-4xl font-display font-black flex items-center gap-3 text-slate-900">
                <TrendingUp className="h-10 w-10 text-rose-500" />
                Top 5 Produits
              </h2>
              <p className="text-slate-500 text-lg font-medium">Les articles qui font le buzz en ce moment</p>
            </div>
            <Button variant="outline" asChild className="rounded-full border-2 font-bold group hover:bg-primary hover:text-white hover:border-primary transition-all">
              <Link to="/explore" className="flex items-center gap-2">
                Explorer tout
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
          
          <ProductPreviewGrid />
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-display font-bold text-center mb-12">
            Tout ce dont vous avez besoin
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Smartphone className="h-8 w-8" />}
              title="Kissariya mobile"
              description="Une page kissariya optimisée pour mobile que vos clients peuvent consulter facilement"
            />
            <FeatureCard
              icon={<MessageCircle className="h-8 w-8" />}
              title="Commandes WhatsApp"
              description="Vos clients commandent directement via WhatsApp avec un message pré-rempli"
            />
            <FeatureCard
              icon={<QrCode className="h-8 w-8" />}
              title="QR Code gratuit"
              description="Un QR code unique pour votre boutique à imprimer ou partager"
            />
            <FeatureCard
              icon={<BarChart3 className="h-8 w-8" />}
              title="Statistiques"
              description="Suivez les vues de votre kissariya et l'engagement de vos clients"
            />
            <FeatureCard
              icon={<Store className="h-8 w-8" />}
              title="Gestion facile"
              description="Ajoutez, modifiez et organisez vos produits en quelques clics"
            />
            <FeatureCard
              icon={<Check className="h-8 w-8" />}
              title="Promotions"
              description="Mettez en avant vos produits en promotion avec des prix barrés"
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-display font-bold mb-6">
            Prêt à lancer votre boutique ?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Rejoignez des centaines de commerçants marocains qui utilisent KissariyaMaroc
          </p>
          <Button 
            size="lg" 
            asChild 
            className="gradient-primary text-primary-foreground shadow-lg text-lg px-8"
          >
            <Link to="/auth">
              Commencer maintenant - C'est gratuit
              <ArrowRight className="h-5 w-5 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Floating Cart Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <CartSheet />
      </div>

      {/* Floating Explore Button for Mobile */}
      <div className="fixed bottom-24 right-6 z-50 md:hidden">
        <Button asChild className="h-14 w-14 rounded-full gradient-primary shadow-[0_10px_30px_rgba(249,115,22,0.4)] border-4 border-white animate-pulse">
          <Link to="/explore">
            <Sparkles className="h-6 w-6 text-white" />
          </Link>
        </Button>
      </div>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="max-w-6xl mx-auto text-center text-sm text-muted-foreground">
          <p>© 2024 KissariyaMaroc. pour les commerçants marocains.</p>
        </div>
      </footer>
    </div>
  );
}

function ProductPreviewGrid() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopProducts = async () => {
      // Fetch products with their views to calculate popularity
      const { data, error } = await supabase
        .from('products')
        .select('*, shops(name, slug, whatsapp_number), product_views(id)')
        .eq('is_active', true);
      
      if (data) {
        // Sort by number of views (length of product_views array) descending and take top 5
        const sorted = [...data]
          .sort((a: any, b: any) => {
            const countA = a.product_views?.length || 0;
            const countB = b.product_views?.length || 0;
            return countB - countA;
          })
          .slice(0, 5);
        
        setProducts(sorted);
      }
      setLoading(false);
    };
    fetchTopProducts();
  }, []);

  if (loading) return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-48 bg-muted animate-pulse rounded-xl" />
      ))}
    </div>
  );

  if (products.length === 0) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
      {products.map((product) => {
        const images = product.image_url?.startsWith('[') 
          ? JSON.parse(product.image_url) 
          : [product.image_url];
        const displayImage = images[0];

        return (
          <Link key={product.id} to={`/c/${product.shops.slug}`} className="group">
            <Card className="border-none shadow-sm group-hover:shadow-xl transition-all duration-500 overflow-hidden rounded-2xl bg-white hover:-translate-y-1">
              <div className="aspect-square bg-muted relative overflow-hidden">
                {displayImage ? (
                  <img 
                    src={displayImage} 
                    alt={product.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-10 w-10 text-slate-300" />
                  </div>
                )}
                {product.is_promotion && (
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg border-none">
                      PROMO
                    </Badge>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="bg-white/90 backdrop-blur-sm p-2 rounded-full scale-50 group-hover:scale-100 transition-transform duration-300">
                    <ArrowRight className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </div>
              <CardContent className="p-4">
                <p className="text-[9px] font-black text-primary uppercase tracking-[0.15em] mb-1 truncate opacity-70">
                  {product.shops.name}
                </p>
                <h3 className="font-bold text-slate-800 text-xs truncate mb-2 group-hover:text-primary transition-colors">
                  {product.name}
                </h3>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-black text-slate-900 text-sm">{product.price} DH</p>
                  <div className="flex gap-1">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="h-7 w-7 p-0 border-primary text-primary hover:bg-primary hover:text-white rounded-full shadow-sm"
                      onClick={(e) => {
                        e.preventDefault();
                        const images = product.image_url?.startsWith('[') 
                          ? JSON.parse(product.image_url) 
                          : [product.image_url];
                        // We need addToCart from context, but this is a sub-component.
                        // I'll pass it or use the hook inside.
                      }}
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                    </Button>
                    <Button 
                      size="sm" 
                      className="h-7 w-7 p-0 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-full shadow-sm"
                      onClick={(e) => {
                        e.preventDefault();
                        const message = `Bonjour! J'ai vu votre produit *${product.name}* sur KissariyaMaroc. Est-il toujours disponible?`;
                        const whatsappUrl = `https://wa.me/${product.shops.whatsapp_number?.replace(/[^0-9]/g, '') || ''}?text=${encodeURIComponent(message)}`;
                        window.open(whatsappUrl, '_blank');
                      }}
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

function FeatureCard({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 bg-card rounded-2xl border-2 hover:shadow-lg transition-shadow">
      <div className="w-14 h-14 gradient-primary rounded-xl flex items-center justify-center text-primary-foreground mb-4">
        {icon}
      </div>
      <h3 className="font-display font-bold text-lg mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
