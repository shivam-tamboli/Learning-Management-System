"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { registrationService, courseService, documentService } from "@/lib/api";
import {
  TITLE_OPTIONS,
  GENDER_OPTIONS,
  MOTHER_TONGUE_OPTIONS,
  ADDRESS_TYPE_OPTIONS,
  COUNTRIES,
  INDIAN_STATES,
  getDistrictsByState,
  getTalukasByDistrict,
  getCitiesByState,
} from "@/lib/dropdownData";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Button, LinkButton } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { StepProgress } from "@/components/ui/StepProgress";
import { Check, FileText, ChevronLeft, ChevronRight, BookOpen, User, MapPin, Phone, GraduationCap, Heart, Upload, CreditCard, Eye, X } from "lucide-react";
import styles from "./register.module.css";

interface BasicDetails {
  title: string;
  firstName: string;
  middleName: string;
  lastName: string;
  fullName: string;
  dob: string;
  age: string;
  gender: string;
  fatherName: string;
  motherName: string;
  motherTongue: string;
  nationality: string;
  email: string;
}

interface Address {
  addressType: string;
  addressLine1: string;
  addressLine2: string;
  suburb: string;
  landmark: string;
  city: string;
  taluka: string;
  district: string;
  state: string;
  pincode: string;
  country: string;
}

interface Contact {
  phone: string;
  whatsappNumber: string;
  sameAsMobile: boolean;
  emergencyContact: string;
  emergencyName: string;
  relationship: string;
}

interface Education {
  schoolName: string;
  standard: string;
  city: string;
  qualification?: string;
  institution?: string;
  year?: string;
  percentage?: string;
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
    photo: null,
    signature: null,
    admissionFormFront: null,
    admissionFormBack: null,
  });
  const [uploadedDocIds, setUploadedDocIds] = useState<string[]>([]);
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const [registrationStatus, setRegistrationStatus] = useState<string>("");
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [savedDraft, setSavedDraft] = useState<any>(null);
  const [previewDoc, setPreviewDoc] = useState<{ file: File | null; name: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [touchedFields, setTouchedFields] = useState<{ [key: string]: boolean }>({});

  const validateField = (field: string, value: string): string => {
    switch (field) {
      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return 'Please enter a valid email address';
        }
        break;
      case 'phone':
      case 'whatsappNumber':
        if (value && !/^\d{10}$/.test(value)) {
          return 'Please enter a valid 10-digit phone number';
        }
        break;
      case 'pincode':
        if (value && !/^\d{6}$/.test(value)) {
          return 'Please enter a valid 6-digit pincode';
        }
        break;
      case 'emergencyContact':
        if (value && !/^\d{10}$/.test(value)) {
          return 'Please enter a valid 10-digit phone number';
        }
        break;
    }
    return '';
  };

  const handleFieldBlur = (field: string, value: string) => {
    setTouchedFields({ ...touchedFields, [field]: true });
    const error = validateField(field, value);
    setValidationErrors({ ...validationErrors, [field]: error });
  };

  const isFieldInvalid = (field: string): boolean => {
    return touchedFields[field] && !!validationErrors[field];
  };

  const isFieldValid = (field: string, value: string): boolean => {
    return touchedFields[field] && !validationErrors[field] && value.length > 0;
  };

  const [basicDetails, setBasicDetails] = useState<BasicDetails>({
    title: "",
    firstName: "",
    middleName: "",
    lastName: "",
    fullName: "",
    dob: "",
    age: "",
    gender: "",
    fatherName: "",
    motherName: "",
    motherTongue: "",
    nationality: "India",
    email: "",
  });

  const [address, setAddress] = useState<Address>({
    addressType: "Permanent",
    addressLine1: "",
    addressLine2: "",
    suburb: "",
    landmark: "",
    city: "",
    taluka: "",
    district: "",
    state: "",
    pincode: "",
    country: "India",
  });

  const [contact, setContact] = useState<Contact>({
    phone: "",
    whatsappNumber: "",
    sameAsMobile: false,
    emergencyContact: "",
    emergencyName: "",
    relationship: "",
  });

  const [education, setEducation] = useState<Education>({
    schoolName: "",
    standard: "",
    city: "",
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

  const hasActualData = (obj: any): boolean => {
    if (!obj || typeof obj !== 'object') return false;
    if (Array.isArray(obj)) return obj.length > 0;
    return Object.keys(obj).some(key => {
      const value = obj[key];
      if (value === null || value === undefined) return false;
      if (typeof value === 'string') return value.trim().length > 0;
      if (typeof value === 'object') return hasActualData(value);
      return true;
    });
  };

  useEffect(() => {
    loadCourses();
    if (isEditing) {
      loadRegistration(editId);
    } else if (!isProfileMode) {
      // Check for existing draft
      const draft = getSavedDraft();
      if (draft?.registrationId) {
        setSavedDraft(draft);
        setShowResumeModal(true);
      }
    }
  }, []);

  const loadRegistration = async (id: string, resumeFromStep?: number) => {
    try {
      setLoading(true);
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

      if (resumeFromStep) {
        const targetStep = resumeFromStep > 1 ? resumeFromStep : 2;
        setCurrentStep(targetStep);
      }
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
    } finally {
      setLoading(false);
    }
  };

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!registrationId || isEditing || isProfileMode) return;

    const interval = setInterval(async () => {
      try {
        setIsSaving(true);
        let stepData: any = {};
        let step = currentStep;

        switch (currentStep) {
          case 2:
            stepData = basicDetails;
            break;
          case 3:
            stepData = address;
            break;
          case 4:
            stepData = contact;
            break;
          case 5:
            stepData = education;
            break;
          case 6:
            stepData = health;
            break;
          case 7:
            stepData = payment;
            break;
          default:
            return;
        }

        await registrationService.saveStep({
          studentId: registrationId,
          step: step,
          data: stepData,
        });
        saveDraftToStorage(registrationId, currentStep);
        setLastSaved(new Date());
        setIsSaving(false);
        setHasUnsavedChanges(false);
        console.log("Auto-saved at step", currentStep);
      } catch (error) {
        console.error("Auto-save failed:", error);
        setIsSaving(false);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [registrationId, currentStep, basicDetails, address, contact, education, health, payment, isEditing, isProfileMode]);

  useEffect(() => {
    if (!registrationId || isEditing || isProfileMode) return;
    setHasUnsavedChanges(true);
  }, [basicDetails, address, contact, education, health, payment, registrationId, isEditing, isProfileMode]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const DRAFT_STORAGE_KEY = "registration_draft";

  const saveDraftToStorage = (regId: string, step: number) => {
    try {
      const draftData = {
        registrationId: regId,
        currentStep: step,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData));
    } catch (error) {
      console.error("Failed to save draft to storage:", error);
    }
  };

  const getSavedDraft = () => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error("Failed to get saved draft:", error);
      return null;
    }
  };

  const clearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch (error) {
      console.error("Failed to clear draft:", error);
    }
  };

  const handleResumeDraft = async () => {
    if (savedDraft?.registrationId) {
      await loadRegistration(savedDraft.registrationId, savedDraft.currentStep);
      setShowResumeModal(false);
    }
  };

  const handleStartFresh = () => {
    clearDraft();
    setSavedDraft(null);
    setShowResumeModal(false);
    setRegistrationId(null);
    setCurrentStep(1);
    setSelectedCourses([]);
    setDocuments({ photo: null, signature: null, admissionFormFront: null, admissionFormBack: null });
    setUploadedDocIds([]);
    setBasicDetails({
      title: "",
      firstName: "",
      middleName: "",
      lastName: "",
      fullName: "",
      dob: "",
      age: "",
      gender: "",
      fatherName: "",
      motherName: "",
      motherTongue: "",
      nationality: "India",
      email: "",
    });
    setAddress({
      addressType: "Permanent",
      addressLine1: "",
      addressLine2: "",
      suburb: "",
      landmark: "",
      city: "",
      taluka: "",
      district: "",
      state: "",
      pincode: "",
      country: "India",
    });
    setContact({
      phone: "",
      whatsappNumber: "",
      sameAsMobile: false,
      emergencyContact: "",
      emergencyName: "",
      relationship: "",
    });
    setEducation({
      schoolName: "",
      standard: "",
      city: "",
    });
    setHealth({
      conditions: "",
      medications: "",
      allergies: "",
    });
    setPayment({
      amount: "",
      status: "pending",
      reference: "",
      notes: "",
    });
  };

  const handleCoursesSubmit = async () => {
    if (selectedCourses.length === 0) {
      showError("Please select at least one course");
      return;
    }

    if (!isEditing && !isProfileMode && !registrationId) {
      try {
        setLoading(true);
        const registrationRes = await registrationService.saveStep({
          courseIds: selectedCourses,
          step: 1,
          data: {},
        });
        const newRegId = registrationRes.data.id;
        setRegistrationId(newRegId);
        saveDraftToStorage(newRegId, 2);
      } catch (error: any) {
        showError(error.response?.data?.message || "Failed to save courses");
        setLoading(false);
        return;
      }
    }
    setLoading(false);
    setCurrentStep(2);
  };

  const handleBasicDetailsSubmit = async () => {
    if (!basicDetails.firstName || !basicDetails.lastName || !basicDetails.dob || !basicDetails.gender || !basicDetails.email) {
      showError("Please fill in all required fields");
      return;
    }

    if (registrationId) {
      try {
        await registrationService.saveStep({
          studentId: registrationId,
          step: 2,
          data: basicDetails,
        });
        if (!isEditing) {
          saveDraftToStorage(registrationId, 3);
        }
      } catch (error: any) {
        console.error("Failed to save basic details:", error);
        showError(error.response?.data?.message || "Failed to save. Please try again.");
        return;
      }
    }
    setCurrentStep(3);
  };

  const handleAddressSubmit = async () => {
    if (!address.addressLine1 || !address.pincode) {
      showError("Please fill in address line 1 and pincode");
      return;
    }
    if (registrationId) {
      try {
        await registrationService.saveStep({
          studentId: registrationId,
          step: 3,
          data: address,
        });
        if (!isEditing) {
          saveDraftToStorage(registrationId, 4);
        }
      } catch (error: any) {
        console.error("Failed to save address:", error);
        showError(error.response?.data?.message || "Failed to save. Please try again.");
        return;
      }
    }
    setCurrentStep(4);
  };

  const handleContactSubmit = async () => {
    if (!contact.phone || !contact.emergencyContact) {
      showError("Please fill in phone numbers");
      return;
    }
    if (registrationId) {
      try {
        await registrationService.saveStep({
          studentId: registrationId,
          step: 4,
          data: contact,
        });
        if (!isEditing) {
          saveDraftToStorage(registrationId, 5);
        }
      } catch (error: any) {
        console.error("Failed to save contact:", error);
        showError(error.response?.data?.message || "Failed to save. Please try again.");
        return;
      }
    }
    setCurrentStep(5);
  };

  const handleEducationSubmit = async () => {
    if (!education.schoolName || !education.standard) {
      showError("Please fill in school name and standard");
      return;
    }
    if (registrationId) {
      try {
        await registrationService.saveStep({
          studentId: registrationId,
          step: 5,
          data: education,
        });
        if (!isEditing) {
          saveDraftToStorage(registrationId, 6);
        }
      } catch (error: any) {
        console.error("Failed to save education:", error);
        showError(error.response?.data?.message || "Failed to save. Please try again.");
        return;
      }
    }
    setCurrentStep(6);
  };

  const handleHealthSubmit = async () => {
    if (registrationId) {
      try {
        await registrationService.saveStep({
          studentId: registrationId,
          step: 6,
          data: health,
        });
        if (!isEditing) {
          saveDraftToStorage(registrationId, 7);
        }
      } catch (error: any) {
        console.error("Failed to save health:", error);
        showError(error.response?.data?.message || "Failed to save. Please try again.");
        return;
      }
    }
    setCurrentStep(7);
  };

  const handleDocumentsSubmit = async () => {
    if (!documents.photo || !documents.signature || !documents.admissionFormFront || !documents.admissionFormBack) {
      showError("Please upload all required documents");
      return;
    }

    if (!registrationId) {
      showError("Registration ID missing. Please complete previous steps first.");
      return;
    }

    setSubmitting(true);
    
    try {
      // STEP 1: Upload ALL documents FIRST - before updating status
      const uploadedIds = await uploadDocumentsWithValidation(registrationId);
      
      // STEP 2: Verify upload succeeded
      if (!uploadedIds || uploadedIds.length < 4) {
        throw new Error("Not all documents were uploaded. Please try again.");
      }
      
      // STEP 3: Now update status to pending (with document verification flag)
      const stepResult = await registrationService.saveStep({
        studentId: registrationId,
        step: 7,
        data: { documentsComplete: true, documentIds: uploadedIds },
      });
      
      // STEP 4: Verify response and status
      const responseData = stepResult?.data;
      
      if (!responseData) {
        throw new Error("No response from server. Please try again.");
      }
      
      // Check for explicit failure from backend
      if (responseData.success === false) {
        throw new Error(responseData.message || "Failed to submit registration");
      }
      
      const newStatus = responseData?.status;
      if (!newStatus || (newStatus !== "pending" && newStatus !== "approved")) {
        throw new Error("Failed to update registration status. Please try again.");
      }

      // STEP 5: Success
      success("Registration submitted successfully!");
      clearDraft();
      router.push("/admin/payment");
    } catch (error: any) {
      console.error("Failed to submit registration:", error);
      showError(error.response?.data?.message || error.message || "Failed to submit registration. Please try again.");
    } finally {
      // ALWAYS reset loading state
      setSubmitting(false);
    }
  };

  // Upload documents with proper error handling - throws on failure
  const uploadDocumentsWithValidation = async (registrationId: string): Promise<string[]> => {
    const uploadedIds: string[] = [];
    const docTypes = ["photo", "signature", "admissionFormFront", "admissionFormBack"];
    const docNames: Record<string, string> = {
      photo: "Photo",
      signature: "Signature",
      admissionFormFront: "Admission Form - Front",
      admissionFormBack: "Admission Form - Back",
    };

    for (const type of docTypes) {
      const file = documents[type as keyof typeof documents];
      if (!file) {
        throw new Error(`Missing required document: ${docNames[type]}`);
      }
      
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("registrationId", registrationId);
        formData.append("type", docNames[type]);

        const res = await documentService.upload(formData);
        
        if (!res || (!res.id && !res._id)) {
          throw new Error(`Failed to upload ${docNames[type]}`);
        }
        
        uploadedIds.push(res.id || res._id);
      } catch (error: any) {
        console.error(`Failed to upload ${type}:`, error);
        throw new Error(`Failed to upload ${docNames[type]}: ${error.message || "Unknown error"}`);
      }
    }

    if (uploadedIds.length !== 4) {
      throw new Error("Not all documents were uploaded successfully. Please try again.");
    }
    
    return uploadedIds;
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
        clearDraft();
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
        const updateData: any = {
          courseIds: selectedCourses,
        };

        if (hasActualData(basicDetails)) {
          updateData.basicDetails = basicDetails;
        }
        if (hasActualData(address)) {
          updateData.address = address;
        }
        if (hasActualData(contact)) {
          updateData.contact = contact;
        }
        if (hasActualData(education)) {
          updateData.education = education;
        }
        if (hasActualData(health)) {
          updateData.health = health;
        }
        if (payment.amount || payment.status || payment.reference || payment.notes) {
          updateData.payment = {
            amount: parseFloat(payment.amount) || 0,
            status: payment.status,
            reference: payment.reference,
            notes: payment.notes,
          };
        }

        await registrationService.update(registrationId, updateData);

        success("Registration updated successfully!");
        clearDraft();
        router.push("/admin/student");
      } else if (registrationId) {
        // Use existing registration (user completed step-by-step flow)
        // Save all steps first, then upload documents, then finalize
        await registrationService.saveStep({
          studentId: registrationId,
          step: 2,
          data: basicDetails,
        });

        await registrationService.saveStep({
          studentId: registrationId,
          step: 3,
          data: address,
        });

        await registrationService.saveStep({
          studentId: registrationId,
          step: 4,
          data: contact,
        });

        await registrationService.saveStep({
          studentId: registrationId,
          step: 5,
          data: education,
        });

        await registrationService.saveStep({
          studentId: registrationId,
          step: 6,
          data: health,
        });

        // STEP 1: Upload documents FIRST
        const uploadedIds = await uploadDocumentsWithValidation(registrationId);
        
        // STEP 2: Now call step 7 with document verification
        const stepResult = await registrationService.saveStep({
          studentId: registrationId,
          step: 7,
          data: { documentsComplete: true, documentIds: uploadedIds },
        });

        // STEP 3: Verify response properly
        const responseData = stepResult?.data;
        
        if (responseData?.success === false) {
          throw new Error(responseData.message || "Failed to submit registration");
        }
        
        const newStatus = responseData?.status;
        if (!newStatus || (newStatus !== "pending" && newStatus !== "approved")) {
          throw new Error("Failed to update registration status");
        }

        success("Registration submitted successfully!");
        clearDraft();
        router.push("/admin/payment");
      } else {
        // Fallback: create new registration (shouldn't happen normally)
        const registrationRes = await registrationService.saveStep({
          courseIds: selectedCourses,
          step: 1,
          data: {},
        });

        const newRegistrationId = registrationRes.data?.id;
        
        if (!newRegistrationId) {
          throw new Error("Failed to create registration");
        }

        await registrationService.saveStep({
          studentId: newRegistrationId,
          step: 2,
          data: basicDetails,
        });

        await registrationService.saveStep({
          studentId: newRegistrationId,
          step: 3,
          data: address,
        });

        await registrationService.saveStep({
          studentId: newRegistrationId,
          step: 4,
          data: contact,
        });

        await registrationService.saveStep({
          studentId: newRegistrationId,
          step: 5,
          data: education,
        });

        await registrationService.saveStep({
          studentId: newRegistrationId,
          step: 6,
          data: health,
        });

        // STEP 1: Upload documents FIRST
        const uploadedIds = await uploadDocumentsWithValidation(newRegistrationId);
        
        // STEP 2: Now call step 7 with document verification
        const stepResult = await registrationService.saveStep({
          studentId: newRegistrationId,
          step: 7,
          data: { documentsComplete: true, documentIds: uploadedIds },
        });

        // STEP 3: Verify response properly
        const responseData = stepResult?.data;
        
        if (responseData?.success === false) {
          throw new Error(responseData.message || "Failed to submit registration");
        }
        
        const newStatus = responseData?.status;
        if (!newStatus || (newStatus !== "pending" && newStatus !== "approved")) {
          throw new Error("Failed to update registration status");
        }

        success("Registration submitted successfully!");
        clearDraft();
        router.push("/admin/payment");
      }
    } catch (error: any) {
      console.error("Registration failed:", error);
      showError(error.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const stepLabels = [
    { label: "Courses" },
    { label: "Basic Details" },
    { label: "Address" },
    { label: "Contact" },
    { label: "Education" },
    { label: "Health" },
    { label: "Documents" },
  ];

  const steps = stepLabels.map(s => s.label);
  const progressPercent = ((currentStep - 1) / 7) * 100;

  const renderStepIndicator = () => (
    <StepProgress steps={steps} currentStep={currentStep} showStepText className="mb-6" />
  );

  const renderStep2 = () => (
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Select
            label="Title"
            value={basicDetails.title}
            onChange={(e) => setBasicDetails({ ...basicDetails, title: e.target.value })}
            options={[{ value: "", label: "Select Title" }, ...TITLE_OPTIONS]}
          />
          <Input
            label="First Name"
            required
            value={basicDetails.firstName}
            onChange={(e) => setBasicDetails({ ...basicDetails, firstName: e.target.value })}
            placeholder="Enter first name"
          />
          <Input
            label="Middle Name"
            value={basicDetails.middleName}
            onChange={(e) => setBasicDetails({ ...basicDetails, middleName: e.target.value })}
            placeholder="Enter middle name"
          />
          <Input
            label="Last Name"
            required
            value={basicDetails.lastName}
            onChange={(e) => setBasicDetails({ ...basicDetails, lastName: e.target.value })}
            placeholder="Enter last name"
          />
          <Input
            label="Full Name"
            required
            value={basicDetails.fullName}
            onChange={(e) => setBasicDetails({ ...basicDetails, fullName: e.target.value })}
            placeholder="Enter full name"
          />
          <Input
            type="date"
            label="Date of Birth"
            required
            value={basicDetails.dob}
            onChange={(e) => setBasicDetails({ ...basicDetails, dob: e.target.value })}
          />
          <Input
            label="Age"
            value={basicDetails.age}
            onChange={(e) => setBasicDetails({ ...basicDetails, age: e.target.value })}
            placeholder="Enter age"
          />
          <Select
            label="Gender"
            required
            value={basicDetails.gender}
            onChange={(e) => setBasicDetails({ ...basicDetails, gender: e.target.value })}
            options={GENDER_OPTIONS}
          />
          <Input
            label="Father Name"
            value={basicDetails.fatherName}
            onChange={(e) => setBasicDetails({ ...basicDetails, fatherName: e.target.value })}
            placeholder="Enter father name"
          />
          <Input
            label="Mother Name"
            required
            value={basicDetails.motherName}
            onChange={(e) => setBasicDetails({ ...basicDetails, motherName: e.target.value })}
            placeholder="Enter mother name"
          />
          <Select
            label="Mother Tongue"
            value={basicDetails.motherTongue}
            onChange={(e) => setBasicDetails({ ...basicDetails, motherTongue: e.target.value })}
            options={MOTHER_TONGUE_OPTIONS}
          />
          <Select
            label="Nationality"
            value={basicDetails.nationality}
            onChange={(e) => setBasicDetails({ ...basicDetails, nationality: e.target.value })}
            options={[{ value: "", label: "Select Nationality" }, ...COUNTRIES.slice(0, 50)]}
          />
          <div className="sm:col-span-2 lg:col-span-3">
            <Input
              type="email"
              label="Email Address"
              required
              value={basicDetails.email}
              onChange={(e) => setBasicDetails({ ...basicDetails, email: e.target.value })}
              onBlur={() => handleFieldBlur('email', basicDetails.email)}
              error={isFieldInvalid('email') ? validationErrors['email'] : undefined}
              showValid={isFieldValid('email', basicDetails.email)}
              placeholder="student@example.com"
            />
          </div>
        </div>
      </div>
      
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 -mx-6 md:mx-0 md:px-6 lg:rounded-b-xl shadow-lg z-40">
        <div className="flex justify-between max-w-7xl mx-auto">
          <Button variant="outline" onClick={() => setCurrentStep(1)}>
            <ChevronLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Button onClick={handleBasicDetailsSubmit}>
            Next <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => {
    const districts = getDistrictsByState(address.state);
    const talukas = address.district ? getTalukasByDistrict(address.district) : [];
    const cities = getCitiesByState(address.state);

    return (
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Select
            label="Address Type"
            value={address.addressType}
            onChange={(e) => setAddress({ ...address, addressType: e.target.value })}
            options={ADDRESS_TYPE_OPTIONS}
          />
          <Select
            label="Country"
            value={address.country}
            onChange={(e) => setAddress({ ...address, country: e.target.value })}
            options={[{ value: "", label: "Select Country" }, ...COUNTRIES.slice(0, 50)]}
          />
          <Select
            label="State"
            value={address.state}
            onChange={(e) => setAddress({ ...address, state: e.target.value, district: "", taluka: "", city: "" })}
            options={[{ value: "", label: "Select State" }, ...INDIAN_STATES]}
          />
          <Select
            label="District"
            value={address.district}
            onChange={(e) => setAddress({ ...address, district: e.target.value, taluka: "" })}
            options={[{ value: "", label: "Select District" }, ...districts]}
          />
          <Select
            label="Taluka"
            value={address.taluka}
            onChange={(e) => setAddress({ ...address, taluka: e.target.value })}
            options={[{ value: "", label: "Select Taluka" }, ...talukas]}
          />
          <Select
            label="City"
            value={address.city}
            onChange={(e) => setAddress({ ...address, city: e.target.value })}
            options={[{ value: "", label: "Select City" }, ...cities]}
          />
          <Input
            label="Pin Code"
            required
            value={address.pincode}
            onChange={(e) => setAddress({ ...address, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
            onBlur={() => handleFieldBlur('pincode', address.pincode)}
            error={isFieldInvalid('pincode') ? validationErrors['pincode'] : undefined}
            showValid={isFieldValid('pincode', address.pincode)}
            placeholder="6-digit pincode"
            maxLength={6}
          />
          <Input
            label="Suburb"
            value={address.suburb}
            onChange={(e) => setAddress({ ...address, suburb: e.target.value })}
            placeholder="Suburb"
          />
          <Input
            label="Landmark"
            value={address.landmark}
            onChange={(e) => setAddress({ ...address, landmark: e.target.value })}
            placeholder="Near landmark"
          />
          <div className="sm:col-span-2 lg:col-span-3">
            <Input
              label="Address Line 1"
              required
              value={address.addressLine1}
              onChange={(e) => setAddress({ ...address, addressLine1: e.target.value })}
              placeholder="House No., Street Name, Area"
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <Input
              label="Address Line 2"
              value={address.addressLine2}
              onChange={(e) => setAddress({ ...address, addressLine2: e.target.value })}
              placeholder="Village/Town, Colony details"
            />
          </div>
        </div>
      </div>
      
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 -mx-6 md:mx-0 md:px-6 lg:rounded-b-xl shadow-lg z-40">
        <div className="flex justify-between max-w-7xl mx-auto">
          <Button variant="outline" onClick={() => setCurrentStep(2)}>
            <ChevronLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Button onClick={handleAddressSubmit}>
            Next <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
    );
  };

  const renderStep4 = () => (
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
            onChange={(e) => setContact({ ...contact, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
            onBlur={() => handleFieldBlur('phone', contact.phone)}
            error={isFieldInvalid('phone') ? validationErrors['phone'] : undefined}
            showValid={isFieldValid('phone', contact.phone)}
            placeholder="10-digit phone number"
            maxLength={10}
          />
          <div>
            <Input
              type="tel"
              label="WhatsApp Number"
              value={contact.sameAsMobile ? contact.phone : contact.whatsappNumber}
              onChange={(e) => {
                if (!contact.sameAsMobile) {
                  setContact({ ...contact, whatsappNumber: e.target.value.replace(/\D/g, '').slice(0, 10) });
                }
              }}
              placeholder="10-digit WhatsApp number"
              maxLength={10}
              disabled={contact.sameAsMobile}
            />
            <label className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={contact.sameAsMobile}
                onChange={(e) => setContact({ ...contact, sameAsMobile: e.target.checked })}
                className="h-4 w-4 rounded border-border"
              />
              Same as Mobile Number
            </label>
          </div>
          <Input
            type="tel"
            label="Emergency Contact Number"
            required
            value={contact.emergencyContact}
            onChange={(e) => setContact({ ...contact, emergencyContact: e.target.value.replace(/\D/g, '').slice(0, 10) })}
            onBlur={() => handleFieldBlur('emergencyContact', contact.emergencyContact)}
            error={isFieldInvalid('emergencyContact') ? validationErrors['emergencyContact'] : undefined}
            showValid={isFieldValid('emergencyContact', contact.emergencyContact)}
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
      
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 -mx-6 md:mx-0 md:px-6 lg:rounded-b-xl shadow-lg z-40">
        <div className="flex justify-between max-w-7xl mx-auto">
          <Button variant="outline" onClick={() => setCurrentStep(3)}>
            <ChevronLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Button onClick={handleContactSubmit}>
            Next <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <GraduationCap className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Education History</h2>
          <p className="text-sm text-muted-foreground">Current education details</p>
        </div>
      </div>
      
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="School Name"
            required
            value={education.schoolName}
            onChange={(e) => setEducation({ ...education, schoolName: e.target.value })}
            placeholder="Enter school name"
          />
          <Select
            label="Standard"
            required
            value={education.standard}
            onChange={(e) => setEducation({ ...education, standard: e.target.value })}
            options={[
              { value: "", label: "Select Standard" },
              { value: "5th", label: "5th" },
              { value: "6th", label: "6th" },
              { value: "7th", label: "7th" },
              { value: "8th", label: "8th" },
              { value: "9th", label: "9th" },
              { value: "10th", label: "10th" },
              { value: "11th", label: "11th" },
              { value: "12th", label: "12th" },
              { value: "Undergraduate", label: "Undergraduate" },
              { value: "Postgraduate", label: "Postgraduate" },
            ]}
          />
          <Input
            label="City"
            value={education.city}
            onChange={(e) => setEducation({ ...education, city: e.target.value })}
            placeholder="Enter city"
          />
        </div>
      </div>
      
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 -mx-6 md:mx-0 md:px-6 lg:rounded-b-xl shadow-lg z-40">
        <div className="flex justify-between max-w-7xl mx-auto">
          <Button variant="outline" onClick={() => setCurrentStep(4)}>
            <ChevronLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Button onClick={handleEducationSubmit}>
            Next <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  const renderStep6 = () => (
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
      
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 -mx-6 md:mx-0 md:px-6 lg:rounded-b-xl shadow-lg z-40">
        <div className="flex justify-between max-w-7xl mx-auto">
          <Button variant="outline" onClick={() => setCurrentStep(5)}>
            <ChevronLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Button onClick={handleHealthSubmit}>
            Next <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  const renderStep7 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Upload className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Upload Documents</h2>
          <p className="text-sm text-muted-foreground">Upload required documents for verification</p>
        </div>
      </div>
      
      <div className="rounded-xl border border-border bg-card p-6 space-y-6">
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
          <FileText className="h-4 w-4" />
          <span>Accepted formats: JPG, PNG, PDF (max 5MB per file)</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { key: "photo", title: "Photo", subtitle: "Passport size photograph", formats: "JPG, PNG" },
            { key: "signature", title: "Signature", subtitle: "Your signature on white paper", formats: "JPG, PNG" },
            { key: "admissionFormFront", title: "Admission Form - Front", subtitle: "First page of filled form", formats: "PDF, JPG, PNG" },
            { key: "admissionFormBack", title: "Admission Form - Back", subtitle: "Second page of filled form", formats: "PDF, JPG, PNG" },
          ].map((doc) => {
            const file = documents[doc.key as keyof typeof documents];
            const isUploaded = !!file;
            
            return (
              <div key={doc.key} className={`flex flex-col gap-3 rounded-xl border-2 p-4 transition-all ${
                isUploaded
                  ? "border-emerald-300 bg-emerald-50/30"
                  : "border-dashed border-border bg-muted/20 hover:border-primary/40 hover:bg-muted/40"
              }`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      isUploaded
                        ? "bg-emerald-100 text-emerald-600"
                        : "bg-primary/10 text-primary"
                    }`}>
                      {isUploaded ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <FileText className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">{doc.title} <span className="text-destructive">*</span></h4>
                      <p className="text-xs text-muted-foreground">{doc.subtitle}</p>
                    </div>
                  </div>
                  {isUploaded && (
                    <button
                      onClick={() => handleFileChange(doc.key, null)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Remove file"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {isUploaded ? (
                  <div className="flex items-center gap-3 p-2 bg-card rounded-lg border">
                    {file?.type?.startsWith('image/') ? (
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <img 
                          src={URL.createObjectURL(file)} 
                          alt={doc.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-8 w-8 text-red-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{file?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {file ? (file.size / 1024 / 1024).toFixed(2) : '0'} MB
                      </p>
                      <p className="text-xs text-emerald-600 font-medium">Ready for upload</p>
                    </div>
                    <button
                      onClick={() => setPreviewDoc({ file, name: doc.title })}
                      className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                      title="Preview"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className={`cursor-pointer rounded-lg border-2 border-dashed px-4 py-3 text-center text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    "border-dashed border-input bg-background text-foreground hover:bg-accent hover:border-primary"
                  }`}>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileChange(doc.key, e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <Upload className="h-4 w-4" />
                    Upload {doc.formats}
                  </label>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <p className="text-sm text-muted-foreground">
            {Object.values(documents).filter(Boolean).length} of 4 documents uploaded
          </p>
          <div className="flex gap-2">
            {Object.entries(documents).map(([key, file]) => file && (
              <button
                key={key}
                onClick={() => setPreviewDoc({ file, name: key })}
                className="w-8 h-8 rounded-lg border bg-card hover:ring-2 hover:ring-primary/30 transition-all"
              >
                {file.type?.startsWith('image/') ? (
                  <img 
                    src={URL.createObjectURL(file)} 
                    alt={key}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 -mx-6 md:mx-0 md:px-6 lg:rounded-b-xl shadow-lg z-40">
        <div className="flex justify-between max-w-7xl mx-auto">
          <Button variant="outline" onClick={() => setCurrentStep(6)}>
            <ChevronLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Button onClick={handleDocumentsSubmit} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Registration"}
          </Button>
        </div>
      </div>
    </div>
  );

  const renderStep1 = () => (
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

      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 -mx-6 md:mx-0 md:px-6 lg:rounded-b-xl shadow-lg z-40">
        <div className="flex justify-end max-w-7xl mx-auto">
          <Button
            onClick={handleCoursesSubmit}
            disabled={submitting || (isProfileMode ? false : selectedCourses.length === 0)}
          >
            {submitting ? "Saving..." : "Next"} <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
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

  // Resume Draft Modal
  if (showResumeModal && savedDraft && !isEditing && !isProfileMode) {
    const savedDate = savedDraft.savedAt ? new Date(savedDraft.savedAt).toLocaleString() : "unknown time";
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
          <div className="text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 mx-auto mb-4">
              <FileText className="h-8 w-8 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Resume Registration?</h2>
            <p className="text-muted-foreground mb-2">
              You have an incomplete registration from:
            </p>
            <p className="text-sm font-medium text-foreground mb-6">{savedDate}</p>
            <div className="space-y-3">
              <Button onClick={handleResumeDraft} className="w-full">
                <BookOpen className="mr-2 h-4 w-4" />
                Resume Registration (Step {savedDraft.currentStep || 1})
              </Button>
              <Button variant="outline" onClick={handleStartFresh} className="w-full">
                Start Fresh
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <LinkButton href="/admin/student" variant="ghost" size="sm" className="w-fit -ml-2">
                <ChevronLeft className="mr-1 h-4 w-4" /> Back
              </LinkButton>
              {!isProfileMode && !isEditing && (
                <span className="text-xs text-muted-foreground">
                  Step {currentStep} of 7
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              {isProfileMode ? "Update Profile" : isEditing ? "Edit Registration" : "Student Registration"}
            </h1>
            <p className="text-muted-foreground">
              {isProfileMode ? "Update student profile information" : isEditing ? "Update registration details" : "Fill in the details to register a new student"}
            </p>
          </div>
          {!isProfileMode && !isEditing && registrationId && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {isSaving ? (
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  Saving...
                </span>
              ) : lastSaved ? (
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  All changes saved
                </span>
              ) : null}
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
                value={address.addressLine1}
                onChange={(e) => setAddress({ ...address, addressLine1: e.target.value })}
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

          <div className="space-y-6 pb-24">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
            {currentStep === 5 && renderStep5()}
            {currentStep === 6 && renderStep6()}
            {currentStep === 7 && renderStep7()}
          </div>
        </>
      )}

      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-xl bg-card">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h3 className="text-lg font-semibold text-foreground">{previewDoc.name}</h3>
              <button
                onClick={() => setPreviewDoc(null)}
                className="rounded-lg p-2 hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 overflow-auto max-h-[calc(90vh-60px)]">
              {previewDoc.file && previewDoc.file.type.startsWith("image/") ? (
                <img
                  src={URL.createObjectURL(previewDoc.file)}
                  alt={previewDoc.name}
                  className="max-w-full h-auto mx-auto"
                />
              ) : (
                <iframe
                  src={previewDoc.file ? URL.createObjectURL(previewDoc.file) : ""}
                  className="w-full h-[70vh] border-0"
                  title={previewDoc.name}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}