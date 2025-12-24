import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { CalendarView } from '@/components/CalendarView';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Flame, Calendar, TrendingUp, FolderOpen, List, Edit, Trash2, Eye, MoreVertical, CheckCircle2, Circle, User, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { toast } from 'sonner';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [taskDetailOpen, setTaskDetailOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<number | null>(null);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [taskToComplete, setTaskToComplete] = useState<{ id: number; isCompleted: boolean; title: string } | null>(null);

  // Get tasks for the selected date
  // For daily tasks: show all active daily tasks
  // For date-specific tasks: show only tasks with due_date matching selectedDate
  const { data: allTasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', { isActive: true }],
    queryFn: () => api.getTasks({ isActive: true }),
  });

  // Filter tasks based on selected date
  const tasks = useMemo(() => {
    const filtered = allTasks.filter((task: any) => {
      const isActive = task.is_active ?? task.isActive;
      if (isActive === false || isActive === 0 || isActive === '0') {
        return false;
      }
      
      const isDaily = task.is_daily ?? task.isDaily;
      const dueDate = task.due_date;
      
      // Daily tasks appear on all dates
      if (isDaily === true || isDaily === 1 || isDaily === '1') {
        return true;
      }
      
      // Non-daily tasks only appear on their due_date
      if (dueDate) {
        // Handle different date formats (Date object, string, etc.)
        let taskDueDateStr: string;
        try {
          if (dueDate instanceof Date) {
            taskDueDateStr = format(dueDate, 'yyyy-MM-dd');
          } else if (typeof dueDate === 'string') {
            // If it's already in YYYY-MM-DD format, use it directly
            if (dueDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
              taskDueDateStr = dueDate;
            } else {
              // Otherwise, parse it (handle MySQL date format YYYY-MM-DD or datetime)
              const parsedDate = new Date(dueDate);
              taskDueDateStr = format(parsedDate, 'yyyy-MM-dd');
            }
          } else {
            taskDueDateStr = format(new Date(dueDate), 'yyyy-MM-dd');
          }
          
          const matches = taskDueDateStr === selectedDate;
          
          // Debug logging in development
          if (process.env.NODE_ENV === 'development' && !matches && dueDate) {
            console.log('Task date mismatch:', {
              taskId: task.id,
              taskTitle: task.title,
              taskDueDate: dueDate,
              taskDueDateStr,
              selectedDate,
              isDaily,
            });
          }
          
          return matches;
        } catch (error) {
          console.error('Error parsing due_date:', dueDate, error);
          return false;
        }
      }
      
      // Tasks without due_date and not daily don't appear
      return false;
    });
    
    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Filtered tasks for date:', selectedDate, {
        totalTasks: allTasks.length,
        filteredTasks: filtered.length,
        dailyTasks: allTasks.filter((t: any) => (t.is_daily ?? t.isDaily) === true || (t.is_daily ?? t.isDaily) === 1).length,
        dateSpecificTasks: allTasks.filter((t: any) => {
          const isDaily = t.is_daily ?? t.isDaily;
          return (isDaily === false || isDaily === 0) && t.due_date;
        }).length,
      });
    }
    
    return filtered;
  }, [allTasks, selectedDate]);

  const { data: statistics, isLoading: statisticsLoading } = useQuery({
    queryKey: ['statistics', 'daily', selectedDate],
    queryFn: () => {
      console.log('Fetching statistics for date:', selectedDate);
      return api.getDailyStatistics(selectedDate);
    },
    staleTime: 0, // Always consider data stale to ensure fresh data on date change
    gcTime: 0, // Don't cache to ensure fresh data (gcTime replaces cacheTime in React Query v5)
  });

  // Debug: Log statistics changes
  useEffect(() => {
    if (statistics) {
      console.log('Statistics updated for date:', selectedDate, statistics);
    }
  }, [statistics, selectedDate]);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.getCategories(),
  });

  const completeMutation = useMutation({
    mutationFn: ({ taskId, notes }: { taskId: number; notes?: string }) =>
      api.completeTask(taskId, { notes, completionDate: selectedDate }),
    onSuccess: () => {
      toast.success(t('tasks.taskCompletedSuccess') || 'Task completed successfully!');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
      queryClient.invalidateQueries({ queryKey: ['completions'] });
      setCompleteDialogOpen(false);
      setTaskToComplete(null);
    },
    onError: (error: any) => {
      toast.error(error.message || t('tasks.failedToCompleteTask') || 'Failed to complete task');
    },
  });

  const uncompleteMutation = useMutation({
    mutationFn: (taskId: number) =>
      api.uncompleteTask(taskId, { completionDate: selectedDate }),
    onSuccess: () => {
      toast.success(t('tasks.taskUncompletedSuccess') || 'Task uncompleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
      queryClient.invalidateQueries({ queryKey: ['completions'] });
      setCompleteDialogOpen(false);
      setTaskToComplete(null);
    },
    onError: (error: any) => {
      toast.error(error.message || t('tasks.failedToUncompleteTask') || 'Failed to uncomplete task');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (taskId: number) => api.deleteTask(taskId),
    onSuccess: () => {
      toast.success(t('tasks.taskDeletedSuccess') || 'Task deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error.message || t('tasks.failedToDeleteTask') || 'Failed to delete task');
    },
  });

  const { data: completions } = useQuery({
    queryKey: ['completions', selectedDate],
    queryFn: () => api.getTaskHistory({ startDate: selectedDate, endDate: selectedDate }),
  });

  // Fetch completions for the entire month for calendar view
  const monthStart = startOfMonth(calendarMonth);
  const monthEnd = endOfMonth(calendarMonth);
  const { data: monthCompletions = [] } = useQuery({
    queryKey: ['completions', 'month', format(monthStart, 'yyyy-MM-dd'), format(monthEnd, 'yyyy-MM-dd')],
    queryFn: () => api.getTaskHistory({
      startDate: format(monthStart, 'yyyy-MM-dd'),
      endDate: format(monthEnd, 'yyyy-MM-dd'),
    }),
    enabled: viewMode === 'calendar',
  });

  const completedTaskIds = new Set(
    (completions || []).map((c: any) => c.task_id)
  );

  const handleToggleComplete = (taskId: number, isCompleted: boolean, taskTitle: string) => {
    setTaskToComplete({ id: taskId, isCompleted, title: taskTitle });
    setCompleteDialogOpen(true);
  };

  const handleCompleteConfirm = () => {
    if (taskToComplete) {
      if (taskToComplete.isCompleted) {
        uncompleteMutation.mutate(taskToComplete.id);
      } else {
        completeMutation.mutate({ taskId: taskToComplete.id });
      }
    }
  };

  const handleCompleteCancel = () => {
    setCompleteDialogOpen(false);
    setTaskToComplete(null);
  };

  const handleViewTask = (task: any) => {
    setSelectedTask(task);
    setTaskDetailOpen(true);
  };

  const handleDeleteClick = (taskId: number) => {
    setTaskToDelete(taskId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (taskToDelete) {
      deleteMutation.mutate(taskToDelete);
    }
  };

  const getCategoryColor = (categoryId: number | null) => {
    if (!categoryId) return '#6B7280';
    const category = categories.find((c: any) => c.id === categoryId);
    return category?.color || '#6B7280';
  };

  // Calculate completion rate from statistics
  // Always recalculate to ensure accuracy
  // IMPORTANT: This hook must be called BEFORE any conditional returns
  const completionRate = useMemo(() => {
    if (!statistics) return '0';
    
    const total = statistics.total_tasks || 0;
    const completed = statistics.completed_tasks || 0;
    
    if (total === 0) return '0';
    
    const rate = (completed / total) * 100;
    console.log(`Completion rate calculation for ${selectedDate}:`, {
      total,
      completed,
      rate: rate.toFixed(2),
      backendRate: statistics.completion_rate,
    });
    
    return rate.toFixed(0);
  }, [statistics, selectedDate]);

  if (tasksLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
              {t('dashboard.welcomeBack', { name: user?.firstName || 'User' })}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {format(new Date(selectedDate), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Link to="/profile">
              <Button variant="outline" size="icon" title={t('profile.title') || 'Profile'}>
                <User className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                logout();
                navigate('/auth');
                toast.success(t('auth.loggedOut') || 'Logged out successfully');
              }}
              title={t('auth.logout') || 'Logout'}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.completionRate')}</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completionRate}%</div>
              <p className="text-xs text-muted-foreground">
                {statistics?.completed_tasks || 0} of {statistics?.total_tasks || 0} {t('tasks.title').toLowerCase()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.activeStreaks')}</CardTitle>
              <Flame className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statistics?.active_streaks || 0}
              </div>
              <p className="text-xs text-muted-foreground">{t('dashboard.keepItUp')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.totalTasks')}</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics?.total_tasks || 0}</div>
              <p className="text-xs text-muted-foreground">{t('dashboard.dailyTasks')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.longestStreak')}</CardTitle>
              <Flame className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statistics?.longest_streak || 0}
              </div>
              <p className="text-xs text-muted-foreground">{t('dashboard.days')}</p>
            </CardContent>
          </Card>
        </div>

        {/* View Toggle and Actions */}
        <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'list' | 'calendar')} className="w-full sm:w-auto">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="list" className="flex-1 sm:flex-initial">
                <List className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{t('dashboard.listView')}</span>
                <span className="sm:hidden">{t('dashboard.listView').split(' ')[0]}</span>
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex-1 sm:flex-initial">
                <Calendar className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{t('dashboard.calendarView')}</span>
                <span className="sm:hidden">{t('dashboard.calendarView').split(' ')[0]}</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Link to="/categories" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto">
                <FolderOpen className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{t('categories.title')}</span>
                <span className="sm:hidden">Categories</span>
              </Button>
            </Link>
            <Link to="/tasks/new" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                {t('dashboard.newTask')}
              </Button>
            </Link>
          </div>
        </div>

        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <div className="mb-8">
            <CalendarView
              tasks={allTasks as any}
              completions={monthCompletions as any}
              categories={categories as any}
              selectedDate={new Date(selectedDate)}
              currentMonth={calendarMonth}
              onMonthChange={setCalendarMonth}
              onDateSelect={(date) => {
                setSelectedDate(format(date, 'yyyy-MM-dd'));
                setViewMode('list');
              }}
            />
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <>
            <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold">{t('dashboard.todaysTasks')}</h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  {format(new Date(selectedDate), 'EEEE, MMMM d, yyyy')}
                </p>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="flex-1 sm:w-auto"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                  className="whitespace-nowrap"
                >
                  {t('common.today') || 'Today'}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task: any) => {
            const isCompleted = completedTaskIds.has(task.id);
            const category = categories.find((c: any) => c.id === task.category_id);

            return (
              <Card
                key={task.id}
                className={isCompleted ? 'opacity-60' : ''}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2 flex-1">
                      <Checkbox
                        checked={isCompleted}
                        onCheckedChange={() =>
                          handleToggleComplete(task.id, isCompleted, task.title)
                        }
                        disabled={
                          completeMutation.isPending || uncompleteMutation.isPending
                        }
                      />
                      <CardTitle 
                        className="text-lg cursor-pointer hover:underline"
                        onClick={() => handleViewTask(task)}
                      >
                        {task.title}
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      {category && (
                        <Badge
                          style={{ backgroundColor: category.color }}
                          className="text-white"
                        >
                          {category.name}
                        </Badge>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewTask(task)}>
                            <Eye className="h-4 w-4 mr-2" />
                            {t('common.view') || 'View'}
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={`/tasks/${task.id}/edit`}>
                              <Edit className="h-4 w-4 mr-2" />
                              {t('common.edit') || 'Edit'}
                            </Link>
                          </DropdownMenuItem>
                          {isCompleted ? (
                            <DropdownMenuItem 
                              onClick={() => handleToggleComplete(task.id, isCompleted, task.title)}
                              className="text-yellow-600"
                            >
                              <Circle className="h-4 w-4 mr-2" />
                              {t('tasks.uncomplete') || 'Uncomplete'}
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem 
                              onClick={() => handleToggleComplete(task.id, isCompleted, task.title)}
                              className="text-green-600"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              {t('tasks.complete') || 'Complete'}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={() => handleDeleteClick(task.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {t('common.delete') || 'Delete'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  {task.description && (
                    <CardDescription>{task.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {task.current_streak > 0 && (
                        <div className="flex items-center space-x-1">
                          <Flame className="h-4 w-4 text-orange-500" />
                          <span className="text-sm font-medium">
                            {t('dashboard.dayStreak', { count: task.current_streak })}
                          </span>
                        </div>
                      )}
                    </div>
                    {task.reminder_times && task.reminder_times.length > 0 && (
                      <div className="text-sm text-muted-foreground">
                        {task.reminder_times.join(', ')}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

            {tasks.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground mb-4">
                    {t('dashboard.noTasks')}
                  </p>
                  <Link to="/tasks/new">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('dashboard.createTask')}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Task Detail Dialog */}
        <Dialog open={taskDetailOpen} onOpenChange={setTaskDetailOpen}>
          <DialogContent className="max-w-2xl w-[95vw] sm:w-full">
            <DialogHeader>
              <DialogTitle>{selectedTask?.title}</DialogTitle>
              <DialogDescription>
                {format(new Date(selectedDate), 'EEEE, MMMM d, yyyy')}
              </DialogDescription>
            </DialogHeader>
            {selectedTask && (
              <div className="space-y-4">
                {selectedTask.description && (
                  <div>
                    <h4 className="font-semibold mb-2">{t('tasks.description')}</h4>
                    <p className="text-muted-foreground">{selectedTask.description}</p>
                  </div>
                )}
                {selectedTask.category_id && (
                  <div>
                    <h4 className="font-semibold mb-2">{t('tasks.category')}</h4>
                    <Badge
                      style={{ backgroundColor: getCategoryColor(selectedTask.category_id) }}
                      className="text-white"
                    >
                      {categories.find((c: any) => c.id === selectedTask.category_id)?.name}
                    </Badge>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">{t('tasks.priority')}</h4>
                    <Badge variant="outline" className="capitalize">
                      {selectedTask.priority || 'medium'}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">{t('tasks.dailyTask')}</h4>
                    <Badge variant="outline">
                      {selectedTask.is_daily ? t('common.yes') : t('common.no')}
                    </Badge>
                  </div>
                </div>
                {selectedTask.reminder_times && selectedTask.reminder_times.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">{t('tasks.reminderTimes')}</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedTask.reminder_times.map((time: string, idx: number) => (
                        <Badge key={idx} variant="secondary">{time}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {selectedTask.current_streak > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">{t('dashboard.activeStreaks')}</h4>
                    <div className="flex items-center space-x-2">
                      <Flame className="h-5 w-5 text-orange-500" />
                      <span>{t('dashboard.dayStreak', { count: selectedTask.current_streak })}</span>
                    </div>
                  </div>
                )}
                <div className="flex gap-2 pt-4">
                  <Button asChild variant="outline" className="flex-1">
                    <Link to={`/tasks/${selectedTask.id}/edit`}>
                      <Edit className="h-4 w-4 mr-2" />
                      {t('common.edit') || 'Edit'}
                    </Link>
                  </Button>
                  {completedTaskIds.has(selectedTask.id) ? (
                    <Button
                      variant="outline"
                      className="flex-1 border-yellow-500 text-yellow-600 hover:bg-yellow-50"
                      onClick={() => {
                        setTaskDetailOpen(false);
                        handleToggleComplete(selectedTask.id, true, selectedTask.title);
                      }}
                    >
                      <Circle className="h-4 w-4 mr-2" />
                      {t('tasks.uncomplete') || 'Uncomplete'}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="flex-1 border-green-500 text-green-600 hover:bg-green-50"
                      onClick={() => {
                        setTaskDetailOpen(false);
                        handleToggleComplete(selectedTask.id, false, selectedTask.title);
                      }}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      {t('tasks.complete') || 'Complete'}
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => {
                      setTaskDetailOpen(false);
                      handleDeleteClick(selectedTask.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('common.delete') || 'Delete'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Complete/Uncomplete Confirmation Dialog */}
        <AlertDialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {taskToComplete?.isCompleted 
                  ? t('tasks.uncompleteTaskConfirmTitle') || 'Uncomplete Task'
                  : t('tasks.completeTaskConfirmTitle') || 'Complete Task'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {taskToComplete?.isCompleted
                  ? t('tasks.uncompleteTaskConfirmDescription', { task: taskToComplete.title }) || 
                    `Are you sure you want to mark "${taskToComplete?.title}" as incomplete?`
                  : t('tasks.completeTaskConfirmDescription', { task: taskToComplete?.title }) || 
                    `Are you sure you want to mark "${taskToComplete?.title}" as completed?`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleCompleteCancel}>
                {t('common.cancel') || 'Cancel'}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCompleteConfirm}
                disabled={completeMutation.isPending || uncompleteMutation.isPending}
                className={taskToComplete?.isCompleted 
                  ? 'bg-yellow-500 text-white hover:bg-yellow-600' 
                  : 'bg-green-500 text-white hover:bg-green-600'}
              >
                {(completeMutation.isPending || uncompleteMutation.isPending) 
                  ? (t('common.loading') || 'Processing...')
                  : taskToComplete?.isCompleted
                    ? (t('tasks.uncomplete') || 'Uncomplete')
                    : (t('tasks.complete') || 'Complete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('tasks.deleteTaskConfirmTitle') || 'Delete Task'}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('tasks.deleteTaskConfirmDescription') || 'Are you sure you want to delete this task? This action cannot be undone.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel') || 'Cancel'}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? t('common.loading') || 'Deleting...' : t('common.delete') || 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

