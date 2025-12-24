import { CheckCircle2, Plus, Bell, TrendingUp } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Plus,
    title: "Create Your Tasks",
    description: "Add your daily tasks like prayers, exercise, reading, or any habit you want to build. Categorize them for easy organization.",
  },
  {
    number: "02",
    icon: Bell,
    title: "Set Custom Reminders",
    description: "Configure specific reminder times for each task. Choose between in-app notifications, email reminders, or both.",
  },
  {
    number: "03",
    icon: CheckCircle2,
    title: "Complete & Track",
    description: "Mark tasks as complete throughout the day. Watch your streaks grow and build momentum with daily consistency.",
  },
  {
    number: "04",
    icon: TrendingUp,
    title: "Review & Improve",
    description: "Access detailed statistics and insights. Identify patterns, celebrate wins, and continuously improve your routine.",
  },
];

export const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-24 bg-muted/30 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-50">
        <div className="absolute top-20 left-10 w-64 h-64 border border-border rounded-full" />
        <div className="absolute bottom-20 right-10 w-96 h-96 border border-border rounded-full" />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-secondary/10 text-secondary text-sm font-medium mb-4">
            How It Works
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Simple Steps to{" "}
            <span className="text-gradient">Better Habits</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Getting started takes just minutes. Here's how DailyFlow helps you build lasting habits.
          </p>
        </div>
        
        {/* Steps */}
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Connecting Line */}
            <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-secondary via-secondary/50 to-transparent hidden md:block" />
            
            {/* Step Items */}
            <div className="space-y-12">
              {steps.map((step, index) => (
                <div key={index} className="relative flex gap-6 md:gap-12">
                  {/* Number & Icon */}
                  <div className="flex-shrink-0 relative">
                    <div className="w-16 h-16 rounded-2xl bg-card border border-border shadow-soft flex items-center justify-center group-hover:border-secondary transition-colors">
                      <step.icon className="w-7 h-7 text-secondary" />
                    </div>
                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-secondary text-secondary-foreground text-xs font-bold flex items-center justify-center">
                      {step.number}
                    </span>
                  </div>
                  
                  {/* Content */}
                  <div className="pt-2">
                    <h3 className="font-display font-semibold text-xl text-foreground mb-2">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground max-w-md">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
