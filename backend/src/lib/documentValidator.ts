export enum DocumentType {
  ID_PROOF = "ID Proof",
  ADDRESS_PROOF = "Address Proof",
  EDUCATION_CERT = "Education Certificate",
  PASSPORT = "Passport",
  DRIVING_LICENSE = "Driving License",
  HEALTH_CERT = "Health Certificate",
  PERMISSION_LETTER = "Permission Letter",
  OTHER = "Other"
}

export interface DocumentRequirement {
  type: DocumentType;
  label: string;
  required: boolean;
  maxSizeMB: number;
  acceptedFormats: string[];
  expireDays?: number;
  description: string;
}

export const DOCUMENT_REQUIREMENTS: Record<DocumentType, DocumentRequirement> = {
  [DocumentType.ID_PROOF]: {
    type: DocumentType.ID_PROOF,
    label: "ID Proof",
    required: true,
    maxSizeMB: 5,
    acceptedFormats: ["pdf", "jpg", "jpeg", "png"],
    description: "Aadhar, PAN, Voter ID, or Passport"
  },
  [DocumentType.ADDRESS_PROOF]: {
    type: DocumentType.ADDRESS_PROOF,
    label: "Address Proof",
    required: true,
    maxSizeMB: 5,
    acceptedFormats: ["pdf", "jpg", "jpeg", "png"],
    description: "Utility bill, lease agreement, or bank statement"
  },
  [DocumentType.EDUCATION_CERT]: {
    type: DocumentType.EDUCATION_CERT,
    label: "Education Certificate",
    required: true,
    maxSizeMB: 5,
    acceptedFormats: ["pdf", "jpg", "jpeg", "png"],
    description: "10th, 12th, or degree certificate"
  },
  [DocumentType.PASSPORT]: {
    type: DocumentType.PASSPORT,
    label: "Passport",
    required: false,
    maxSizeMB: 5,
    acceptedFormats: ["pdf", "jpg", "jpeg", "png"],
    expireDays: 3650,
    description: "Valid passport (optional)"
  },
  [DocumentType.DRIVING_LICENSE]: {
    type: DocumentType.DRIVING_LICENSE,
    label: "Driving License",
    required: false,
    maxSizeMB: 5,
    acceptedFormats: ["pdf", "jpg", "jpeg", "png"],
    expireDays: 365,
    description: "Valid driving license (optional)"
  },
  [DocumentType.HEALTH_CERT]: {
    type: DocumentType.HEALTH_CERT,
    label: "Health Certificate",
    required: false,
    maxSizeMB: 5,
    acceptedFormats: ["pdf", "jpg", "jpeg", "png"],
    expireDays: 365,
    description: "Medical fitness certificate (if required)"
  },
  [DocumentType.PERMISSION_LETTER]: {
    type: DocumentType.PERMISSION_LETTER,
    label: "Permission Letter",
    required: false,
    maxSizeMB: 5,
    acceptedFormats: ["pdf", "jpg", "jpeg", "png"],
    description: "From employer/institution if applicable"
  },
  [DocumentType.OTHER]: {
    type: DocumentType.OTHER,
    label: "Other",
    required: false,
    maxSizeMB: 10,
    acceptedFormats: ["pdf", "jpg", "jpeg", "png", "doc", "docx"],
    description: "Any other supporting document"
  }
};

const ACCEPTED_MIMES: Record<string, string[]> = {
  pdf: ["application/pdf"],
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  png: ["image/png"],
  doc: ["application/msword"],
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
};

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateDocument(
  file: { size: number; mimetype: string; originalname: string },
  documentType: DocumentType
): ValidationResult {
  const requirement = DOCUMENT_REQUIREMENTS[documentType];
  const errors: string[] = [];

  if (!requirement) {
    errors.push(`Unknown document type: ${documentType}`);
    return { valid: false, errors };
  }

  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB > requirement.maxSizeMB) {
    errors.push(`File size exceeds ${requirement.maxSizeMB}MB limit`);
  }

  const fileExt = file.originalname.split(".").pop()?.toLowerCase();
  if (!fileExt || !requirement.acceptedFormats.includes(fileExt)) {
    errors.push(
      `File format not accepted. Allowed: ${requirement.acceptedFormats.join(", ")}`
    );
  }

  if (fileExt) {
    const allowedMimes = ACCEPTED_MIMES[fileExt] || [];
    if (!allowedMimes.includes(file.mimetype)) {
      errors.push("Invalid file MIME type");
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function getRequiredDocuments(): DocumentType[] {
  const keys = Object.keys(DocumentType);
  return Object.values(DocumentType).filter(
    (type) => !keys.includes(type) && DOCUMENT_REQUIREMENTS[type as DocumentType]?.required
  );
}

export function getMissingDocuments(
  uploadedTypes: DocumentType[]
): DocumentType[] {
  const required = getRequiredDocuments();
  return required.filter((type) => !uploadedTypes.includes(type));
}

export function calculateExpiry(documentType: DocumentType): Date | null {
  const requirement = DOCUMENT_REQUIREMENTS[documentType];
  if (!requirement?.expireDays) {
    return null;
  }
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + requirement.expireDays);
  return expiryDate;
}

export function getFrontendDocumentTypes(): { key: string; title: string; subtitle: string }[] {
  return [
    { key: "idProof", title: "ID Proof", subtitle: "Aadhaar Card, PAN Card, Passport, or Voter ID" },
    { key: "addressProof", title: "Address Proof", subtitle: "Utility Bill, Bank Statement, or Rent Agreement" },
    { key: "educationCertificate", title: "Education Certificate", subtitle: "Highest qualification certificate or marksheet" }
  ];
}

export function mapFrontendToDocumentType(frontendKey: string): DocumentType {
  const mapping: Record<string, DocumentType> = {
    idProof: DocumentType.ID_PROOF,
    addressProof: DocumentType.ADDRESS_PROOF,
    educationCertificate: DocumentType.EDUCATION_CERT
  };
  return mapping[frontendKey] || DocumentType.OTHER;
}
