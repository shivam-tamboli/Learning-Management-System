"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { registrationService, courseService, documentService } from "@/lib/api";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Button, LinkButton } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { Check, FileText, MapPin, Phone, GraduationCap, Heart, Upload, CreditCard, BookOpen, User, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import styles from "./register.module.css";

const SESSION_KEY_DRAFT_ID = "registrationDraftId";
const SESSION_KEY_DRAFT_STEP = "registrationDraftStep";
const SESSION_KEY_DRAFT_TIMESTAMP = "registrationDraftTimestamp";
const AUTO_SAVE_INTERVAL = 30000;

interface BasicDetails {
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  email: string;
}

interface Address {
  street: string;
  city: string;
  state: string;
  pincode: string;
}

interface Contact {
  phone: string;
  emergencyContact: string;
  emergencyName: string;
  relationship: string;
}

interface Education {
  qualification: string;
  institution: string;
  year: string;
  percentage: string;
}

interface Health {
  conditions: string;
  medications: string;
  allergies: string;
}

interface Payment {
  amount: string;
  status: "pending" | "completed";
  reference: string;
  notes: string;
}

export default function AddStudentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { success, error: showError, info } = useToast();
  const editId = searchParams.get("edit");
  const mode = searchParams.get("mode");
  const isEditing = !!editId;
  const isProfileMode = mode === "profile";

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [documents, setDocuments] = useState<{ [key: string]: File | null }>({
    idProof: null,
    addressProof: null,
    educationCertificate: null,
  });
  const [uploadedDocIds, setUploadedDocIds] = useState<string[]>([]);
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const [registrationStatus, setRegistrationStatus] = useState<string>("");
  
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [draftData, setDraftData] = useState<any>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [basicDetails, setBasicDetails] = useState<BasicDetails>({
    firstName: "",
    lastName: "",
    dob: "",
    gender: "",
    email: "",
  });

  const [address, setAddress] = useState<Address>({
    street: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [contact, setContact] = useState<Contact>({
    phone: "",
    emergencyContact: "",
    emergencyName: "",
    relationship: "",
  });

  const [education, setEducation] = useState<Education>({
    qualification: "",
    institution: "",
    year: "",
    percentage: "",
  });

  const [health, setHealth] = useState<Health>({
    conditions: "",
    medications: "",
    allergies: "",
  });

  const [payment, setPayment] = useState<Payment>({
    amount: "",
    status: "pending",
    reference: "",
    notes: "",
  });

  useEffect(() => {
    loadCourses();
    if (isEditing) {
      loadRegistration(editId);
    } else if (!isProfileMode) {
      checkForExistingDraft();
    }
  }, []);

  const checkForExistingDraft = async () => {
    const savedDraftId = sessionStorage.getItem(SESSION_KEY_DRAFT_ID);
    const savedStep = sessionStorage.getItem(SESSION_KEY_DRAFT_STEP);
    const savedTimestamp = sessionStorage.getItem(SESSION_KEY_DRAFT_TIMESTAMP);

    if (savedDraftId && savedStep) {
      try {
        const res = await registrationService.getById(savedDraftId);
        const reg = res.data;
        
        if (reg.status === "draft") {
          setDraftData(reg);
          setLastSaved(savedTimestamp ? new Date(savedTimestamp) : null);
          setShowResumeModal(true);
          setLoading(false);
        } else {
          clearDraftSession();
          setLoading(false);
        }
      } catch {
        clearDraftSession();
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  };

  const resumeDraft = async () => {
    if (!draftData) return;
    
    const draftId = draftData._id || draftData.id;
    
    try {
      const res = await registrationService.getById(draftId);
      const reg = res.data;
      
      if (reg.status !== "draft") {
        clearDraftSession();
        setShowResumeModal(false);
        setDraftData(null);
        showError("This registration has already been submitted");
        return;
      }
      
      setShowResumeModal(false);
      setRegistrationId(draftId);
      setRegistrationStatus(reg.status);
      
      if (reg.basicDetails) setBasicDetails(reg.basicDetails);
      if (reg.address) setAddress(reg.address);
      if (reg.contact) setContact(reg.contact);
      if (reg.education) setEducation(reg.education);
      if (reg.health) setHealth(reg.health);
      if (reg.payment) {
        setPayment({
          amount: reg.payment.amount?.toString() || "",
          status: reg.payment.status || "pending",
          reference: reg.payment.reference || "",
          notes: reg.payment.notes || "",
        });
      }
      if (reg.courseIds) setSelectedCourses(reg.courseIds);
      
      const savedStep = sessionStorage.getItem(SESSION_KEY_DRAFT_STEP);
      setCurrentStep(savedStep ? parseInt(savedStep) : 2);
    } catch (error) {
      console.error("Failed to resume draft:", error);
      showError("Failed to resume registration. Please try again.");
      clearDraftSession();
      setShowResumeModal(false);
      setDraftData(null);
    }
  };

  const startFresh = () => {
    clearDraftSession();
    setShowResumeModal(false);
    setDraftData(null);
  };

  const clearDraftSession = () => {
    try {
      sessionStorage.removeItem(SESSION_KEY_DRAFT_ID);
      sessionStorage.removeItem(SESSION_KEY_DRAFT_STEP);
      sessionStorage.removeItem(SESSION_KEY_DRAFT_TIMESTAMP);
    } catch (error) {
      console.error("Failed to clear draft session:", error);
    }
  };

  const saveDraftToSession = (regId: string, step: number) => {
    try {
      sessionStorage.setItem(SESSION_KEY_DRAFT_ID, regId);
      sessionStorage.setItem(SESSION_KEY_DRAFT_STEP, step.toString());
      sessionStorage.setItem(SESSION_KEY_DRAFT_TIMESTAMP, new Date().toISOString());
      setLastSaved(new Date());
    } catch (error) {
      console.error("Failed to save draft to session:", error);
    }
  };

  useEffect(() => {
    if (!registrationId || isEditing || isProfileMode || currentStep === 1) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const currentData = getCurrentStepData();
        if (Object.keys(currentData).length > 0) {
          await registrationService.saveStep({
            studentId: registrationId,
            step: currentStep,
            data: currentData,
          });
          sessionStorage.setItem(SESSION_KEY_DRAFT_TIMESTAMP, new Date().toISOString());
          setLastSaved(new Date());
        }
      } catch (error) {
        console.error("Auto-save failed:", error);
      }
    }, AUTO_SAVE_INTERVAL);

    return () => clearInterval(interval);
  }, [registrationId, currentStep, isEditing, isProfileMode]);

  const getCurrentStepData = () => {
    switch (currentStep) {
      case 2: return address;
      case 3: return contact;
      case 4: return education;
      case 5: return health;
      case 6: return payment;
      default: return {};
    }
  };

  const markAsUnsaved = () => {
    if (!isEditing && !isProfileMode) {
      setHasUnsavedChanges(true);
    }
  };

  const loadRegistration = async (id: string) => {
    try {
      setLoading(true);
      setDraftData(null);
      setShowResumeModal(false);
      const res = await registrationService.getById(id);
      const reg = res.data;
      setRegistrationId(id);
      setRegistrationStatus(reg.status);

      if (reg.basicDetails) setBasicDetails(reg.basicDetails);
      if (reg.address) setAddress(reg.address);
      if (reg.contact) setContact(reg.contact);
      if (reg.education) setEducation(reg.education);
      if (reg.health) setHealth(reg.health);
      if (reg.payment) {
        setPayment({
          amount: reg.payment.amount?.toString() || "",
          status: reg.payment.status || "pending",
          reference: reg.payment.reference || "",
          notes: reg.payment.notes || "",
        });
      }
      if (reg.courseIds) setSelectedCourses(reg.courseIds);
    } catch (error) {
      console.error("Failed to load registration:", error);
      showError("Failed to load registration data");
      router.push("/admin/student");
    } finally {
      setLoading(false);
    }
  };

  const loadCourses = async () => {
    try {
      const res = await courseService.getAll();
      setCourses(res.data);
    } catch (error) {
      console.error("Failed to load courses:", error);
    }
  };

  const handleBasicDetailsSubmit = async () => {
    if (!basicDetails.firstName || !basicDetails.lastName || !basicDetails.dob || !basicDetails.gender || !basicDetails.email) {
      showError("Please fill in all required fields");
      return;
    }

    if (!isEditing && !isProfileMode && !registrationId) {
      try {
        setLoading(true);
        const registrationRes = await registrationService.saveStep({
          courseIds: selectedCourses,
          step: 1,
          data: basicDetails,
        });
        const newRegId = registrationRes.data.id;
        setRegistrationId(newRegId);
        saveDraftToSession(newRegId, 2);
      } catch (error: any) {
        showError(error.response?.data?.message || "Failed to start registration");
        setLoading(false);
        return;
      }
    }
    setLoading(false);
    setCurrentStep(2);
    markAsUnsaved();
  };

  const handleAddressSubmit = async () => {
    if (!address.street || !address.city || !address.state || !address.pincode) {
      showError("Please fill in all address fields");
      return;
    }
    if (registrationId && !isEditing) {
      try {
        await registrationService.saveStep({
          studentId: registrationId,
          step: 2,
          data: address,
        });
        saveDraftToSession(registrationId, 3);
      } catch (error) {
        console.error("Failed to save address:", error);
      }
    }
    setCurrentStep(3);
    markAsUnsaved();
  };

  const handleContactSubmit = async () => {
    if (!contact.phone || !contact.emergencyContact) {
      showError("Please fill in phone numbers");
      return;
    }
    if (registrationId && !isEditing) {
      try {
        await registrationService.saveStep({
          studentId: registrationId,
          step: 3,
          data: contact,
        });
        saveDraftToSession(registrationId, 4);
      } catch (error) {
        console.error("Failed to save contact:", error);
      }
    }
    setCurrentStep(4);
    markAsUnsaved();
  };

  const handleEducationSubmit = async () => {
    if (!education.qualification || !education.institution || !education.year) {
      showError("Please fill in education details");
      return;
    }
    if (registrationId && !isEditing) {
      try {
        await registrationService.saveStep({
          studentId: registrationId,
          step: 4,
          data: education,
        });
        saveDraftToSession(registrationId, 5);
      } catch (error) {
        console.error("Failed to save education:", error);
      }
    }
    setCurrentStep(5);
    markAsUnsaved();
  };

  const handleHealthSubmit = async () => {
    if (registrationId && !isEditing) {
      try {
        await registrationService.saveStep({
          studentId: registrationId,
          step: 5,
          data: health,
        });
        saveDraftToSession(registrationId, 6);
      } catch (error) {
        console.error("Failed to save health:", error);
      }
    }
    setCurrentStep(6);
    markAsUnsaved();
  };

  const handleDocumentsSubmit = async () => {
    if (!documents.idProof || !documents.addressProof || !documents.educationCertificate) {
      showError("Please upload all required documents");
      return;
    }
    setCurrentStep(7);
  };

  const handlePaymentSubmit = async () => {
    if (!payment.amount || parseFloat(payment.amount) <= 0) {
      showError("Please enter a valid payment amount");
      return;
    }
    if (registrationId && !isEditing) {
      try {
        await registrationService.saveStep({
          studentId: registrationId,
          step: 6,
          data: payment,
        });
        saveDraftToSession(registrationId, 8);
      } catch (error) {
        console.error("Failed to save payment:", error);
      }
    }
    setCurrentStep(8);
    markAsUnsaved();
  };

  const handleFileChange = (type: string, file: File | null) => {
    setDocuments((prev) => ({ ...prev, [type]: file }));
  };

  const toggleCourse = (courseId: string) => {
    setSelectedCourses((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const uploadDocuments = async (registrationId: string): Promise<string[]> => {
    const uploadedIds: string[] = [];
    const docTypes = ["idProof", "addressProof", "educationCertificate"];
    const docNames: Record<string, string> = {
      idProof: "ID Proof",
      addressProof: "Address Proof",
      educationCertificate: "Education Certificate",
    };

    for (const type of docTypes) {
      const file = documents[type as keyof typeof documents];
      if (file) {
        try {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("registrationId", registrationId);
          formData.append("type", docNames[type]);

          const res = await documentService.upload(formData);
          uploadedIds.push(res.id || res._id);
        } catch (error) {
          console.error(`Failed to upload ${type}:`, error);
        }
      }
    }

    return uploadedIds;
  };

  const handleSubmit = async () => {
    if (isProfileMode && registrationId) {
      setSubmitting(true);
      try {
        await registrationService.updateUser(registrationId, {
          name: `${basicDetails.firstName} ${basicDetails.lastName}`.trim(),
          phone: contact.phone,
          address,
        });

        success("Profile updated successfully!");
        router.push("/admin/student");
      } catch (error: any) {
        console.error("Profile update failed:", error);
        showError(error.response?.data?.message || "Profile update failed. Please try again.");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (selectedCourses.length === 0) {
      showError("Please select at least one course");
      return;
    }

    setSubmitting(true);
    try {
      if (isEditing && registrationId) {
        await registrationService.update(registrationId, {
          basicDetails,
          address,
          contact,
          education,
          health,
          payment: {
            amount: parseFloat(payment.amount) || 0,
            status: payment.status,
            reference: payment.reference,
            notes: payment.notes,
          },
          courseIds: selectedCourses,
        });

        await registrationService.updateStatus(registrationId, "submit");

        clearDraftSession();
        success("Registration submitted for review");
        router.push("/admin/student");
      } else {
        const registrationRes = await registrationService.saveStep({
          courseIds: selectedCourses,
          step: 1,
          data: basicDetails,
        });

        const newRegistrationId = registrationRes.data.id;

        await registrationService.saveStep({
          studentId: newRegistrationId,
          step: 2,
          data: address,
        });

        await registrationService.saveStep({
          studentId: newRegistrationId,
          step: 3,
          data: contact,
        });

        await registrationService.saveStep({
          studentId: newRegistrationId,
          step: 4,
          data: education,
        });

        await registrationService.saveStep({
          studentId: newRegistrationId,
          step: 5,
          data: health,
        });

        await registrationService.saveStep({
          studentId: newRegistrationId,
          step: 6,
          data: payment,
        });

        await uploadDocuments(newRegistrationId);

        await registrationService.updateStatus(newRegistrationId, "submit");

        clearDraftSession();
        success("Registration submitted successfully!");
        router.push("/admin/student");
      }
    } catch (error: any) {
      console.error("Registration failed:", error);
      showError(error.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const stepLabels = [
    { num: 1, label: "Basic", icon: User },
    { num: 2, label: "Address", icon: MapPin },
    { num: 3, label: "Contact", icon: Phone },
    { num: 4, label: "Education", icon: GraduationCap },
    { num: 5, label: "Health", icon: Heart },
    { num: 6, label: "Documents", icon: Upload },
    { num: 7, label: "Payment", icon: CreditCard },
    { num: 8, label: "Courses", icon: BookOpen },
  ];

  const progressPercent = ((currentStep - 1) / 8) * 100;

  const renderStepIndicator = () => (
    <div className="space-y-4">
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
      </div>
      <div className={styles.stepIndicator}>
        {stepLabels.map((step) => {
          const Icon = step.icon;
          const isActive = currentStep >= step.num;
          const isCurrent = currentStep === step.num;
          const isCompleted = currentStep > step.num;
          
          return (
            <div
              key={step.num}
              className={`${styles.step} ${isActive ? styles.active : ""} ${isCurrent ? styles.current : ""} ${isCompleted ? styles.completed : ""}`}
            >
              {step.num > 1 && (
                <div className={`${styles.stepConnector} ${isActive ? styles.stepConnectorActive : ""}`} />
              )}
              <div className={styles.stepNumber}>
                {isCompleted ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <div className={styles.stepLabel}>{step.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <User className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Basic Details</h2>
          <p className="text-sm text-muted-foreground">Personal information about the student</p>
        </div>
      </div>
      
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="First Name"
            required
            value={basicDetails.firstName}
            onChange={(e) => setBasicDetails({ ...basicDetails, firstName: e.target.value })}
            placeholder="Enter first name"
          />
          <Input
            label="Last Name"
            required
            value={basicDetails.lastName}
            onChange={(e) => setBasicDetails({ ...basicDetails, lastName: e.target.value })}
            placeholder="Enter last name"
          />
          <Input
            type="date"
            label="Date of Birth"
            required
            value={basicDetails.dob}
            onChange={(e) => setBasicDetails({ ...basicDetails, dob: e.target.value })}
          />
          <Select
            label="Gender"
            required
            value={basicDetails.gender}
            onChange={(e) => setBasicDetails({ ...basicDetails, gender: e.target.value })}
            options={[
              { value: "", label: "Select Gender" },
              { value: "male", label: "Male" },
              { value: "female", label: "Female" },
              { value: "other", label: "Other" },
            ]}
          />
          <div className="sm:col-span-2">
            <Input
              type="email"
              label="Email Address"
              required
              value={basicDetails.email}
              onChange={(e) => setBasicDetails({ ...basicDetails, email: e.target.value })}
              placeholder="student@example.com"
            />
          </div>
        </div>
      </div>
      
      <div className="flex justify-end gap-3">
        <LinkButton href="/admin/student" variant="outline">
          Cancel
        </LinkButton>
        <Button onClick={handleBasicDetailsSubmit}>
          Next
        </Button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <MapPin className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Address Information</h2>
          <p className="text-sm text-muted-foreground">Student&apos;s residential address</p>
        </div>
      </div>
      
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input
              label="Street Address"
              required
              value={address.street}
              onChange={(e) => setAddress({ ...address, street: e.target.value })}
              placeholder="House No., Street Name, Area"
            />
          </div>
          <Input
            label="City"
            required
            value={address.city}
            onChange={(e) => setAddress({ ...address, city: e.target.value })}
            placeholder="City"
          />
          <Input
            label="State"
            required
            value={address.state}
            onChange={(e) => setAddress({ ...address, state: e.target.value })}
            placeholder="State"
          />
          <Input
            label="Pincode"
            required
            value={address.pincode}
            onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
            placeholder="6-digit pincode"
            maxLength={6}
          />
        </div>
      </div>
      
      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={() => setCurrentStep(1)}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button onClick={handleAddressSubmit}>
          Next <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Phone className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Contact Details</h2>
          <p className="text-sm text-muted-foreground">Phone and emergency contact information</p>
        </div>
      </div>
      
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            type="tel"
            label="Phone Number"
            required
            value={contact.phone}
            onChange={(e) => setContact({ ...contact, phone: e.target.value })}
            placeholder="10-digit phone number"
            maxLength={10}
          />
          <Input
            type="tel"
            label="Emergency Contact Number"
            required
            value={contact.emergencyContact}
            onChange={(e) => setContact({ ...contact, emergencyContact: e.target.value })}
            placeholder="10-digit phone number"
            maxLength={10}
          />
          <Input
            label="Emergency Contact Name"
            value={contact.emergencyName}
            onChange={(e) => setContact({ ...contact, emergencyName: e.target.value })}
            placeholder="Emergency contact name"
          />
          <Select
            label="Relationship"
            value={contact.relationship}
            onChange={(e) => setContact({ ...contact, relationship: e.target.value })}
            options={[
              { value: "", label: "Select Relationship" },
              { value: "parent", label: "Parent" },
              { value: "guardian", label: "Guardian" },
              { value: "spouse", label: "Spouse" },
              { value: "sibling", label: "Sibling" },
              { value: "other", label: "Other" },
            ]}
          />
        </div>
      </div>
      
      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={() => setCurrentStep(2)}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button onClick={handleContactSubmit}>
          Next <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <GraduationCap className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Education History</h2>
          <p className="text-sm text-muted-foreground">Academic qualifications and achievements</p>
        </div>
      </div>
      
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Highest Qualification"
            required
            value={education.qualification}
            onChange={(e) => setEducation({ ...education, qualification: e.target.value })}
            options={[
              { value: "", label: "Select Qualification" },
              { value: "10th", label: "10th Pass" },
              { value: "12th", label: "12th Pass" },
              { value: "diploma", label: "Diploma" },
              { value: "graduation", label: "Graduation" },
              { value: "postgraduation", label: "Post Graduation" },
            ]}
          />
          <Input
            label="Institution/Board"
            required
            value={education.institution}
            onChange={(e) => setEducation({ ...education, institution: e.target.value })}
            placeholder="School/University name"
          />
          <Input
            label="Year of Passing"
            required
            value={education.year}
            onChange={(e) => setEducation({ ...education, year: e.target.value })}
            placeholder="e.g., 2024"
            maxLength={4}
          />
          <Input
            label="Percentage/CGPA"
            value={education.percentage}
            onChange={(e) => setEducation({ ...education, percentage: e.target.value })}
            placeholder="e.g., 85% or 8.5 CGPA"
          />
        </div>
      </div>
      
      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={() => setCurrentStep(3)}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button onClick={handleEducationSubmit}>
          Next <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Heart className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Health Information</h2>
          <p className="text-sm text-muted-foreground">This information helps us provide appropriate support</p>
        </div>
      </div>
      
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <Textarea
          label="Any Medical Conditions"
          value={health.conditions}
          onChange={(e) => setHealth({ ...health, conditions: e.target.value })}
          placeholder="List any medical conditions (or write 'None')"
          rows={3}
        />
        <Textarea
          label="Current Medications"
          value={health.medications}
          onChange={(e) => setHealth({ ...health, medications: e.target.value })}
          placeholder="List any current medications (or write 'None')"
          rows={2}
        />
        <Textarea
          label="Allergies"
          value={health.allergies}
          onChange={(e) => setHealth({ ...health, allergies: e.target.value })}
          placeholder="List any allergies (food, medicine, etc.)"
          rows={2}
        />
      </div>
      
      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={() => setCurrentStep(4)}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button onClick={handleHealthSubmit}>
          Next <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const renderStep6 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Upload className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Upload Documents</h2>
          <p className="text-sm text-muted-foreground">Please upload the following documents (PDF, JPG, PNG)</p>
        </div>
      </div>
      
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { key: "idProof", title: "ID Proof", subtitle: "Aadhaar Card, PAN Card, Passport, or Voter ID" },
            { key: "addressProof", title: "Address Proof", subtitle: "Utility Bill, Bank Statement, or Rent Agreement" },
            { key: "educationCertificate", title: "Education Certificate", subtitle: "Highest qualification certificate or marksheet" },
          ].map((doc) => (
            <div key={doc.key} className={`flex flex-col gap-3 rounded-lg border p-4 transition-all ${
              documents[doc.key as keyof typeof documents]
                ? "border-emerald-200 bg-emerald-50/50"
                : "border-border bg-muted/30 hover:border-primary/30"
            }`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                    documents[doc.key as keyof typeof documents]
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-primary/10 text-primary"
                  }`}>
                    {documents[doc.key as keyof typeof documents] ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{doc.title} <span className="text-destructive">*</span></h4>
                    <p className="text-xs text-muted-foreground">{doc.subtitle}</p>
                  </div>
                </div>
              </div>
              <label className={`cursor-pointer rounded-lg border px-4 py-2 text-center text-sm font-medium transition-all ${
                documents[doc.key as keyof typeof documents]
                  ? "border-emerald-200 bg-card text-emerald-600 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-900/20"
                  : "border-dashed border-input bg-background text-foreground hover:bg-accent"
              }`}>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(doc.key, e.target.files?.[0] || null)}
                  className="hidden"
                />
                {documents[doc.key as keyof typeof documents] ? "Change File" : "Upload Document"}
              </label>
              {documents[doc.key as keyof typeof documents] && (
                <p className="text-xs text-emerald-600 font-medium truncate">
                  {(documents[doc.key as keyof typeof documents])?.name}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={() => setCurrentStep(5)}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button onClick={handleDocumentsSubmit}>
          Next <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const renderStep7 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <CreditCard className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Payment Information</h2>
          <p className="text-sm text-muted-foreground">Record payment details for this registration</p>
        </div>
      </div>
      
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            type="number"
            label="Amount (INR)"
            required
            value={payment.amount}
            onChange={(e) => setPayment({ ...payment, amount: e.target.value })}
            placeholder="Enter amount"
          />
          <Select
            label="Payment Status"
            value={payment.status}
            onChange={(e) => setPayment({ ...payment, status: e.target.value as "pending" | "completed" })}
            options={[
              { value: "pending", label: "Pending" },
              { value: "completed", label: "Completed" },
            ]}
          />
          <Input
            label="Reference / Transaction ID"
            value={payment.reference}
            onChange={(e) => setPayment({ ...payment, reference: e.target.value })}
            placeholder="Transaction ID, Receipt No., etc."
          />
          <Textarea
            label="Notes"
            value={payment.notes}
            onChange={(e) => setPayment({ ...payment, notes: e.target.value })}
            placeholder="Any additional notes about the payment"
            rows={3}
          />
        </div>
      </div>
      
      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={() => setCurrentStep(6)}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button onClick={handlePaymentSubmit}>
          Next <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const renderStep8 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <BookOpen className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Select Courses</h2>
          <p className="text-sm text-muted-foreground">Choose the courses to enroll in</p>
        </div>
      </div>
      
      {courses.length === 0 ? (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <p className="text-lg font-medium text-muted-foreground">No courses available</p>
            <p className="text-sm text-muted-foreground mb-4">Please create courses first</p>
            <LinkButton href="/admin/course/manage" variant="outline">
              Manage Courses →
            </LinkButton>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <div
              key={course._id}
              onClick={() => toggleCourse(course._id)}
              className={`cursor-pointer rounded-xl border p-4 transition-all hover:border-primary/50 ${
                selectedCourses.includes(course._id)
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card"
              }`}
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <span className={`text-lg font-semibold ${selectedCourses.includes(course._id) ? "text-primary" : "text-muted-foreground"}`}>
                  {selectedCourses.includes(course._id) ? "✓" : course.title[0]}
                </span>
              </div>
              <h4 className="font-medium text-foreground">{course.title}</h4>
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{course.description}</p>
            </div>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Registration Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{basicDetails.firstName} {basicDetails.lastName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{basicDetails.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Payment</p>
              <p className={`font-medium ${payment.status === "completed" ? "text-emerald-600" : "text-amber-600"}`}>
                {payment.status === "completed" ? "✓ Completed" : "○ Pending"} - ₹{payment.amount || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Selected Courses</p>
              <p className="font-medium">{selectedCourses.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={() => setCurrentStep(7)}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting || (isProfileMode ? false : selectedCourses.length === 0)}
        >
          {submitting 
            ? (isProfileMode ? "Updating..." : isEditing ? "Updating..." : "Submitting...") 
            : (isProfileMode ? "Update Profile" : isEditing ? "Update Registration" : "Submit Registration")}
        </Button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (showResumeModal && draftData) {
    return (
      <div className="space-y-6">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-primary" />
              Resume Registration?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              You have an incomplete registration from{" "}
              <span className="font-medium text-foreground">
                {lastSaved ? lastSaved.toLocaleString() : "earlier"}
              </span>
            </p>
            {draftData.basicDetails?.firstName && (
              <p className="text-sm">
                Student: <span className="font-medium">{draftData.basicDetails.firstName} {draftData.basicDetails.lastName}</span>
              </p>
            )}
            {draftData.courseIds?.length > 0 && (
              <p className="text-sm">
                Courses selected: <span className="font-medium">{draftData.courseIds.length}</span>
              </p>
            )}
            <div className="flex gap-3 pt-2">
              <Button onClick={resumeDraft} className="flex-1">
                Resume
              </Button>
              <Button variant="outline" onClick={startFresh} className="flex-1">
                Start New
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <LinkButton href="/admin/student" variant="ghost" size="sm" className="w-fit -ml-2">
              <ChevronLeft className="mr-1 h-4 w-4" /> Back to Registrations
            </LinkButton>
            <h1 className="text-2xl font-bold text-foreground">
              {isProfileMode ? "Update Profile" : isEditing ? "Edit Registration" : "Student Registration"}
            </h1>
            <p className="text-muted-foreground">
              {isProfileMode ? "Update student profile information" : isEditing ? "Update registration details" : "Fill in the details to register a new student"}
            </p>
          </div>
          {!isProfileMode && !isEditing && (
            <div className="flex flex-col items-end gap-1">
              <div className="hidden sm:flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2">
                <span className="text-sm text-muted-foreground">Step</span>
                <span className="text-lg font-bold text-primary">{currentStep}</span>
                <span className="text-sm text-muted-foreground">of 8</span>
              </div>
              {lastSaved && registrationId && (
                <span className="text-xs text-muted-foreground">
                  Last saved: {lastSaved.toLocaleTimeString()}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {isProfileMode ? (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <span className="text-lg font-semibold text-primary">✎</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Update Profile Information</h2>
              <p className="text-sm text-muted-foreground">Update student details for approved registration</p>
            </div>
          </div>
          
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="First Name"
                required
                value={basicDetails.firstName}
                onChange={(e) => setBasicDetails({ ...basicDetails, firstName: e.target.value })}
                placeholder="Enter first name"
              />
              <Input
                label="Last Name"
                required
                value={basicDetails.lastName}
                onChange={(e) => setBasicDetails({ ...basicDetails, lastName: e.target.value })}
                placeholder="Enter last name"
              />
              <Input
                type="tel"
                label="Phone Number"
                value={contact.phone}
                onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                placeholder="10-digit phone number"
                maxLength={10}
              />
              <Input
                label="Street Address"
                value={address.street}
                onChange={(e) => setAddress({ ...address, street: e.target.value })}
                placeholder="House No., Street Name, Area"
              />
              <Input
                label="City"
                value={address.city}
                onChange={(e) => setAddress({ ...address, city: e.target.value })}
                placeholder="City"
              />
              <Input
                label="State"
                value={address.state}
                onChange={(e) => setAddress({ ...address, state: e.target.value })}
                placeholder="State"
              />
              <Input
                label="Pincode"
                value={address.pincode}
                onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                placeholder="6-digit pincode"
                maxLength={6}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <LinkButton href="/admin/student" variant="outline">
              Cancel
            </LinkButton>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "Updating..." : "Update Profile"}
            </Button>
          </div>
        </div>
      ) : (
        <>
          {renderStepIndicator()}

          <div className="space-y-6">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
            {currentStep === 5 && renderStep5()}
            {currentStep === 6 && renderStep6()}
            {currentStep === 7 && renderStep7()}
            {currentStep === 8 && renderStep8()}
          </div>
        </>
      )}
    </div>
  );
}