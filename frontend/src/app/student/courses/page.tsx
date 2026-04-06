"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { courseService } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { BookOpen, PlayCircle, GraduationCap } from "lucide-react";

interface CourseWithProgress {
  _id: string;
  title: string;
  description: string;
  progress: number;
  totalVideos: number;
  completedVideos: number;
}

type FilterType = "all" | "in_progress" | "completed";

export default function StudentCourses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<CourseWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const coursesRes = await courseService.getEnrolled();
      setCourses(coursesRes.data);
    } catch (error) {
      console.error("Failed to load courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter((course) => {
    if (filter === "all") return true;
    if (filter === "in_progress") return course.progress > 0 && course.progress < 100;
    if (filter === "completed") return course.progress === 100;
    return true;
  });

  const getFilterStats = () => ({
    all: courses.length,
    in_progress: courses.filter(c => c.progress > 0 && c.progress < 100).length,
    completed: courses.filter(c => c.progress === 100).length,
  });

  const stats = getFilterStats();

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Courses"
        description="Pick up where you left off or start something new"
        breadcrumbs={[
          { label: "Student", href: "/student/dashboard" },
          { label: "Courses" },
        ]}
      />

      {/* Filter Pills */}
      <div className="flex items-center gap-2 p-1 bg-muted rounded-xl w-fit">
        {(["all", "in_progress", "completed"] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {f === "all" && "All Courses"}
            {f === "in_progress" && "In Progress"}
            {f === "completed" && "Completed"}
            <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
              filter === f ? "bg-primary/10 text-primary" : "bg-muted-foreground/10"
            }`}>{stats[f]}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : filteredCourses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="font-semibold text-foreground mb-2">
              {filter === "all" ? "No courses yet" : 
               filter === "in_progress" ? "No courses in progress" : 
               "No completed courses"}
            </p>
            <p className="text-sm text-muted-foreground">
              {filter === "all" && "Contact your teacher to get started with your learning adventure!"}
              {filter === "in_progress" && "Start learning a course to see it here"}
              {filter === "completed" && "Complete a course to see it here"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => (
            <Link key={course._id} href={`/student/course/${course._id}`}>
              <Card className="h-full hover:shadow-md transition-all hover:border-primary/30">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <GraduationCap className="h-5 w-5 text-primary" />
                    </div>
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

                  <h3 className="font-semibold text-foreground mb-2 line-clamp-1">{course.title}</h3>
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
  );
}
