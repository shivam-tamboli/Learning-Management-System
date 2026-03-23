"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { courseService, progressService } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { BookOpen, PlayCircle, CheckCircle, ChevronLeft, Lock, Video } from "lucide-react";

interface VideoItem {
  _id: string;
  title: string;
  youtubeUrl: string;
}

interface Module {
  _id: string;
  title: string;
  videos: VideoItem[];
}

interface CourseDetail {
  _id: string;
  title: string;
  description: string;
  modules: Module[];
}

export default function CourseDetail() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const courseId = params.id as string;

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [completedVideos, setCompletedVideos] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [markingComplete, setMarkingComplete] = useState<string | null>(null);

  const loadCourse = useCallback(async () => {
    try {
      const [courseRes, progressRes] = await Promise.all([
        courseService.getById(courseId),
        progressService.getByCourse(courseId)
      ]);
      
      setCourse(courseRes.data);
      const completed = new Set<string>(
        progressRes.data
          .filter((p: any) => p.isCompleted)
          .map((p: any) => p.videoId)
      );
      setCompletedVideos(completed);
    } catch (error) {
      console.error("Failed to load course:", error);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadCourse();
  }, [loadCourse]);

  const handleVideoComplete = async (videoId: string) => {
    setMarkingComplete(videoId);
    try {
      await progressService.complete({ courseId, videoId });
      setCompletedVideos(prev => new Set<string>(Array.from(prev).concat(videoId)));
    } catch (error) {
      console.error("Failed to mark video complete:", error);
    } finally {
      setMarkingComplete(null);
    }
  };

  const getProgressPercentage = () => {
    if (!course) return 0;
    const totalVideos = course.modules.reduce(
      (acc, mod) => acc + mod.videos.length,
      0
    );
    if (totalVideos === 0) return 0;
    return Math.round((completedVideos.size / totalVideos) * 100);
  };

  const extractYouTubeId = (url: string): string | null => {
    const regex = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="font-medium text-foreground mb-1">Course not found</p>
        <p className="text-sm text-muted-foreground mb-4">
          This course may not exist or you may not have access
        </p>
        <Button variant="outline" onClick={() => router.push("/student/courses")}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Courses
        </Button>
      </div>
    );
  }

  const progress = getProgressPercentage();
  const totalVideos = course.modules.reduce((acc, mod) => acc + mod.videos.length, 0);
  const completedCount = completedVideos.size;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => router.push("/student/courses")}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{course.title}</h1>
          <p className="text-muted-foreground">{course.description || "No description"}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{course.modules.length}</p>
              <p className="text-sm text-muted-foreground">Modules</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Video className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalVideos}</p>
              <p className="text-sm text-muted-foreground">Videos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{progress}%</p>
              <p className="text-sm text-muted-foreground">{completedCount} of {totalVideos} completed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="space-y-4">
        {course.modules.map((module, moduleIndex) => (
          <Card key={module._id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                  {moduleIndex + 1}
                </span>
                {module.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {module.videos.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No videos in this module</p>
              ) : (
                <div className="space-y-2">
                  {module.videos.map((video) => {
                    const isCompleted = completedVideos.has(video._id);
                    const isLoading = markingComplete === video._id;
                    const youtubeId = extractYouTubeId(video.youtubeUrl);

                    return (
                      <div
                        key={video._id}
                        className="flex items-center justify-between rounded-lg border border-border p-4 transition-all hover:bg-accent/50"
                      >
                        <div className="flex items-center gap-3">
                          {isCompleted ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <PlayCircle className="h-5 w-5 text-muted-foreground" />
                          )}
                          <span className={isCompleted ? "text-muted-foreground" : "text-foreground"}>
                            {video.title}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {youtubeId && (
                            <a
                              href={`https://www.youtube.com/watch?v=${youtubeId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline"
                            >
                              Watch on YouTube
                            </a>
                          )}
                          <Button
                            size="sm"
                            variant={isCompleted ? "outline" : "default"}
                            onClick={() => handleVideoComplete(video._id)}
                            disabled={isCompleted || isLoading}
                          >
                            {isLoading ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : isCompleted ? (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Completed
                              </>
                            ) : (
                              "Mark Complete"
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {progress === 100 && (
        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="flex items-center gap-4 py-4">
            <CheckCircle className="h-10 w-10 text-green-500" />
            <div>
              <p className="font-medium text-foreground">Congratulations!</p>
              <p className="text-sm text-muted-foreground">
                You have completed this course. Great job on finishing all videos!
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
