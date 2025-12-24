import { 
  Bell, 
  Calendar, 
  TrendingUp, 
  Clock, 
  Mail, 
  Shield,
  Repeat,
  BarChart3,
  Globe
} from "lucide-react";

const features = [
  {
    icon: Repeat,
    title: "Daily Repeating Tasks",
    description: "Set up tasks that automatically repeat daily, like prayers, medications, or exercise routines.",
    color: "bg-category-spiritual/10 text-category-spiritual",
  },
  {
    icon: Bell,
    title: "Smart Reminders",
    description: "Custom reminder times for each task. Get notified in-app and via email so you never miss a task.",
    color: "bg-category-health/10 text-category-health",
  },
  {
    icon: TrendingUp,
    title: "Streak Tracking",
    description: "Build momentum with streak tracking. See your consistency grow and stay motivated.",
    color: "bg-secondary/10 text-secondary",
  },
  {
    icon: Clock,
    title: "Timezone Aware",
    description: "Reminders adapt to your timezone. Perfect for traveling or users worldwide.",
    color: "bg-category-personal/10 text-category-personal",
  },
  {
    icon: Mail,
    title: "Email Notifications",
    description: "Receive scheduled email reminders for important tasks. Gmail and all major providers supported.",
    color: "bg-category-habits/10 text-category-habits",
  },
  {
    icon: BarChart3,
    title: "Daily Statistics",
    description: "Beautiful insights into your daily, weekly, and monthly task completion rates.",
    color: "bg-destructive/10 text-destructive",
  },
  {
    icon: Calendar,
    title: "History & Insights",
    description: "Review your task completion history. Identify patterns and optimize your routine.",
    color: "bg-category-spiritual/10 text-category-spiritual",
  },
  {
    icon: Globe,
    title: "Prayer Times Integration",
    description: "Automatic prayer time calculations based on your location for Islamic prayers.",
    color: "bg-category-health/10 text-category-health",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Your data is encrypted and secure. Multi-tenant architecture ensures complete privacy.",
    color: "bg-muted text-muted-foreground",
  },
];

export const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-secondary/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-secondary/10 text-secondary text-sm font-medium mb-4">
            Features
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Everything You Need for{" "}
            <span className="text-gradient">Daily Excellence</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Powerful features designed to help you build lasting habits and never miss what matters most.
          </p>
        </div>
        
        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-6 rounded-2xl bg-card border border-border hover:border-secondary/50 transition-all duration-300 hover:shadow-soft"
            >
              <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="font-display font-semibold text-lg text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
