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
import { ArrowLeft, Upload, Loader2, Store, Phone, Link as LinkIcon, MapPin, Navigation } from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';

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
  const [coverUrl, setCoverUrl] = useState('');
  const [coverPreview, setCoverPreview] = useState('');
  const [locationCity, setLocationCity] = useState('');
  const [locationUrl, setLocationUrl] = useState('');
  const [showLocation, setShowLocation] = useState(false);

  const updateCityFromCoords = async (lat: number, lon: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
      );
      const data = await response.json();
      if (data.address) {
        const city = data.address.city || data.address.town || data.address.village || data.address.suburb || data.address.county || '';
        if (city) setLocationCity(city);
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
  const [isLocating, setIsLocating] = useState(false);

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
      setCoverUrl(shop.cover_url || '');
      setCoverPreview(shop.cover_url || '');
      setLocationCity(shop.location_city || '');
      setLocationUrl(shop.location_url || '');
      setShowLocation(shop.show_location || false);
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

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setCoverPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

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

    await updateShop.mutateAsync({
      name: name.trim(),
      description: description.trim() || undefined,
      whatsapp_number: whatsappNumber.trim(),
      logo_url: logoUrl || undefined,
      cover_url: coverUrl || undefined,
      location_city: locationCity.trim() || undefined,
      location_url: locationUrl.trim() || undefined,
      show_location: showLocation,
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
              {/* Cover & Logo Upload */}
              <div className="space-y-4">
                <Label>Images de la boutique</Label>
                
                {/* Cover Upload */}
                <div 
                  className="relative w-full h-40 rounded-2xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary transition-colors bg-muted/30"
                  onClick={() => document.getElementById('cover-upload')?.click()}
                >
                  {coverPreview ? (
                    <img src={coverPreview} alt="Couverture" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Upload className="h-8 w-8" />
                      <span className="text-xs font-medium">Photo de couverture</span>
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
                    className="relative w-20 h-20 rounded-2xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary transition-colors shrink-0 bg-muted/30"
                    onClick={() => document.getElementById('logo-upload')?.click()}
                  >
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Upload className="h-6 w-6 text-muted-foreground" />
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
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Logo de la boutique</p>
                    <p className="text-xs text-muted-foreground">Format carré recommandé</p>
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
