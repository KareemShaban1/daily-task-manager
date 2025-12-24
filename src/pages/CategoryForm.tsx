import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const COLOR_PRESETS = [
  '#8B5CF6', // Purple
  '#EF4444', // Red
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
  '#6366F1', // Indigo
];

const ICON_PRESETS = [
  'prayer',
  'heart',
  'user',
  'repeat',
  'book',
  'dumbbell',
  'coffee',
  'moon',
  'sun',
  'star',
  'target',
  'check-circle',
];

export default function CategoryForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
    color: '',
  });

  const { data: category, isLoading: categoryLoading } = useQuery({
    queryKey: ['category', id],
    queryFn: () => api.getCategory(Number(id)),
    enabled: isEditing,
  });

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        description: category.description || '',
        icon: category.icon || '',
        color: category.color || '',
      });
    }
  }, [category]);

  const createMutation = useMutation({
    mutationFn: (data: any) => api.createCategory(data),
    onSuccess: () => {
      toast.success('Category created successfully!');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      navigate('/categories');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create category');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.updateCategory(Number(id), data),
    onSuccess: () => {
      toast.success('Category updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['category', id] });
      navigate('/categories');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update category');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    const submitData = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      icon: formData.icon.trim() || undefined,
      color: formData.color.trim() || undefined,
    };

    if (isEditing) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  if (categoryLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/categories')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Categories
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>
              {isEditing ? 'Edit Category' : 'Create New Category'}
            </CardTitle>
            <CardDescription>
              {isEditing
                ? 'Update category details below'
                : 'Add a new category to organize your tasks'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Category Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Spiritual, Health, Personal"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Optional description for this category..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {COLOR_PRESETS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, color })
                      }
                      className={`w-10 h-10 rounded-full border-2 transition-all ${
                        formData.color === color
                          ? 'border-foreground scale-110'
                          : 'border-transparent hover:border-foreground/50'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
                <Input
                  id="color"
                  type="text"
                  value={formData.color}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                  placeholder="#8B5CF6"
                  pattern="^#[0-9A-Fa-f]{6}$"
                />
                <p className="text-sm text-muted-foreground">
                  Enter a hex color code (e.g., #8B5CF6) or select from presets
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="icon">Icon</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {ICON_PRESETS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, icon })
                      }
                      className={`px-3 py-2 rounded-md border transition-all ${
                        formData.icon === icon
                          ? 'border-foreground bg-primary text-primary-foreground'
                          : 'border-border hover:border-foreground/50'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
                <Input
                  id="icon"
                  type="text"
                  value={formData.icon}
                  onChange={(e) =>
                    setFormData({ ...formData, icon: e.target.value })
                  }
                  placeholder="e.g., prayer, heart, user"
                />
                <p className="text-sm text-muted-foreground">
                  Enter an icon name or select from presets
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/categories')}
                  className="flex-1 w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 w-full sm:w-auto"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Saving...'
                    : isEditing
                    ? 'Update Category'
                    : 'Create Category'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

