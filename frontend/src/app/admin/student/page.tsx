"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { registrationService } from "@/lib/api";
import styles from "./students.module.css";

export default function StudentListPage() {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  useEffect(() => {
    loadRegistrations();
  }, []);

  const loadRegistrations = async () => {
    try {
      const res = await registrationService.getAll();
      setRegistrations(res.data);
    } catch (error) {
      console.error("Failed to load registrations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, action: "approve" | "reject") => {
    try {
      await registrationService.updateStatus(id, action);
      loadRegistrations();
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const filteredRegistrations = registrations.filter((reg) => {
    if (filter === "all") return true;
    return reg.status === filter;
  });

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      pending: styles.badgePending,
      approved: styles.badgeApproved,
      rejected: styles.badgeRejected,
    };
    return badges[status] || "";
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Student Registrations</h1>
          <p>Review and manage student registrations</p>
        </div>
        <Link href="/admin/add-student" className={styles.addBtn}>
          + Add New Student
        </Link>
      </div>

      <div className={styles.filters}>
        <button
          className={filter === "all" ? styles.activeFilter : ""}
          onClick={() => setFilter("all")}
        >
          All ({registrations.length})
        </button>
        <button
          className={filter === "pending" ? styles.activeFilter : ""}
          onClick={() => setFilter("pending")}
        >
          Pending ({registrations.filter((r) => r.status === "pending").length})
        </button>
        <button
          className={filter === "approved" ? styles.activeFilter : ""}
          onClick={() => setFilter("approved")}
        >
          Approved ({registrations.filter((r) => r.status === "approved").length})
        </button>
        <button
          className={filter === "rejected" ? styles.activeFilter : ""}
          onClick={() => setFilter("rejected")}
        >
          Rejected ({registrations.filter((r) => r.status === "rejected").length})
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : filteredRegistrations.length === 0 ? (
        <div className={styles.empty}>
          <p>No registrations found.</p>
          <Link href="/admin/add-student">Add a new student</Link>
        </div>
      ) : (
        <div className={styles.list}>
          {filteredRegistrations.map((reg) => (
            <div key={reg._id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h3>
                    {reg.basicDetails?.firstName} {reg.basicDetails?.lastName}
                  </h3>
                  <p>{reg.basicDetails?.email || "Email not provided"}</p>
                </div>
                <span className={`${styles.badge} ${getStatusBadge(reg.status)}`}>
                  {reg.status}
                </span>
              </div>
              
              <div className={styles.cardBody}>
                <div className={styles.info}>
                  <span>DOB:</span> {reg.basicDetails?.dob || "N/A"}
                </div>
                <div className={styles.info}>
                  <span>Phone:</span> {reg.contact?.phone || "N/A"}
                </div>
                <div className={styles.info}>
                  <span>Courses:</span> {reg.courseIds?.length || 0}
                </div>
              </div>

              {reg.status === "pending" && (
                <div className={styles.cardActions}>
                  <button
                    className={styles.approveBtn}
                    onClick={() => handleStatusUpdate(reg._id, "approve")}
                  >
                    Approve
                  </button>
                  <button
                    className={styles.rejectBtn}
                    onClick={() => handleStatusUpdate(reg._id, "reject")}
                  >
                    Reject
                  </button>
                </div>
              )}

              {reg.credentials && (
                <div className={styles.credentials}>
                  <strong>Generated Credentials:</strong>
                  <p>Email: {reg.credentials.email}</p>
                  <p>Password: {reg.credentials.password}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}