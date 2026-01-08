import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useShop } from '@/hooks/useShop';
import { useCategories, useSubcategories, Category, Subcategory } from '@/hooks/useCategories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  FolderOpen,
  Tag
} from 'lucide-react';
import { toast } from 'sonner';

export default function Categories() {
  const { user, loading: authLoading } = useAuth();
  const { hasShop, isLoading: shopLoading } = useShop();
  const { categories, isLoading, createCategory, updateCategory, deleteCategory } = useCategories();
  const navigate = useNavigate();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState('');
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

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setCategoryName(category.name);
    } else {
      setEditingCategory(null);
      setCategoryName('');
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!categoryName.trim()) {
      toast.error('Le nom de la catégorie est requis');
      return;
    }

    if (editingCategory) {
      await updateCategory.mutateAsync({ id: editingCategory.id, name: categoryName.trim() });
    } else {
      await createCategory.mutateAsync(categoryName.trim());
    }
    setDialogOpen(false);
    setCategoryName('');
    setEditingCategory(null);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteCategory.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  if (authLoading || shopLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-2xl mx-auto">
          <Skeleton className="h-10 w-48 mb-6" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
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
          <div className="flex-1">
            <h1 className="text-2xl font-display font-bold">Catégories</h1>
            <p className="text-muted-foreground">{categories.length} catégorie(s)</p>
          </div>
          <Button onClick={() => handleOpenDialog()} className="gradient-primary text-primary-foreground shadow-lg">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </div>

        {/* Categories List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <Card className="border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">Aucune catégorie</h3>
              <p className="text-muted-foreground text-center mb-4">
                Créez des catégories pour organiser vos produits
              </p>
              <Button onClick={() => handleOpenDialog()} className="gradient-primary text-primary-foreground">
                <Plus className="h-4 w-4 mr-2" />
                Créer une catégorie
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Accordion type="multiple" className="space-y-4">
            {categories.map((category) => (
              <CategoryItem
                key={category.id}
                category={category}
                onEdit={() => handleOpenDialog(category)}
                onDelete={() => setDeleteId(category.id)}
              />
            ))}
          </Accordion>
        )}
      </div>

      {/* Category Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Nom de la catégorie"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createCategory.isPending || updateCategory.isPending}
              className="gradient-primary text-primary-foreground"
            >
              {editingCategory ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette catégorie ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera également toutes les sous-catégories associées.
              Les produits de cette catégorie ne seront pas supprimés mais n'auront plus de catégorie.
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

function CategoryItem({ 
  category, 
  onEdit, 
  onDelete 
}: { 
  category: Category;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { subcategories, createSubcategory, updateSubcategory, deleteSubcategory } = useSubcategories(category.id);
  
  const [subDialogOpen, setSubDialogOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subcategory | null>(null);
  const [subName, setSubName] = useState('');
  const [deleteSubId, setDeleteSubId] = useState<string | null>(null);

  const handleOpenSubDialog = (sub?: Subcategory) => {
    if (sub) {
      setEditingSub(sub);
      setSubName(sub.name);
    } else {
      setEditingSub(null);
      setSubName('');
    }
    setSubDialogOpen(true);
  };

  const handleSubmitSub = async () => {
    if (!subName.trim()) {
      toast.error('Le nom de la sous-catégorie est requis');
      return;
    }

    if (editingSub) {
      await updateSubcategory.mutateAsync({ id: editingSub.id, name: subName.trim() });
    } else {
      await createSubcategory.mutateAsync({ categoryId: category.id, name: subName.trim() });
    }
    setSubDialogOpen(false);
    setSubName('');
    setEditingSub(null);
  };

  const handleDeleteSub = async () => {
    if (deleteSubId) {
      await deleteSubcategory.mutateAsync(deleteSubId);
      setDeleteSubId(null);
    }
  };

  return (
    <>
      <AccordionItem value={category.id} className="border-2 rounded-lg px-4 bg-card">
        <AccordionTrigger className="hover:no-underline py-4">
          <div className="flex items-center gap-3 flex-1">
            <FolderOpen className="h-5 w-5 text-primary" />
            <span className="font-semibold">{category.name}</span>
            <span className="text-sm text-muted-foreground">
              ({subcategories.length} sous-catégorie{subcategories.length > 1 ? 's' : ''})
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pb-4">
          <div className="flex gap-2 mb-4">
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="h-3 w-3 mr-1" />
              Modifier
            </Button>
            <Button variant="outline" size="sm" onClick={onDelete}>
              <Trash2 className="h-3 w-3 mr-1" />
              Supprimer
            </Button>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => handleOpenSubDialog()}
              className="ml-auto"
            >
              <Plus className="h-3 w-3 mr-1" />
              Sous-catégorie
            </Button>
          </div>

          {subcategories.length > 0 && (
            <div className="space-y-2 pl-4 border-l-2 border-muted">
              {subcategories.map((sub) => (
                <div 
                  key={sub.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50 group"
                >
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <span>{sub.name}</span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenSubDialog(sub)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteSubId(sub.id)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </AccordionContent>
      </AccordionItem>

      {/* Subcategory Dialog */}
      <Dialog open={subDialogOpen} onOpenChange={setSubDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSub ? 'Modifier la sous-catégorie' : 'Nouvelle sous-catégorie'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Nom de la sous-catégorie"
              value={subName}
              onChange={(e) => setSubName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmitSub()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleSubmitSub}
              disabled={createSubcategory.isPending || updateSubcategory.isPending}
              className="gradient-primary text-primary-foreground"
            >
              {editingSub ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Subcategory Dialog */}
      <AlertDialog open={!!deleteSubId} onOpenChange={() => setDeleteSubId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette sous-catégorie ?</AlertDialogTitle>
            <AlertDialogDescription>
              Les produits de cette sous-catégorie resteront dans la catégorie parente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSub}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}