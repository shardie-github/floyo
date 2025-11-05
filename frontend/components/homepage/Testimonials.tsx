"use client";

import FadeIn from "@/components/motion/FadeIn";

const testimonials = [
  {
    quote: "Best experience I've had shopping online.",
    author: "Jane Doe",
    role: "Customer",
  },
  {
    quote: "Fast, accessible, and beautiful.",
    author: "John Smith",
    role: "Customer",
  },
  {
    quote: "The attention to detail is incredible.",
    author: "Sarah Johnson",
    role: "Customer",
  },
];

export function Testimonials() {
  return (
    <section className="py-20 bg-muted/50">
      <div className="container">
        <FadeIn>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            What People Say
          </h2>
        </FadeIn>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, i) => (
            <FadeIn key={testimonial.author} delay={i * 0.1}>
              <div className="p-6 rounded-xl bg-card border border-border">
                <p className="text-lg mb-4">&ldquo;{testimonial.quote}&rdquo;</p>
                <div>
                  <p className="font-semibold">{testimonial.author}</p>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}