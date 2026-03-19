"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { courseService } from "@/lib/api";
import styles from "./manage.module.css";

interface Course {
  _id: string;
  title: string;
  description: string;
}

export default function CourseManagePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCourse, setNewCourse] = useState({ title: "", description: "" });
  const [creating, setCreating] = useState(false);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [courseDetails, setCourseDetails] = useState<any>(null);
  const [newModule, setNewModule] = useState({ courseId: "", title: "" });
  const [newVideo, setNewVideo] = useState({ moduleId: "", title: "", youtubeUrl: "" });
  const [addingModule, setAddingModule] = useState(false);
  const [addingVideo, setAddingVideo] = useState(false);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const res = await courseService.getAll();
      setCourses(res.data);
    } catch (error) {
      console.error("Failed to load courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await courseService.create(newCourse);
      setNewCourse({ title: "", description: "" });
      setShowCreateModal(false);
      loadCourses();
    } catch (error) {
      console.error("Failed to create course:", error);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm("Are you sure you want to delete this course?")) return;
    try {
      await courseService.delete(id);
      loadCourses();
    } catch (error) {
      console.error("Failed to delete course:", error);
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
      }
    }
  };

  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingModule(true);
    try {
      await courseService.createModule(newModule);
      setNewModule({ courseId: newModule.courseId, title: "" });
      const res = await courseService.getById(newModule.courseId);
      setCourseDetails(res.data);
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
      await courseService.createVideo(newVideo);
      setNewVideo({ moduleId: newVideo.moduleId, title: "", youtubeUrl: "" });
      if (courseDetails) {
        const res = await courseService.getById(courseDetails._id);
        setCourseDetails(res.data);
      }
    } catch (error) {
      console.error("Failed to add video:", error);
    } finally {
      setAddingVideo(false);
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm("Delete this module and all its videos?")) return;
    try {
      await courseService.deleteModule(moduleId);
      if (courseDetails) {
        const res = await courseService.getById(courseDetails._id);
        setCourseDetails(res.data);
      }
    } catch (error) {
      console.error("Failed to delete module:", error);
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm("Delete this video?")) return;
    try {
      await courseService.deleteVideo(videoId);
      if (courseDetails) {
        const res = await courseService.getById(courseDetails._id);
        setCourseDetails(res.data);
      }
    } catch (error) {
      console.error("Failed to delete video:", error);
    }
  };

  const extractYouTubeId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    return match ? match[1] : null;
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>Course Management</h1>
          <p>Create courses, add modules and videos</p>
        </div>
        <div className={styles.headerActions}>
          <Link href="/admin/dashboard" className={styles.backBtn}>
            ← Back
          </Link>
          <button className={styles.createBtn} onClick={() => setShowCreateModal(true)}>
            + Create Course
          </button>
        </div>
      </header>

      {loading ? (
        <p className={styles.loading}>Loading courses...</p>
      ) : courses.length === 0 ? (
        <div className={styles.empty}>
          <p>No courses yet. Create your first course!</p>
        </div>
      ) : (
        <div className={styles.courseList}>
          {courses.map((course) => (
            <div key={course._id} className={styles.courseCard}>
              <div className={styles.courseMain}>
                <div className={styles.courseInfo}>
                  <h3>{course.title}</h3>
                  <p>{course.description}</p>
                </div>
                <div className={styles.courseActions}>
                  <button
                    className={styles.expandBtn}
                    onClick={() => toggleCourseDetails(course._id)}
                  >
                    {expandedCourse === course._id ? "Collapse" : "Manage"}
                  </button>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => handleDeleteCourse(course._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>

              {expandedCourse === course._id && courseDetails && (
                <div className={styles.courseDetails}>
                  <div className={styles.sectionHeader}>
                    <h4>Modules</h4>
                    <form onSubmit={handleAddModule} className={styles.inlineForm}>
                      <input
                        type="text"
                        placeholder="Module title"
                        value={newModule.courseId === course._id ? newModule.title : ""}
                        onChange={(e) => setNewModule({ courseId: course._id, title: e.target.value })}
                        required
                      />
                      <button type="submit" disabled={addingModule}>
                        {addingModule ? "..." : "Add"}
                      </button>
                    </form>
                  </div>

                  {courseDetails.modules?.length === 0 ? (
                    <p className={styles.noItems}>No modules yet</p>
                  ) : (
                    courseDetails.modules?.map((mod: any) => (
                      <div key={mod._id} className={styles.moduleItem}>
                        <div className={styles.moduleHeader}>
                          <h5>{mod.title}</h5>
                          <div className={styles.moduleActions}>
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
                                {addingVideo ? "..." : "Add Video"}
                              </button>
                            </form>
                            <button
                              className={styles.deleteSmallBtn}
                              onClick={() => handleDeleteModule(mod._id)}
                            >
                              Delete Module
                            </button>
                          </div>
                        </div>

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
                                        Watch on YouTube
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
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>Create New Course</h2>
            <form onSubmit={handleCreateCourse}>
              <div className={styles.field}>
                <label>Course Title</label>
                <input
                  type="text"
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                  placeholder="e.g., Web Development Fundamentals"
                  required
                />
              </div>
              <div className={styles.field}>
                <label>Description</label>
                <textarea
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                  placeholder="Brief description of the course"
                  rows={3}
                  required
                />
              </div>
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={creating}>
                  {creating ? "Creating..." : "Create Course"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}