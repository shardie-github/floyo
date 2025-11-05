"use client";

import FadeIn from "@/components/motion/FadeIn";

const features = [
  {
    title: "Fast Performance",
    description: "Lightning-fast load times with optimized assets and caching.",
    icon: "⚡",
  },
  {
    title: "Accessible",
    description: "Built with WCAG 2.2 AA compliance in mind.",
    icon: "♿",
  },
  {
    title: "Mobile First",
    description: "Beautiful experience on all devices, thumb-friendly interactions.",
    icon: "📱",
  },
];

export function Features() {
  return (
    <section className="py-20">
      <div className="container">
        <FadeIn>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Features
          </h2>
        </FadeIn>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <FadeIn key={feature.title} delay={i * 0.1}>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}