"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registrationService } from "@/lib/api";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button, LinkButton } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LoadingPage } from "@/components/ui/Loading";
import { useToast } from "@/components/ui/Toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { useAPI } from "@/hooks";
import { X, Check, XCircle, Eye, CreditCard, Search } from "lucide-react";

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
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Payment Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "pending" | "completed")}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div>
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

export default function PaymentPage() {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingPayment, setEditingPayment] = useState<any>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    variant: "default" | "destructive";
    action: "approve" | "reject";
    id: string;
  }>({ open: false, title: "", description: "", variant: "default", action: "reject", id: "" });

  const loadRegistrations = async () => {
    try {
      setLoading(true);
      const res = await registrationService.getAll();
      const pending = res.data.filter((r: any) => r.status === "pending");
      setRegistrations(pending);
    } catch (error) {
      console.error("Failed to load registrations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRegistrations();
  }, []);

  const handleApprove = (id: string) => {
    const reg = registrations.find(r => r._id === id);
    setConfirmDialog({
      open: true,
      title: "Approve Registration",
      description: `Are you sure you want to approve the registration for ${reg?.basicDetails?.firstName} ${reg?.basicDetails?.lastName}?`,
      variant: "default",
      action: "approve",
      id,
    });
  };

  const handleReject = (id: string) => {
    const reg = registrations.find(r => r._id === id);
    setConfirmDialog({
      open: true,
      title: "Reject Registration",
      description: `Are you sure you want to reject the registration for ${reg?.basicDetails?.firstName} ${reg?.basicDetails?.lastName}?`,
      variant: "destructive",
      action: "reject",
      id,
    });
  };

  const handleConfirmAction = async () => {
    const { action, id } = confirmDialog;
    setProcessingId(id);

    try {
      await registrationService.updateStatus(id, action);
      success(`Registration ${action}ed successfully`);
      loadRegistrations();
    } catch (error: any) {
      showError(error.response?.data?.message || `Failed to ${action} registration`);
    } finally {
      setProcessingId(null);
      setConfirmDialog(prev => ({ ...prev, open: false }));
    }
  };

  const handleStatusUpdate = async (id: string, action: "approve" | "reject") => {
    try {
      await registrationService.updateStatus(id, action);
      success(action === "approve" ? "Registration approved successfully!" : "Registration rejected");
      loadRegistrations();
    } catch (error: any) {
      showError(error.response?.data?.message || `Failed to ${action} registration`);
    }
  };

  const filteredRegistrations = registrations.filter((reg) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      reg.basicDetails?.firstName?.toLowerCase().includes(query) ||
      reg.basicDetails?.lastName?.toLowerCase().includes(query) ||
      reg.basicDetails?.email?.toLowerCase().includes(query) ||
      reg.contact?.phone?.includes(query)
    );
  });

  if (loading) {
    return <LoadingPage />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment & Approval"
        description="Manage pending registrations, update payment details, and approve students"
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Payment" },
        ]}
      />

      <div className="relative w-full sm:w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search by name, email, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredRegistrations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
              <CreditCard className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No pending registrations</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              All registrations have been processed. New registrations will appear here after submission.
            </p>
            <LinkButton href="/admin/student">
              Go to Students
            </LinkButton>
          </CardContent>
        </Card>
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
                        <StatusBadge status={reg.status} />
                      </div>
                      <p className="text-sm text-muted-foreground">{reg.basicDetails?.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Phone</p>
                      <p className="font-medium text-foreground">{reg.contact?.phone || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Emergency Contact</p>
                      <p className="font-medium text-foreground">{reg.contact?.emergencyContact || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Selected Courses</p>
                      <p className="font-medium text-foreground">{reg.courseIds?.length || 0} course{(reg.courseIds?.length || 0) !== 1 ? "s" : ""}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Registration Date</p>
                      <p className="font-medium text-foreground">
                        {reg.createdAt ? new Date(reg.createdAt).toLocaleDateString() : "—"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 pt-2">
                    <div className="rounded-lg bg-muted px-3 py-2">
                      <p className="text-xs text-muted-foreground mb-1">Payment Amount</p>
                      <p className="font-semibold text-foreground">
                        {reg.payment?.amount ? `₹${reg.payment.amount}` : "Not set"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted px-3 py-2">
                      <p className="text-xs text-muted-foreground mb-1">Payment Status</p>
                      <StatusBadge status={reg.payment?.status || "pending"} />
                    </div>
                    {reg.payment?.reference && (
                      <div className="rounded-lg bg-muted px-3 py-2">
                        <p className="text-xs text-muted-foreground mb-1">Reference</p>
                        <p className="font-medium text-foreground text-sm">{reg.payment.reference}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 md:flex-col">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingPayment(reg)}
                    className="w-full md:w-auto"
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Update Payment
                  </Button>
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 w-full md:w-auto"
                    onClick={() => handleApprove(reg._id)}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleReject(reg._id)}
                    className="w-full md:w-auto"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                  <Link href={`/admin/student/view/${reg._id}`}>
                    <Button variant="outline" size="sm" className="w-full md:w-auto">
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {editingPayment && (
        <PaymentUpdateModal
          registration={editingPayment}
          onClose={() => setEditingPayment(null)}
          onUpdate={loadRegistrations}
        />
      )}

      <ConfirmationDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmLabel={confirmDialog.action === "approve" ? "Approve" : "Reject"}
        cancelLabel="Cancel"
        variant={confirmDialog.variant}
        onConfirm={handleConfirmAction}
        loading={!!processingId}
      />
    </div>
  );
}
