import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function Categories() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.getCategories(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteCategory(id),
    onSuccess: () => {
      toast.success(t('success.categoryDeleted'));
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error.message || t('errors.somethingWentWrong'));
    },
  });

  const handleDeleteClick = (id: number) => {
    setCategoryToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (categoryToDelete) {
      deleteMutation.mutate(categoryToDelete);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">{t('categories.title')}</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                {t('categories.manageCategories')}
              </p>
            </div>
          </div>
          <Link to="/categories/new" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              {t('categories.newCategory')}
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('categories.allCategories')}</CardTitle>
            <CardDescription>
              {categories.length === 1 
                ? t('categories.totalOne')
                : t('categories.totalMany', { count: categories.length })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {categories.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  {t('categories.noCategories')}
                </p>
                <Link to="/categories/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('categories.createCategory')}
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('common.name')}</TableHead>
                        <TableHead>{t('tasks.description')}</TableHead>
                        <TableHead>{t('categories.color')}</TableHead>
                        <TableHead>{t('categories.icon')}</TableHead>
                        <TableHead className="text-right">{t('common.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories.map((category: any) => (
                        <TableRow key={category.id}>
                          <TableCell className="font-medium">
                            {category.name}
                          </TableCell>
                          <TableCell>
                            {category.description || (
                              <span className="text-muted-foreground">{t('categories.noDescription')}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {category.color ? (
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-4 h-4 rounded-full"
                                  style={{ backgroundColor: category.color }}
                                />
                                <span className="text-sm">{category.color}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">{t('categories.noColor')}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {category.icon ? (
                              <Badge variant="outline">{category.icon}</Badge>
                            ) : (
                              <span className="text-muted-foreground">{t('categories.noIcon')}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Link to={`/categories/${category.id}/edit`}>
                                <Button variant="ghost" size="icon">
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteClick(category.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                  {categories.map((category: any) => (
                    <Card key={category.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle>{category.name}</CardTitle>
                            {category.description && (
                              <CardDescription className="mt-2">{category.description}</CardDescription>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Link to={`/categories/${category.id}/edit`}>
                              <Button variant="ghost" size="icon">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(category.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {category.color && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{t('categories.color')}:</span>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-4 h-4 rounded-full"
                                  style={{ backgroundColor: category.color }}
                                />
                                <span className="text-sm">{category.color}</span>
                              </div>
                            </div>
                          )}
                          {category.icon && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{t('categories.icon')}:</span>
                              <Badge variant="outline">{category.icon}</Badge>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('categories.deleteConfirm')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('categories.deleteMessage')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteMutation.isPending ? t('common.loading') : t('common.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

