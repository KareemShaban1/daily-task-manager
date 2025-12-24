import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for getting started with daily task tracking.",
    features: [
      "Up to 10 daily tasks",
      "Basic categories",
      "In-app reminders",
      "7-day history",
      "Basic streak tracking",
    ],
    cta: "Get Started Free",
    variant: "outline" as const,
    popular: false,
  },
  {
    name: "Pro",
    price: "$9",
    period: "per month",
    description: "For those serious about building lasting habits.",
    features: [
      "Unlimited daily tasks",
      "Custom categories",
      "Email reminders",
      "Unlimited history",
      "Advanced analytics",
      "Prayer time integration",
      "Priority support",
      "Export data",
    ],
    cta: "Start 14-Day Trial",
    variant: "default" as const,
    popular: true,
  },
  {
    name: "Team",
    price: "$29",
    period: "per month",
    description: "Perfect for families or small groups.",
    features: [
      "Everything in Pro",
      "Up to 5 members",
      "Shared task templates",
      "Group challenges",
      "Family dashboard",
      "Admin controls",
      "Team analytics",
    ],
    cta: "Contact Sales",
    variant: "outline" as const,
    popular: false,
  },
];

export const PricingSection = () => {
  return (
    <section id="pricing" className="py-24 bg-muted/30 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-secondary/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-secondary/10 text-secondary text-sm font-medium mb-4">
            Pricing
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Simple,{" "}
            <span className="text-gradient">Transparent</span> Pricing
          </h2>
          <p className="text-lg text-muted-foreground">
            Start free and upgrade when you're ready. No hidden fees, cancel anytime.
          </p>
        </div>
        
        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative p-8 rounded-2xl transition-all duration-300 ${
                plan.popular
                  ? "bg-primary text-primary-foreground shadow-elevated scale-105"
                  : "bg-card border border-border hover:border-secondary/50 hover:shadow-soft"
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 rounded-full bg-secondary text-secondary-foreground text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              
              {/* Plan Info */}
              <div className="text-center mb-8">
                <h3 className={`font-display font-semibold text-xl mb-2 ${
                  plan.popular ? "text-primary-foreground" : "text-foreground"
                }`}>
                  {plan.name}
                </h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className={`font-display text-5xl font-bold ${
                    plan.popular ? "text-primary-foreground" : "text-foreground"
                  }`}>
                    {plan.price}
                  </span>
                  <span className={plan.popular ? "text-primary-foreground/70" : "text-muted-foreground"}>
                    /{plan.period}
                  </span>
                </div>
                <p className={`mt-2 text-sm ${
                  plan.popular ? "text-primary-foreground/70" : "text-muted-foreground"
                }`}>
                  {plan.description}
                </p>
              </div>
              
              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <Check className={`w-5 h-5 flex-shrink-0 ${
                      plan.popular ? "text-secondary" : "text-success"
                    }`} />
                    <span className={`text-sm ${
                      plan.popular ? "text-primary-foreground/90" : "text-foreground"
                    }`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
              
              {/* CTA */}
              <Button
                variant={plan.popular ? "hero" : plan.variant}
                className="w-full"
                asChild
              >
                <Link to="/auth?mode=signup">{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
