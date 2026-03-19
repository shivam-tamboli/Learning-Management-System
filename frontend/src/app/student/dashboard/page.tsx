"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { registrationService, progressService, courseService } from "@/lib/api";
import styles from "./dashboard.module.css";

interface CourseWithProgress {
  _id: string;
  title: string;
  description: string;
  progress: number;
  totalVideos: number;
  completedVideos: number;
}

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const [courses, setCourses] = useState<CourseWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const registrationRes = await registrationService.getAll();
      const userRegistrations = registrationRes.data.filter(
        (reg: any) => reg.studentId === user?.id || reg.userId === user?.id
      );

      const coursesWithProgress: CourseWithProgress[] = [];

      for (const reg of userRegistrations) {
        for (const courseId of reg.courseIds || []) {
          try {
            const courseRes = await courseService.getById(courseId);
            const progressRes = await progressService.getByCourse(courseId);
            
            const totalVideos = courseRes.data.modules?.reduce(
              (acc: number, mod: any) => acc + (mod.videos?.length || 0),
              0
            ) || 0;
            
            const completedVideos = progressRes.data.filter(
              (p: any) => p.isCompleted
            ).length;
            
            coursesWithProgress.push({
              _id: courseRes.data._id,
              title: courseRes.data.title,
              description: courseRes.data.description,
              progress: totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0,
              totalVideos,
              completedVideos,
            });
          } catch (e) {
            console.error("Failed to load course:", e);
          }
        }
      }

      setCourses(coursesWithProgress);
    } catch (error) {
      console.error("Failed to load courses:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Student Dashboard</h1>
        <div className={styles.userInfo}>
          <span>Welcome, {user?.name}</span>
          <button onClick={logout} className={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </header>

      <div className={styles.welcome}>
        <h2>Your Courses</h2>
        <p>Continue learning from your enrolled courses</p>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : courses.length === 0 ? (
        <div className={styles.empty}>
          <p>No courses enrolled yet.</p>
          <p>Please contact the administrator for course enrollment.</p>
        </div>
      ) : (
        <div className={styles.courseGrid}>
          {courses.map((course) => (
            <div key={course._id} className={styles.courseCard}>
              <div className={styles.courseContent}>
                <h3>{course.title}</h3>
                <p>{course.description}</p>
              </div>
              <div className={styles.progressSection}>
                <div className={styles.progressHeader}>
                  <span>Progress</span>
                  <span>{course.progress}%</span>
                </div>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${course.progress}%` }}
                  />
                </div>
                <p className={styles.videoCount}>
                  {course.completedVideos} of {course.totalVideos} videos completed
                </p>
              </div>
              <a href={`/student/course/${course._id}`} className={styles.continueBtn}>
                Continue Learning
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}