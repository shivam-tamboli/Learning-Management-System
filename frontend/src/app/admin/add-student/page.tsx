"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registrationService, courseService, documentService } from "@/lib/api";
import styles from "./register.module.css";

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
  }, []);

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

  const handleBasicDetailsSubmit = () => {
    if (!basicDetails.firstName || !basicDetails.lastName || !basicDetails.dob || !basicDetails.gender || !basicDetails.email) {
      alert("Please fill in all fields");
      return;
    }
    setCurrentStep(2);
  };

  const handleAddressSubmit = () => {
    if (!address.street || !address.city || !address.state || !address.pincode) {
      alert("Please fill in all address fields");
      return;
    }
    setCurrentStep(3);
  };

  const handleContactSubmit = () => {
    if (!contact.phone || !contact.emergencyContact) {
      alert("Please fill in phone numbers");
      return;
    }
    setCurrentStep(4);
  };

  const handleEducationSubmit = () => {
    if (!education.qualification || !education.institution || !education.year) {
      alert("Please fill in education details");
      return;
    }
    setCurrentStep(5);
  };

  const handleHealthSubmit = () => {
    setCurrentStep(6);
  };

  const handleDocumentsSubmit = () => {
    if (!documents.idProof || !documents.addressProof || !documents.educationCertificate) {
      alert("Please upload all required documents");
      return;
    }
    setCurrentStep(7);
  };

  const handlePaymentSubmit = () => {
    if (!payment.amount || parseFloat(payment.amount) <= 0) {
      alert("Please enter a valid payment amount");
      return;
    }
    setCurrentStep(8);
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
    if (selectedCourses.length === 0) {
      alert("Please select at least one course");
      return;
    }

    setSubmitting(true);
    try {
      const registrationRes = await registrationService.saveStep({
        courseIds: selectedCourses,
        step: 1,
        data: basicDetails,
      });

      const registrationId = registrationRes.data.id;

      await registrationService.saveStep({
        studentId: registrationId,
        step: 2,
        data: address,
      });

      await registrationService.saveStep({
        studentId: registrationId,
        step: 3,
        data: contact,
      });

      await registrationService.saveStep({
        studentId: registrationId,
        step: 4,
        data: education,
      });

      await registrationService.saveStep({
        studentId: registrationId,
        step: 5,
        data: health,
      });

      await registrationService.saveStep({
        studentId: registrationId,
        step: 6,
        data: payment,
      });

      await uploadDocuments(registrationId);

      alert("Registration submitted successfully!");
      router.push("/admin/student");
    } catch (error: any) {
      console.error("Registration failed:", error);
      alert(error.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <div className={styles.stepIndicator}>
      {[1, 2, 3, 4, 5, 6, 7, 8].map((step) => (
        <div
          key={step}
          className={`${styles.step} ${currentStep >= step ? styles.active : ""} ${currentStep === step ? styles.current : ""}`}
        >
          <div className={styles.stepNumber}>{step}</div>
          <div className={styles.stepLabel}>
            {step === 1 && "Basic"}
            {step === 2 && "Address"}
            {step === 3 && "Contact"}
            {step === 4 && "Education"}
            {step === 5 && "Health"}
            {step === 6 && "Documents"}
            {step === 7 && "Payment"}
            {step === 8 && "Courses"}
          </div>
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className={styles.formStep}>
      <h2>Basic Details</h2>
      <div className={styles.formGrid}>
        <div className={styles.field}>
          <label>First Name *</label>
          <input
            type="text"
            value={basicDetails.firstName}
            onChange={(e) => setBasicDetails({ ...basicDetails, firstName: e.target.value })}
            placeholder="Enter first name"
          />
        </div>
        <div className={styles.field}>
          <label>Last Name *</label>
          <input
            type="text"
            value={basicDetails.lastName}
            onChange={(e) => setBasicDetails({ ...basicDetails, lastName: e.target.value })}
            placeholder="Enter last name"
          />
        </div>
        <div className={styles.field}>
          <label>Date of Birth *</label>
          <input
            type="date"
            value={basicDetails.dob}
            onChange={(e) => setBasicDetails({ ...basicDetails, dob: e.target.value })}
          />
        </div>
        <div className={styles.field}>
          <label>Gender *</label>
          <select
            value={basicDetails.gender}
            onChange={(e) => setBasicDetails({ ...basicDetails, gender: e.target.value })}
          >
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className={styles.field}>
          <label>Email Address *</label>
          <input
            type="email"
            value={basicDetails.email}
            onChange={(e) => setBasicDetails({ ...basicDetails, email: e.target.value })}
            placeholder="student@example.com"
          />
        </div>
      </div>
      <div className={styles.actions}>
        <Link href="/admin/dashboard" className={styles.cancelBtn}>
          Cancel
        </Link>
        <button type="button" onClick={handleBasicDetailsSubmit} className={styles.nextBtn}>
          Next →
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className={styles.formStep}>
      <h2>Address Information</h2>
      <div className={styles.formGrid}>
        <div className={styles.field} style={{ gridColumn: "1 / -1" }}>
          <label>Street Address *</label>
          <input
            type="text"
            value={address.street}
            onChange={(e) => setAddress({ ...address, street: e.target.value })}
            placeholder="House No., Street Name, Area"
          />
        </div>
        <div className={styles.field}>
          <label>City *</label>
          <input
            type="text"
            value={address.city}
            onChange={(e) => setAddress({ ...address, city: e.target.value })}
            placeholder="City"
          />
        </div>
        <div className={styles.field}>
          <label>State *</label>
          <input
            type="text"
            value={address.state}
            onChange={(e) => setAddress({ ...address, state: e.target.value })}
            placeholder="State"
          />
        </div>
        <div className={styles.field}>
          <label>Pincode *</label>
          <input
            type="text"
            value={address.pincode}
            onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
            placeholder="6-digit pincode"
            maxLength={6}
          />
        </div>
      </div>
      <div className={styles.actions}>
        <button type="button" onClick={() => setCurrentStep(1)} className={styles.backBtn}>
          ← Back
        </button>
        <button type="button" onClick={handleAddressSubmit} className={styles.nextBtn}>
          Next →
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className={styles.formStep}>
      <h2>Contact Details</h2>
      <div className={styles.formGrid}>
        <div className={styles.field}>
          <label>Phone Number *</label>
          <input
            type="tel"
            value={contact.phone}
            onChange={(e) => setContact({ ...contact, phone: e.target.value })}
            placeholder="10-digit phone number"
            maxLength={10}
          />
        </div>
        <div className={styles.field}>
          <label>Emergency Contact Number *</label>
          <input
            type="tel"
            value={contact.emergencyContact}
            onChange={(e) => setContact({ ...contact, emergencyContact: e.target.value })}
            placeholder="10-digit phone number"
            maxLength={10}
          />
        </div>
        <div className={styles.field}>
          <label>Emergency Contact Name</label>
          <input
            type="text"
            value={contact.emergencyName}
            onChange={(e) => setContact({ ...contact, emergencyName: e.target.value })}
            placeholder="Emergency contact name"
          />
        </div>
        <div className={styles.field}>
          <label>Relationship</label>
          <select
            value={contact.relationship}
            onChange={(e) => setContact({ ...contact, relationship: e.target.value })}
          >
            <option value="">Select Relationship</option>
            <option value="parent">Parent</option>
            <option value="guardian">Guardian</option>
            <option value="spouse">Spouse</option>
            <option value="sibling">Sibling</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>
      <div className={styles.actions}>
        <button type="button" onClick={() => setCurrentStep(2)} className={styles.backBtn}>
          ← Back
        </button>
        <button type="button" onClick={handleContactSubmit} className={styles.nextBtn}>
          Next →
        </button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className={styles.formStep}>
      <h2>Education History</h2>
      <div className={styles.formGrid}>
        <div className={styles.field}>
          <label>Highest Qualification *</label>
          <select
            value={education.qualification}
            onChange={(e) => setEducation({ ...education, qualification: e.target.value })}
          >
            <option value="">Select Qualification</option>
            <option value="10th">10th Pass</option>
            <option value="12th">12th Pass</option>
            <option value="diploma">Diploma</option>
            <option value="graduation">Graduation</option>
            <option value="postgraduation">Post Graduation</option>
          </select>
        </div>
        <div className={styles.field}>
          <label>Institution/Board *</label>
          <input
            type="text"
            value={education.institution}
            onChange={(e) => setEducation({ ...education, institution: e.target.value })}
            placeholder="School/University name"
          />
        </div>
        <div className={styles.field}>
          <label>Year of Passing *</label>
          <input
            type="text"
            value={education.year}
            onChange={(e) => setEducation({ ...education, year: e.target.value })}
            placeholder="e.g., 2024"
            maxLength={4}
          />
        </div>
        <div className={styles.field}>
          <label>Percentage/CGPA</label>
          <input
            type="text"
            value={education.percentage}
            onChange={(e) => setEducation({ ...education, percentage: e.target.value })}
            placeholder="e.g., 85% or 8.5 CGPA"
          />
        </div>
      </div>
      <div className={styles.actions}>
        <button type="button" onClick={() => setCurrentStep(3)} className={styles.backBtn}>
          ← Back
        </button>
        <button type="button" onClick={handleEducationSubmit} className={styles.nextBtn}>
          Next →
        </button>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className={styles.formStep}>
      <h2>Health Information</h2>
      <p className={styles.subtitle}>This information helps us provide appropriate support</p>
      <div className={styles.formGrid}>
        <div className={styles.field} style={{ gridColumn: "1 / -1" }}>
          <label>Any Medical Conditions</label>
          <textarea
            value={health.conditions}
            onChange={(e) => setHealth({ ...health, conditions: e.target.value })}
            placeholder="List any medical conditions (or write 'None')"
            rows={3}
          />
        </div>
        <div className={styles.field} style={{ gridColumn: "1 / -1" }}>
          <label>Current Medications</label>
          <textarea
            value={health.medications}
            onChange={(e) => setHealth({ ...health, medications: e.target.value })}
            placeholder="List any current medications (or write 'None')"
            rows={2}
          />
        </div>
        <div className={styles.field} style={{ gridColumn: "1 / -1" }}>
          <label>Allergies</label>
          <textarea
            value={health.allergies}
            onChange={(e) => setHealth({ ...health, allergies: e.target.value })}
            placeholder="List any allergies (food, medicine, etc.)"
            rows={2}
          />
        </div>
      </div>
      <div className={styles.actions}>
        <button type="button" onClick={() => setCurrentStep(4)} className={styles.backBtn}>
          ← Back
        </button>
        <button type="button" onClick={handleHealthSubmit} className={styles.nextBtn}>
          Next →
        </button>
      </div>
    </div>
  );

  const renderStep6 = () => (
    <div className={styles.formStep}>
      <h2>Upload Documents</h2>
      <p className={styles.subtitle}>Please upload the following documents (PDF, JPG, PNG)</p>
      
      <div className={styles.documentList}>
        <div className={styles.documentItem}>
          <div className={styles.documentInfo}>
            <h4>ID Proof *</h4>
            <p>Aadhaar Card, PAN Card, Passport, or Voter ID</p>
          </div>
          <label className={styles.uploadButton}>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => handleFileChange("idProof", e.target.files?.[0] || null)}
              style={{ display: "none" }}
            />
            {documents.idProof ? documents.idProof.name : "Choose File"}
          </label>
          {documents.idProof && (
            <span className={styles.fileName}>{documents.idProof.name}</span>
          )}
        </div>

        <div className={styles.documentItem}>
          <div className={styles.documentInfo}>
            <h4>Address Proof *</h4>
            <p>Utility Bill, Bank Statement, or Rent Agreement</p>
          </div>
          <label className={styles.uploadButton}>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => handleFileChange("addressProof", e.target.files?.[0] || null)}
              style={{ display: "none" }}
            />
            {documents.addressProof ? documents.addressProof.name : "Choose File"}
          </label>
          {documents.addressProof && (
            <span className={styles.fileName}>{documents.addressProof.name}</span>
          )}
        </div>

        <div className={styles.documentItem}>
          <div className={styles.documentInfo}>
            <h4>Education Certificate *</h4>
            <p>Highest qualification certificate or marksheet</p>
          </div>
          <label className={styles.uploadButton}>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => handleFileChange("educationCertificate", e.target.files?.[0] || null)}
              style={{ display: "none" }}
            />
            {documents.educationCertificate ? documents.educationCertificate.name : "Choose File"}
          </label>
          {documents.educationCertificate && (
            <span className={styles.fileName}>{documents.educationCertificate.name}</span>
          )}
        </div>
      </div>

      <div className={styles.documentSummary}>
        <div className={`${styles.docStatus} ${documents.idProof ? styles.complete : ""}`}>
          {documents.idProof ? "✓" : "○"} ID Proof
        </div>
        <div className={`${styles.docStatus} ${documents.addressProof ? styles.complete : ""}`}>
          {documents.addressProof ? "✓" : "○"} Address Proof
        </div>
        <div className={`${styles.docStatus} ${documents.educationCertificate ? styles.complete : ""}`}>
          {documents.educationCertificate ? "✓" : "○"} Education Certificate
        </div>
      </div>

      <div className={styles.actions}>
        <button type="button" onClick={() => setCurrentStep(5)} className={styles.backBtn}>
          ← Back
        </button>
        <button type="button" onClick={handleDocumentsSubmit} className={styles.nextBtn}>
          Next →
        </button>
      </div>
    </div>
  );

  const renderStep7 = () => (
    <div className={styles.formStep}>
      <h2>Payment Information</h2>
      <p className={styles.subtitle}>Record payment details for this registration</p>
      <div className={styles.formGrid}>
        <div className={styles.field}>
          <label>Amount (INR) *</label>
          <input
            type="number"
            value={payment.amount}
            onChange={(e) => setPayment({ ...payment, amount: e.target.value })}
            placeholder="Enter amount"
          />
        </div>
        <div className={styles.field}>
          <label>Payment Status</label>
          <select
            value={payment.status}
            onChange={(e) => setPayment({ ...payment, status: e.target.value as "pending" | "completed" })}
          >
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div className={styles.field}>
          <label>Reference / Transaction ID</label>
          <input
            type="text"
            value={payment.reference}
            onChange={(e) => setPayment({ ...payment, reference: e.target.value })}
            placeholder="Transaction ID, Receipt No., etc."
          />
        </div>
        <div className={styles.field}>
          <label>Notes</label>
          <textarea
            value={payment.notes}
            onChange={(e) => setPayment({ ...payment, notes: e.target.value })}
            placeholder="Any additional notes about the payment"
            rows={3}
            style={{ gridColumn: "1 / -1" }}
          />
        </div>
      </div>
      <div className={styles.actions}>
        <button type="button" onClick={() => setCurrentStep(6)} className={styles.backBtn}>
          ← Back
        </button>
        <button type="button" onClick={handlePaymentSubmit} className={styles.nextBtn}>
          Next →
        </button>
      </div>
    </div>
  );

  const renderStep8 = () => (
    <div className={styles.formStep}>
      <h2>Select Courses</h2>
      <p className={styles.subtitle}>Choose the courses you want to enroll in</p>
      
      {courses.length === 0 ? (
        <div className={styles.noCourses}>
          <p>No courses available. Please create courses first.</p>
          <Link href="/admin/course/manage" className={styles.manageLink}>
            Manage Courses →
          </Link>
        </div>
      ) : (
        <div className={styles.courseGrid}>
          {courses.map((course) => (
            <div
              key={course._id}
              className={`${styles.courseCard} ${selectedCourses.includes(course._id) ? styles.selected : ""}`}
              onClick={() => toggleCourse(course._id)}
            >
              <div className={styles.checkbox}>
                {selectedCourses.includes(course._id) && <span>✓</span>}
              </div>
              <div className={styles.courseInfo}>
                <h4>{course.title}</h4>
                <p>{course.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={styles.summary}>
        <h3>Registration Summary</h3>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}>
            <span>Name:</span>
            <strong>{basicDetails.firstName} {basicDetails.lastName}</strong>
          </div>
          <div className={styles.summaryItem}>
            <span>Email:</span>
            <strong>{basicDetails.email}</strong>
          </div>
          <div className={styles.summaryItem}>
            <span>Payment:</span>
            <strong className={payment.status === "completed" ? "text-green-600" : "text-yellow-600"}>
              {payment.status === "completed" ? "✓ Completed" : "○ Pending"} - ₹{payment.amount || 0}
            </strong>
          </div>
          <div className={styles.summaryItem}>
            <span>Selected Courses:</span>
            <strong>{selectedCourses.length}</strong>
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        <button type="button" onClick={() => setCurrentStep(7)} className={styles.backBtn}>
          ← Back
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className={styles.submitBtn}
          disabled={submitting || selectedCourses.length === 0}
        >
          {submitting ? "Submitting..." : "Submit Registration"}
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className={styles.container}>
        <p className={styles.loading}>Loading...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <Link href="/admin/dashboard" className={styles.backLink}>
            ← Back to Dashboard
          </Link>
          <h1>Student Registration</h1>
          <p>Fill in the details to register a new student</p>
        </div>
      </header>

      {renderStepIndicator()}

      <div className={styles.formContainer}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
        {currentStep === 5 && renderStep5()}
        {currentStep === 6 && renderStep6()}
        {currentStep === 7 && renderStep7()}
        {currentStep === 8 && renderStep8()}
      </div>
    </div>
  );
}