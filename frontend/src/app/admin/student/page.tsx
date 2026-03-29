"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registrationService } from "@/lib/api";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button, LinkButton } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { LoadingPage } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { useAPI } from "@/hooks";
import { X, Check, XCircle, Eye, Pencil, Trash2, UserPlus, CreditCard, Users, Clock } from "lucide-react";

interface PaymentUpdateModalProps {
  registration: any;
  onClose: () => void;
  onUpdate: () => void;
}

function PaymentUpdateModal({ registration, onClose, onUpdate }: PaymentUpdateModalProps) {
  const { success, error: showError } = useToast();
  const [amount, setAmount] = useState(registration.payment?.amount?.toString() || "");
  const [status, setStatus] = useState<"pending" | "completed">(registration.payment?.status || "pending");
  const [reference, setReference] = useState(registration.payment?.reference || "");

  const updatePaymentAPI = useAPI(() =>
    registrationService.updatePayment(registration._id, {
      amount: parseFloat(amount) || 0,
      status,
      reference,
    })
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updatePaymentAPI.execute();
      success("Payment updated successfully");
      onUpdate();
      onClose();
    } catch (err: any) {
      showError(err.response?.data?.message || "Failed to update payment");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Update Payment</h3>
              <p className="text-sm text-muted-foreground">{registration.basicDetails?.firstName} {registration.basicDetails?.lastName}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-accent transition-colors">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <Input
            type="number"
            label="Amount (INR)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            required
          />
          <Select
            label="Payment Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as "pending" | "completed")}
            options={[
              { value: "pending", label: "Pending" },
              { value: "completed", label: "Completed" },
            ]}
          />
          <Input
            label="Reference / Transaction ID"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Transaction ID, Receipt No."
          />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" loading={updatePaymentAPI.loading} className="flex-1">
              Update Payment
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function StudentListPage() {
  const router = useRouter();
  const { success, error: showError, info } = useToast();
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "draft" | "pending" | "approved" | "rejected">("all");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [paymentUpdateReg, setPaymentUpdateReg] = useState<any | null>(null);

  useEffect(() => {
    loadRegistrations();
  }, []);

  const loadRegistrations = async () => {
    try {
      const res = await registrationService.getAll();
      setRegistrations(res.data);
    } catch (err: any) {
      console.error("Failed to load registrations:", err);
      showError(err.response?.data?.message || "Failed to load registrations");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, action: "approve" | "reject") => {
    setProcessingId(id);

    try {
      const res = await registrationService.updateStatus(id, action);
      success(res.data.message || `Registration ${action}ed successfully`);
      await loadRegistrations();
    } catch (err: any) {
      console.error("Failed to update status:", err);
      showError(err.response?.data?.message || `Failed to ${action} student`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setProcessingId(id);

    try {
      await registrationService.delete(id);
      success("Registration deleted successfully");
      await loadRegistrations();
    } catch (err: any) {
      console.error("Failed to delete registration:", err);
      showError(err.response?.data?.message || "Failed to delete registration");
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Student Registrations</h1>
          <p className="text-muted-foreground">Review and manage student registrations</p>
        </div>
        <LinkButton href="/admin/add-student">
          <UserPlus className="mr-2 h-4 w-4" />
          Add New Student
        </LinkButton>
      </div>

      <div className="flex flex-wrap gap-2 p-1 bg-muted rounded-xl w-fit">
        {(["all", "draft", "pending", "approved", "rejected"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              filter === f
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="capitalize">{f}</span>
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-muted-foreground/10">
              {f === "all" 
                ? registrations.length 
                : registrations.filter((r) => r.status === f).length}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingPage text="Loading registrations..." />
      ) : filteredRegistrations.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No registrations found"
          description={filter === "all" ? "No student registrations yet" : `No ${filter} registrations`}
          action={filter === "all" ? {
            label: "Add New Student",
            onClick: () => router.push("/admin/add-student"),
          } : undefined}
        />
      ) : (
        <div className="space-y-4">
          {filteredRegistrations.map((reg) => (
            <Card key={reg._id} className="overflow-hidden hover:shadow-md transition-shadow duration-200">
              <div className="flex flex-col gap-4 p-5 md:flex-row md:items-start md:justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <span className="text-lg font-semibold text-primary">
                        {reg.basicDetails?.firstName?.[0] || "?"}
                        {reg.basicDetails?.lastName?.[0] || ""}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground">
                          {reg.basicDetails?.firstName} {reg.basicDetails?.lastName}
                        </h3>
                        <span title={reg.previouslyRejected && reg.status === "approved" && reg.approvedAt ? `Previously rejected, re-approved on ${new Date(reg.approvedAt).toLocaleDateString()}` : undefined}>
                          <StatusBadge status={reg.status} reApproved={reg.previouslyRejected} />
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {reg.basicDetails?.email || "Email not provided"}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <span className="text-muted-foreground">DOB:</span>{" "}
                      <span className="text-foreground font-medium">{reg.basicDetails?.dob || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Phone:</span>{" "}
                      <span className="text-foreground font-medium">{reg.contact?.phone || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Courses:</span>{" "}
                      <span className="text-foreground font-medium">{reg.courseIds?.length || 0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Payment:</span>
                      <span className={reg.payment?.status === "completed" ? "text-emerald-600 font-semibold" : "text-amber-600 font-semibold"}>
                        {reg.payment?.status === "completed" 
                          ? `✓ ₹${reg.payment?.amount || 0}` 
                          : "○ Pending"}
                      </span>
                      {reg.status === "pending" && (
                        <button
                          onClick={() => setPaymentUpdateReg(reg)}
                          className="rounded-md bg-secondary px-2 py-1 text-xs font-medium hover:bg-accent transition-colors"
                        >
                          Update
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleView(reg._id)}>
                    <Eye className="mr-1.5 h-4 w-4" />
                    View
                  </Button>

                  {reg.status === "draft" && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(reg._id)}>
                        <Pencil className="mr-1.5 h-4 w-4" />
                        Continue
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDelete(reg._id)}
                        disabled={processingId === reg._id}
                      >
                        <Trash2 className="mr-1.5 h-4 w-4" />
                        {processingId === reg._id ? "Deleting..." : "Delete"}
                      </Button>
                    </>
                  )}

                  {reg.status === "pending" && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(reg._id)}>
                        <Pencil className="mr-1.5 h-4 w-4" />
                        Edit
                      </Button>
                      <Link href="/admin/payment">
                        <Button 
                          size="sm" 
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <CreditCard className="mr-1.5 h-4 w-4" />
                          Go to Payment
                        </Button>
                      </Link>
                    </>
                  )}

                  {(reg.status === "pending" || reg.status === "rejected") && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(reg._id)}>
                        <Pencil className="mr-1.5 h-4 w-4" />
                        Edit
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDelete(reg._id)}
                        disabled={processingId === reg._id}
                      >
                        <Trash2 className="mr-1.5 h-4 w-4" />
                        {processingId === reg._id ? "Deleting..." : "Delete"}
                      </Button>
                    </>
                  )}

                  {reg.status === "approved" && (
                    <Button variant="outline" size="sm" onClick={() => handleUpdateInfo(reg._id)}>
                      <Pencil className="mr-1.5 h-4 w-4" />
                      Update Info
                    </Button>
                  )}
                </div>
              </div>

              {/* Timestamps Display */}
              <div className="border-t border-border px-5 py-2 bg-muted/20">
                {reg.status === "draft" && reg.expiresAt && (
                  (() => {
                    const daysLeft = Math.ceil((new Date(reg.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    const isWarning = daysLeft <= 2 && daysLeft > 0;
                    return (
                      <div className={`text-sm flex items-center gap-2 ${isWarning ? "text-amber-600 font-medium" : "text-muted-foreground"}`}>
                        <Clock className="h-4 w-4" />
                        {isWarning ? `⚠️ Expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}` : `Expires in ${daysLeft} days`}
                        {daysLeft <= 0 && <span className="text-red-600">(Expired)</span>}
                      </div>
                    );
                  })()
                )}
                {(reg.status === "pending" || reg.status === "approved") && reg.createdAt && (
                  <div className="text-sm text-muted-foreground">
                    Registration Started: {new Date(reg.createdAt).toLocaleDateString()}
                    {reg.status === "approved" && reg.approvedAt && (
                      <span className="ml-4">Approved: {new Date(reg.approvedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                )}
                {reg.status === "rejected" && reg.createdAt && (
                  <div className="text-sm text-muted-foreground">
                    Registration Started: {new Date(reg.createdAt).toLocaleDateString()}
                  </div>
                )}
              </div>

              {reg.status === "approved" && reg.credentials && (
                <div className="border-t border-border bg-muted/30 px-5 py-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Credentials:</p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Email:</span> <span className="font-medium">{reg.credentials.email}</span>
                    <span className="mx-3 text-muted-foreground">|</span>
                    <span className="text-muted-foreground">Password:</span> <span className="font-medium">{reg.credentials.password}</span>
                  </p>
                </div>
              )}
            </Card>
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
