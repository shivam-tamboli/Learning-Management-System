"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { courseService } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { BookOpen, PlayCircle, Trophy, Clock } from "lucide-react";

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
      setCourses(coursesRes.data);
    } catch (error) {
      console.error("Failed to load courses:", error);
      showError("Failed to load your courses");
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const totalVideosCompleted = courses.reduce((acc, c) => acc + c.completedVideos, 0);
  const averageProgress = courses.length > 0 
    ? Math.round(courses.reduce((acc, c) => acc + c.progress, 0) / courses.length) 
    : 0;
  const completedCourses = courses.filter(c => c.progress === 100).length;
  const inProgressCourses = courses.filter(c => c.progress > 0 && c.progress < 100).length;
  const nextCourse = courses.find(c => c.progress > 0 && c.progress < 100);

  const statCards = [
    { title: "My Courses", value: courses.length, icon: BookOpen, desc: "enrolled" },
    { title: "Videos Done", value: totalVideosCompleted, icon: PlayCircle, desc: "completed" },
    { title: "In Progress", value: inProgressCourses, icon: Clock, desc: "ongoing" },
    { title: "Completed", value: completedCourses, icon: Trophy, desc: "finished" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${getGreeting()}, ${user?.name || "Student"}!`}
        description={averageProgress > 0 ? `Your average progress is ${averageProgress}%` : "Start learning a course to begin your journey"}
        breadcrumbs={[
          { label: "Student", href: "/student/dashboard" },
          { label: "Dashboard" },
        ]}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.desc}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Continue Learning Section */}
      {nextCourse && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-primary mb-1">Continue Learning</p>
                <h2 className="text-lg font-semibold text-foreground mb-3">{nextCourse.title}</h2>
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-primary transition-all" 
                      style={{ width: `${nextCourse.progress}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">
                    {nextCourse.progress}% done
                  </span>
                </div>
              </div>
              <Link
                href={`/student/course/${nextCourse._id}`}
                className="ml-6 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Continue
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Course Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">My Learning</h2>
          <Link href="/student/courses" className="text-sm font-medium text-primary hover:text-primary/80">
            View all
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : courses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="font-semibold text-foreground mb-2">No courses yet</p>
              <p className="text-sm text-muted-foreground">
                Contact your teacher to get started with your learning adventure!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.slice(0, 6).map((course) => (
              <Link key={course._id} href={`/student/course/${course._id}`}>
                <Card className="h-full hover:shadow-md transition-all hover:border-primary/30">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-foreground line-clamp-1">{course.title}</h3>
                      <span className={`shrink-0 text-xs font-medium px-2 py-1 rounded-full ${
                        course.progress === 100 
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : course.progress > 0
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {course.progress === 100 ? "Complete" : course.progress > 0 ? `${course.progress}%` : "Start"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {course.description || "No description"}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {course.completedVideos}/{course.totalVideos}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
