"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { courseService, registrationService } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button, LinkButton } from "@/components/ui/Button";
import { LoadingPage } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { Plus, BookOpen, Users, Clock, ArrowRight, GraduationCap, FileText, X } from "lucide-react";

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

  if (loading) {
    return <LoadingPage text="Loading dashboard..." />;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.name}. Here&apos;s an overview of your LMS.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Courses</p>
              <p className="text-3xl font-bold text-foreground mt-1">{courses.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Active courses in the system</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950">
              <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Registrations</p>
              <p className="text-3xl font-bold text-foreground mt-1">{registrations.length}</p>
              <p className="text-xs text-muted-foreground mt-1">All student registrations</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-950">
              <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-700 dark:text-amber-300">Pending Approvals</p>
              <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-1">{pendingCount}</p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Awaiting your review</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900">
              <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowDraftModal(true)}
          className="rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50 p-6 shadow-sm text-left hover:border-slate-300 dark:hover:border-slate-600 transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Draft Students</p>
              <p className="text-3xl font-bold text-slate-700 dark:text-slate-200 mt-1">{draftCount}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Incomplete registrations</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700">
              <FileText className="h-6 w-6 text-slate-600 dark:text-slate-300" />
            </div>
          </div>
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <LinkButton
          href="/admin/add-student"
          className="group flex flex-col items-start gap-3 p-6 h-auto rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-primary/50 bg-white dark:bg-card hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-200"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <Plus className="h-5 w-5 text-primary" />
            </div>
            <span className="font-semibold text-foreground">Add New Student</span>
          </div>
          <p className="text-sm text-muted-foreground">Register a new student to the system</p>
          <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
        </LinkButton>

        <LinkButton
          href="/admin/course/manage"
          className="group flex flex-col items-start gap-3 p-6 h-auto rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-primary/50 bg-white dark:bg-card hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-200"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <span className="font-semibold text-foreground">Manage Courses</span>
          </div>
          <p className="text-sm text-muted-foreground">Add modules and videos to courses</p>
          <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
        </LinkButton>

        <LinkButton
          href="/admin/student"
          className="group flex flex-col items-start gap-3 p-6 h-auto rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-primary/50 bg-white dark:bg-card hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-200"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <span className="font-semibold text-foreground">View Registrations</span>
          </div>
          <p className="text-sm text-muted-foreground">Review and approve student applications</p>
          <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
        </LinkButton>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
          <CardTitle className="text-lg font-semibold">Recent Courses</CardTitle>
          <LinkButton href="/admin/course/manage" variant="ghost" size="sm" className="-mr-2">
            View All
          </LinkButton>
        </CardHeader>
        <CardContent className="p-0">
          {courses.length === 0 ? (
            <div className="py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-muted-foreground" />
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
                <div
                  key={course._id}
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
                  <LinkButton href={`/admin/course/${course._id}`} variant="outline" size="sm">
                    Manage
                  </LinkButton>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {pendingCount > 0 && (
        <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900">
                <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  {pendingCount} pending registration{pendingCount !== 1 ? "s" : ""} awaiting review
                </p>
                <p className="text-sm text-muted-foreground">
                  Review and approve student applications
                </p>
              </div>
            </div>
            <LinkButton href="/admin/student?filter=pending" className="shrink-0 bg-amber-600 hover:bg-amber-700">
              Review Now
            </LinkButton>
          </div>
        </div>
      )}

      {showDraftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">Draft Students</h2>
              <button
                onClick={() => setShowDraftModal(false)}
                className="rounded-lg p-2 hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {draftCount === 0 ? (
              <p className="text-muted-foreground py-8 text-center">No draft registrations found.</p>
            ) : (
              <div className="max-h-96 overflow-y-auto space-y-2">
                {registrations
                  .filter((r) => r.status === "draft")
                  .map((draft) => (
                    <Link
                      key={draft._id}
                      href={`/admin/add-student?edit=${draft._id}`}
                      onClick={() => setShowDraftModal(false)}
                      className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-foreground">
                          {draft.basicDetails?.fullName || draft.basicDetails?.firstName || "Unnamed"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {draft.basicDetails?.phone || "No phone"}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
