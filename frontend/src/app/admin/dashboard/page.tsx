"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { courseService, registrationService } from "@/lib/api";
import { StatsCard } from "@/components/ui/StatsCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button, LinkButton } from "@/components/ui/Button";
import { LoadingPage } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { Plus, BookOpen, Users, Clock, ArrowRight, GraduationCap } from "lucide-react";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    } finally {
      setLoading(false);
    }
  };

  const pendingCount = registrations.filter((r) => r.status === "pending").length;
  const approvedCount = registrations.filter((r) => r.status === "approved").length;

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
        <StatsCard
          title="Total Courses"
          value={courses.length}
          description="Active courses in the system"
        />
        <StatsCard
          title="Total Registrations"
          value={registrations.length}
          description="All student registrations"
        />
        <StatsCard
          title="Pending Approvals"
          value={pendingCount}
          description="Awaiting your review"
          variant="warning"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <LinkButton
          href="/admin/add-student"
          className="group flex flex-col items-start gap-2 p-6 h-auto border-2 border-dashed border-primary/30 hover:border-primary bg-card hover:bg-primary/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Plus className="h-5 w-5 text-primary" />
            </div>
            <span className="font-semibold text-foreground">Add New Student</span>
          </div>
          <p className="text-sm text-muted-foreground">Register a new student to the system</p>
          <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
        </LinkButton>

        <LinkButton
          href="/admin/course/manage"
          className="group flex flex-col items-start gap-2 p-6 h-auto border-2 border-dashed border-primary/30 hover:border-primary bg-card hover:bg-primary/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <span className="font-semibold text-foreground">Manage Courses</span>
          </div>
          <p className="text-sm text-muted-foreground">Add modules and videos to courses</p>
          <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
        </LinkButton>

        <LinkButton
          href="/admin/student"
          className="group flex flex-col items-start gap-2 p-6 h-auto border-2 border-dashed border-primary/30 hover:border-primary bg-card hover:bg-primary/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <span className="font-semibold text-foreground">View Registrations</span>
          </div>
          <p className="text-sm text-muted-foreground">Review and approve student applications</p>
          <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
        </LinkButton>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Courses</CardTitle>
          <LinkButton href="/admin/course/manage" variant="ghost" size="sm">
            View All
          </LinkButton>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No courses yet"
              description="Create your first course to get started"
              action={{
                label: "Create Course",
                onClick: () => window.location.href = "/admin/course/manage",
              }}
              className="py-8"
            />
          ) : (
            <div className="space-y-3">
              {courses.slice(0, 5).map((course) => (
                <div
                  key={course._id}
                  className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-accent"
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
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-foreground">
                  {pendingCount} pending registration{pendingCount !== 1 ? "s" : ""} awaiting review
                </p>
                <p className="text-sm text-muted-foreground">
                  Review and approve student applications
                </p>
              </div>
            </div>
            <LinkButton href="/admin/student?filter=pending" variant="outline" size="sm">
              Review Now
            </LinkButton>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
