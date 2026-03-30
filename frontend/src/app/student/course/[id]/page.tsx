"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { courseService, progressService } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MultiLangPlayer } from "@/components/players/MultiLangPlayer";
import { BookOpen, PlayCircle, CheckCircle, ChevronLeft, ChevronRight, Video, Trophy, ArrowRight, Sparkles, Circle, CheckCircle2, Zap, Star, Clock } from "lucide-react";
import confetti from "canvas-confetti";

interface AudioTrack {
  id: string;
  language: string;
  languageCode: string;
  filePath: string;
}

interface VideoItem {
  _id: string;
  title: string;
  youtubeUrl: string;
  duration?: number;
  videoType?: "youtube" | "demo-local";
  localVideoPath?: string;
  audioTracks?: AudioTrack[];
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
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#22c55e', '#f59e0b', '#ec4899']
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
  const videoType = selectedVideo?.videoType || "youtube";
  const youtubeId = videoType === "youtube" && selectedVideo ? extractYouTubeId(selectedVideo.youtubeUrl) : null;
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
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
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

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => router.push("/student/courses")}
          className="hover:bg-primary/10"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{course.title}</h1>
          <p className="text-muted-foreground">{course.description || "No description"}</p>
        </div>
      </div>

      {/* Progress Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-6 text-white shadow-2xl">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 h-32 w-32 rounded-full bg-white/10 animate-pulse"></div>
        <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-white/5"></div>
        <div className="absolute top-4 right-32 text-4xl animate-bounce">🏆</div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="flex items-center gap-2 text-indigo-100 font-semibold mb-2">
              <Trophy className="h-5 w-5" /> Your Learning Journey
            </p>
            <div className="flex items-center gap-6">
              <span className="text-5xl font-extrabold drop-shadow-lg">{progress}%</span>
              <div>
                <p className="text-indigo-100 font-medium">{completedCount} of {totalVideos} lessons done</p>
                {progress === 100 && <p className="text-yellow-300 font-bold text-lg mt-1">🎉 You did it! Amazing job!</p>}
              </div>
            </div>
          </div>
          <div className="h-20 w-20 relative">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="white"
                strokeWidth="3"
                strokeDasharray={`${progress}, 100`}
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              {progress === 100 ? (
                <Star className="h-8 w-8 text-yellow-300 animate-pulse" />
              ) : (
                <Sparkles className="h-6 w-6 text-yellow-300" />
              )}
            </div>
          </div>
        </div>
        <div className="mt-5 h-3 w-full rounded-full bg-white/30 overflow-hidden shadow-inner">
          <div 
            className="h-full rounded-full bg-white shadow-lg shadow-white/30 transition-all duration-700 ease-out" 
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Video Player & Video List */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Video Player Section */}
        <div className="lg:col-span-2 space-y-5">
          {selectedVideo ? (
            <>
              <div className="relative aspect-video overflow-hidden rounded-2xl bg-black shadow-2xl ring-4 ring-primary/10">
                {videoType === "youtube" && youtubeId ? (
                  <div id="youtube-player" className="absolute inset-0" />
                ) : videoType === "demo-local" && selectedVideo?.localVideoPath ? (
                  <MultiLangPlayer
                    videoPath={selectedVideo.localVideoPath}
                    audioTracks={selectedVideo.audioTracks || []}
                    defaultLanguage="en"
                    onProgress={(time, dur) => {
                      if (selectedVideo) {
                        trackWatchProgress(selectedVideo._id, time, dur);
                      }
                    }}
                    onComplete={() => {
                      if (selectedVideo) {
                        handleVideoComplete(selectedVideo._id);
                      }
                    }}
                    startTime={videoProgress.get(selectedVideo?._id || '')?.lastPlayheadPosition || 0}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-white">
                    <Video className="h-16 w-16" />
                    <p className="ml-2">Video not available</p>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between bg-card rounded-2xl p-5 shadow-lg border border-border">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      Lesson {getAllVideos().findIndex(v => v._id === selectedVideo._id) + 1} of {totalVideos}
                    </span>
                    {completedVideos.has(selectedVideo._id) && (
                      <span className="flex items-center gap-1 text-emerald-600 font-bold text-sm">
                        <CheckCircle2 className="h-4 w-4" /> Completed
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-foreground">{selectedVideo.title}</h3>
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
                    className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105"
                  >
                    {markingComplete === selectedVideo._id ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        <CheckCircle2 className="h-5 w-5 mr-2" />
                        Mark Complete
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="flex items-center gap-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-5 py-3 rounded-xl font-bold">
                    <CheckCircle2 className="h-5 w-5" />
                    Done!
                  </div>
                )}
              </div>

              {/* Next Video Suggestion */}
              {nextVideo && (
                <div className="rounded-2xl border-2 border-border bg-gradient-to-r from-muted/50 to-muted/30 p-5">
                  <p className="text-sm font-bold text-muted-foreground mb-3 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-500" /> Up Next
                  </p>
                  <button
                    onClick={() => setSelectedVideo(nextVideo)}
                    className="flex w-full items-center gap-4 rounded-xl p-4 text-left transition-all hover:bg-primary/5 hover:scale-[1.01] border border-transparent hover:border-primary/20"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg">
                      <PlayCircle className="h-7 w-7" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-foreground">{nextVideo.title}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                        <span className="bg-muted px-2 py-0.5 rounded-full text-xs">Module {nextVideo.moduleIndex + 1}</span>
                        <span className="bg-muted px-2 py-0.5 rounded-full text-xs">Lesson {nextVideo.videoIndex + 1}</span>
                      </p>
                    </div>
                    <ChevronRight className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="aspect-video flex flex-col items-center justify-center rounded-2xl bg-muted">
              <PlayCircle className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground font-medium">Select a lesson to start learning</p>
            </div>
          )}
        </div>

        {/* Video List */}
        <div className="space-y-4">
          <h3 className="font-bold text-lg text-foreground flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg">
              <Video className="h-5 w-5" />
            </span>
            Course Content
          </h3>
          
          <div className="max-h-[650px] space-y-4 overflow-y-auto pr-2 custom-scrollbar">
            {course.modules.map((module, moduleIndex) => (
              <div key={module._id} className="rounded-2xl border-2 border-border bg-card overflow-hidden shadow-md">
                <div className="bg-gradient-to-r from-muted/80 to-muted/50 py-4 px-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold text-sm shadow-md">
                      {moduleIndex + 1}
                    </span>
                    <h4 className="font-bold text-foreground flex-1">{module.title}</h4>
                    <span className="text-xs font-bold bg-muted px-3 py-1 rounded-full text-muted-foreground">
                      {module.videos.filter(v => completedVideos.has(v._id)).length}/{module.videos.length}
                    </span>
                  </div>
                </div>
                <div className="p-3">
                  {module.videos.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 px-2 text-center">No videos in this module</p>
                  ) : (
                    <div className="space-y-2">
                      {module.videos.map((video, videoIdx) => {
                        const isCompleted = completedVideos.has(video._id);
                        const isSelected = selectedVideo?._id === video._id;

                        return (
                          <button
                            key={video._id}
                            onClick={() => setSelectedVideo(video)}
                            className={`w-full flex items-center gap-3 rounded-xl p-3 text-left transition-all duration-200 ${
                              isSelected
                                ? "bg-gradient-to-r from-indigo-500/15 to-purple-500/15 border-2 border-indigo-500/30 shadow-md"
                                : isCompleted
                                ? "hover:bg-emerald-50 dark:hover:bg-emerald-950/20 border-2 border-transparent"
                                : "hover:bg-muted border-2 border-transparent"
                            }`}
                          >
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold ${
                              isCompleted 
                                ? "bg-gradient-to-r from-emerald-400 to-green-500 text-white shadow-lg" 
                                : isSelected
                                ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg animate-pulse"
                                : "bg-muted text-muted-foreground"
                            }`}>
                              {isCompleted ? (
                                <CheckCircle2 className="h-5 w-5" />
                              ) : (
                                <span className="text-sm">{videoIdx + 1}</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-semibold truncate ${
                                isCompleted ? "text-muted-foreground line-through decoration-1" : "text-foreground"
                              }`}>
                                {video.title}
                              </p>
                              {isCompleted && (
                                <p className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                                  <CheckCircle2 className="h-3 w-3" /> Completed
                                </p>
                              )}
                            </div>
                            <div className={`shrink-0 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                              {isSelected ? (
                                <span className="flex h-3 w-3 rounded-full bg-indigo-500 animate-pulse" />
                              ) : isCompleted ? (
                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                              ) : (
                                <PlayCircle className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Completion Celebration */}
      {progress === 100 && (
        <div className="rounded-3xl border-3 border-emerald-400 bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-950/30 dark:via-green-950/20 dark:to-teal-950/30 p-8 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 via-green-500 to-teal-500"></div>
          <div className="absolute -top-10 -right-10 text-8xl opacity-20">🏆</div>
          <div className="absolute -bottom-10 -left-10 text-8xl opacity-20">⭐</div>
          <div className="relative z-10">
            <div className="flex justify-center mb-6">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-green-500 shadow-2xl animate-bounce">
                <Trophy className="h-12 w-12 text-white" />
              </div>
            </div>
            <h3 className="text-3xl font-extrabold text-gradient bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 dark:from-emerald-400 dark:via-green-400 dark:to-teal-400 mb-3">
              🎉 Amazing Job! You Did It!
            </h3>
            <p className="text-muted-foreground text-lg font-medium max-w-md mx-auto mb-6">
              You&apos;ve completed all <span className="font-bold text-emerald-600">{totalVideos}</span> lessons in this course! 
              You&apos;re a learning superstar! 🌟
            </p>
            <div className="flex justify-center gap-4">
              <Button 
                className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-bold px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:scale-105"
                onClick={() => router.push("/student/courses")}
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Continue Learning
              </Button>
            </div>
            <div className="mt-6 flex justify-center gap-2 text-4xl">
              <span className="animate-bounce">🌟</span>
              <span className="animate-bounce" style={{animationDelay: '0.1s'}}>🚀</span>
              <span className="animate-bounce" style={{animationDelay: '0.2s'}}>💪</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
