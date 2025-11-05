"use client";

import FadeIn from "@/components/motion/FadeIn";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="py-20 md:py-32">
      <FadeIn>
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Welcome to Hardonia
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Modern, fast, and accessible commerce experience.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg">Get Started</Button>
            <Button size="lg" variant="outline">
              Learn More
            </Button>
          </div>
        </div>
      </FadeIn>
    </section>
  );
}