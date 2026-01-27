import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/auth-utils';
import { useShop } from '@/hooks/useShop';
import { useProducts, ProductFormData } from '@/hooks/useProducts';
import { useCategories, useSubcategories } from '@/hooks/useCategories';
import { useImageUpload } from '@/hooks/useImageUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Upload, Loader2, X, MapPin, Navigation } from 'lucide-react';
import { toast } from 'sonner';

export default function ProductForm() {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  
  const { user, loading: authLoading } = useAuth();
  const { hasShop, isLoading: shopLoading } = useShop();
  const { products, createProduct, updateProduct } = useProducts();
  const { categories } = useCategories();
  const { uploadImage, uploading } = useImageUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [isPromotion, setIsPromotion] = useState(false);
  const [categoryId, setCategoryId] = useState<string>('');
  const [subcategoryId, setSubcategoryId] = useState<string>('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [locationCity, setLocationCity] = useState('');
  const [locationUrl, setLocationUrl] = useState('');
  const [showLocation, setShowLocation] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const updateCityFromCoords = async (lat: number, lon: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
        {
          headers: {
            'User-Agent': 'Kissariya/1.0'
          }
        }
      );
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      if (isMounted.current && data.address) {
        const city = data.address.city || data.address.town || data.address.village || data.address.suburb || data.address.county || '';
        if (city) setLocationCity(city);
      }
    } catch (error) {
      console.error("Error fetching city:", error);
    }
  };

  const handleUrlChange = (url: string) => {
    setLocationUrl(url);
    // Extract coordinates from Google Maps URL using safe, bounded regex to prevent ReDoS
    // regex1 matches @lat,lon (common in Google Maps URLs)
    // regex2 matches q=lat,lon (common in search URLs)
    const regex1 = /@(-?\d{1,3}\.\d{1,15}),(-?\d{1,3}\.\d{1,15})/;
    const regex2 = /[?&]q=(-?\d{1,3}\.\d{1,15}),(-?\d{1,3}\.\d{1,15})/;
    const coordsMatch = regex1.exec(url) || regex2.exec(url);
    if (coordsMatch) {
      const lat = Number.parseFloat(coordsMatch[1]);
      const lon = Number.parseFloat(coordsMatch[2]);
      updateCityFromCoords(lat, lon);
      toast.success("Coordonnées extraites du lien !");
    }
  };

  const { subcategories } = useSubcategories(categoryId || undefined);

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
    if (!isEditing || products.length === 0) return;
    
    const product = products.find(p => p.id === id);
    if (!product) return;

    setName(product.name);
    setDescription(product.description || '');
    setPrice(product.price.toString());
    setOriginalPrice(product.original_price?.toString() || '');
    setIsPromotion(product.is_promotion);
    setCategoryId(product.category_id || '');
    setSubcategoryId(product.subcategory_id || '');
    
    // Handle multiple images stored as JSON string or single string
    let urls: string[] = [];
    if (product.image_url) {
      if (product.image_url.startsWith('[')) {
        try {
          urls = JSON.parse(product.image_url);
        } catch {
          urls = [product.image_url];
        }
      } else {
        urls = [product.image_url];
      }
    }
    
    setImageUrls(urls);
    setImagePreviews(urls);
    setLocationCity(product.location_city || '');
    setLocationUrl(product.location_url || '');
    setShowLocation(product.show_location || false);
    setIsActive(product.is_active);
  }, [isEditing, id, products]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;

      // Upload en parallèle pour de meilleures performances
      const uploadPromises = files.map(file => uploadImage(file, 'products'));
      const uploadedUrls = await Promise.all(uploadPromises);
      
      const validUrls = uploadedUrls.filter((url): url is string => url !== null);
      
      if (isMounted.current) {
        setImageUrls(prev => [...prev, ...validUrls]);
        setImagePreviews(prev => [...prev, ...validUrls]);
      }
      
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Erreur lors de l\'envoi des images');
    }
  };

  const removeImage = (index: number) => {
    const newUrls = imageUrls.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImageUrls(newUrls);
    setImagePreviews(newPreviews);
  };

  const getCurrentLocation = () => {
    // Geolocation is used here to help the seller precisely locate their shop/product
    // for buyers, which is a core feature of the local marketplace.
    if (!navigator.geolocation) {
      toast.error("La géolocalisation n'est pas supportée par votre navigateur");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
        
        if (isMounted.current) {
          setLocationUrl(url);
        }
        
    try {
      // Reverse geocoding using OpenStreetMap Nominatim
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude},${longitude}`,
        {
          headers: {
            'User-Agent': 'Kissariya/1.0'
          }
        }
      );
      const data = await response.json();
          
          if (isMounted.current && data.address) {
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
          if (isMounted.current) {
            setIsLocating(false);
          }
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
      toast.error('Le nom du produit est requis');
      return;
    }

    const parsedPrice = Number.parseFloat(price);
    if (!price || parsedPrice <= 0) {
      toast.error('Le prix doit être supérieur à 0');
      return;
    }

    const parsedOriginalPrice = Number.parseFloat(originalPrice);
    if (isPromotion && (!originalPrice || parsedOriginalPrice <= parsedPrice)) {
      toast.error('Le prix original doit être supérieur au prix promotionnel');
      return;
    }

    const formData: ProductFormData = {
      name: name.trim(),
      description: description.trim() || undefined,
      price: parsedPrice,
      original_price: isPromotion ? parsedOriginalPrice : undefined,
      is_promotion: isPromotion,
      category_id: categoryId || undefined,
      subcategory_id: subcategoryId || undefined,
      image_url: imageUrls.length > 0 ? JSON.stringify(imageUrls) : undefined,
      location_city: locationCity.trim() || undefined,
      location_url: locationUrl.trim() || undefined,
      show_location: showLocation,
      is_active: isActive,
    };

    try {
      if (isEditing) {
        if (!id) throw new Error('ID manquant');
        await updateProduct.mutateAsync({ id, ...formData });
      } else {
        await createProduct.mutateAsync(formData);
      }
      navigate('/products');
    } catch (error) {
      console.error('Product submission error:', error);
      const message = error instanceof Error ? error.message : 'Une erreur est survenue lors de l\'enregistrement du produit';
      toast.error(message);
    }
  };

  if (authLoading || shopLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/products">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-display font-bold">
            {isEditing ? 'Modifier le produit' : 'Nouveau produit'}
          </h1>
        </div>

        <Card className="border-2">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Image Upload */}
              <div className="space-y-4">
                <Label>Images du produit</Label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={`${preview}-${index}`} className="relative aspect-square rounded-xl overflow-hidden border group flex items-center justify-center bg-slate-50">
                      <img src={preview} alt={`Product ${index}`} className="max-w-full max-h-full object-contain" />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  
                  <button 
                    type="button"
                    className="relative aspect-square rounded-xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground mt-1">Ajouter</span>
                    {uploading && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-xl">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      </div>
                    )}
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <p className="text-xs text-muted-foreground">
                  Vous pouvez ajouter plusieurs images. La première sera l'image principale.
                </p>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Nom du produit *</Label>
                <Input
                  id="name"
                  placeholder="Ex: T-shirt Premium"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Décrivez votre produit..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Category & Subcategory */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Catégorie</Label>
                  <Select value={categoryId} onValueChange={(value) => {
                    setCategoryId(value);
                    setSubcategoryId('');
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id} className="uppercase">
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sous-catégorie</Label>
                  <Select 
                    value={subcategoryId} 
                    onValueChange={setSubcategoryId}
                    disabled={!categoryId || subcategories.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {subcategories.map((sub) => (
                        <SelectItem key={sub.id} value={sub.id} className="lowercase">
                          {sub.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Price */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Promotion</Label>
                  <Switch
                    checked={isPromotion}
                    onCheckedChange={setIsPromotion}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">
                      {isPromotion ? 'Prix promotionnel *' : 'Prix *'}
                    </Label>
                    <div className="relative">
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="pr-12"
                        required
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        DH
                      </span>
                    </div>
                  </div>
                  {isPromotion && (
                    <div className="space-y-2">
                      <Label htmlFor="originalPrice">Prix original *</Label>
                      <div className="relative">
                        <Input
                          id="originalPrice"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={originalPrice}
                          onChange={(e) => setOriginalPrice(e.target.value)}
                          className="pr-12"
                          required={isPromotion}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          DH
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Afficher la localisation</Label>
                    <p className="text-xs text-muted-foreground">
                      Permettre aux acheteurs de voir la ville du vendeur
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

              {/* Active Status */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <Label>Produit visible</Label>
                  <p className="text-sm text-muted-foreground">
                    Le produit sera affiché dans votre kissariya
                  </p>
                </div>
                <Switch
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>

              {/* Submit */}
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate('/products')}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="flex-1 gradient-primary text-primary-foreground"
                  disabled={createProduct.isPending || updateProduct.isPending || uploading}
                >
                  {(() => {
                    if (createProduct.isPending || updateProduct.isPending) {
                      return (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {isEditing ? 'Mise à jour...' : 'Création...'}
                        </>
                      );
                    }
                    return isEditing ? 'Mettre à jour' : 'Créer le produit';
                  })()}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
