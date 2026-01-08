import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useShop } from '@/hooks/useShop';
import { useImageUpload } from '@/hooks/useImageUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Upload, Loader2, Store, Phone, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const { user, loading: authLoading } = useAuth();
  const { shop, hasShop, updateShop, isLoading: shopLoading } = useShop();
  const { uploadImage, uploading } = useImageUpload();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [slug, setSlug] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoPreview, setLogoPreview] = useState('');

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

  useEffect(() => {
    if (shop) {
      setName(shop.name);
      setDescription(shop.description || '');
      setWhatsappNumber(shop.whatsapp_number);
      setSlug(shop.slug);
      setLogoUrl(shop.logo_url || '');
      setLogoPreview(shop.logo_url || '');
    }
  }, [shop]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    const url = await uploadImage(file, 'logos');
    if (url) {
      setLogoUrl(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Le nom de la boutique est requis');
      return;
    }

    if (!whatsappNumber.trim()) {
      toast.error('Le numéro WhatsApp est requis');
      return;
    }

    await updateShop.mutateAsync({
      name: name.trim(),
      description: description.trim() || undefined,
      whatsapp_number: whatsappNumber.trim(),
      logo_url: logoUrl || undefined,
    });
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
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Logo Upload */}
              <div className="flex flex-col items-center gap-4">
                <div 
                  className="relative w-24 h-24 rounded-2xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary transition-colors"
                  onClick={() => document.getElementById('logo-upload')?.click()}
                >
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  )}
                </div>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
                <p className="text-sm text-muted-foreground">Logo de votre boutique</p>
              </div>

              {/* Shop Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Nom de la boutique *</Label>
                <div className="relative">
                  <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="Ma Boutique"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Décrivez votre boutique..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              {/* WhatsApp Number */}
              <div className="space-y-2">
                <Label htmlFor="whatsapp">Numéro WhatsApp *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="whatsapp"
                    placeholder="+212 6XX XXX XXX"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Slug (readonly) */}
              <div className="space-y-2">
                <Label>Lien de votre kissariya</Label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={`${window.location.origin}/c/${slug}`}
                    readOnly
                    className="pl-10 bg-muted"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Le lien ne peut pas être modifié après la création
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full gradient-primary text-primary-foreground shadow-lg"
                disabled={updateShop.isPending || uploading}
              >
                {updateShop.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  'Enregistrer les modifications'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
