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
import { Store, Upload, Phone, Link as LinkIcon, Loader2, MapPin, Navigation } from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';

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
  const [coverUrl, setCoverUrl] = useState('');
  const [coverPreview, setCoverPreview] = useState('');
  const [locationCity, setLocationCity] = useState('');
  const [locationUrl, setLocationUrl] = useState('');
  const [showLocation, setShowLocation] = useState(true);
  const [isLocating, setIsLocating] = useState(false);

  const updateCityFromCoords = async (lat: number, lon: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
      );
      const data = await response.json();
      if (data.address) {
        const city = data.address.city || 
                     data.address.town || 
                     data.address.village || 
                     data.address.suburb || 
                     data.address.county || 
                     '';
        if (city) {
          setLocationCity(city);
        }
      }
    } catch (error) {
      console.error("Error fetching city:", error);
    }
  };

  const handleUrlChange = (url: string) => {
    setLocationUrl(url);
    // Extract coordinates from Google Maps URL
    const coordsMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) || url.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (coordsMatch) {
      const lat = parseFloat(coordsMatch[1]);
      const lon = parseFloat(coordsMatch[2]);
      updateCityFromCoords(lat, lon);
      toast.success("Coordonnées extraites du lien !");
    }
  };

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

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setCoverPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    const url = await uploadImage(file, 'covers');
    if (url) {
      setCoverUrl(url);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("La géolocalisation n'est pas supportée par votre navigateur");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
        setLocationUrl(url);
        
        try {
          // Reverse geocoding using OpenStreetMap Nominatim
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          
          if (data.address) {
            const city = data.address.city || 
                         data.address.town || 
                         data.address.village || 
                         data.address.suburb || 
                         data.address.county || 
                         '';
            if (city) {
              setLocationCity(city);
            }
          }
          toast.success("Position et ville récupérées !");
        } catch (error) {
          console.error("Error during reverse geocoding:", error);
          toast.success("Position récupérée (ville non identifiée)");
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        setIsLocating(false);
        let message = "Impossible de récupérer votre position";
        if (error.code === 1) message = "Permission de géolocalisation refusée";
        else if (error.code === 2) message = "Position non disponible";
        else if (error.code === 3) message = "Délai d'attente dépassé";
        
        toast.error(message);
        console.error(error);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
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
      cover_url: coverUrl || undefined,
      location_city: locationCity.trim() || undefined,
      location_url: locationUrl.trim() || undefined,
      show_location: showLocation,
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
            {/* Cover & Logo Upload */}
            <div className="space-y-4">
              <Label>Images de la boutique</Label>
              
              {/* Cover Upload */}
              <div 
                className="relative w-full h-32 rounded-2xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary transition-colors bg-muted/30"
                onClick={() => document.getElementById('cover-upload')?.click()}
              >
                {coverPreview ? (
                  <img src={coverPreview} alt="Couverture" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    <Upload className="h-6 w-6" />
                    <span className="text-[10px] font-medium">Photo de couverture (optionnelle)</span>
                  </div>
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                )}
              </div>
              <input
                id="cover-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoverUpload}
              />

              {/* Logo Upload */}
              <div className="flex items-center gap-4">
                <div 
                  className="relative w-16 h-16 rounded-2xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary transition-colors shrink-0 bg-muted/30"
                  onClick={() => document.getElementById('logo-upload')?.click()}
                >
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Upload className="h-5 w-5 text-muted-foreground" />
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
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
                <div className="space-y-0.5">
                  <p className="text-xs font-medium">Logo de la boutique</p>
                  <p className="text-[10px] text-muted-foreground">Format carré recommandé</p>
                </div>
              </div>
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

            {/* Location */}
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Afficher la localisation</Label>
                  <p className="text-xs text-muted-foreground">
                    Permettre aux acheteurs de voir la ville de votre boutique
                  </p>
                </div>
                <Switch
                  checked={showLocation}
                  onCheckedChange={setShowLocation}
                />
              </div>

              {showLocation && (
                <div className="space-y-4 pt-2 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="locationCity">Ville</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="locationCity"
                        placeholder="Ex: Casablanca, Marrakech..."
                        value={locationCity}
                        onChange={(e) => setLocationCity(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="locationUrl">Lien Google Maps / Waze</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="locationUrl"
                          placeholder="Lien de votre position..."
                          value={locationUrl}
                          onChange={(e) => handleUrlChange(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="icon"
                        onClick={getCurrentLocation}
                        disabled={isLocating}
                        title="Ma position actuelle"
                      >
                        {isLocating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Navigation className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Cliquez sur l'icône pour utiliser votre position actuelle ou collez un lien Google Maps.
                    </p>
                  </div>
                </div>
              )}
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
