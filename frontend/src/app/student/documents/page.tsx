"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { registrationService, documentService } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { LoadingPage } from "@/components/ui/Loading";
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock,
  Trash2,
  FileUp
} from "lucide-react";

interface DocumentChecklistItem {
  type: string;
  label: string;
  required: boolean;
  uploaded: boolean;
  verified: boolean;
  rejectionReason: string | null;
  expiresAt: string | null;
  documentId: string | null;
}

interface ChecklistData {
  required: DocumentChecklistItem[];
  missing: string[];
  allUploaded: boolean;
  allVerified: boolean;
  expiringDocuments: { type: string; expiresAt: string; daysUntilExpiry: number }[];
  expiredDocuments: { type: string; expiresAt: string }[];
}

const DOCUMENT_TYPES = [
  { type: "ID Proof", label: "ID Proof", description: "Aadhar, PAN, Voter ID, or Passport", required: true },
  { type: "Address Proof", label: "Address Proof", description: "Utility bill, lease agreement, or bank statement", required: true },
  { type: "Education Certificate", label: "Education Certificate", description: "10th, 12th, or degree certificate", required: true },
  { type: "Passport", label: "Passport", description: "Valid passport (optional)", required: false },
  { type: "Driving License", label: "Driving License", description: "Valid driving license (optional)", required: false },
  { type: "Health Certificate", label: "Health Certificate", description: "Medical fitness certificate (optional)", required: false },
];

export default function StudentDocumentsPage() {
  const { user } = useAuth();
  const { success, error } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [registration, setRegistration] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const regRes = await registrationService.getMyRegistration();
      setRegistration(regRes.data);
      
      if (regRes.data?._id) {
        const docsRes = await documentService.getByRegistration(regRes.data._id);
        setDocuments(docsRes.data || []);
      }
    } catch (err: any) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (type: string) => {
    setSelectedType(type);
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedType || !registration?._id) return;

    setUploading(selectedType);
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", selectedType);
    formData.append("registrationId", registration._id);

    try {
      const result = await documentService.upload(formData);
      
      if (result.success) {
        success("Document uploaded successfully");
        loadData();
      } else {
        error(result.message || "Upload failed");
      }
    } catch (err: any) {
      error(err.response?.data?.message || "Failed to upload document");
    } finally {
      setUploading(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    
    try {
      await documentService.delete(docId);
      success("Document deleted");
      loadData();
    } catch (err) {
      error("Failed to delete document");
    }
  };

  const getDocumentByType = (type: string) => {
    return documents.find((d) => d.type === type);
  };

  const renderStatus = (doc: any, type: string) => {
    if (!doc) {
      return (
        <Button size="sm" onClick={() => handleFileSelect(type)} disabled={uploading === type}>
          {uploading === type ? (
            <>
              <Clock className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </>
          )}
        </Button>
      );
    }

    return (
      <div className="flex items-center gap-2">
        {doc.verified === false ? (
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-destructive" />
            <span className="text-sm text-destructive font-medium">Rejected</span>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleFileSelect(type)}
              disabled={uploading === type}
            >
              Re-upload
            </Button>
          </div>
        ) : doc.verified ? (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-500" />
            <span className="text-sm text-emerald-600 font-medium">Verified</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            <span className="text-sm text-amber-600 font-medium">Pending</span>
          </div>
        )}
        
        <button
          onClick={() => handleDeleteDocument(doc._id)}
          className="p-1 text-muted-foreground hover:text-destructive"
          title="Delete document"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    );
  };

  if (loading) {
    return <LoadingPage />;
  }

  if (!registration) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-foreground">My Documents</h1>
          <p className="text-muted-foreground">Upload and manage your documents</p>
        </div>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="font-medium text-foreground mb-1">No Registration Found</p>
            <p className="text-sm text-muted-foreground">
              Please complete your registration first before uploading documents.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const requiredDocs = DOCUMENT_TYPES.filter(d => d.required);
  const uploadedRequired = requiredDocs.filter(d => getDocumentByType(d.type));
  const allRequiredVerified = requiredDocs.every(d => {
    const doc = getDocumentByType(d.type);
    return doc && doc.verified;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-foreground">My Documents</h1>
        <p className="text-muted-foreground">Upload and manage your documents for verification</p>
      </div>

      {registration.status === "approved" && (
        <Card className="border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20">
          <CardContent className="flex items-center gap-3 py-4">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
            <span className="text-emerald-700 dark:text-emerald-400 font-medium">
              Your registration is approved. All uploaded documents have been verified.
            </span>
          </CardContent>
        </Card>
      )}

      {registration.status === "pending" && !allRequiredVerified && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <span className="text-amber-700 dark:text-amber-400">
              Please upload all required documents. Your registration is pending verification.
            </span>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <p className="text-3xl font-bold text-primary">{uploadedRequired.length}/{requiredDocs.length}</p>
            <p className="text-sm text-muted-foreground">Required Uploaded</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <p className="text-3xl font-bold text-emerald-500">
              {requiredDocs.filter(d => getDocumentByType(d.type)?.verified).length}
            </p>
            <p className="text-sm text-muted-foreground">Verified</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <p className="text-3xl font-bold text-amber-500">
              {requiredDocs.filter(d => getDocumentByType(d.type) && !getDocumentByType(d.type)?.verified).length}
            </p>
            <p className="text-sm text-muted-foreground">Pending Review</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Checklist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {DOCUMENT_TYPES.map((docType) => {
              const doc = getDocumentByType(docType.type);
              const isRejected = doc && doc.verified === false;
              
              return (
                <div 
                  key={docType.type} 
                  className={`flex items-center justify-between rounded-lg border p-4 ${
                    isRejected 
                      ? "border-destructive/50 bg-destructive/5" 
                      : doc?.verified 
                        ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-900/10"
                        : "border-border bg-muted/30"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {doc?.verified ? (
                      <CheckCircle className="mt-0.5 h-5 w-5 text-emerald-500" />
                    ) : isRejected ? (
                      <XCircle className="mt-0.5 h-5 w-5 text-destructive" />
                    ) : (
                      <FileUp className="mt-0.5 h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{docType.label}</p>
                        {docType.required && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                            Required
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{docType.description}</p>
                      
                      {doc && (
                        <div className="mt-2">
                          <p className="text-xs text-muted-foreground">
                            File: {doc.fileName}
                          </p>
                          {isRejected && doc.rejectionReason && (
                            <p className="text-xs text-destructive mt-1">
                              Reason: {doc.rejectionReason}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {renderStatus(doc, docType.type)}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={handleFileUpload}
      />
    </div>
  );
}
