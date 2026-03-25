"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { courseService } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { BookOpen, PlayCircle, GraduationCap, Filter, Trophy, Flame, Sparkles, ArrowRight } from "lucide-react";

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

  const colorStyles = [
    { gradient: "from-blue-400 to-blue-600", bg: "bg-blue-50 dark:bg-blue-950", text: "text-blue-600 dark:text-blue-400" },
    { gradient: "from-emerald-400 to-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950", text: "text-emerald-600 dark:text-emerald-400" },
    { gradient: "from-amber-400 to-amber-600", bg: "bg-amber-50 dark:bg-amber-950", text: "text-amber-600 dark:text-amber-400" },
    { gradient: "from-violet-400 to-violet-600", bg: "bg-violet-50 dark:bg-violet-950", text: "text-violet-600 dark:text-violet-400" },
    { gradient: "from-rose-400 to-rose-600", bg: "bg-rose-50 dark:bg-rose-950", text: "text-rose-600 dark:text-rose-400" },
    { gradient: "from-cyan-400 to-cyan-600", bg: "bg-cyan-50 dark:bg-cyan-950", text: "text-cyan-600 dark:text-cyan-400" },
  ];

  const getFilterStats = () => ({
    all: courses.length,
    in_progress: courses.filter(c => c.progress > 0 && c.progress < 100).length,
    completed: courses.filter(c => c.progress === 100).length,
  });

  const stats = getFilterStats();

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-3">
            <span className="text-4xl filter drop-shadow-lg">📚</span> My Courses
          </h1>
          <span className="text-2xl animate-bounce">🌟</span>
        </div>
        <p className="text-muted-foreground text-lg font-medium">
          Pick up where you left off or start something new!
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-2xl w-fit shadow-inner">
        {(["all", "in_progress", "completed"] as FilterType[]).map((f, idx) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
              filter === f
                ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg hover:scale-105"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {f === "all" && <><BookOpen className="h-4 w-4" /> All Courses</>}
            {f === "in_progress" && <><Flame className="h-4 w-4 text-orange-500" /> In Progress</>}
            {f === "completed" && <><Trophy className="h-4 w-4 text-yellow-500" /> Completed</>}
            <span className={`ml-1 text-xs px-2 py-0.5 rounded-full ${
              filter === f ? "bg-white/20" : "bg-muted"
            }`}>{stats[f]}</span>
          </button>
        ))}
      </div>

      <div className="bg-card rounded-3xl border-2 border-border p-6 shadow-xl">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-muted mb-6 shadow-inner">
                <BookOpen className="h-12 w-12 text-muted-foreground" />
              </div>
              <p className="font-bold text-xl text-foreground mb-2">
                {filter === "all" ? "No courses yet" : 
                 filter === "in_progress" ? "No courses in progress" : 
                 "No completed courses"}
              </p>
              <p className="text-muted-foreground mb-6 max-w-md">
                {filter === "all" && "Contact your teacher to get started with your learning adventure!"}
                {filter === "in_progress" && "Start learning a course to see it here"}
                {filter === "completed" && "Complete a course to earn your trophy!"}
              </p>
              <div className="text-5xl">📚🌟🚀</div>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCourses.map((course, index) => {
                const style = colorStyles[index % colorStyles.length];
                return (
                  <Link
                    key={course._id}
                    href={`/student/course/${course._id}`}
                    className="group"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="h-full rounded-3xl border-2 border-border bg-card p-6 shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:border-primary/30 overflow-hidden relative">
                      <div className={`absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl ${style.gradient} opacity-10 rounded-bl-full`}></div>
                      <div className="absolute -bottom-4 -right-4 text-6xl opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:rotate-12">
                        📖
                      </div>
                      
                      <div className="flex items-start justify-between mb-4 relative z-10">
                        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${style.gradient} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                          <GraduationCap className="h-7 w-7" />
                        </div>
                        <span className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-bold shadow-sm ${
                          course.progress === 100 
                            ? "bg-gradient-to-r from-emerald-400 to-green-500 text-white"
                            : course.progress > 0
                            ? "bg-gradient-to-r from-blue-400 to-cyan-500 text-white"
                            : "bg-gradient-to-r from-gray-400 to-slate-500 text-white"
                        }`}>
                          {course.progress === 100 ? "🎉 Complete!" : course.progress > 0 ? `${course.progress}%` : "🚀 Start"}
                        </span>
                      </div>

                      <h3 className="font-bold text-lg text-foreground mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                        {course.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-5">
                        {course.description || "No description"}
                      </p>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground flex items-center gap-2 font-medium">
                            <PlayCircle className="h-4 w-4 text-blue-500" /> Videos
                          </span>
                          <span className="font-bold bg-muted px-3 py-1 rounded-full">
                            {course.completedVideos} / {course.totalVideos}
                          </span>
                        </div>
                        <div className="h-3 w-full overflow-hidden rounded-full bg-secondary shadow-inner">
                          <div
                            className="h-full rounded-full progress-gradient shadow-lg"
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="mt-5 flex items-center justify-center gap-2 text-sm font-bold text-primary bg-primary/5 rounded-xl py-3 opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-y-2 group-hover:translate-y-0">
                        {course.progress === 0 ? "🚀 Start Learning" : course.progress === 100 ? "📝 Review Course" : "▶️ Continue"} 
                        <ArrowRight className="h-4 w-4 animate-pulse" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
    </div>
  );
}
