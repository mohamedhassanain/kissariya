import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/auth-utils';
import { useShop } from '@/hooks/useShop';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { ShopForm, ShopFormData } from '@/components/ShopForm';

export default function Settings() {
  const { user, loading: authLoading } = useAuth();
  const { shop, hasShop, updateShop, isLoading: shopLoading } = useShop();
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

  const handleSubmit = async (data: ShopFormData) => {
    await updateShop.mutateAsync(data);
  };

  if (authLoading || shopLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-2xl mx-auto">
          <Skeleton className="h-10 w-48 mb-6" />
          <Skeleton className="h-[400px]" />
        </div>
      </div>
    );
  }

  if (!shop) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-display font-bold">Paramètres boutique</h1>
        </div>

        <Card className="border-2">
          <CardContent className="pt-6">
            <ShopForm 
              initialData={{
                name: shop.name,
                description: shop.description || '',
                whatsapp_number: shop.whatsapp_number,
                slug: shop.slug,
                logo_url: shop.logo_url || '',
                cover_url: shop.cover_url || '',
                location_city: shop.location_city || '',
                location_url: shop.location_url || '',
                show_location: shop.show_location,
              }}
              onSubmit={handleSubmit}
              isPending={updateShop.isPending}
              submitLabel="Enregistrer les modifications"
              isSlugReadOnly={true}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
