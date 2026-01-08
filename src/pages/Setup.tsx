import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useShop } from '@/hooks/useShop';
import { useImageUpload } from '@/hooks/useImageUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Store, Upload, Phone, Link as LinkIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Setup() {
  const { user, loading: authLoading } = useAuth();
  const { shop, hasShop, createShop, isLoading: shopLoading } = useShop();
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
    if (!authLoading && !shopLoading && hasShop) {
      navigate('/dashboard');
    }
  }, [hasShop, authLoading, shopLoading, navigate]);

  useEffect(() => {
    // Auto-generate slug from name
    const generatedSlug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    setSlug(generatedSlug);
  }, [name]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
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

    if (!slug.trim()) {
      toast.error('Le lien de la kissariya est requis');
      return;
    }

    await createShop.mutateAsync({
      name: name.trim(),
      description: description.trim() || undefined,
      whatsapp_number: whatsappNumber.trim(),
      slug: slug.trim(),
      logo_url: logoUrl || undefined,
    });

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
      <Card className="w-full max-w-lg border-2 shadow-xl">
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
              <p className="text-sm text-muted-foreground">Logo de votre boutique (optionnel)</p>
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
              <Label htmlFor="description">Description (optionnel)</Label>
              <Textarea
                id="description"
                placeholder="Décrivez votre boutique en quelques mots..."
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
              <p className="text-xs text-muted-foreground">
                Ce numéro sera utilisé pour recevoir les commandes via WhatsApp
              </p>
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label htmlFor="slug">Lien de votre kissariya *</Label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="slug"
                  placeholder="ma-boutique"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  className="pl-10"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Votre kissariya sera accessible sur : {window.location.origin}/c/{slug || 'votre-boutique'}
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full gradient-primary text-primary-foreground shadow-lg"
              disabled={createShop.isPending || uploading}
            >
              {createShop.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                'Créer ma boutique'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
