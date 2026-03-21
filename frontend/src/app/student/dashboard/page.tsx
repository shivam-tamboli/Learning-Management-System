"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { progressService, courseService } from "@/lib/api";
import { StatsCard } from "@/components/ui/StatsCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { BookOpen, PlayCircle, Award, TrendingUp, GraduationCap } from "lucide-react";

interface CourseWithProgress {
  _id: string;
  title: string;
  description: string;
  progress: number;
  totalVideos: number;
  completedVideos: number;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const { error: showError } = useToast();
  const [courses, setCourses] = useState<CourseWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const coursesRes = await courseService.getEnrolled();
      const enrolledCourses = coursesRes.data;

      const coursesWithProgress: CourseWithProgress[] = [];

      for (const course of enrolledCourses) {
        try {
          const courseDetailRes = await courseService.getById(course._id);
          const progressRes = await progressService.getByCourse(course._id);
          
          const totalVideos = courseDetailRes.data.modules?.reduce(
            (acc: number, mod: any) => acc + (mod.videos?.length || 0),
            0
          ) || 0;
          
          const completedVideos = progressRes.data.filter(
            (p: any) => p.isCompleted
          ).length;
          
          coursesWithProgress.push({
            _id: course._id,
            title: course.title,
            description: course.description,
            progress: totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0,
            totalVideos,
            completedVideos,
          });
        } catch (e) {
          console.error("Failed to load course details:", e);
        }
      }

      setCourses(coursesWithProgress);
    } catch (error) {
      console.error("Failed to load courses:", error);
      showError("Failed to load your courses");
    } finally {
      setLoading(false);
    }
  };

  const totalVideosCompleted = courses.reduce((acc, c) => acc + c.completedVideos, 0);
  const averageProgress = courses.length > 0 
    ? Math.round(courses.reduce((acc, c) => acc + c.progress, 0) / courses.length) 
    : 0;
  const completedCourses = courses.filter(c => c.progress === 100).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-foreground">Student Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.name}. Continue your learning journey.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Enrolled Courses"
          value={courses.length}
          description="Active courses"
        />
        <StatsCard
          title="Videos Completed"
          value={totalVideosCompleted}
          description="Total video lessons"
          variant="success"
        />
        <StatsCard
          title="Average Progress"
          value={`${averageProgress}%`}
          description="Across all courses"
          variant="default"
        />
        <StatsCard
          title="Completed"
          value={completedCourses}
          description="Courses finished"
          variant="success"
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Your Courses</CardTitle>
          <span className="text-sm text-muted-foreground">
            {courses.length} course{courses.length !== 1 ? "s" : ""} enrolled
          </span>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : courses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="font-medium text-foreground mb-1">No courses enrolled</p>
              <p className="text-sm text-muted-foreground mb-4">
                Please contact the administrator for course enrollment
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {courses.map((course) => (
                <Link
                  key={course._id}
                  href={`/student/course/${course._id}`}
                  className="block"
                >
                  <div className="flex flex-col gap-4 rounded-lg border border-border p-5 transition-all hover:border-primary/50 hover:bg-accent/50 md:flex-row md:items-center">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <GraduationCap className="h-7 w-7 text-primary" />
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-foreground">{course.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {course.description || "No description"}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                          {course.progress}%
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">
                            {course.completedVideos} of {course.totalVideos} videos
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-500"
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm font-medium text-primary">
                      <PlayCircle className="h-4 w-4" />
                      {course.progress === 0 ? "Start Learning" : course.progress === 100 ? "Review Course" : "Continue"}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {courses.length > 0 && averageProgress < 100 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Keep up the momentum!</p>
                <p className="text-sm text-muted-foreground">
                  You&apos;re {averageProgress}% through your courses on average
                </p>
              </div>
            </div>
            {courses.find(c => c.progress < 100) && (
              <Link
                href={courses.find(c => c.progress < 100)?._id ? `/student/course/${courses.find(c => c.progress < 100)?._id}` : "#"}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Continue Learning
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
