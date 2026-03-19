"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { courseService, moduleService, videoService } from "@/lib/api";
import styles from "./detail.module.css";

export default function CourseDetailPage() {
  const params = useParams();
  const courseId = params.id as string;

  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [newVideo, setNewVideo] = useState({ moduleId: "", title: "", youtubeUrl: "" });
  const [addingModule, setAddingModule] = useState(false);
  const [addingVideo, setAddingVideo] = useState(false);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  const loadCourse = async () => {
    try {
      const res = await courseService.getById(courseId);
      setCourse(res.data);
    } catch (error) {
      console.error("Failed to load course:", error);
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
      loadCourse();
    } catch (error) {
      console.error("Failed to add module:", error);
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
      loadCourse();
    } catch (error) {
      console.error("Failed to add video:", error);
    } finally {
      setAddingVideo(false);
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm("Delete this module and all its videos?")) return;
    try {
      await moduleService.delete(moduleId);
      loadCourse();
    } catch (error) {
      console.error("Failed to delete module:", error);
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm("Delete this video?")) return;
    try {
      await videoService.delete(videoId);
      loadCourse();
    } catch (error) {
      console.error("Failed to delete video:", error);
    }
  };

  const extractYouTubeId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    return match ? match[1] : null;
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <p className={styles.loading}>Loading course...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>
          <h2>Course not found</h2>
          <Link href="/admin/course/manage">← Back to Course Management</Link>
        </div>
      </div>
    );
  }

  const totalVideos = course.modules?.reduce(
    (acc: number, mod: any) => acc + (mod.videos?.length || 0),
    0
  ) || 0;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <Link href="/admin/course/manage" className={styles.backLink}>
            ← Back to Courses
          </Link>
          <h1>{course.title}</h1>
          <p>{course.description}</p>
          <div className={styles.stats}>
            <span>{course.modules?.length || 0} Modules</span>
            <span>{totalVideos} Videos</span>
          </div>
        </div>
      </header>

      <div className={styles.content}>
        <div className={styles.section}>
          <h2>Add New Module</h2>
          <form onSubmit={handleAddModule} className={styles.addForm}>
            <input
              type="text"
              placeholder="Module title"
              value={newModuleTitle}
              onChange={(e) => setNewModuleTitle(e.target.value)}
              required
            />
            <button type="submit" disabled={addingModule}>
              {addingModule ? "..." : "Add Module"}
            </button>
          </form>
        </div>

        {course.modules?.length === 0 ? (
          <div className={styles.empty}>
            <p>No modules yet. Add your first module above.</p>
          </div>
        ) : (
          <div className={styles.moduleList}>
            {course.modules?.map((mod: any) => (
              <div key={mod._id} className={styles.moduleCard}>
                <div className={styles.moduleHeader}>
                  <div>
                    <h3>{mod.title}</h3>
                    <span className={styles.videoCount}>
                      {mod.videos?.length || 0} videos
                    </span>
                  </div>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => handleDeleteModule(mod._id)}
                  >
                    Delete
                  </button>
                </div>

                <div className={styles.videoSection}>
                  <h4>Add Video</h4>
                  <form onSubmit={handleAddVideo} className={styles.videoForm}>
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
                    />
                    <button type="submit" disabled={addingVideo}>
                      {addingVideo ? "..." : "Add"}
                    </button>
                  </form>

                  {mod.videos?.length > 0 && (
                    <div className={styles.videoList}>
                      {mod.videos.map((video: any) => {
                        const ytId = extractYouTubeId(video.youtubeUrl);
                        return (
                          <div key={video._id} className={styles.videoItem}>
                            <div className={styles.videoPreview}>
                              {ytId && (
                                <img
                                  src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
                                  alt={video.title}
                                  className={styles.thumbnail}
                                />
                              )}
                              <div>
                                <p className={styles.videoTitle}>{video.title}</p>
                                <a
                                  href={video.youtubeUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={styles.videoLink}
                                >
                                  Open on YouTube
                                </a>
                              </div>
                            </div>
                            <button
                              className={styles.deleteSmallBtn}
                              onClick={() => handleDeleteVideo(video._id)}
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}