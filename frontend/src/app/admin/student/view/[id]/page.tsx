"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { registrationService, courseService, documentService } from "@/lib/api";
import styles from "../view.module.css";

export default function ViewRegistrationPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [registration, setRegistration] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [regRes, coursesRes, docsRes] = await Promise.all([
        registrationService.getById(id),
        courseService.getAll(),
        documentService.getByRegistration(id),
      ]);

      setRegistration(regRes.data);
      setCourses(coursesRes.data);
      setDocuments(docsRes.data || []);
    } catch (error) {
      console.error("Failed to load registration:", error);
      alert("Failed to load registration data");
      router.push("/admin/student");
    } finally {
      setLoading(false);
    }
  };

  const getCourseName = (courseId: string) => {
    const course = courses.find((c) => c._id === courseId);
    return course?.title || "Unknown Course";
  };

  const getDocTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      "ID Proof": "ID Proof",
      "Address Proof": "Address Proof",
      "Education Certificate": "Education Certificate",
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <p className={styles.loading}>Loading...</p>
      </div>
    );
  }

  if (!registration) {
    return (
      <div className={styles.container}>
        <p>Registration not found</p>
        <Link href="/admin/student" className={styles.backLink}>
          Back to Registrations
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <Link href="/admin/student" className={styles.backLink}>
            ← Back to Registrations
          </Link>
          <h1>Registration Details</h1>
          <p>
            {registration.basicDetails?.firstName} {registration.basicDetails?.lastName} -{" "}
            <span className={`${styles.badge} ${styles[registration.status]}`}>
              {registration.status}
            </span>
          </p>
        </div>
      </div>

      <div className={styles.sections}>
        <div className={styles.section}>
          <h2>1. Basic Details</h2>
          <div className={styles.grid}>
            <div className={styles.field}>
              <label>Full Name</label>
              <p>{registration.basicDetails?.firstName} {registration.basicDetails?.lastName}</p>
            </div>
            <div className={styles.field}>
              <label>Date of Birth</label>
              <p>{registration.basicDetails?.dob || "N/A"}</p>
            </div>
            <div className={styles.field}>
              <label>Gender</label>
              <p className={styles.capitalize}>{registration.basicDetails?.gender || "N/A"}</p>
            </div>
            <div className={styles.field}>
              <label>Email</label>
              <p>{registration.basicDetails?.email || "N/A"}</p>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2>2. Address</h2>
          <div className={styles.grid}>
            <div className={styles.field} style={{ gridColumn: "1 / -1" }}>
              <label>Street Address</label>
              <p>{registration.address?.street || "N/A"}</p>
            </div>
            <div className={styles.field}>
              <label>City</label>
              <p>{registration.address?.city || "N/A"}</p>
            </div>
            <div className={styles.field}>
              <label>State</label>
              <p>{registration.address?.state || "N/A"}</p>
            </div>
            <div className={styles.field}>
              <label>Pincode</label>
              <p>{registration.address?.pincode || "N/A"}</p>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2>3. Contact</h2>
          <div className={styles.grid}>
            <div className={styles.field}>
              <label>Phone Number</label>
              <p>{registration.contact?.phone || "N/A"}</p>
            </div>
            <div className={styles.field}>
              <label>Emergency Contact</label>
              <p>{registration.contact?.emergencyContact || "N/A"}</p>
            </div>
            <div className={styles.field}>
              <label>Emergency Contact Name</label>
              <p>{registration.contact?.emergencyName || "N/A"}</p>
            </div>
            <div className={styles.field}>
              <label>Relationship</label>
              <p className={styles.capitalize}>{registration.contact?.relationship || "N/A"}</p>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2>4. Education</h2>
          <div className={styles.grid}>
            <div className={styles.field}>
              <label>Highest Qualification</label>
              <p className={styles.capitalize}>{registration.education?.qualification || "N/A"}</p>
            </div>
            <div className={styles.field}>
              <label>Institution/Board</label>
              <p>{registration.education?.institution || "N/A"}</p>
            </div>
            <div className={styles.field}>
              <label>Year of Passing</label>
              <p>{registration.education?.year || "N/A"}</p>
            </div>
            <div className={styles.field}>
              <label>Percentage/CGPA</label>
              <p>{registration.education?.percentage || "N/A"}</p>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2>5. Health</h2>
          <div className={styles.grid}>
            <div className={styles.field}>
              <label>Medical Conditions</label>
              <p>{registration.health?.conditions || "None"}</p>
            </div>
            <div className={styles.field}>
              <label>Current Medications</label>
              <p>{registration.health?.medications || "None"}</p>
            </div>
            <div className={styles.field}>
              <label>Allergies</label>
              <p>{registration.health?.allergies || "None"}</p>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2>6. Documents</h2>
          {documents.length > 0 ? (
            <div className={styles.documentsList}>
              {documents.map((doc) => (
                <div key={doc._id} className={styles.documentItem}>
                  <span className={styles.docType}>{getDocTypeLabel(doc.type)}</span>
                  <span className={styles.docName}>{doc.fileName}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.noData}>No documents uploaded</p>
          )}
        </div>

        <div className={styles.section}>
          <h2>7. Payment</h2>
          <div className={styles.grid}>
            <div className={styles.field}>
              <label>Amount</label>
              <p className={styles.amount}>
                ₹{registration.payment?.amount || 0}
              </p>
            </div>
            <div className={styles.field}>
              <label>Status</label>
              <p className={`${styles.status} ${styles[registration.payment?.status || "pending"]}`}>
                {registration.payment?.status === "completed" ? "✓ Completed" : "○ Pending"}
              </p>
            </div>
            <div className={styles.field}>
              <label>Reference/Transaction ID</label>
              <p>{registration.payment?.reference || "N/A"}</p>
            </div>
            {registration.payment?.notes && (
              <div className={styles.field}>
                <label>Notes</label>
                <p>{registration.payment.notes}</p>
              </div>
            )}
          </div>
        </div>

        <div className={styles.section}>
          <h2>8. Courses</h2>
          {registration.courseIds && registration.courseIds.length > 0 ? (
            <div className={styles.coursesList}>
              {registration.courseIds.map((courseId: string) => (
                <div key={courseId} className={styles.courseItem}>
                  {getCourseName(courseId)}
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.noData}>No courses selected</p>
          )}
        </div>

        {(registration.status === "approved" || registration.status === "rejected") && registration.createdAt && (
          <div className={styles.section}>
            <h2>Timeline</h2>
            <div className={styles.grid}>
              <div className={styles.field}>
                <label>Created At</label>
                <p>{new Date(registration.createdAt).toLocaleString()}</p>
              </div>
              {registration.approvedAt && (
                <div className={styles.field}>
                  <label>Approved At</label>
                  <p>{new Date(registration.approvedAt).toLocaleString()}</p>
                </div>
              )}
              {registration.rejectedAt && (
                <div className={styles.field}>
                  <label>Rejected At</label>
                  <p>{new Date(registration.rejectedAt).toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}