"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { registrationService, courseService, documentService } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button, LinkButton } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingPage } from "@/components/ui/Loading";
import { useToast } from "@/components/ui/Toast";
import { ArrowLeft, User, MapPin, Phone, GraduationCap, Heart, FileText, CreditCard, BookOpen, Clock } from "lucide-react";

export default function ViewRegistrationPage() {
  const params = useParams();
  const router = useRouter();
  const { error: showError } = useToast();
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
      showError("Failed to load registration data");
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
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!registration) {
    return (
      <Card className="py-12">
        <CardContent className="flex flex-col items-center justify-center text-center">
          <p className="text-lg font-medium text-muted-foreground">Registration not found</p>
          <LinkButton href="/admin/student" variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Registrations
          </LinkButton>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <LinkButton href="/admin/student" variant="ghost" size="sm" className="mb-2 -ml-2">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Registrations
          </LinkButton>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">
              Registration Details
            </h1>
            <StatusBadge status={registration.status} />
          </div>
          <p className="text-muted-foreground">
            {registration.basicDetails?.firstName} {registration.basicDetails?.lastName}
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center gap-3 border-b border-border pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-base">Basic Details</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                <p className="font-semibold mt-0.5">{registration.basicDetails?.firstName} {registration.basicDetails?.lastName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
                <p className="mt-0.5">{registration.basicDetails?.dob || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Gender</p>
                <p className="capitalize mt-0.5">{registration.basicDetails?.gender || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="mt-0.5">{registration.basicDetails?.email || "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center gap-3 border-b border-border pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-base">Address</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="sm:col-span-2 lg:col-span-4">
                <p className="text-sm font-medium text-muted-foreground">Street Address</p>
                <p className="mt-0.5">{registration.address?.street || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">City</p>
                <p className="mt-0.5">{registration.address?.city || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">State</p>
                <p className="mt-0.5">{registration.address?.state || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pincode</p>
                <p className="mt-0.5">{registration.address?.pincode || "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center gap-3 border-b border-border pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Phone className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-base">Contact</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Phone Number</p>
                <p className="mt-0.5">{registration.contact?.phone || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Emergency Contact</p>
                <p className="mt-0.5">{registration.contact?.emergencyContact || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Emergency Contact Name</p>
                <p className="mt-0.5">{registration.contact?.emergencyName || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Relationship</p>
                <p className="capitalize mt-0.5">{registration.contact?.relationship || "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center gap-3 border-b border-border pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-base">Education</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Highest Qualification</p>
                <p className="capitalize mt-0.5">{registration.education?.qualification || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Institution/Board</p>
                <p className="mt-0.5">{registration.education?.institution || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Year of Passing</p>
                <p className="mt-0.5">{registration.education?.year || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Percentage/CGPA</p>
                <p className="mt-0.5">{registration.education?.percentage || "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center gap-3 border-b border-border pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Heart className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-base">Health</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Medical Conditions</p>
                <p className="mt-0.5">{registration.health?.conditions || "None"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Medications</p>
                <p className="mt-0.5">{registration.health?.medications || "None"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Allergies</p>
                <p className="mt-0.5">{registration.health?.allergies || "None"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center gap-3 border-b border-border pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-base">Documents</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {documents.length > 0 ? (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div key={doc._id} className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium">{getDocTypeLabel(doc.type)}</p>
                      <p className="text-sm text-muted-foreground">{doc.fileName}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No documents uploaded</p>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center gap-3 border-b border-border pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-base">Payment</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Amount</p>
                <p className="text-xl font-bold text-primary mt-0.5">₹{registration.payment?.amount || 0}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <p className={`mt-0.5 font-semibold ${registration.payment?.status === "completed" ? "text-emerald-600" : "text-amber-600"}`}>
                  {registration.payment?.status === "completed" ? "✓ Completed" : "○ Pending"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Reference/Transaction ID</p>
                <p className="mt-0.5">{registration.payment?.reference || "N/A"}</p>
              </div>
              {registration.payment?.notes && (
                <div className="lg:col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">Notes</p>
                  <p className="mt-0.5">{registration.payment.notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center gap-3 border-b border-border pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-base">Courses</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {registration.courseIds && registration.courseIds.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {registration.courseIds.map((courseId: string) => (
                  <div key={courseId} className="rounded-lg bg-primary/10 px-4 py-2">
                    <span className="font-medium text-primary">{getCourseName(courseId)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No courses selected</p>
            )}
          </CardContent>
        </Card>

        {(registration.status === "approved" || registration.status === "rejected") && registration.createdAt && (
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center gap-3 border-b border-border pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-base">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created At</p>
                  <p className="mt-0.5">{new Date(registration.createdAt).toLocaleString()}</p>
                </div>
                {registration.approvedAt && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Approved At</p>
                    <p className="mt-0.5">{new Date(registration.approvedAt).toLocaleString()}</p>
                  </div>
                )}
                {registration.rejectedAt && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Rejected At</p>
                    <p className="mt-0.5">{new Date(registration.rejectedAt).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
