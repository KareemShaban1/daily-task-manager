import { Heart, Sparkles, User, Target } from "lucide-react";

const categories = [
  {
    icon: Sparkles,
    name: "Spiritual",
    description: "Prayer times, meditation, Quran reading, gratitude journaling",
    color: "bg-category-spiritual",
    lightColor: "bg-category-spiritual/10",
    examples: ["5 Daily Prayers", "Morning Duas", "Evening Adhkar", "Quran Recitation"],
  },
  {
    icon: Heart,
    name: "Health",
    description: "Exercise routines, medications, water intake, sleep schedule",
    color: "bg-category-health",
    lightColor: "bg-category-health/10",
    examples: ["Morning Workout", "Take Vitamins", "8 Glasses Water", "Sleep by 10pm"],
  },
  {
    icon: User,
    name: "Personal",
    description: "Reading goals, skill development, hobbies, self-care",
    color: "bg-category-personal",
    lightColor: "bg-category-personal/10",
    examples: ["Read 20 Pages", "Practice Spanish", "Journal Entry", "Call Family"],
  },
  {
    icon: Target,
    name: "Habits",
    description: "Daily habits you want to build or break, productivity goals",
    color: "bg-category-habits",
    lightColor: "bg-category-habits/10",
    examples: ["No Social Media", "Wake Up Early", "Cold Shower", "Review Goals"],
  },
];

export const CategoriesSection = () => {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-secondary/10 text-secondary text-sm font-medium mb-4">
            Categories
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Organize Your Life,{" "}
            <span className="text-gradient">Your Way</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Four thoughtfully designed categories to help you organize all aspects of your daily routine.
          </p>
        </div>
        
        {/* Categories Grid */}
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {categories.map((category, index) => (
            <div
              key={index}
              className="group relative p-8 rounded-2xl bg-card border border-border hover:border-transparent hover:shadow-lifted transition-all duration-300 overflow-hidden"
            >
              {/* Background Gradient on Hover */}
              <div className={`absolute inset-0 ${category.lightColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              
              <div className="relative z-10">
                {/* Icon & Title */}
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-14 h-14 rounded-xl ${category.color} flex items-center justify-center`}>
                    <category.icon className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-xl text-foreground">
                      {category.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {category.description}
                    </p>
                  </div>
                </div>
                
                {/* Examples */}
                <div className="flex flex-wrap gap-2 mt-6">
                  {category.examples.map((example, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 rounded-full bg-muted text-sm text-muted-foreground"
                    >
                      {example}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
