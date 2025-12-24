import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, getDay } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Flame, CheckCircle2, Circle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Link } from 'react-router-dom';

interface Task {
	id: number;
	title: string;
	category_id?: number | null;
	is_daily: boolean;
	current_streak?: number;
	completed?: boolean;
}

interface Completion {
	task_id: number;
	completion_date: string;
}

interface CalendarViewProps {
	tasks: Task[];
	completions: Completion[];
	categories: Array<{ id: number; color: string; name: string }>;
	selectedDate?: Date;
	onDateSelect?: (date: Date) => void;
	onTaskClick?: (taskId: number) => void;
	currentMonth?: Date;
	onMonthChange?: (month: Date) => void;
}

export const CalendarView = ({
	tasks,
	completions,
	categories,
	selectedDate,
	onDateSelect,
	onTaskClick,
	currentMonth: externalMonth,
	onMonthChange,
}: CalendarViewProps) => {
	const { t, isRTL } = useLanguage();
	const [internalMonth, setInternalMonth] = useState(new Date());
	const currentMonth = externalMonth || internalMonth;
	const [selectedDayTasks, setSelectedDayTasks] = useState<{ date: Date; tasks: Task[] } | null>(null);
	const [dayDialogOpen, setDayDialogOpen] = useState(false);

	// Debug: Log tasks to console in development
	if (process.env.NODE_ENV === 'development') {
		console.log('CalendarView - Total tasks:', tasks.length);
		console.log('CalendarView - Tasks data:', tasks);
		console.log('CalendarView - Completions:', completions.length);
	}

	// Get all dates in the current month
	const monthStart = startOfMonth(currentMonth);
	const monthEnd = endOfMonth(currentMonth);
	const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

	// Get first day of week for the month (0 = Sunday, 6 = Saturday)
	const firstDayOfWeek = getDay(monthStart);

	// Create array with empty cells for days before month starts
	const emptyDays = Array(firstDayOfWeek).fill(null);

	// Group completions by date
	const completionsByDate = useMemo(() => {
		const map = new Map<string, Set<number>>();
		completions.forEach((completion) => {
			// Normalize the date to YYYY-MM-DD format
			let dateStr: string;
			try {
				if (typeof completion.completion_date === 'string') {
					// If it's already in YYYY-MM-DD format, use it directly
					if (completion.completion_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
						dateStr = completion.completion_date;
					} else {
						// Otherwise, parse it and format it
						const parsedDate = new Date(completion.completion_date);
						if (isNaN(parsedDate.getTime())) {
							console.warn('Invalid completion_date:', completion.completion_date);
							return; // Skip invalid dates
						}
						dateStr = format(parsedDate, 'yyyy-MM-dd');
					}
				} else {
					// Try to parse as date
					try {
						const parsedDate = new Date(completion.completion_date);
						if (isNaN(parsedDate.getTime())) {
							console.warn('Invalid completion_date:', completion.completion_date);
							return; // Skip invalid dates
						}
						dateStr = format(parsedDate, 'yyyy-MM-dd');
					} catch (error) {
						console.warn('Error parsing completion_date:', completion.completion_date, error);
						return; // Skip on error
					}
				}

				if (!map.has(dateStr)) {
					map.set(dateStr, new Set());
				}
				map.get(dateStr)!.add(completion.task_id);
			} catch (error) {
				console.error('Error processing completion date:', completion, error);
			}
		});

		// Debug logging in development
		if (process.env.NODE_ENV === 'development') {
			console.log('Completions by date:', Array.from(map.entries()).map(([date, ids]) => ({
				date,
				taskIds: Array.from(ids),
			})));
			console.log('Raw completions:', completions);
		}

		return map;
	}, [completions]);

	// Get tasks for a specific date
	const getTasksForDate = (date: Date): Task[] => {
		const dateStr = format(date, 'yyyy-MM-dd');
		const completedTaskIds = completionsByDate.get(dateStr) || new Set();

		// Filter active tasks that should appear on this date
		const activeTasks = tasks.filter((task: any) => {
			const isActive = (task as any).is_active ?? (task as any).isActive;
			if (isActive === false || isActive === 0 || isActive === '0') {
				return false;
			}

			const isDaily = (task as any).is_daily ?? (task as any).isDaily;
			const dueDate = (task as any).due_date;

			// If task is daily, show on all dates
			if (isDaily === true || isDaily === 1 || isDaily === '1') {
				return true;
			}

			// If task is not daily, only show on its due_date
			if (dueDate) {
				const taskDueDate = format(new Date(dueDate), 'yyyy-MM-dd');
				return taskDueDate === dateStr;
			}

			// If no due_date and not daily, don't show
			return false;
		});

		// Mark which tasks are completed for this date
		return activeTasks.map((task) => ({
			...task,
			completed: completedTaskIds.has(task.id),
		}));
	};

	// Get completion stats for a date
	const getDateStats = (date: Date) => {
		const dateStr = format(date, 'yyyy-MM-dd');
		const completedTaskIds = completionsByDate.get(dateStr) || new Set();

		// Get active tasks that should appear on this date (same logic as getTasksForDate)
		const activeTasks = tasks.filter((task: any) => {
			const isActive = (task as any).is_active ?? (task as any).isActive;
			if (isActive === false || isActive === 0 || isActive === '0') {
				return false;
			}

			const isDaily = (task as any).is_daily ?? (task as any).isDaily;
			const dueDate = (task as any).due_date;

			// If task is daily, show on all dates
			if (isDaily === true || isDaily === 1 || isDaily === '1') {
				return true;
			}

			// If task is not daily, only show on its due_date
			if (dueDate) {
				const taskDueDate = format(new Date(dueDate), 'yyyy-MM-dd');
				return taskDueDate === dateStr;
			}

			return false;
		});

		const completedCount = Array.from(completedTaskIds).length;
		const totalCount = activeTasks.length;

		return {
			completed: completedCount,
			total: totalCount,
			percentage: totalCount > 0 ? (completedCount / totalCount) * 100 : 0,
		};
	};

	const navigateMonth = (direction: 'prev' | 'next') => {
		const newMonth = direction === 'next' ? addMonths(currentMonth, 1) : subMonths(currentMonth, 1);
		if (onMonthChange) {
			onMonthChange(newMonth);
		} else {
			setInternalMonth(newMonth);
		}
	};

	const handleDateClick = (date: Date) => {
		const tasksForDate = getTasksForDate(date);
		if (tasksForDate.length > 0) {
			setSelectedDayTasks({ date, tasks: tasksForDate });
			setDayDialogOpen(true);
		}
		// Always call onDateSelect to update the selected date in parent
		if (onDateSelect) {
			onDateSelect(date);
		}
	};

	const weekDays = isRTL
		? ['س', 'أ', 'ث', 'ر', 'خ', 'ج', 'ح'] // Arabic: Sat, Sun, Mon, Tue, Wed, Thu, Fri
		: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

	return (
		<Card>
			<CardHeader>
				<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
					<CardTitle className="text-xl sm:text-2xl">{format(currentMonth, 'MMMM yyyy')}</CardTitle>
					<div className="flex gap-2 w-full sm:w-auto">
						<Button
							variant="outline"
							size="icon"
							onClick={() => navigateMonth('prev')}
							className="flex-1 sm:flex-initial"
						>
							<ChevronLeft className="h-4 w-4" />
						</Button>
						<Button
							variant="outline"
							size="icon"
							onClick={() => navigateMonth('next')}
							className="flex-1 sm:flex-initial"
						>
							<ChevronRight className="h-4 w-4" />
						</Button>
						<Button
							variant="outline"
							onClick={() => {
								const today = new Date();
								if (onMonthChange) {
									onMonthChange(today);
								} else {
									setInternalMonth(today);
								}
							}}
							className="flex-1 sm:flex-initial"
						>
							{t('common.today') || 'Today'}
						</Button>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				{tasks.length === 0 ? (
					<div className="text-center py-8 text-muted-foreground">
						<p>No tasks found. Create some tasks to see them on the calendar.</p>
					</div>
				) : (
					<>
						<div className="grid grid-cols-7 gap-1">
							{/* Week day headers */}
							{weekDays.map((day, index) => (
								<div
									key={index}
									className="text-center text-sm font-medium text-muted-foreground p-2"
								>
									{day}
								</div>
							))}

							{/* Empty cells for days before month starts */}
							{emptyDays.map((_, index) => (
								<div key={`empty-${index}`} className="aspect-square" />
							))}

							{/* Days of the month */}
							{daysInMonth.map((date) => {
								const stats = getDateStats(date);
								const isSelected = selectedDate && isSameDay(date, selectedDate);
								const isToday = isSameDay(date, new Date());
								const tasksForDate = getTasksForDate(date);

								// Debug logging for today's date in development
								if (process.env.NODE_ENV === 'development' && isToday) {
									const dateStr = format(date, 'yyyy-MM-dd');
									console.log(`Tasks for today (${dateStr}):`, tasksForDate.map(t => ({
										id: t.id,
										title: t.title,
										completed: t.completed,
										completedType: typeof t.completed,
									})));
								}

								return (
									<button
										key={date.toISOString()}
										onClick={() => handleDateClick(date)}
										className={cn(
											'aspect-square p-1 rounded-md border transition-colors text-sm relative',
											'hover:bg-accent hover:border-primary',
											isSelected && 'bg-primary text-primary-foreground border-primary',
											isToday && !isSelected && 'border-primary/50 bg-primary/5',
											stats.total === 0 && 'opacity-50'
										)}
									>
										<div className="flex flex-col h-full">
											<span className={cn(
												'text-xs font-medium',
												isSelected && 'text-primary-foreground',
												isToday && !isSelected && 'text-primary'
											)}>
												{format(date, 'd')}
											</span>

											{/* Task indicators */}
											{tasksForDate.length > 0 ? (
												<div className="flex-1 flex flex-wrap gap-1 mt-1 justify-center items-center min-h-[20px]">
													{tasksForDate.slice(0, 4).map((task) => {
														// Use green for completed tasks, red for incomplete tasks
														// Handle both boolean and number types (MySQL returns 1/0)
														const taskCompleted = (task as any).completed;
														const isCompleted = taskCompleted === true ||
															taskCompleted === 1 ||
															taskCompleted === '1' ||
															String(taskCompleted) === 'true';
														const taskColor = isCompleted ? '#10B981' : '#EF4444'; // Green for completed, Red for incomplete

														// Debug logging in development
														if (process.env.NODE_ENV === 'development') {
															console.log(`Task ${task.id} (${task.title}): completed=${taskCompleted}, type=${typeof taskCompleted}, isCompleted=${isCompleted}, color=${taskColor}`);
														}

														return (
															<div
																key={task.id}
																className={cn(
																	'w-2.5 h-2.5 rounded-full border-2',
																	isCompleted
																		? 'border-green-600 ring-1 ring-green-400'
																		: 'border-red-600 ring-1 ring-red-400'
																)}
																style={{
																	backgroundColor: taskColor,
																	opacity: isCompleted ? 1 : 0.9,
																}}
																title={`${task.title}${isCompleted ? ' (Completed)' : ' (Incomplete)'}`}
															/>
														);
													})}
													{tasksForDate.length > 4 && (
														<div className="text-[10px] font-semibold text-primary px-1.5 py-0.5 bg-primary/10 rounded">
															+{tasksForDate.length - 4}
														</div>
													)}
												</div>
											) : (
												<div className="flex-1 min-h-[20px]" />
											)}

											{/* Completion percentage indicator */}
											{stats.total > 0 && (
												<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-muted rounded-b-md overflow-hidden">
													<div
														className={cn(
															'h-full transition-all',
															stats.percentage === 100 ? 'bg-green-500' :
																stats.percentage >= 50 ? 'bg-yellow-500' :
																	'bg-red-500'
														)}
														style={{ width: `${stats.percentage}%` }}
													/>
												</div>
											)}
										</div>
									</button>
								);
							})}
						</div>
						{/* Debug info - remove in production */}
						{process.env.NODE_ENV === 'development' && (
							<div className="mt-2 text-xs text-muted-foreground text-center space-y-1">
								<div>Total tasks: {tasks.length}</div>
								<div>Active tasks: {tasks.filter((t: any) => {
									const isActive = (t as any).is_active ?? (t as any).isActive;
									return isActive !== false && isActive !== 0 && isActive !== '0';
								}).length}</div>
								<div>Completions this month: {completions.length}</div>
							</div>
						)}
					</>
				)}

				{/* Legend */}
				<div className="mt-4 pt-4 border-t flex flex-wrap gap-4 text-xs text-muted-foreground">
					<div className="flex items-center gap-2">
						<div className="w-3 h-3 rounded-full bg-green-500 border-2 border-green-600" />
						<span>{t('tasks.completed') || 'Completed'}</span>
					</div>
					<div className="flex items-center gap-2">
						<div className="w-3 h-3 rounded-full bg-red-500 border-2 border-red-600" />
						<span>{t('tasks.uncompleted') || 'Incomplete'}</span>
					</div>
					<div className="flex items-center gap-2">
						<div className="w-full h-0.5 bg-green-500" />
						<span>100% Complete</span>
					</div>
				</div>
			</CardContent>

			{/* Day Tasks Dialog */}
			<Dialog open={dayDialogOpen} onOpenChange={setDayDialogOpen}>
				<DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[80vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>
							{selectedDayTasks && format(selectedDayTasks.date, 'EEEE, MMMM d, yyyy')}
						</DialogTitle>
						<DialogDescription>
							{selectedDayTasks && `${selectedDayTasks.tasks.length} ${selectedDayTasks.tasks.length === 1 ? 'task' : 'tasks'}`}
						</DialogDescription>
					</DialogHeader>
					{selectedDayTasks && (
						<div className="space-y-3">
							{selectedDayTasks.tasks.map((task) => {
								const category = categories.find((c) => c.id === task.category_id);
								return (
									<Card key={task.id} className={task.completed ? 'opacity-75' : ''}>
										<CardHeader>
											<div className="flex items-start justify-between">
												<div className="flex items-center gap-3 flex-1">
													{task.completed ? (
														<CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
													) : (
														<Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
													)}
													<div className="flex-1">
														<CardTitle className="text-lg">{task.title}</CardTitle>
														{task.description && (
															<p className="text-sm text-muted-foreground mt-1">{task.description}</p>
														)}
													</div>
												</div>
												{category && (
													<Badge
														style={{ backgroundColor: category.color }}
														className="text-white"
													>
														{category.name}
													</Badge>
												)}
											</div>
										</CardHeader>
										<CardContent>
											<div className="flex items-center justify-between flex-wrap gap-2">
												<div className="flex items-center gap-4 flex-wrap">
													{task.current_streak && task.current_streak > 0 && (
														<div className="flex items-center gap-1">
															<Flame className="h-4 w-4 text-orange-500" />
															<span className="text-sm">
																{t('dashboard.dayStreak', { count: task.current_streak })}
															</span>
														</div>
													)}
													<Badge variant="outline" className="capitalize">
														{t(`tasks.${task.priority || 'medium'}`) || task.priority || 'medium'}
													</Badge>
													{task.completed && (
														<Badge variant="default" className="bg-green-500">
															{t('tasks.completed') || 'Completed'}
														</Badge>
													)}
												</div>
												<Button asChild variant="outline" size="sm">
													<Link to={`/tasks/${task.id}/edit`}>
														{t('common.edit') || 'Edit'}
													</Link>
												</Button>
											</div>
										</CardContent>
									</Card>
								);
							})}
							{selectedDayTasks.tasks.length === 0 && (
								<div className="text-center py-8 text-muted-foreground">
									<p>{t('calendar.noTasksForSelectedDate') || 'No tasks for this date'}</p>
								</div>
							)}
						</div>
					)}
				</DialogContent>
			</Dialog>
		</Card>
	);
};

