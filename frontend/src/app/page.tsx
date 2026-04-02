"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { GraduationCap, BookOpen, Award, ArrowRight } from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Learn at Your Pace",
    description: "Access course materials anytime, anywhere. Learn at your own speed with our flexible platform.",
  },
  {
    icon: Award,
    title: "Track Progress",
    description: "Monitor your learning journey with detailed progress tracking and achievement badges.",
  },
  {
    icon: GraduationCap,
    title: "Expert Content",
    description: "Access high-quality educational content designed by experienced instructors.",
  },
];

export default function LandingPage() {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      window.location.href = isAdmin ? "/admin/dashboard" : "/student/dashboard";
    }
  }, [isAuthenticated, isLoading, isAdmin]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-foreground">LMS Platform</span>
          </div>
          <Link
            href="/login"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground tracking-tight mb-6">
              Learn at Your Own Pace
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Access quality education resources, track your progress, and achieve your learning goals with our flexible learning management system.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-6 py-3 text-sm font-medium text-foreground hover:bg-accent transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-6">
          <h2 className="text-2xl font-semibold text-foreground text-center mb-12">
            Why Choose Our Platform
          </h2>
          <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-card border border-border rounded-xl p-6 text-center"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mx-auto mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Ready to Start Learning?
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Join thousands of students already learning on our platform.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Get Started Now
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-6">
          <p className="text-sm text-muted-foreground text-center">
            © 2024 LMS Platform. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}