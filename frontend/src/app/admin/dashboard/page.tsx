"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { courseService, registrationService } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button, LinkButton } from "@/components/ui/Button";
import { LoadingPage, LoadingCard } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { Plus, BookOpen, Users, Clock, ArrowRight, GraduationCap, FileText, X, TrendingUp, TrendingDown, CheckCircle } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  variant?: "default" | "warning" | "success";
  onClick?: () => void;
}

function StatCard({ label, value, icon, trend, variant = "default", onClick }: StatCardProps) {
  const baseStyles = "rounded-xl border bg-card p-5 shadow-sm transition-all duration-200";
  const variantStyles = {
    default: "border-border hover:border-primary/30 hover:shadow-md",
    warning: "border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 hover:border-amber-300",
    success: "border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 hover:border-emerald-300",
  };
  const clickableStyles = onClick ? "cursor-pointer hover:-translate-y-0.5" : "";

  const labelColor = variant === "warning" ? "text-amber-700 dark:text-amber-300" : "text-muted-foreground";
  const valueColor = variant === "warning" ? "text-amber-600 dark:text-amber-400" : variant === "success" ? "text-emerald-600 dark:text-emerald-400" : "text-foreground";
  const iconBg = variant === "warning" ? "bg-amber-100 dark:bg-amber-900" : variant === "success" ? "bg-emerald-100 dark:bg-emerald-900" : "bg-primary/10";
  const iconColor = variant === "warning" ? "text-amber-600 dark:text-amber-400" : variant === "success" ? "text-emerald-600 dark:text-emerald-400" : "text-primary";

  return (
    <div className={`${baseStyles} ${variantStyles[variant]} ${clickableStyles}`} onClick={onClick}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className={`text-sm font-medium ${labelColor}`}>{label}</p>
          <p className={`text-[28px] font-bold ${valueColor} leading-tight`}>{value}</p>
          {trend && (
            <div className={`flex items-center gap-1 text-xs font-medium ${trend.isPositive ? "text-emerald-600" : "text-red-500"}`}>
              {trend.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              <span>{trend.value}% from last month</span>
            </div>
          )}
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconBg}`}>
          <div className={iconColor}>{icon}</div>
        </div>
      </div>
    </div>
  );
}

function QuickActionCard({ href, icon, title, description }: { href: string; icon: React.ReactNode; title: string; description: string }) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-4 p-5 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-primary/50 bg-card hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-200 w-full h-full"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
        {icon}
      </div>
      <div className="flex-1 text-left min-w-0">
        <span className="font-semibold text-foreground block">{title}</span>
        <span className="text-sm text-muted-foreground">{description}</span>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1 transition-transform group-hover:translate-x-1" />
    </Link>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { error: showError } = useToast();
  const [courses, setCourses] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDraftModal, setShowDraftModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [coursesRes, regRes] = await Promise.all([
        courseService.getAll(),
        registrationService.getAll(),
      ]);
      setCourses(coursesRes.data);
      setRegistrations(regRes.data);
    } catch (error) {
      console.error("Failed to load data:", error);
      showError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const pendingCount = registrations.filter((r) => r.status === "pending").length;
  const approvedCount = registrations.filter((r) => r.status === "approved").length;
  const draftCount = registrations.filter((r) => r.status === "draft").length;
  const completedCount = registrations.filter((r) => r.payment?.status === "completed").length;

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Admin Dashboard" 
          description="Loading..."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Admin Dashboard" 
        description={`Welcome back, ${user?.name}. Here's what's happening with your LMS.`}
        breadcrumbs={[
          { label: "Admin" },
        ]}
        actions={
          <LinkButton href="/admin/add-student">
            <Plus className="mr-2 h-4 w-4" />
            Add Student
          </LinkButton>
        }
      />

      {/* Stats Grid - 4 columns desktop, 2 tablet, 1 mobile */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Courses"
          value={courses.length}
          icon={<BookOpen className="h-5 w-5" />}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          label="Total Students"
          value={registrations.length}
          icon={<Users className="h-5 w-5" />}
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          label="Pending Approvals"
          value={pendingCount}
          icon={<Clock className="h-5 w-5" />}
          variant="warning"
        />
        <StatCard
          label="Completed Payments"
          value={completedCount}
          icon={<CheckCircle className="h-5 w-5" />}
          variant="success"
        />
      </div>

      {/* Quick Actions - 2 columns */}
      <div className="grid gap-4 md:grid-cols-2">
        <QuickActionCard
          href="/admin/course/manage"
          icon={<BookOpen className="h-5 w-5 text-primary" />}
          title="Manage Courses"
          description="Add modules, videos, and course content"
        />
        <QuickActionCard
          href="/admin/payment"
          icon={<Users className="h-5 w-5 text-primary" />}
          title="Review Registrations"
          description="Process pending applications and payments"
        />
      </div>

      {/* Pending Alert Banner */}
      {pendingCount > 0 && (
        <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="font-medium text-foreground">
                <span className="font-semibold text-amber-600">{pendingCount}</span> pending registration{pendingCount !== 1 ? "s" : ""} awaiting review
              </p>
              <p className="text-sm text-muted-foreground">Review and approve student applications</p>
            </div>
          </div>
          <LinkButton href="/admin/student?filter=pending" size="sm" className="shrink-0 bg-amber-600 hover:bg-amber-700">
            Review Now
          </LinkButton>
        </div>
      )}

      {/* Recent Courses Card */}
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-3">
          <div>
            <CardTitle className="text-lg font-semibold">Recent Courses</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">Latest courses added to the system</p>
          </div>
          <LinkButton href="/admin/course/manage" variant="ghost" size="sm" className="-mr-2">
            View All
          </LinkButton>
        </CardHeader>
        <CardContent className="p-0">
          {courses.length === 0 ? (
            <div className="py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mx-auto mb-4">
                <BookOpen className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground mb-1">No courses yet</p>
              <p className="text-sm text-muted-foreground mb-4">Create your first course to get started</p>
              <LinkButton href="/admin/course/manage" variant="outline" size="sm">
                Create Course
              </LinkButton>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {courses.slice(0, 5).map((course) => (
                <Link
                  key={course._id}
                  href={`/admin/course/${course._id}`}
                  className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <GraduationCap className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{course.title}</p>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {course.description || "No description"}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="shrink-0">
                    Manage
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Draft Students Modal */}
      {showDraftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Draft Students</h2>
                <p className="text-sm text-muted-foreground">{draftCount} incomplete registration{draftCount !== 1 ? "s" : ""}</p>
              </div>
              <button
                onClick={() => setShowDraftModal(false)}
                className="rounded-lg p-2 hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <div className="p-4">
              {draftCount === 0 ? (
                <div className="py-8 text-center">
                  <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No draft registrations found</p>
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto space-y-2">
                  {registrations
                    .filter((r) => r.status === "draft")
                    .map((draft) => (
                      <Link
                        key={draft._id}
                        href={`/admin/add-student?edit=${draft._id}`}
                        onClick={() => setShowDraftModal(false)}
                        className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 hover:border-primary/30 transition-all"
                      >
                        <div>
                          <p className="font-medium text-foreground">
                            {draft.basicDetails?.firstName} {draft.basicDetails?.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {draft.basicDetails?.phone || "No phone"} • Created {draft.createdAt ? new Date(draft.createdAt).toLocaleDateString() : "recently"}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
