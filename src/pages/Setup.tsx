import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/auth-utils';
import { useShop } from '@/hooks/useShop';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Store, ArrowLeft, Loader2, LogOut } from 'lucide-react';
import { ShopForm, ShopFormData } from '@/components/ShopForm';

export default function Setup() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { hasShop, createShop, isLoading: shopLoading } = useShop();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!authLoading && !shopLoading && hasShop) {
      navigate('/dashboard');
    }
  }, [hasShop, authLoading, shopLoading, navigate]);

  const handleSubmit = async (data: ShopFormData) => {
    await createShop.mutateAsync(data);
    navigate('/dashboard');
  };

  if (authLoading || shopLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-between mb-6">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à l'accueil
          </Link>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={signOut}
            className="text-muted-foreground hover:text-destructive gap-2"
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </Button>
        </div>

        <Card className="border-2 shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <Store className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl font-display">Créer votre boutique</CardTitle>
            <CardDescription>
              Configurez votre boutique pour commencer à vendre
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ShopForm 
              onSubmit={handleSubmit}
              isPending={createShop.isPending}
              submitLabel="Créer ma boutique"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
