"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { courseService } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { BookOpen, PlayCircle, GraduationCap } from "lucide-react";

interface CourseWithProgress {
  _id: string;
  title: string;
  description: string;
  progress: number;
  totalVideos: number;
  completedVideos: number;
}

export default function StudentCourses() {
  const { user } = useAuth();
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-foreground">My Courses</h1>
        <p className="text-muted-foreground">
          View and manage your enrolled courses
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Enrolled Courses</CardTitle>
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
              <p className="text-sm text-muted-foreground">
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
    </div>
  );
}
