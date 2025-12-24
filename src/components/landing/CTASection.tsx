import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export const CTASection = () => {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-hero" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-secondary/20 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
            Ready to Transform Your{" "}
            <span className="text-gradient">Daily Routine?</span>
          </h2>
          <p className="text-lg text-primary-foreground/70 mb-10 max-w-xl mx-auto">
            Join thousands of users who are building better habits, staying consistent with their prayers, 
            and achieving their daily goals with DailyFlow.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="hero" size="xl" asChild>
              <Link to="/auth?mode=signup">
                Start Your Journey
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button variant="hero-outline" size="lg" asChild>
              <Link to="#features">Learn More</Link>
            </Button>
          </div>
          <p className="mt-6 text-sm text-primary-foreground/50">
            Free forever • No credit card required • Cancel anytime
          </p>
        </div>
      </div>
    </section>
  );
};
