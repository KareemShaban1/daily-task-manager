import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

export default function TaskForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: undefined as string | undefined,
    isDaily: true,
    dueDate: '',
    reminderEnabled: true,
    reminderTimes: [] as string[],
    priority: 'medium' as 'low' | 'medium' | 'high',
    color: '',
    icon: '',
  });

  const [newReminderTime, setNewReminderTime] = useState('');

  const { data: task, isLoading: taskLoading } = useQuery({
    queryKey: ['task', id],
    queryFn: () => api.getTask(Number(id)),
    enabled: isEditing,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.getCategories(),
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        categoryId: task.category_id?.toString() || undefined,
        isDaily: task.is_daily ?? true,
        dueDate: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '',
        reminderEnabled: task.reminder_enabled ?? true,
        reminderTimes: task.reminder_times || [],
        priority: task.priority || 'medium',
        color: task.color || '',
        icon: task.icon || '',
      });
    }
  }, [task]);

  const createMutation = useMutation({
    mutationFn: (data: any) => api.createTask(data),
    onSuccess: () => {
      toast.success('Task created successfully!');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      navigate('/dashboard');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create task');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.updateTask(Number(id), data),
    onSuccess: () => {
      toast.success('Task updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', id] });
      navigate('/dashboard');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update task');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const submitData = {
      title: formData.title,
      description: formData.description || undefined,
      categoryId: formData.categoryId ? Number(formData.categoryId) : undefined,
      isDaily: formData.isDaily,
      reminderEnabled: formData.reminderEnabled,
      reminderTimes: formData.reminderTimes,
      priority: formData.priority,
      color: formData.color || undefined,
      icon: formData.icon || undefined,
    };

    if (isEditing) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  const addReminderTime = () => {
    if (newReminderTime && !formData.reminderTimes.includes(newReminderTime)) {
      setFormData({
        ...formData,
        reminderTimes: [...formData.reminderTimes, newReminderTime],
      });
      setNewReminderTime('');
    }
  };

  const removeReminderTime = (time: string) => {
    setFormData({
      ...formData,
      reminderTimes: formData.reminderTimes.filter((t) => t !== time),
    });
  };

  if (taskLoading) {
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
          onClick={() => navigate('/dashboard')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>{isEditing ? t('tasks.editTask') : t('tasks.newTask')}</CardTitle>
            <CardDescription>
              {isEditing
                ? t('tasks.editTask')
                : t('tasks.newTask')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">{t('tasks.taskTitle')} *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="e.g., Fajr Prayer"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t('tasks.description')}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder={t('tasks.description')}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">{t('tasks.category')}</Label>
                <Select
                  value={formData.categoryId || undefined}
                  onValueChange={(value) =>
                    setFormData({ ...formData, categoryId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('tasks.selectCategory')} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat: any) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('tasks.dailyTask')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('tasks.taskRepeats')}
                  </p>
                </div>
                <Switch
                  checked={formData.isDaily}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isDaily: checked, dueDate: checked ? '' : formData.dueDate })
                  }
                />
              </div>

              {!formData.isDaily && (
                <div className="space-y-2">
                  <Label htmlFor="dueDate">{t('tasks.dueDate') || 'Due Date'} *</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) =>
                      setFormData({ ...formData, dueDate: e.target.value })
                    }
                    required={!formData.isDaily}
                  />
                  <p className="text-sm text-muted-foreground">
                    {t('tasks.dueDateDescription') || 'This task will only appear on the selected date'}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('tasks.enableReminders')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('tasks.getNotified')}
                  </p>
                </div>
                <Switch
                  checked={formData.reminderEnabled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, reminderEnabled: checked })
                  }
                />
              </div>

              {formData.reminderEnabled && (
                <div className="space-y-2">
                  <Label>{t('tasks.reminderTimes')}</Label>
                  <div className="flex gap-2">
                    <Input
                      type="time"
                      value={newReminderTime}
                      onChange={(e) => setNewReminderTime(e.target.value)}
                      placeholder="HH:MM"
                    />
                    <Button
                      type="button"
                      onClick={addReminderTime}
                      variant="outline"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.reminderTimes.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.reminderTimes.map((time) => (
                        <div
                          key={time}
                          className="flex items-center gap-2 bg-secondary px-3 py-1 rounded-md"
                        >
                          <span>{time}</span>
                          <button
                            type="button"
                            onClick={() => removeReminderTime(time)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="priority">{t('tasks.priority')}</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: 'low' | 'medium' | 'high') =>
                    setFormData({ ...formData, priority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{t('tasks.low')}</SelectItem>
                    <SelectItem value="medium">{t('tasks.medium')}</SelectItem>
                    <SelectItem value="high">{t('tasks.high')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                  className="flex-1 w-full sm:w-auto"
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  className="flex-1 w-full sm:w-auto"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? t('common.loading')
                    : isEditing
                    ? t('tasks.editTask')
                    : t('tasks.newTask')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

