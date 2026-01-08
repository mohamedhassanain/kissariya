import { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProducts, Product } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { useShop } from '@/hooks/useShop';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Plus, 
  Search, 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Package,
  Tag,
  Eye,
  EyeOff
} from 'lucide-react';

export default function Products() {
  const { user, loading: authLoading } = useAuth();
  const { hasShop, isLoading: shopLoading } = useShop();
  const { products, isLoading, deleteProduct } = useProducts();
  const { categories } = useCategories();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

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

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category_id === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleDelete = async () => {
    if (deleteId) {
      await deleteProduct.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return 'Sans catégorie';
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Sans catégorie';
  };

  if (authLoading || shopLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-10 w-48 mb-6" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-display font-bold">Mes Produits</h1>
            <p className="text-muted-foreground">{products.length} produit(s)</p>
          </div>
          <Button asChild className="gradient-primary text-primary-foreground shadow-lg">
            <Link to="/products/new">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un produit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les catégories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Products List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <Card className="border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">Aucun produit</h3>
              <p className="text-muted-foreground text-center mb-4">
                {search || categoryFilter !== 'all' 
                  ? 'Aucun produit ne correspond à votre recherche'
                  : 'Commencez par ajouter votre premier produit'}
              </p>
              {!search && categoryFilter === 'all' && (
                <Button asChild className="gradient-primary text-primary-foreground">
                  <Link to="/products/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un produit
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                categoryName={getCategoryName(product.category_id)}
                onEdit={() => navigate(`/products/${product.id}`)}
                onDelete={() => setDeleteId(product.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce produit ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le produit sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ProductCard({ 
  product, 
  categoryName, 
  onEdit, 
  onDelete 
}: { 
  product: Product;
  categoryName: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const displayImage = useMemo(() => {
    if (!product.image_url) return null;
    try {
      if (product.image_url.startsWith('[')) {
        const urls = JSON.parse(product.image_url);
        return urls[0];
      }
      return product.image_url;
    } catch (e) {
      return product.image_url;
    }
  }, [product.image_url]);

  return (
    <Card className="border-2 hover:shadow-lg transition-all group">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Product Image */}
          <div className="w-20 h-20 rounded-lg bg-muted overflow-hidden flex-shrink-0">
            {displayImage ? (
              <img 
                src={displayImage} 
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold truncate">{product.name}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  {categoryName}
                </p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" onClick={onEdit}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={onDelete}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-2">
              {product.is_promotion && product.original_price ? (
                <>
                  <span className="font-bold text-promotion">{product.price} DH</span>
                  <span className="text-sm text-muted-foreground line-through">
                    {product.original_price} DH
                  </span>
                  <Badge variant="destructive" className="text-xs">Promo</Badge>
                </>
              ) : (
                <span className="font-bold">{product.price} DH</span>
              )}
              
              {!product.is_active && (
                <Badge variant="secondary" className="text-xs">
                  <EyeOff className="h-3 w-3 mr-1" />
                  Masqué
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
