import * as React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useLocation } from '@/hooks/useLocation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Store, Upload, Phone, Link as LinkIcon, Loader2, MapPin, Navigation } from 'lucide-react';
import { toast } from 'sonner';

export interface ShopFormData {
  name: string;
  description: string;
  whatsapp_number: string;
  slug: string;
  logo_url: string;
  cover_url: string;
  location_city: string;
  location_url: string;
  show_location: boolean;
}

interface ShopFormProps {
  initialData?: Partial<ShopFormData>;
  onSubmit: (data: ShopFormData) => Promise<void>;
  isPending: boolean;
  submitLabel: string;
  isSlugReadOnly?: boolean;
}

export function ShopForm({ initialData, onSubmit, isPending, submitLabel, isSlugReadOnly = false }: Readonly<ShopFormProps>) {
  const { uploadImage, uploading } = useImageUpload();
  const { isLocating, getCurrentLocation, updateCityFromCoords, extractCoordsFromUrl } = useLocation();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [whatsappNumber, setWhatsappNumber] = useState(initialData?.whatsapp_number || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [logoUrl, setLogoUrl] = useState(initialData?.logo_url || '');
  const [logoPreview, setLogoPreview] = useState(initialData?.logo_url || '');
  const [coverUrl, setCoverUrl] = useState(initialData?.cover_url || '');
  const [coverPreview, setCoverPreview] = useState(initialData?.cover_url || '');
  const [locationCity, setLocationCity] = useState(initialData?.location_city || '');
  const [locationUrl, setLocationUrl] = useState(initialData?.location_url || '');
  const [showLocation, setShowLocation] = useState(initialData?.show_location ?? true);

  useEffect(() => {
    if (!isSlugReadOnly && !isSlugManuallyEdited) {
      const generatedSlug = name
        .toLowerCase()
        .normalize('NFD')
        .replaceAll(/[\u0300-\u036f]/g, '')
        .replaceAll(/[^a-z0-9]+/g, '-')
        .replaceAll(/(^-)|(-$)/g, '');
      setSlug(generatedSlug);
    }
  }, [name, isSlugReadOnly, isSlugManuallyEdited]);

  const handleLogoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await uploadImage(file, 'logos');
      if (isMounted.current && url) {
        setLogoUrl(url);
        setLogoPreview(url);
      }
      if (logoInputRef.current) logoInputRef.current.value = '';
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Erreur lors de l\'envoi du logo');
    }
  }, [uploadImage]);

  const handleCoverUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await uploadImage(file, 'covers');
      if (isMounted.current && url) {
        setCoverUrl(url);
        setCoverPreview(url);
      }
      if (coverInputRef.current) coverInputRef.current.value = '';
    } catch (error) {
      console.error('Error uploading cover:', error);
      toast.error('Erreur lors de l\'envoi de la couverture');
    }
  }, [uploadImage]);

  const handleUrlChange = useCallback(async (url: string) => {
    setLocationUrl(url);
    const coords = extractCoordsFromUrl(url);
    if (coords) {
      try {
        const city = await updateCityFromCoords(coords.lat, coords.lon);
        if (isMounted.current && city) {
          setLocationCity(city);
          toast.success("Coordonnées extraites du lien !");
        }
      } catch (error) {
        console.error('Error handling URL change:', error);
      }
    }
  }, [extractCoordsFromUrl, updateCityFromCoords]);

  const handleGetLocation = useCallback(() => {
    getCurrentLocation((city, url) => {
      if (isMounted.current) {
        setLocationCity(city);
        setLocationUrl(url);
        toast.success("Position récupérée !");
      }
    });
  }, [getCurrentLocation]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
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

    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        whatsapp_number: whatsappNumber.trim(),
        slug: slug.trim(),
        logo_url: logoUrl,
        cover_url: coverUrl,
        location_city: locationCity.trim(),
        location_url: locationUrl.trim(),
        show_location: showLocation,
      });
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('Une erreur est survenue lors de l\'enregistrement');
    }
  }, [name, whatsappNumber, slug, description, logoUrl, coverUrl, locationCity, locationUrl, showLocation, onSubmit]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <Label htmlFor="cover-file-input">Images de la boutique</Label>
        <button 
          id="cover-upload-btn"
          type="button"
          className="relative w-full h-32 md:h-40 rounded-2xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary transition-colors bg-muted/30"
          onClick={() => coverInputRef.current?.click()}
          aria-label="Télécharger une photo de couverture"
        >
          {coverPreview ? (
            <img src={coverPreview} alt="Aperçu de la couverture" className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              <Upload className="h-6 w-6" />
              <span className="text-[10px] font-medium">Photo de couverture (optionnelle)</span>
            </div>
          )}
          {uploading ? (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : null}
        </button>
        <input 
          ref={coverInputRef}
          id="cover-file-input"
          type="file" 
          accept="image/*" 
          className="hidden" 
          onChange={handleCoverUpload} 
        />

        <div className="flex items-center gap-4">
          <button 
            id="logo-upload-btn"
            type="button"
            className="relative w-16 h-16 md:w-20 md:h-20 rounded-2xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary transition-colors shrink-0 bg-muted/30"
            onClick={() => logoInputRef.current?.click()}
            aria-label="Télécharger le logo de la boutique"
          >
            {logoPreview ? (
              <img src={logoPreview} alt="Aperçu du logo" className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <Upload className="h-5 w-5 text-muted-foreground" />
            )}
            {uploading ? (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </div>
            ) : null}
          </button>
          <input 
            ref={logoInputRef}
            id="logo-file-input"
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

      <div className="space-y-2">
        <Label htmlFor="name">Nom de la boutique *</Label>
        <div className="relative">
          <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input id="name" placeholder="Ma Boutique" value={name} onChange={(e) => setName(e.target.value)} className="pl-10" required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" placeholder="Décrivez votre boutique..." value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="whatsapp">Numéro WhatsApp *</Label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input id="whatsapp" placeholder="+212 6XX XXX XXX" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} className="pl-10" required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Lien de votre kissariya *</Label>
        <div className="relative">
          <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            id="slug" 
            placeholder="ma-boutique" 
            value={slug} 
            onChange={(e) => {
              if (!isSlugReadOnly) {
                setIsSlugManuallyEdited(true);
                setSlug(e.target.value.toLowerCase().replaceAll(/[^a-z0-9-]/g, ''));
              }
            }} 
            className="pl-10" 
            readOnly={isSlugReadOnly}
            required 
          />
        </div>
        {isSlugReadOnly ? (
          <p className="text-xs text-muted-foreground">
            Lien actuel : <span className="font-medium">{globalThis.location.origin}/c/{slug}</span>
          </p>
        ) : (
          <p className="text-[10px] text-muted-foreground">
            Aperçu du lien : {globalThis.location.origin}/c/{slug || '...'}
          </p>
        )}
      </div>

      <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="show-location-switch">Afficher la localisation</Label>
            <p className="text-xs text-muted-foreground">Permettre aux acheteurs de voir la ville</p>
          </div>
          <Switch id="show-location-switch" checked={showLocation} onCheckedChange={setShowLocation} />
        </div>

        {showLocation && (
          <div className="space-y-4 pt-2 border-t">
            <div className="space-y-2">
              <Label htmlFor="locationCity">Ville</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="locationCity" placeholder="Ex: Casablanca..." value={locationCity} onChange={(e) => setLocationCity(e.target.value)} className="pl-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="locationUrl">Lien Google Maps / Waze</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="locationUrl" placeholder="Lien de votre position..." value={locationUrl} onChange={(e) => handleUrlChange(e.target.value)} className="pl-10" />
                </div>
                <Button type="button" variant="outline" size="icon" onClick={handleGetLocation} disabled={isLocating}>
                  {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Button type="submit" className="w-full gradient-primary text-primary-foreground shadow-lg" disabled={isPending || uploading}>
        {isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Traitement...</> : submitLabel}
      </Button>
    </form>
  );
}
