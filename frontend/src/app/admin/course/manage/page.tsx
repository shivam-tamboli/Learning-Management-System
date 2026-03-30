"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { courseService, moduleService, videoService } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button, LinkButton } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Input";
import { LoadingPage } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { useAPI } from "@/hooks";
import { Plus, ChevronDown, ChevronUp, Trash2, BookOpen, X, Video, Edit } from "lucide-react";

interface Course {
  _id: string;
  title: string;
  description: string;
}

export default function CourseManagePage() {
  const { success, error: showError } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCourse, setNewCourse] = useState({ title: "", description: "" });
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [courseDetails, setCourseDetails] = useState<any>(null);
  const [newModule, setNewModule] = useState({ courseId: "", title: "" });
  const [newVideo, setNewVideo] = useState({ 
    moduleId: "", 
    title: "", 
    youtubeUrl: "",
    videoType: "youtube" as "youtube" | "demo-local",
    localVideoPath: "",
    audioTracks: [] as { id: string; language: string; languageCode: string; filePath: string }[]
  });
  const [addingAudioTrack, setAddingAudioTrack] = useState(false);
  const [newAudioTrack, setNewAudioTrack] = useState({ language: "", languageCode: "", filePath: "" });
  
  const [confirmDelete, setConfirmDelete] = useState<{
    type: "course" | "module" | "video" | null;
    id: string | null;
    name: string;
  }>({ type: null, id: null, name: "" });
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);

  const createCourseAPI = useAPI(() => courseService.create(newCourse));
  const addModuleAPI = useAPI(() => courseService.createModule(newModule));

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const res = await courseService.getAll();
      setCourses(res.data);
    } catch (error) {
      console.error("Failed to load courses:", error);
      showError("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createCourseAPI.execute();
      success("Course created successfully");
      setNewCourse({ title: "", description: "" });
      setShowCreateModal(false);
      loadCourses();
    } catch (error) {
      console.error("Failed to create course:", error);
      showError("Failed to create course");
    }
  };

  const handleDeleteCourse = async () => {
    if (!confirmDelete.id) return;
    try {
      await courseService.delete(confirmDelete.id);
      success("Course deleted successfully");
      setConfirmDelete({ type: null, id: null, name: "" });
      loadCourses();
    } catch (error) {
      console.error("Failed to delete course:", error);
      showError("Failed to delete course");
    }
  };

  const toggleCourseDetails = async (courseId: string) => {
    if (expandedCourse === courseId) {
      setExpandedCourse(null);
      setCourseDetails(null);
    } else {
      setExpandedCourse(courseId);
      try {
        const res = await courseService.getById(courseId);
        setCourseDetails(res.data);
      } catch (error) {
        console.error("Failed to load course details:", error);
        showError("Failed to load course details");
      }
    }
  };

  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await addModuleAPI.execute();
      success("Module added successfully");
      setNewModule({ courseId: newModule.courseId, title: "" });
      const res = await courseService.getById(newModule.courseId);
      setCourseDetails(res.data);
    } catch (error) {
      console.error("Failed to add module:", error);
      showError("Failed to add module");
    }
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isEditMode && editingVideoId) {
        const updateData: any = {
          title: newVideo.title,
          videoType: newVideo.videoType,
        };
        if (newVideo.videoType === "youtube") {
          updateData.youtubeUrl = newVideo.youtubeUrl;
          updateData.localVideoPath = "";
          updateData.audioTracks = [];
        } else {
          updateData.localVideoPath = newVideo.localVideoPath;
          updateData.audioTracks = newVideo.audioTracks;
          updateData.youtubeUrl = "";
        }
        await videoService.update(editingVideoId, updateData);
        success("Video updated successfully");
        setIsEditMode(false);
        setEditingVideoId(null);
      } else {
        const videoData = {
          moduleId: newVideo.moduleId,
          title: newVideo.title,
          videoType: newVideo.videoType,
          ...(newVideo.videoType === "youtube" 
            ? { youtubeUrl: newVideo.youtubeUrl }
            : { 
                localVideoPath: newVideo.localVideoPath,
                audioTracks: newVideo.audioTracks
              }
          )
        };
        await videoService.create(videoData);
        success("Video added successfully");
      }
      setNewVideo({ 
        moduleId: newVideo.moduleId, 
        title: "", 
        youtubeUrl: "",
        videoType: "youtube",
        localVideoPath: "",
        audioTracks: []
      });
      if (courseDetails) {
        const res = await courseService.getById(courseDetails._id);
        setCourseDetails(res.data);
      }
    } catch (error) {
      console.error("Failed to save video:", error);
      showError("Failed to save video");
    }
  };

  const handleEditVideo = (video: any) => {
    setIsEditMode(true);
    setEditingVideoId(video._id);
    setNewVideo({
      moduleId: video.moduleId,
      title: video.title,
      youtubeUrl: video.youtubeUrl || "",
      videoType: video.videoType || "youtube",
      localVideoPath: video.localVideoPath || "",
      audioTracks: video.audioTracks || []
    });
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditingVideoId(null);
    setNewVideo({
      moduleId: "",
      title: "",
      youtubeUrl: "",
      videoType: "youtube",
      localVideoPath: "",
      audioTracks: []
    });
  };

  const normalizeLanguageCode = (code: string): string => {
    const codeMap: Record<string, string> = {
      'english': 'en', 'eng': 'en', 'en-us': 'en', 'en-uk': 'en',
      'hindi': 'hi', 'hin': 'hi',
      'marathi': 'mr', 'mar': 'mr',
      'tamil': 'ta', 'tam': 'ta',
      'telugu': 'te', 'tel': 'te',
      'kannada': 'kn', 'kan': 'kn',
      'malayalam': 'ml', 'mal': 'ml',
      'gujarati': 'gu', 'guj': 'gu',
      'punjabi': 'pa', 'pan': 'pa',
      'bengali': 'bn', 'ben': 'bn',
    };
    const normalized = code.toLowerCase().trim();
    return codeMap[normalized] || normalized;
  };

  const handleAddAudioTrack = () => {
    if (newAudioTrack.language && newAudioTrack.languageCode && newAudioTrack.filePath) {
      const normalizedCode = normalizeLanguageCode(newAudioTrack.languageCode);
      setNewVideo(prev => ({
        ...prev,
        audioTracks: [
          ...prev.audioTracks,
          { id: Date.now().toString(), language: newAudioTrack.language, languageCode: normalizedCode, filePath: newAudioTrack.filePath }
        ]
      }));
      setNewAudioTrack({ language: "", languageCode: "", filePath: "" });
      setAddingAudioTrack(false);
    }
  };

  const handleRemoveAudioTrack = (id: string) => {
    setNewVideo(prev => ({
      ...prev,
      audioTracks: prev.audioTracks.filter(t => t.id !== id)
    }));
  };

  const handleDeleteModule = async () => {
    if (!confirmDelete.id) return;
    try {
      await moduleService.delete(confirmDelete.id);
      success("Module deleted successfully");
      setConfirmDelete({ type: null, id: null, name: "" });
      if (courseDetails) {
        const res = await courseService.getById(courseDetails._id);
        setCourseDetails(res.data);
      }
    } catch (error) {
      console.error("Failed to delete module:", error);
      showError("Failed to delete module");
    }
  };

  const handleDeleteVideo = async () => {
    if (!confirmDelete.id) return;
    try {
      await videoService.delete(confirmDelete.id);
      success("Video deleted successfully");
      setConfirmDelete({ type: null, id: null, name: "" });
      if (courseDetails) {
        const res = await courseService.getById(courseDetails._id);
        setCourseDetails(res.data);
      }
    } catch (error) {
      console.error("Failed to delete video:", error);
      showError("Failed to delete video");
    }
  };

  const extractYouTubeId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    return match ? match[1] : null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Course Management</h1>
          <p className="text-muted-foreground">Create courses, add modules and videos</p>
        </div>
        <div className="flex gap-2">
          <LinkButton href="/admin/dashboard" variant="outline">
            Back
          </LinkButton>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Course
          </Button>
        </div>
      </div>

      {loading ? (
        <LoadingPage text="Loading courses..." />
      ) : courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No courses yet"
          description="Create your first course to get started"
          action={{
            label: "Create Course",
            onClick: () => setShowCreateModal(true),
          }}
        />
      ) : (
        <div className="space-y-4">
          {courses.map((course) => (
            <Card key={course._id} className="overflow-hidden hover:shadow-md transition-shadow duration-200">
              <div className="flex flex-col gap-4 p-5 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{course.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {course.description || "No description"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleCourseDetails(course._id)}
                  >
                    {expandedCourse === course._id ? (
                      <>
                        <ChevronUp className="mr-1.5 h-4 w-4" />
                        Collapse
                      </>
                    ) : (
                      <>
                        <ChevronDown className="mr-1.5 h-4 w-4" />
                        Manage
                      </>
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setConfirmDelete({ type: "course", id: course._id, name: course.title })}
                  >
                    <Trash2 className="mr-1.5 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>

              {expandedCourse === course._id && courseDetails && (
                <div className="border-t border-border bg-slate-50/50 dark:bg-slate-900/30 p-5">
                  <div className="mb-5">
                    <h4 className="mb-3 font-semibold text-foreground">Modules</h4>
                    <form onSubmit={handleAddModule} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Module title"
                        value={newModule.courseId === course._id ? newModule.title : ""}
                        onChange={(e) => setNewModule({ courseId: course._id, title: e.target.value })}
                        required
                        className="flex-1 rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <Button type="submit" size="sm" loading={addModuleAPI.loading && newModule.courseId === course._id}>
                        Add Module
                      </Button>
                    </form>
                  </div>

                  {courseDetails.modules?.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground bg-muted/30 rounded-lg">
                      No modules yet. Add your first module above.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {courseDetails.modules?.map((mod: any) => (
                        <div key={mod._id} className="rounded-xl border border-border bg-card p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <h5 className="font-semibold text-foreground">{mod.title}</h5>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setConfirmDelete({ type: "module", id: mod._id, name: mod.title })}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <form onSubmit={handleAddVideo} className="mb-4 space-y-2">
                            <div className="flex gap-2">
                              <div className="flex-1">
                                <input
                                  type="text"
                                  placeholder="Video title"
                                  value={newVideo.moduleId === mod._id ? newVideo.title : ""}
                                  onChange={(e) => setNewVideo({ 
                                    ...newVideo,
                                    moduleId: mod._id, 
                                    title: e.target.value
                                  })}
                                  required
                                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                              </div>
                              <select
                                value={newVideo.moduleId === mod._id ? newVideo.videoType : "youtube"}
                                onChange={(e) => setNewVideo({
                                  ...newVideo,
                                  moduleId: mod._id,
                                  videoType: e.target.value as "youtube" | "demo-local"
                                })}
                                className="rounded-lg border border-input bg-background px-2 py-2.5 text-sm"
                              >
                                <option value="youtube">YouTube</option>
                                <option value="demo-local">Local</option>
                              </select>
                            </div>

                            {newVideo.moduleId === mod._id && newVideo.videoType === "youtube" && (
                              <input
                                type="url"
                                placeholder="YouTube URL"
                                value={newVideo.youtubeUrl}
                                onChange={(e) => setNewVideo({ 
                                  ...newVideo, 
                                  youtubeUrl: e.target.value 
                                })}
                                required
                                className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                              />
                            )}

                            {newVideo.moduleId === mod._id && newVideo.videoType === "demo-local" && (
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  placeholder="Local video path (e.g., /videos/demo/lesson1.mp4)"
                                  value={newVideo.localVideoPath}
                                  onChange={(e) => setNewVideo({ 
                                    ...newVideo, 
                                    localVideoPath: e.target.value 
                                  })}
                                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm"
                                />
                                
                                <div className="text-xs text-muted-foreground">
                                  Audio Tracks ({newVideo.audioTracks.length})
                                </div>
                                
                                {newVideo.audioTracks.map((track) => (
                                  <div key={track.id} className="flex items-center gap-2 text-xs bg-muted p-2 rounded">
                                    <span className="flex-1">{track.language} ({track.languageCode})</span>
                                    <button 
                                      type="button"
                                      onClick={() => handleRemoveAudioTrack(track.id)}
                                      className="text-red-500"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                ))}

                                {addingAudioTrack ? (
                                  <div className="space-y-2 p-2 border rounded">
                                    <input
                                      type="text"
                                      placeholder="Language"
                                      value={newAudioTrack.language}
                                      onChange={(e) => setNewAudioTrack({ ...newAudioTrack, language: e.target.value })}
                                      className="w-full rounded border border-input bg-background px-2 py-1 text-xs"
                                    />
                                    <input
                                      type="text"
                                      placeholder="Code"
                                      value={newAudioTrack.languageCode}
                                      onChange={(e) => setNewAudioTrack({ ...newAudioTrack, languageCode: e.target.value })}
                                      className="w-full rounded border border-input bg-background px-2 py-1 text-xs"
                                    />
                                    <input
                                      type="text"
                                      placeholder="Audio path"
                                      value={newAudioTrack.filePath}
                                      onChange={(e) => setNewAudioTrack({ ...newAudioTrack, filePath: e.target.value })}
                                      className="w-full rounded border border-input bg-background px-2 py-1 text-xs"
                                    />
                                    <div className="flex gap-2">
                                      <Button type="button" size="sm" onClick={handleAddAudioTrack} className="flex-1 text-xs">
                                        Add
                                      </Button>
                                      <Button type="button" size="sm" variant="outline" onClick={() => setAddingAudioTrack(false)} className="text-xs">
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <Button 
                                    type="button" 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => setAddingAudioTrack(true)}
                                    className="w-full text-xs"
                                  >
                                    <Plus className="h-3 w-3 mr-1" /> Add Audio Track
                                  </Button>
                                )}
                              </div>
                            )}

                            {isEditMode && editingVideoId && newVideo.moduleId === mod._id && (
                              <Button type="button" size="sm" variant="outline" onClick={handleCancelEdit} className="w-full mb-2">
                                Cancel Edit
                              </Button>
                            )}
                            <Button type="submit" size="sm" disabled={newVideo.moduleId !== mod._id}>
                              {isEditMode ? "Update Video" : "Add Video"}
                            </Button>
                          </form>

                          {mod.videos?.length > 0 && (
                            <div className="space-y-2">
                              {mod.videos.map((video: any) => {
                                const ytId = extractYouTubeId(video.youtubeUrl);
                                return (
                                  <div key={video._id} className="flex items-center gap-3 rounded-lg bg-muted/50 p-3 hover:bg-muted transition-colors">
                                    {ytId && (
                                      <img
                                        src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
                                        alt={video.title}
                                        className="h-14 w-24 rounded-md object-cover shrink-0"
                                      />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-foreground truncate">{video.title}</p>
                                      <a
                                        href={video.youtubeUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-primary hover:underline"
                                      >
                                        Watch on YouTube
                                      </a>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEditVideo(video)}
                                      className="text-primary hover:text-primary hover:bg-primary/10 shrink-0"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setConfirmDelete({ type: "video", id: video._id, name: video.title })}
                                      className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h3 className="text-lg font-semibold">Create New Course</h3>
              <button onClick={() => setShowCreateModal(false)} className="rounded-lg p-1.5 hover:bg-accent transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCourse} className="p-6 space-y-5">
              <Input
                label="Course Title"
                value={newCourse.title}
                onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                placeholder="e.g., Web Development Fundamentals"
                required
              />
              <Textarea
                label="Description"
                value={newCourse.description}
                onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                placeholder="Brief description of the course"
                rows={3}
                required
              />
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" loading={createCourseAPI.loading} className="flex-1">
                  Create Course
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete.type !== null}
        onConfirm={() => {
          if (confirmDelete.type === "course") handleDeleteCourse();
          else if (confirmDelete.type === "module") handleDeleteModule();
          else if (confirmDelete.type === "video") handleDeleteVideo();
        }}
        onCancel={() => setConfirmDelete({ type: null, id: null, name: "" })}
        title={`Delete ${confirmDelete.type === "course" ? "Course" : confirmDelete.type === "module" ? "Module" : "Video"}`}
        message={`Are you sure you want to delete "${confirmDelete.name}"? This will also delete all ${
          confirmDelete.type === "course" ? "modules, videos, and progress" : 
          confirmDelete.type === "module" ? "videos and progress" : "related progress"
        }.`}
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}
