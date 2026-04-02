"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { courseService, progressService } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { BookOpen, PlayCircle, CheckCircle, ChevronLeft, ChevronRight, Video, Trophy, CheckCircle2, Clock } from "lucide-react";

interface VideoItem {
  _id: string;
  title: string;
  youtubeUrl: string;
  duration?: number;
}

interface VideoProgress {
  videoId: string;
  watchTime: number;
  lastPlayheadPosition: number;
  completionPercentage: number;
  isCompleted: boolean;
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
  const [videoProgress, setVideoProgress] = useState<Map<string, VideoProgress>>(new Map());
  const [loading, setLoading] = useState(true);
  const [markingComplete, setMarkingComplete] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [showCompletionCelebration, setShowCompletionCelebration] = useState(false);
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const playerRef = useRef<any>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadCourse = useCallback(async () => {
    try {
      const [courseRes, progressRes] = await Promise.all([
        courseService.getById(courseId),
        progressService.getByCourse(courseId)
      ]);
      
      setCourse(courseRes.data);
      
      const progressMap = new Map<string, VideoProgress>();
      const completed = new Set<string>();
      
      progressRes.data.forEach((p: any) => {
        progressMap.set(p.videoId, {
          videoId: p.videoId,
          watchTime: p.watchTime || 0,
          lastPlayheadPosition: p.lastPlayheadPosition || 0,
          completionPercentage: p.completionPercentage || 0,
          isCompleted: p.isCompleted || false
        });
        if (p.isCompleted) {
          completed.add(p.videoId);
        }
      });
      
      setCompletedVideos(completed);
      setVideoProgress(progressMap);

      const allVideos = courseRes.data.modules.flatMap((m: Module) => m.videos);
      const firstIncomplete = allVideos.find((v: VideoItem) => !completed.has(v._id));
      if (firstIncomplete) {
        setSelectedVideo(firstIncomplete);
      } else if (allVideos.length > 0) {
        setSelectedVideo(allVideos[0]);
      }
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
      setVideoProgress(prev => {
        const updated = new Map(prev);
        const existing = updated.get(videoId);
        if (existing) {
          updated.set(videoId, { ...existing, isCompleted: true, completionPercentage: 100 });
        }
        return updated;
      });
    } catch (error) {
      console.error("Failed to mark video complete:", error);
    } finally {
      setMarkingComplete(null);
    }
  };

  const trackWatchProgress = async (videoId: string, currentTime: number, duration: number) => {
    try {
      const result = await progressService.watchVideo({
        courseId,
        videoId,
        watchedTime: Math.floor(currentTime),
        totalDuration: Math.floor(duration)
      });
      
      setVideoProgress(prev => {
        const updated = new Map(prev);
        updated.set(videoId, {
          videoId,
          watchTime: Math.floor(currentTime),
          lastPlayheadPosition: Math.floor(currentTime),
          completionPercentage: result.data.completionPercentage || 0,
          isCompleted: result.data.isCompleted || false
        });
        return updated;
      });
      
      if (result.data.isCompleted && !completedVideos.has(videoId)) {
        setCompletedVideos(prev => new Set<string>(Array.from(prev).concat(videoId)));
      }
    } catch (error) {
      console.error("Failed to track watch progress:", error);
    }
  };

  const initYouTubePlayer = useCallback((youtubeId: string) => {
    if (!youtubeId) return;
    
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    const loadPlayer = () => {
      if ((window as any).YT && (window as any).YT.Player) {
        const savedProgress = videoProgress.get(selectedVideo?._id || '');
        const startTime = savedProgress?.lastPlayheadPosition || 0;
        
        playerRef.current = new (window as any).YT.Player('youtube-player', {
          videoId: youtubeId,
          playerVars: {
            rel: 0,
            start: startTime
          },
          events: {
            onStateChange: (event: any) => {
              if (event.data === 1) {
                progressIntervalRef.current = setInterval(() => {
                  if (playerRef.current && 
                      typeof playerRef.current.getCurrentTime === 'function' &&
                      typeof playerRef.current.getDuration === 'function') {
                    try {
                      const currentTime = playerRef.current.getCurrentTime();
                      const duration = playerRef.current.getDuration();
                      setCurrentVideoTime(currentTime);
                      
                      if (selectedVideo && duration > 0) {
                        trackWatchProgress(selectedVideo._id, currentTime, duration);
                      }
                    } catch (e) {
                      console.error('Error tracking progress:', e);
                    }
                  }
                }, 10000);
              } else if (event.data === 2 || event.data === 0) {
                if (progressIntervalRef.current) {
                  clearInterval(progressIntervalRef.current);
                }
                if (playerRef.current && selectedVideo && 
                    typeof playerRef.current.getCurrentTime === 'function' &&
                    typeof playerRef.current.getDuration === 'function') {
                  try {
                    const currentTime = playerRef.current.getCurrentTime();
                    const duration = playerRef.current.getDuration();
                    if (currentTime > 0 && duration > 0) {
                      trackWatchProgress(selectedVideo._id, currentTime, duration);
                    }
                  } catch (e) {
                    console.error('Error getting video time:', e);
                  }
                }
              }
            }
          }
        });
      }
    };

    if (!(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      (window as any).onYouTubeIframeAPIReady = loadPlayer;
    } else {
      loadPlayer();
    }
  }, [selectedVideo, videoProgress]);

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

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

  const getAllVideos = () => {
    if (!course) return [];
    return course.modules.flatMap((m, mi) => 
      m.videos.map((v, vi) => ({ ...v, moduleIndex: mi, videoIndex: vi }))
    );
  };

  const getNextVideo = () => {
    const allVideos = getAllVideos();
    const currentIndex = selectedVideo 
      ? allVideos.findIndex(v => v._id === selectedVideo._id)
      : -1;
    return currentIndex >= 0 && currentIndex < allVideos.length - 1 
      ? allVideos[currentIndex + 1] 
      : null;
  };

  const progress = getProgressPercentage();
  const totalVideos = course ? course.modules.reduce((acc, mod) => acc + mod.videos.length, 0) : 0;
  const completedCount = completedVideos.size;
  const youtubeId = selectedVideo ? extractYouTubeId(selectedVideo.youtubeUrl) : null;
  const nextVideo = getNextVideo();

  useEffect(() => {
    if (youtubeId) {
      initYouTubePlayer(youtubeId);
    }
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [youtubeId, initYouTubePlayer]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Course Not Found"
          breadcrumbs={[
            { label: "Student", href: "/student/dashboard" },
            { label: "Courses", href: "/student/courses" },
            { label: "Not Found" },
          ]}
        />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="font-medium text-foreground mb-1">Course not found</p>
            <p className="text-sm text-muted-foreground mb-4">
              This course may not exist or you may not have access
            </p>
            <Button variant="outline" onClick={() => router.push("/student/courses")}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Courses
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={course.title}
        description={course.description || "No description"}
        breadcrumbs={[
          { label: "Student", href: "/student/dashboard" },
          { label: "Courses", href: "/student/courses" },
          { label: course.title },
        ]}
      />

      {/* Progress Card */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Course Progress</p>
                <p className="text-2xl font-bold text-foreground">{progress}%</p>
                <p className="text-xs text-muted-foreground">{completedCount} of {totalVideos} lessons</p>
              </div>
            </div>
            <div className="flex-1 max-w-xs">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Video Player & Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Video Player */}
        <div className="lg:col-span-2 space-y-4">
          {selectedVideo ? (
            <>
              <div className="aspect-video bg-black rounded-xl overflow-hidden">
                {youtubeId ? (
                  <div id="youtube-player" className="absolute inset-0" />
                ) : (
                  <div className="flex h-full items-center justify-center text-white">
                    <Video className="h-12 w-12" />
                    <p className="ml-2">Video not available</p>
                  </div>
                )}
              </div>
              
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-muted text-muted-foreground">
                          Lesson {getAllVideos().findIndex(v => v._id === selectedVideo._id) + 1} of {totalVideos}
                        </span>
                        {completedVideos.has(selectedVideo._id) && (
                          <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            Completed
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">{selectedVideo.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {(() => {
                          const allVids = getAllVideos();
                          const idx = allVids.findIndex(v => v._id === selectedVideo._id);
                          return `Module ${Math.floor(idx / 10) + 1} • Lesson ${(idx % 10) + 1}`;
                        })()}
                      </p>
                    </div>
                    {!completedVideos.has(selectedVideo._id) ? (
                      <Button
                        onClick={() => handleVideoComplete(selectedVideo._id)}
                        disabled={markingComplete === selectedVideo._id}
                        size="sm"
                      >
                        {markingComplete === selectedVideo._id ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Mark Complete
                          </>
                        )}
                      </Button>
                    ) : (
                      <span className="text-sm font-medium text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" />
                        Done
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Next Video */}
              {nextVideo && (
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm font-medium text-muted-foreground mb-3">Up Next</p>
                    <button
                      onClick={() => setSelectedVideo(nextVideo)}
                      className="flex w-full items-center gap-3 p-3 rounded-lg text-left hover:bg-muted transition-colors"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <PlayCircle className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{nextVideo.title}</p>
                        <p className="text-xs text-muted-foreground">Module {nextVideo.moduleIndex + 1} • Lesson {nextVideo.videoIndex + 1}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <PlayCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Select a lesson to start learning</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Course Content */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Course Content</h3>
          
          <div className="max-h-[500px] overflow-y-auto space-y-3 pr-2">
            {course.modules.map((module, moduleIndex) => (
              <Card key={module._id} className="overflow-hidden">
                <CardHeader className="py-3 px-4 bg-muted/50 border-b border-border">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-medium">
                      {moduleIndex + 1}
                    </span>
                    <h4 className="text-sm font-medium text-foreground flex-1 truncate">{module.title}</h4>
                    <span className="text-xs text-muted-foreground">
                      {module.videos.filter(v => completedVideos.has(v._id)).length}/{module.videos.length}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-2">
                  {module.videos.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2 px-2 text-center">No videos in this module</p>
                  ) : (
                    <div className="space-y-1">
                      {module.videos.map((video, videoIdx) => {
                        const isCompleted = completedVideos.has(video._id);
                        const isSelected = selectedVideo?._id === video._id;

                        return (
                          <button
                            key={video._id}
                            onClick={() => setSelectedVideo(video)}
                            className={`w-full flex items-center gap-2 rounded-lg p-2 text-left transition-colors ${
                              isSelected
                                ? "bg-primary/10 border border-primary/30"
                                : isCompleted
                                ? "hover:bg-muted"
                                : "hover:bg-muted"
                            }`}
                          >
                            <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-medium ${
                              isCompleted 
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                : isSelected
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}>
                              {isCompleted ? (
                                <CheckCircle2 className="h-4 w-4" />
                              ) : (
                                <span>{videoIdx + 1}</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm truncate ${isCompleted ? "text-muted-foreground" : "text-foreground"}`}>
                                {video.title}
                              </p>
                            </div>
                            {isCompleted && (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Completion Message */}
      {progress === 100 && (
        <Card className="border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/20">
          <CardContent className="p-6 text-center">
            <Trophy className="h-12 w-12 text-emerald-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Course Completed!</h3>
            <p className="text-sm text-muted-foreground">
              Congratulations! You have completed all {totalVideos} lessons in this course.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
