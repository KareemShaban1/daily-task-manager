import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Bell, Calendar, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

export const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-hero" />
      
      {/* Gradient Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-category-spiritual/20 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 animate-fade-up opacity-0">
            <Sparkles className="w-4 h-4 text-secondary" />
            <span className="text-sm text-primary-foreground/80">Your daily companion for mindful living</span>
          </div>
          
          {/* Headline */}
          <h1 className="font-display text-5xl md:text-7xl font-bold text-primary-foreground mb-6 animate-fade-up opacity-0 stagger-1">
            Transform Your{" "}
            <span className="text-gradient">Daily Routine</span>
            {" "}Into Lasting Habits
          </h1>
          
          {/* Subheadline */}
          <p className="text-lg md:text-xl text-primary-foreground/70 mb-10 max-w-2xl mx-auto animate-fade-up opacity-0 stagger-2">
            Track prayers, build healthy habits, and never miss important daily tasks. 
            Smart reminders, streak tracking, and beautiful insights to keep you motivated.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-up opacity-0 stagger-3">
            <Button variant="hero" size="xl" asChild>
              <Link to="/auth?mode=signup">
                Start Free Today
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button variant="hero-outline" size="xl" asChild>
              <Link to="#how-it-works">
                See How It Works
              </Link>
            </Button>
          </div>
          
          {/* Feature Pills */}
          <div className="flex flex-wrap items-center justify-center gap-4 animate-fade-up opacity-0 stagger-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 backdrop-blur-sm">
              <Bell className="w-4 h-4 text-secondary" />
              <span className="text-sm text-primary-foreground/80">Smart Reminders</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 backdrop-blur-sm">
              <Calendar className="w-4 h-4 text-secondary" />
              <span className="text-sm text-primary-foreground/80">Daily Tracking</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 backdrop-blur-sm">
              <TrendingUp className="w-4 h-4 text-secondary" />
              <span className="text-sm text-primary-foreground/80">Streak Analytics</span>
            </div>
          </div>
        </div>
        
        {/* Dashboard Preview */}
        <div className="mt-16 max-w-5xl mx-auto animate-fade-up opacity-0 stagger-5">
          <div className="relative rounded-2xl overflow-hidden shadow-elevated">
            {/* Glass overlay effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/50 z-10 pointer-events-none" />
            
            {/* Dashboard mockup */}
            <div className="bg-card p-6 rounded-2xl">
              <DashboardPreview />
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

const DashboardPreview = () => {
  const tasks = [
    { name: "Fajr Prayer", time: "5:30 AM", completed: true, category: "spiritual" },
    { name: "Morning Workout", time: "6:30 AM", completed: true, category: "health" },
    { name: "Dhuhr Prayer", time: "12:30 PM", completed: true, category: "spiritual" },
    { name: "Read 20 Pages", time: "2:00 PM", completed: false, category: "personal" },
    { name: "Asr Prayer", time: "3:45 PM", completed: false, category: "spiritual" },
    { name: "Drink 8 Glasses Water", time: "All Day", completed: false, category: "health" },
  ];

  const categoryColors: Record<string, string> = {
    spiritual: "bg-category-spiritual",
    health: "bg-category-health",
    personal: "bg-category-personal",
    habits: "bg-category-habits",
  };

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {/* Today's Tasks */}
      <div className="md:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold text-lg text-foreground">Today's Tasks</h3>
          <span className="text-sm text-muted-foreground">3/6 completed</span>
        </div>
        <div className="space-y-3">
          {tasks.map((task, index) => (
            <div
              key={index}
              className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                task.completed ? "bg-muted/50" : "bg-card border border-border"
              }`}
            >
              <div className={`w-3 h-3 rounded-full ${categoryColors[task.category]}`} />
              <div className="flex-1">
                <p className={`font-medium ${task.completed ? "text-muted-foreground line-through" : "text-foreground"}`}>
                  {task.name}
                </p>
                <p className="text-sm text-muted-foreground">{task.time}</p>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                task.completed 
                  ? "bg-success border-success" 
                  : "border-muted-foreground"
              }`}>
                {task.completed && (
                  <svg className="w-4 h-4 text-success-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Stats */}
      <div className="space-y-4">
        <div className="p-5 rounded-xl bg-gradient-to-br from-secondary/20 to-secondary/5 border border-secondary/20">
          <p className="text-sm text-muted-foreground mb-1">Current Streak</p>
          <p className="font-display text-4xl font-bold text-foreground">12</p>
          <p className="text-sm text-secondary font-medium">Days 🔥</p>
        </div>
        
        <div className="p-5 rounded-xl bg-card border border-border">
          <p className="text-sm text-muted-foreground mb-1">This Week</p>
          <p className="font-display text-3xl font-bold text-foreground">89%</p>
          <p className="text-sm text-success font-medium">Completion Rate</p>
        </div>
        
        <div className="p-5 rounded-xl bg-card border border-border">
          <p className="text-sm text-muted-foreground mb-2">Categories</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-category-spiritual" />
              <span className="text-sm text-foreground">Spiritual</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-category-health" />
              <span className="text-sm text-foreground">Health</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-category-personal" />
              <span className="text-sm text-foreground">Personal</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
