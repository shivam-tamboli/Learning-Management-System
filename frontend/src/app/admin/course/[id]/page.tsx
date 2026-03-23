"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { courseService, moduleService, videoService } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button, LinkButton } from "@/components/ui/Button";
import { StatsCard } from "@/components/ui/StatsCard";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { Plus, Trash2, BookOpen, Video, ArrowLeft, X } from "lucide-react";

export default function CourseDetailPage() {
  const params = useParams();
  const courseId = params.id as string;
  const { success, error: showError } = useToast();

  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [newVideo, setNewVideo] = useState({ moduleId: "", title: "", youtubeUrl: "" });
  const [addingModule, setAddingModule] = useState(false);
  const [addingVideo, setAddingVideo] = useState(false);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: "default" | "destructive";
  }>({ open: false, title: "", message: "", onConfirm: () => {} });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  const loadCourse = async () => {
    try {
      const res = await courseService.getById(courseId);
      setCourse(res.data);
    } catch (error) {
      console.error("Failed to load course:", error);
      showError("Failed to load course");
    } finally {
      setLoading(false);
    }
  };

  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingModule(true);
    try {
      await moduleService.create({ courseId, title: newModuleTitle });
      setNewModuleTitle("");
      success("Module added successfully");
      loadCourse();
    } catch (error) {
      console.error("Failed to add module:", error);
      showError("Failed to add module");
    } finally {
      setAddingModule(false);
    }
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingVideo(true);
    try {
      await videoService.create(newVideo);
      setNewVideo({ moduleId: "", title: "", youtubeUrl: "" });
      success("Video added successfully");
      loadCourse();
    } catch (error) {
      console.error("Failed to add video:", error);
      showError("Failed to add video");
    } finally {
      setAddingVideo(false);
    }
  };

  const handleDeleteModule = (moduleId: string) => {
    setConfirmDialog({
      open: true,
      title: "Delete Module",
      message: "This will delete the module and all its videos. This action cannot be undone.",
      variant: "destructive",
      onConfirm: async () => {
        setDeletingId(moduleId);
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        try {
          await moduleService.delete(moduleId);
          success("Module deleted successfully");
          loadCourse();
        } catch (error) {
          console.error("Failed to delete module:", error);
          showError("Failed to delete module");
        } finally {
          setDeletingId(null);
        }
      },
    });
  };

  const handleDeleteVideo = (videoId: string) => {
    setConfirmDialog({
      open: true,
      title: "Delete Video",
      message: "This action cannot be undone.",
      variant: "destructive",
      onConfirm: async () => {
        setDeletingId(videoId);
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        try {
          await videoService.delete(videoId);
          success("Video deleted successfully");
          loadCourse();
        } catch (error) {
          console.error("Failed to delete video:", error);
          showError("Failed to delete video");
        } finally {
          setDeletingId(null);
        }
      },
    });
  };

  const extractYouTubeId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    return match ? match[1] : null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!course) {
    return (
      <Card className="py-12">
        <CardContent className="flex flex-col items-center justify-center text-center">
          <p className="text-lg font-medium text-muted-foreground">Course not found</p>
          <LinkButton href="/admin/course/manage" variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Course Management
          </LinkButton>
        </CardContent>
      </Card>
    );
  }

  const totalVideos = course.modules?.reduce(
    (acc: number, mod: any) => acc + (mod.videos?.length || 0),
    0
  ) || 0;

  return (
    <div className="space-y-6">
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        confirmText="Delete"
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
        loading={!!deletingId}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <LinkButton href="/admin/course/manage" variant="ghost" size="sm" className="mb-2 -ml-2">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Courses
          </LinkButton>
          <h1 className="text-2xl font-bold text-foreground">{course.title}</h1>
          <p className="text-muted-foreground">{course.description}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <StatsCard
          title="Modules"
          value={course.modules?.length || 0}
          description="Total modules in this course"
        />
        <StatsCard
          title="Videos"
          value={totalVideos}
          description="Total videos across all modules"
          variant="success"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Module</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddModule} className="flex gap-2">
            <input
              type="text"
              placeholder="Module title"
              value={newModuleTitle}
              onChange={(e) => setNewModuleTitle(e.target.value)}
              required
              className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
            <Button type="submit" disabled={addingModule}>
              <Plus className="mr-2 h-4 w-4" />
              {addingModule ? "..." : "Add Module"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {course.modules?.length === 0 ? (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">No modules yet</p>
            <p className="text-sm text-muted-foreground">Add your first module above to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {course.modules?.map((mod: any) => (
            <Card key={mod._id}>
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{mod.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {mod.videos?.length || 0} videos
                    </p>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteModule(mod._id)}
                  disabled={deletingId === mod._id}
                >
                  <Trash2 className="mr-1 h-4 w-4" />
                  {deletingId === mod._id ? "..." : "Delete"}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-dashed border-border p-4">
                  <p className="mb-3 text-sm font-medium text-muted-foreground">Add Video</p>
                  <form onSubmit={handleAddVideo} className="space-y-3">
                    <input
                      type="text"
                      placeholder="Video title"
                      value={newVideo.moduleId === mod._id ? newVideo.title : ""}
                      onChange={(e) => setNewVideo({ 
                        moduleId: mod._id, 
                        title: e.target.value, 
                        youtubeUrl: newVideo.moduleId === mod._id ? newVideo.youtubeUrl : "" 
                      })}
                      required
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    />
                    <input
                      type="url"
                      placeholder="YouTube URL"
                      value={newVideo.moduleId === mod._id ? newVideo.youtubeUrl : ""}
                      onChange={(e) => setNewVideo({ 
                        moduleId: mod._id, 
                        title: newVideo.moduleId === mod._id ? newVideo.title : "", 
                        youtubeUrl: e.target.value 
                      })}
                      required
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    />
                    <Button type="submit" size="sm" disabled={addingVideo} className="w-full">
                      <Plus className="mr-1 h-4 w-4" />
                      {addingVideo ? "..." : "Add Video"}
                    </Button>
                  </form>
                </div>

                {mod.videos?.length > 0 && (
                  <div className="space-y-2">
                    {mod.videos.map((video: any) => {
                      const ytId = extractYouTubeId(video.youtubeUrl);
                      return (
                        <div key={video._id} className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                          {ytId && (
                            <img
                              src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
                              alt={video.title}
                              className="h-14 w-24 rounded object-cover"
                            />
                          )}
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{video.title}</p>
                            <a
                              href={video.youtubeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline"
                            >
                              Open on YouTube
                            </a>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteVideo(video._id)}
                            disabled={deletingId === video._id}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
