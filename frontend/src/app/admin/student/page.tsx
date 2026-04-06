"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { registrationService } from "@/lib/api";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button, LinkButton } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { LoadingPage, LoadingCard } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { useAPI } from "@/hooks";
import { X, Check, XCircle, Eye, Pencil, Trash2, UserPlus, CreditCard, Users, Clock, Search, MoreHorizontal, ChevronUp, ChevronDown, Filter, XCircleIcon } from "lucide-react";

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
  const searchParams = useSearchParams();
  const { success, error: showError } = useToast();
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "draft" | "pending" | "approved" | "rejected">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [paymentUpdateReg, setPaymentUpdateReg] = useState<any | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  
  // Sorting state
  const [sortBy, setSortBy] = useState<"createdAt" | "name" | "status">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    variant: "default" | "destructive";
    action: "delete" | "reject";
    id: string;
  }>({ open: false, title: "", description: "", variant: "default", action: "delete", id: "" });

  useEffect(() => {
    loadRegistrations();
  }, []);

  useEffect(() => {
    const status = searchParams.get("status");
    if (status && ["draft", "pending", "approved", "rejected"].includes(status)) {
      setFilter(status as "draft" | "pending" | "approved" | "rejected");
    } else {
      setFilter("all");
    }
  }, [searchParams]);

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

  const handleDelete = (id: string) => {
    const reg = registrations.find(r => r._id === id);
    setConfirmDialog({
      open: true,
      title: "Delete Registration",
      description: `Are you sure you want to delete the registration for ${reg?.basicDetails?.firstName} ${reg?.basicDetails?.lastName}? This action cannot be undone.`,
      variant: "destructive",
      action: "delete",
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
      if (action === "delete") {
        await registrationService.delete(id);
        success("Registration deleted successfully");
      } else if (action === "reject") {
        await registrationService.updateStatus(id, "reject");
        success("Registration rejected successfully");
      }
      await loadRegistrations();
    } catch (err: any) {
      console.error(`Failed to ${action}:`, err);
      showError(err.response?.data?.message || `Failed to ${action}`);
    } finally {
      setProcessingId(null);
      setConfirmDialog(prev => ({ ...prev, open: false }));
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

  // Sorting handlers
  const handleSort = (column: "createdAt" | "name" | "status") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  // Bulk selection handlers
  const handleSelectAll = () => {
    if (selectedIds.size === paginatedRegistrations.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedRegistrations.map(r => r._id)));
    }
  };

  const handleSelectRow = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const clearSelection = () => setSelectedIds(new Set());

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    if (openMenuId) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [openMenuId]);

  const filteredRegistrations = registrations.filter((reg) => {
    if (filter !== "all" && reg.status !== filter) return false;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const fullName = `${reg.basicDetails?.firstName || ""} ${reg.basicDetails?.lastName || ""}`.toLowerCase();
      const email = reg.basicDetails?.email?.toLowerCase() || "";
      const phone = reg.contact?.phone || "";
      
      if (!fullName.includes(query) && !email.includes(query) && !phone.includes(query)) {
        return false;
      }
    }
    
    return true;
  }).sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case "name":
        const nameA = `${a.basicDetails?.firstName || ""} ${a.basicDetails?.lastName || ""}`.toLowerCase();
        const nameB = `${b.basicDetails?.firstName || ""} ${b.basicDetails?.lastName || ""}`.toLowerCase();
        comparison = nameA.localeCompare(nameB);
        break;
      case "status":
        comparison = a.status.localeCompare(b.status);
        break;
      case "createdAt":
      default:
        comparison = new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    }
    return sortOrder === "asc" ? comparison : -comparison;
  });

  // Pagination logic
  const paginatedRegistrations = filteredRegistrations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={filter === "draft" ? "Draft Students" : "Student Registrations"}
        description={filter === "draft" ? "Continue or manage draft student registrations" : "Review and manage student registrations"}
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: filter === "draft" ? "Draft" : "Students" },
        ]}
        actions={
          <div className="flex gap-3 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name, email, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-64"
              />
            </div>
            <LinkButton href="/admin/add-student">
              <UserPlus className="mr-2 h-4 w-4" />
              Add New Student
            </LinkButton>
          </div>
        }
      />

      {/* Filter Pills */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 p-1 bg-muted rounded-xl">
          {(["all", "draft", "pending", "approved", "rejected"] as const).map((f) => {
            const count = f === "all" ? registrations.length : registrations.filter((r) => r.status === f).length;
            const isActive = filter === f;
            return (
              <button
                key={f}
                onClick={() => { setFilter(f); setCurrentPage(1); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="capitalize">{f}</span>
                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${isActive ? "bg-primary/10 text-primary" : "bg-muted-foreground/10"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        {(filter !== "all" || searchQuery) && (
          <button
            onClick={() => { setFilter("all"); setSearchQuery(""); }}
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <XCircleIcon className="h-4 w-4" />
            Clear filters
          </button>
        )}
      </div>

      {/* Selection Banner */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between px-4 py-2 bg-primary/10 border border-primary/20 rounded-lg">
          <span className="text-sm font-medium text-primary">
            {selectedIds.size} selected
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={clearSelection}>
              Clear
            </Button>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => {
                const firstId = Array.from(selectedIds)[0];
                handleDelete(firstId);
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <LoadingPage text="Loading registrations..." />
      ) : filteredRegistrations.length === 0 ? (
        <EmptyState
          icon={Users}
          title={filter === "draft" ? "No draft students" : "No registrations found"}
          description={filter === "draft" ? "No draft students found" : (filter === "all" && !searchQuery ? "No student registrations yet" : `No ${filter !== "all" ? filter : ""} registrations${searchQuery ? ` matching "${searchQuery}"` : ""}`)}
          action={filter === "all" && !searchQuery ? {
            label: "Add New Student",
            onClick: () => router.push("/admin/add-student"),
          } : {
            label: "Clear filters",
            onClick: () => { setFilter("all"); setSearchQuery(""); router.push("/admin/student"); },
          }}
        />
      ) : (
        <>
          {/* Table Header */}
          <div className="border border-border rounded-xl overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-muted/50 border-b border-border text-sm font-medium text-muted-foreground">
              <div className="col-span-1 flex items-center">
                <input
                  type="checkbox"
                  checked={selectedIds.size === paginatedRegistrations.length && paginatedRegistrations.length > 0}
                  onChange={handleSelectAll}
                  className="h-4 w-4 rounded border-border"
                />
              </div>
              <div className="col-span-3 flex items-center gap-1 cursor-pointer hover:text-foreground" onClick={() => handleSort("name")}>
                Student
                {sortBy === "name" && (sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
              </div>
              <div className="col-span-3">Email</div>
              <div className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-foreground" onClick={() => handleSort("status")}>
                Status
                {sortBy === "status" && (sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
              </div>
              <div className="col-span-2">Payment</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-border">
              {paginatedRegistrations.map((reg, index) => (
                <div
                  key={reg._id}
                  className={`grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-muted/30 transition-colors ${index % 2 === 0 ? "bg-background" : "bg-muted/10"}`}
                >
                  {/* Checkbox */}
                  <div className="col-span-1">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(reg._id)}
                      onChange={() => handleSelectRow(reg._id)}
                      className="h-4 w-4 rounded border-border"
                    />
                  </div>

                  {/* Name */}
                  <div className="col-span-3 flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <span className="text-sm font-semibold text-primary">
                        {reg.basicDetails?.firstName?.[0] || "?"}
                        {reg.basicDetails?.lastName?.[0] || ""}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {reg.basicDetails?.firstName} {reg.basicDetails?.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">{reg.basicDetails?.dob || "—"}</p>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="col-span-3">
                    <p className="text-sm text-foreground truncate">{reg.basicDetails?.email || "—"}</p>
                    <p className="text-xs text-muted-foreground">{reg.contact?.phone || "—"}</p>
                  </div>

                  {/* Status */}
                  <div className="col-span-2">
                    <StatusBadge status={reg.status} reApproved={reg.previouslyRejected} />
                  </div>

                  {/* Payment */}
                  <div className="col-span-2">
                    <span className={`text-sm font-medium ${reg.payment?.status === "completed" ? "text-emerald-600" : "text-amber-600"}`}>
                      {reg.payment?.status === "completed" 
                        ? `₹${reg.payment?.amount || 0}`
                        : "Pending"}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 flex items-center justify-end gap-1 relative">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleView(reg._id)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === reg._id ? null : reg._id);
                      }}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                    
                    {/* Dropdown Menu */}
                    {openMenuId === reg._id && (
                      <div className="absolute right-0 top-full mt-1 z-10 w-48 bg-card border border-border rounded-lg shadow-lg py-1">
                        {reg.status === "draft" && (
                          <button
                            onClick={() => { handleEdit(reg._id); setOpenMenuId(null); }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                          >
                            <Pencil className="h-4 w-4" /> Continue
                          </button>
                        )}
                        {(reg.status === "pending" || reg.status === "rejected") && (
                          <button
                            onClick={() => { handleEdit(reg._id); setOpenMenuId(null); }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                          >
                            <Pencil className="h-4 w-4" /> Edit
                          </button>
                        )}
                        {reg.status === "approved" && (
                          <button
                            onClick={() => { handleUpdateInfo(reg._id); setOpenMenuId(null); }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                          >
                            <Pencil className="h-4 w-4" /> Update Info
                          </button>
                        )}
                        {reg.status === "pending" && (
                          <button
                            onClick={() => { setPaymentUpdateReg(reg); setOpenMenuId(null); }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                          >
                            <CreditCard className="h-4 w-4" /> Update Payment
                          </button>
                        )}
                        <button
                          onClick={() => { handleDelete(reg._id); setOpenMenuId(null); }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 text-red-500"
                        >
                          <Trash2 className="h-4 w-4" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Credentials Row - Only show for approved students */}
                  {reg.status === "approved" && (reg.credentials || reg.userId) && (
                    <div className="col-span-12 bg-emerald-50 dark:bg-emerald-900/20 border-t border-emerald-200 dark:border-emerald-800 px-4 py-2 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Credentials:</span>
                        <span className="text-sm">
                          <span className="text-muted-foreground">Email:</span>{" "}
                          <span className="font-mono font-medium text-foreground">{reg.basicDetails?.email || "—"}</span>
                          {(reg.credentials?.password || reg.createdAt) && (
                            <>
                              <span className="mx-3 text-muted-foreground">|</span>
                              <span className="text-muted-foreground">Password:</span>{" "}
                              <span className="font-mono font-medium text-foreground">{reg.credentials?.password || "Auto-generated"}</span>
                            </>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {reg.createdAt && (
                          <span>Created: {new Date(reg.createdAt).toLocaleDateString()}</span>
                        )}
                        {reg.updatedAt && reg.updatedAt !== reg.createdAt && (
                          <span> | Updated: {new Date(reg.updatedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Timestamp Row - For non-approved students */}
                  {reg.status !== "approved" && (reg.createdAt || reg.updatedAt) && (
                    <div className="col-span-12 bg-muted/30 border-t border-border px-4 py-2 flex items-center justify-end gap-4 text-xs text-muted-foreground">
                      {reg.createdAt && (
                        <span>Created: {new Date(reg.createdAt).toLocaleDateString()}</span>
                      )}
                      {reg.updatedAt && reg.updatedAt !== reg.createdAt && (
                        <span>Updated: {new Date(reg.updatedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {filteredRegistrations.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredRegistrations.length / itemsPerPage)}
              totalItems={filteredRegistrations.length}
              itemsPerPage={itemsPerPage}
              onPageChange={(page) => { setCurrentPage(page); clearSelection(); }}
              onItemsPerPageChange={(count) => { setItemsPerPage(count); setCurrentPage(1); clearSelection(); }}
            />
          )}
        </>
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

      <ConfirmationDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmLabel={confirmDialog.action === "delete" ? "Delete" : "Reject"}
        cancelLabel="Cancel"
        variant={confirmDialog.variant}
        onConfirm={handleConfirmAction}
        loading={!!processingId}
      />
    </div>
  );
}
