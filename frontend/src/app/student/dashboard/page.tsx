"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { courseService } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { BookOpen, PlayCircle, Award, TrendingUp, GraduationCap, Zap, Star, Target, Rocket, Sparkles, Trophy, Flame } from "lucide-react";

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
    { title: "My Courses", value: courses.length, icon: BookOpen, color: "blue", emoji: "📚", desc: "enrolled" },
    { title: "Videos Done", value: totalVideosCompleted, icon: PlayCircle, color: "green", emoji: "🎬", desc: "completed" },
    { title: "In Progress", value: inProgressCourses, icon: Flame, color: "yellow", emoji: "🔥", desc: "ongoing" },
    { title: "Completed", value: completedCourses, icon: Trophy, color: "purple", emoji: "🏆", desc: "finished" },
  ];

  const colorStyles: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
    blue: { bg: "bg-blue-50 dark:bg-blue-950", text: "text-blue-600 dark:text-blue-400", border: "border-blue-200 dark:border-blue-800", gradient: "from-blue-400 to-blue-600" },
    green: { bg: "bg-emerald-50 dark:bg-emerald-950", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-800", gradient: "from-emerald-400 to-emerald-600" },
    yellow: { bg: "bg-amber-50 dark:bg-amber-950", text: "text-amber-600 dark:text-amber-400", border: "border-amber-200 dark:border-amber-800", gradient: "from-amber-400 to-amber-600" },
    purple: { bg: "bg-violet-50 dark:bg-violet-950", text: "text-violet-600 dark:text-violet-400", border: "border-violet-200 dark:border-violet-800", gradient: "from-violet-400 to-violet-600" },
  };

  return (
    <div className="space-y-8 animate-in">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHptMCAzMmMtNy43MzIgMC0xNC02LjI2OC0xNC0xNHM2LjI2OC0xNCAxNC0xNCAxNCA2LjI2OCAxNCAxNC02LjI2OCAxNC0xNHoiIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iLjEiLz48L2c+PC9zdmc+')] opacity-30"></div>
        <div className="absolute -top-8 -right-8 text-9xl opacity-20 animate-pulse">🎓</div>
        <div className="absolute bottom-4 left-10 text-5xl animate-bounce">📚</div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-3">
            <span className="text-5xl filter drop-shadow-lg">
              {new Date().getHours() < 12 ? "☀️" : new Date().getHours() < 17 ? "🌤️" : "🌙"}
            </span>
            <div>
              <h1 className="text-3xl font-extrabold drop-shadow-lg">
                {getGreeting()}, {user?.name || "Champion"}!
              </h1>
              <p className="text-indigo-100 text-lg font-medium mt-1">Ready to learn something amazing today?</p>
            </div>
            <span className="text-4xl ml-auto animate-bounce hidden sm:block">✨</span>
          </div>
          {averageProgress > 0 && (
            <div className="mt-5 flex items-center gap-4 bg-white/20 rounded-2xl p-4 backdrop-blur-sm">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-white/90">Your Progress</span>
                  <span className="text-sm font-bold text-white">{averageProgress}%</span>
                </div>
                <div className="h-3 w-full rounded-full bg-white/30 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-white shadow-lg shadow-white/30 transition-all duration-700 ease-out" 
                    style={{ width: `${averageProgress}%` }}
                  />
                </div>
              </div>
              <Rocket className="h-8 w-8 text-white animate-pulse ml-4" />
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const styles = colorStyles[stat.color];
          return (
            <div
              key={stat.title}
              className={`group relative overflow-hidden rounded-2xl ${styles.bg} border ${styles.border} p-5 shadow-sm transition-all duration-300 card-hover hover:scale-[1.02] hover:shadow-lg`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="absolute -right-4 -top-4 text-6xl opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:rotate-12">
                {stat.emoji}
              </div>
              <div className="flex items-start justify-between relative z-10">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">{stat.title}</p>
                  <p className={`mt-1 text-4xl font-extrabold ${styles.text} drop-shadow-sm`}>{stat.value}</p>
                  <p className="text-xs font-medium text-muted-foreground mt-1">{stat.desc}</p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-white dark:bg-gray-800 shadow-md ${styles.text} group-hover:scale-110 transition-transform`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 h-1.5 w-full bg-gradient-to-r ${styles.gradient} opacity-0 group-hover:opacity-100 transition-all duration-300" />
            </div>
          );
        })}
      </div>

      {/* Continue Learning Section */}
      {nextCourse && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 p-6 text-white shadow-xl">
          <div className="absolute top-0 right-0 -mt-6 -mr-6 h-32 w-32 rounded-full bg-white/10 animate-pulse"></div>
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-40 w-40 rounded-full bg-white/5"></div>
          <div className="absolute top-4 right-20 text-4xl animate-bounce">🚀</div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="flex items-center gap-2 text-cyan-100 font-semibold mb-1">
                <Zap className="h-5 w-5" /> Pick up where you left off!
              </p>
              <h2 className="text-2xl font-bold mb-3">{nextCourse.title}</h2>
              <div className="flex items-center gap-4">
                <div className="h-3 w-56 rounded-full bg-white/30 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-white shadow-lg shadow-white/30 transition-all duration-700 ease-out" 
                    style={{ width: `${nextCourse.progress}%` }}
                  />
                </div>
                <span className="text-sm font-bold bg-white/20 px-3 py-1 rounded-full">{nextCourse.progress}% done</span>
              </div>
            </div>
            <Link
              href={`/student/course/${nextCourse._id}`}
              className="group flex items-center gap-2 rounded-2xl bg-white px-8 py-4 font-bold text-blue-600 shadow-xl transition-all hover:scale-105 hover:shadow-2xl active:scale-95"
            >
              <PlayCircle className="h-6 w-6 group-hover:animate-pulse" />
              <span>Continue</span>
              <Sparkles className="h-4 w-4 text-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </div>
        </div>
      )}

      {/* Course Cards */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg">
              <GraduationCap className="h-5 w-5" />
            </span>
            My Learning Journey
          </h2>
          <span className="text-sm font-medium text-muted-foreground bg-muted px-4 py-2 rounded-full">
            {courses.length} course{courses.length !== 1 ? "s" : ""} enrolled
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border-3 border-dashed border-border py-20 text-center bg-gradient-to-b from-muted/30 to-muted/10">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-muted mb-6 shadow-inner">
              <BookOpen className="h-12 w-12 text-muted-foreground" />
            </div>
            <p className="font-bold text-xl text-foreground mb-2">No courses yet</p>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Contact your teacher to get started with your learning adventure!
            </p>
            <div className="text-4xl">📚🌟🚀</div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course, index) => (
              <Link
                key={course._id}
                href={`/student/course/${course._id}`}
                className="group"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="h-full rounded-3xl border-2 border-border bg-card p-6 shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:border-primary/30 overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full"></div>
                  <div className="absolute -bottom-4 -right-4 text-6xl opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:rotate-12">
                    📖
                  </div>
                  
                  <div className="flex items-start justify-between mb-4 relative z-10">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${colorStyles[statCards[index % 4].color].gradient} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
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
                    <PlayCircle className="h-4 w-4 animate-pulse" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Motivational Section */}
      {courses.length > 0 && averageProgress < 100 && (
        <div className="rounded-2xl border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-orange-950/30 dark:border-amber-800 p-6 shadow-lg">
          <div className="flex items-center gap-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg">
              <Star className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-lg text-foreground">Keep going, you&apos;re doing amazing! 🌟</p>
              <p className="text-sm text-muted-foreground mt-1">
                You&apos;ve completed <span className="font-bold text-amber-600">{totalVideosCompleted}</span> videos. 
                {totalVideosCompleted > 0 && " Keep up the awesome work! 🚀"}
              </p>
            </div>
            <div className="text-4xl animate-bounce hidden sm:block">💪</div>
          </div>
        </div>
      )}
    </div>
  );
}
