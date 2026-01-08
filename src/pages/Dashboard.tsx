import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useShop } from '@/hooks/useShop';
import { useProducts } from '@/hooks/useProducts';
import { useStats } from '@/hooks/useStats';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Package, 
  Eye, 
  TrendingUp, 
  Share2, 
  QrCode, 
  Plus, 
  Store, 
  LogOut, 
  Settings,
  Tag,
  BarChart3
} from 'lucide-react';
import { Link } from 'react-router-dom';
import StatsChart from '@/components/dashboard/StatsChart';
import Logo from '@/components/Logo';

export default function Dashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { shop, isLoading: shopLoading, hasShop } = useShop();
  const { products, promotionProducts, isLoading: productsLoading } = useProducts();
  const { totalViews, todayViews, dailyStats, isLoading: statsLoading } = useStats();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!authLoading && !shopLoading && user && !hasShop) {
      navigate('/setup');
    }
  }, [user, authLoading, shopLoading, hasShop, navigate]);

  if (authLoading || shopLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user || !shop) return null;

  const catalogUrl = `${window.location.origin}/c/${shop.slug}`;

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: shop.name,
        text: `Découvrez notre kissariya : ${shop.name}`,
        url: catalogUrl,
      });
    } else {
      navigator.clipboard.writeText(catalogUrl);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {shop.logo_url ? (
                <img 
                  src={shop.logo_url} 
                  alt={shop.name}
                  className="h-10 w-10 rounded-xl object-cover"
                />
              ) : (
                <div className="h-10 w-10 rounded-xl overflow-hidden bg-muted">
                  <Logo className="h-full w-full" />
                </div>
              )}
              <div>
                <h1 className="font-display font-bold text-lg">{shop.name}</h1>
                <p className="text-sm text-muted-foreground">Tableau de bord</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link to="/settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Paramètres
                </Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3 mb-8">
          <Button asChild className="gradient-primary text-primary-foreground shadow-lg">
            <Link to="/products/new">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un produit
            </Link>
          </Button>
          <Button variant="outline" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Partager la kissariya
          </Button>
          <Button variant="outline" asChild>
            <Link to="/qrcode">
              <QrCode className="h-4 w-4 mr-2" />
              QR Code
            </Link>
          </Button>
          <Button variant="secondary" asChild>
            <a href={catalogUrl} target="_blank" rel="noopener noreferrer">
              <Eye className="h-4 w-4 mr-2" />
              Voir la kissariya
            </a>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Produits
              </CardDescription>
            </CardHeader>
            <CardContent>
              {productsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-3xl font-bold font-display">{products.length}</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-promotion" />
                En promotion
              </CardDescription>
            </CardHeader>
            <CardContent>
              {productsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-3xl font-bold font-display text-promotion">{promotionProducts.length}</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Vues aujourd'hui
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-3xl font-bold font-display text-secondary">{todayViews}</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Total des vues
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-3xl font-bold font-display">{totalViews}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stats Chart and Quick Links */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Statistiques des 7 derniers jours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StatsChart data={dailyStats} />
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle>Accès rapide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/products">
                  <Package className="h-4 w-4 mr-2" />
                  Gérer les produits
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/categories">
                  <Tag className="h-4 w-4 mr-2" />
                  Gérer les catégories
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Paramètres boutique
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
