"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { courseService, registrationService } from "@/lib/api";
import styles from "./dashboard.module.css";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [coursesRes, regRes] = await Promise.all([
        courseService.getAll(),
        registrationService.getAll(),
      ]);
      setCourses(coursesRes.data);
      setRegistrations(regRes.data);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const pendingCount = registrations.filter((r) => r.status === "pending").length;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Admin Dashboard</h1>
        <div className={styles.userInfo}>
          <span>Welcome, {user?.name}</span>
          <button onClick={logout} className={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </header>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <h3>{courses.length}</h3>
          <p>Courses</p>
        </div>
        <div className={styles.statCard}>
          <h3>{registrations.length}</h3>
          <p>Total Registrations</p>
        </div>
        <div className={`${styles.statCard} ${styles.pending}`}>
          <h3>{pendingCount}</h3>
          <p>Pending Approval</p>
        </div>
      </div>

      <div className={styles.actions}>
        <Link href="/admin/add-student" className={styles.actionCard}>
          <h3>+ Add New Student</h3>
          <p>Register a new student</p>
        </Link>
        <Link href="/admin/course/manage" className={styles.actionCard}>
          <h3>Manage Courses</h3>
          <p>Add modules and videos</p>
        </Link>
        <Link href="/admin/student" className={styles.actionCard}>
          <h3>View Registrations</h3>
          <p>Review and approve students</p>
        </Link>
      </div>

      <div className={styles.recentSection}>
        <h2>Recent Courses</h2>
        {loading ? (
          <p>Loading...</p>
        ) : courses.length === 0 ? (
          <p className={styles.empty}>No courses yet. Create your first course!</p>
        ) : (
          <div className={styles.courseList}>
            {courses.slice(0, 5).map((course) => (
              <div key={course._id} className={styles.courseItem}>
                <div>
                  <h4>{course.title}</h4>
                  <p>{course.description}</p>
                </div>
                <Link href={`/admin/course/${course._id}`} className={styles.viewBtn}>
                  Manage
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}