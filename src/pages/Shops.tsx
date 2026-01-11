import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Store, Search, ArrowLeft, ChevronRight, MapPin, Star } from 'lucide-react';

export default function Shops() {
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const { data, error } = await supabase
          .from('shops')
          .select('*, product_views(id)');
        
        if (error) throw error;

        if (data) {
          const sorted = [...data].sort((a: any, b: any) => {
            const viewsA = a.product_views?.length || 0;
            const viewsB = b.product_views?.length || 0;
            return viewsB - viewsA;
          });
          setShops(sorted);
        }
      } catch (error) {
        console.error('Error fetching shops:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchShops();
  }, []);

  const filteredShops = shops.filter(shop =>
    shop.name.toLowerCase().includes(search.toLowerCase()) ||
    (shop.description && shop.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#F8F9FC]">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild className="rounded-full">
              <Link to="/explore">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="text-xl font-display font-black text-slate-900">Toutes les Boutiques</h1>
          </div>
          
          <div className="flex-1 max-w-md relative group hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Rechercher une boutique..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-muted/50 border-none focus-visible:ring-2 focus-visible:ring-primary/20 h-10 rounded-full"
            />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Mobile Search */}
        <div className="relative group mb-8 md:hidden">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Rechercher une boutique..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white border-slate-200 h-12 rounded-2xl shadow-sm"
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-3xl" />
            ))}
          </div>
        ) : filteredShops.length === 0 ? (
          <div className="text-center py-20">
            <Store className="h-16 w-16 mx-auto text-slate-300 mb-4" />
            <h2 className="text-xl font-bold text-slate-900">Aucune boutique trouvée</h2>
            <p className="text-slate-500">Essayez d'affiner votre recherche.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredShops.map((shop) => (
              <Link key={shop.id} to={`/c/${shop.slug}`} className="group">
                <Card className="h-full border-none bg-white hover:shadow-2xl transition-all duration-500 rounded-[2.5rem] overflow-hidden shadow-sm">
                  <div className="h-32 relative overflow-hidden">
                    {shop.cover_url ? (
                      <img src={shop.cover_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-primary/10 to-orange-500/10" />
                    )}
                    <div className="absolute -bottom-10 left-8">
                      <div className="h-20 w-20 rounded-3xl bg-white p-1 shadow-xl border-4 border-white overflow-hidden">
                        {shop.logo_url ? (
                          <img src={shop.logo_url} alt={shop.name} className="w-full h-full object-cover rounded-2xl" />
                        ) : (
                          <div className="w-full h-full bg-slate-50 flex items-center justify-center rounded-2xl">
                            <Store className="h-8 w-8 text-slate-200" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <CardContent className="pt-24 p-8">
                    <div className="flex items-start justify-between mb-4 mt-2">
                      <div>
                        <h3 className="text-xl font-display font-black text-slate-900 group-hover:text-primary transition-colors line-clamp-1">
                          {shop.name}
                        </h3>
                        <div className="flex items-center gap-1 text-slate-400 text-xs mt-1">
                          <MapPin className="h-3 w-3" />
                          <span>Maroc</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 bg-orange-50 text-orange-600 px-2 py-1 rounded-lg text-[10px] font-black">
                        <Star className="h-3 w-3 fill-orange-600" />
                        <span>POPULAIRE</span>
                      </div>
                    </div>
                    
                    <p className="text-slate-500 text-sm line-clamp-2 mb-6 h-10">
                      {shop.description || "Découvrez notre kissariya de produits exceptionnels et commandez directement sur WhatsApp."}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                      <div className="text-xs font-bold text-slate-400">
                        <span className="text-slate-900">{shop.product_views?.length || 0}</span> vues
                      </div>
                      <div className="flex items-center gap-1 text-primary font-black text-xs uppercase tracking-widest group-hover:gap-2 transition-all">
                        Visiter <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
