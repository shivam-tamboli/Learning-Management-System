"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registrationService } from "@/lib/api";
import styles from "./students.module.css";

interface PaymentUpdateModalProps {
  registration: any;
  onClose: () => void;
  onUpdate: () => void;
}

function PaymentUpdateModal({ registration, onClose, onUpdate }: PaymentUpdateModalProps) {
  const [amount, setAmount] = useState(registration.payment?.amount?.toString() || "");
  const [status, setStatus] = useState<"pending" | "completed">(registration.payment?.status || "pending");
  const [reference, setReference] = useState(registration.payment?.reference || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await registrationService.updatePayment(registration._id, {
        amount: parseFloat(amount) || 0,
        status,
        reference,
      });
      onUpdate();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3>Update Payment</h3>
          <button onClick={onClose} className={styles.modalClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <div className={styles.errorMessage}>{error}</div>}
          <div className={styles.formGroup}>
            <label>Amount (INR)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label>Payment Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as "pending" | "completed")}>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className={styles.formGroup}>
            <label>Reference / Transaction ID</label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Transaction ID, Receipt No."
            />
          </div>
          <div className={styles.modalActions}>
            <button type="button" onClick={onClose} className={styles.cancelBtn}>Cancel</button>
            <button type="submit" disabled={loading} className={styles.submitBtn}>
              {loading ? "Updating..." : "Update Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function StudentListPage() {
  const router = useRouter();
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [paymentUpdateReg, setPaymentUpdateReg] = useState<any | null>(null);

  useEffect(() => {
    loadRegistrations();
  }, []);

  const loadRegistrations = async () => {
    try {
      setError(null);
      const res = await registrationService.getAll();
      setRegistrations(res.data);
    } catch (err: any) {
      console.error("Failed to load registrations:", err);
      setError(err.response?.data?.message || "Failed to load registrations");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, action: "approve" | "reject") => {
    if (!confirm(`Are you sure you want to ${action} this student?`)) {
      return;
    }

    setProcessingId(id);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await registrationService.updateStatus(id, action);
      setSuccessMessage(res.data.message);
      await loadRegistrations();
      
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error("Failed to update status:", err);
      setError(err.response?.data?.message || `Failed to ${action} student`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this registration? This action cannot be undone.")) {
      return;
    }

    setProcessingId(id);
    setError(null);
    setSuccessMessage(null);

    try {
      await registrationService.delete(id);
      setSuccessMessage("Registration deleted successfully");
      await loadRegistrations();
      
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error("Failed to delete registration:", err);
      setError(err.response?.data?.message || "Failed to delete registration");
    } finally {
      setProcessingId(null);
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/admin/add-student?edit=${id}`);
  };

  const handleView = (id: string) => {
    router.push(`/admin/student/view/${id}`);
  };

  const handleUpdateInfo = (id: string) => {
    router.push(`/admin/add-student?edit=${id}&mode=profile`);
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

      {error && (
        <div className={styles.errorBanner}>
          {error}
          <button onClick={() => setError(null)} className={styles.errorClose}>&times;</button>
        </div>
      )}

      {successMessage && (
        <div className={styles.successBanner}>
          {successMessage}
          <button onClick={() => setSuccessMessage(null)} className={styles.successClose}>&times;</button>
        </div>
      )}

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
        <p className={styles.loadingText}>Loading...</p>
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
                <div className={styles.info}>
                  <span>Payment:</span>
                  <strong className={reg.payment?.status === "completed" ? styles.textGreen : styles.textYellow}>
                    {reg.payment?.status === "completed" 
                      ? `✓ ₹${reg.payment?.amount || 0}` 
                      : "○ Pending"}
                  </strong>
                  {reg.status === "pending" && (
                    <button 
                      onClick={() => setPaymentUpdateReg(reg)}
                      className={styles.updatePaymentBtn}
                    >
                      Update
                    </button>
                  )}
                </div>
              </div>

              {reg.status === "pending" && (
                <div className={styles.cardActions}>
                  <button
                    className={styles.viewBtn}
                    onClick={() => handleView(reg._id)}
                    disabled={processingId === reg._id}
                  >
                    View
                  </button>
                  <button
                    className={styles.editBtn}
                    onClick={() => handleEdit(reg._id)}
                    disabled={processingId === reg._id}
                  >
                    Edit
                  </button>
                  <button
                    className={styles.approveBtn}
                    onClick={() => handleStatusUpdate(reg._id, "approve")}
                    disabled={processingId === reg._id}
                  >
                    {processingId === reg._id ? "Processing..." : "Approve"}
                  </button>
                  <button
                    className={styles.rejectBtn}
                    onClick={() => handleStatusUpdate(reg._id, "reject")}
                    disabled={processingId === reg._id}
                  >
                    {processingId === reg._id ? "Processing..." : "Reject"}
                  </button>
                </div>
              )}

              {reg.status === "rejected" && (
                <div className={styles.cardActions}>
                  <button
                    className={styles.viewBtn}
                    onClick={() => handleView(reg._id)}
                    disabled={processingId === reg._id}
                  >
                    View
                  </button>
                  <button
                    className={styles.editBtn}
                    onClick={() => handleEdit(reg._id)}
                    disabled={processingId === reg._id}
                  >
                    Edit
                  </button>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => handleDelete(reg._id)}
                    disabled={processingId === reg._id}
                  >
                    {processingId === reg._id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              )}

              {reg.status === "approved" && (
                <div className={styles.cardActions}>
                  <button
                    className={styles.viewBtn}
                    onClick={() => handleView(reg._id)}
                    disabled={processingId === reg._id}
                  >
                    View
                  </button>
                  <button
                    className={styles.editBtn}
                    onClick={() => handleUpdateInfo(reg._id)}
                    disabled={processingId === reg._id}
                  >
                    Update Info
                  </button>
                </div>
              )}

              {reg.status === "approved" && reg.credentials && (
                <div className={styles.credentials}>
                  <strong>Credentials:</strong>
                  <p><span>Email:</span> {reg.credentials.email}</p>
                  <p><span>Password:</span> {reg.credentials.password}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {paymentUpdateReg && (
        <PaymentUpdateModal
          registration={paymentUpdateReg}
          onClose={() => setPaymentUpdateReg(null)}
          onUpdate={() => {
            setPaymentUpdateReg(null);
            loadRegistrations();
          }}
        />
      )}
    </div>
  );
}
