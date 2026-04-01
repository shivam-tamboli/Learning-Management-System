"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { userService } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  GraduationCap, 
  Heart, 
  Shield,
  AlertCircle,
  Loader2
} from "lucide-react";

interface ProfileData {
  id: string;
  name: string;
  email: string;
  role: string;
  approved: boolean;
  createdAt: string;
  registration: {
    basicDetails: {
      firstName?: string;
      lastName?: string;
      dob?: string;
      gender?: string;
    };
    address: {
      addressLine1?: string;
      addressLine2?: string;
      suburb?: string;
      landmark?: string;
      city?: string;
      state?: string;
      pincode?: string;
      district?: string;
      taluka?: string;
      country?: string;
      addressType?: string;
    };
    contact: {
      phone?: string;
      emergencyContact?: string;
      emergencyName?: string;
      relationship?: string;
    };
    education: {
      schoolName?: string;
      standard?: string;
      city?: string;
      qualification?: string;
      institution?: string;
      year?: string;
      percentage?: string;
    };
    health: {
      conditions?: string;
      medications?: string;
      allergies?: string;
    };
    enrolledCourses: string[];
  } | null;
}

interface InfoRowProps {
  label: string;
  value: string | undefined;
  icon?: React.ReactNode;
}

function InfoRow({ label, value, icon }: InfoRowProps) {
  return (
    <div className="flex items-start gap-3 py-2">
      {icon && <span className="mt-0.5 text-muted-foreground">{icon}</span>}
      <div className="flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium text-foreground">{value || "—"}</p>
      </div>
    </div>
  );
}

function SectionCard({ 
  title, 
  icon, 
  children 
}: { 
  title: string; 
  icon: React.ReactNode; 
  children: React.ReactNode 
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        {icon}
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="divide-y divide-border">
        {children}
      </CardContent>
    </Card>
  );
}

export default function StudentProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await userService.getCurrentUser();
      setProfile(res.data);
    } catch (err: any) {
      console.error("Failed to load profile:", err);
      setError(err.response?.data?.message || "Failed to load profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-foreground">Profile</h1>
          <p className="text-muted-foreground">View your profile information</p>
        </div>
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-destructive font-medium mb-4">{error}</p>
            <Button onClick={loadProfile}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const reg = profile.registration;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <p className="text-muted-foreground">View your profile information</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Account Information" icon={<Shield className="h-5 w-5 text-primary" />}>
          <InfoRow 
            label="Full Name" 
            value={profile.name} 
            icon={<User className="h-4 w-4" />} 
          />
          <InfoRow 
            label="Email Address" 
            value={profile.email} 
            icon={<Mail className="h-4 w-4" />} 
          />
          <InfoRow 
            label="Account Type" 
            value={profile.role === "admin" ? "Administrator" : "Student"} 
          />
          <InfoRow 
            label="Account Status" 
            value={profile.approved ? "Active" : "Inactive"} 
          />
          <InfoRow 
            label="Member Since" 
            value={formatDate(profile.createdAt)} 
          />
        </SectionCard>

        {reg?.basicDetails && (
          <SectionCard title="Personal Information" icon={<User className="h-5 w-5 text-primary" />}>
            <InfoRow 
              label="First Name" 
              value={reg.basicDetails.firstName} 
            />
            <InfoRow 
              label="Last Name" 
              value={reg.basicDetails.lastName} 
            />
            <InfoRow 
              label="Date of Birth" 
              value={formatDate(reg.basicDetails.dob)} 
            />
            <InfoRow 
              label="Gender" 
              value={reg.basicDetails.gender} 
            />
          </SectionCard>
        )}

        {reg?.contact && (
          <SectionCard title="Contact Information" icon={<Phone className="h-5 w-5 text-primary" />}>
            <InfoRow 
              label="Phone Number" 
              value={reg.contact.phone} 
              icon={<Phone className="h-4 w-4" />} 
            />
            <InfoRow 
              label="Emergency Contact" 
              value={reg.contact.emergencyContact} 
            />
            <InfoRow 
              label="Emergency Contact Name" 
              value={reg.contact.emergencyName} 
            />
            <InfoRow 
              label="Relationship" 
              value={reg.contact.relationship} 
            />
          </SectionCard>
        )}

        {reg?.address && (
          <SectionCard title="Address" icon={<MapPin className="h-5 w-5 text-primary" />}>
            <InfoRow 
              label="Street Address" 
              value={reg.address.addressLine1 || reg.address.addressLine2 || "—"} 
              icon={<MapPin className="h-4 w-4" />} 
            />
            <InfoRow 
              label="City" 
              value={reg.address.city} 
            />
            <InfoRow 
              label="State" 
              value={reg.address.state} 
            />
            <InfoRow 
              label="Pincode" 
              value={reg.address.pincode} 
            />
          </SectionCard>
        )}

        {reg?.education && (
          <SectionCard title="Education" icon={<GraduationCap className="h-5 w-5 text-primary" />}>
            <InfoRow 
              label="School Name" 
              value={reg.education.schoolName || reg.education.institution || "—"} 
              icon={<GraduationCap className="h-4 w-4" />} 
            />
            <InfoRow 
              label="Standard" 
              value={reg.education.standard || reg.education.qualification} 
            />
            {reg.education.city && (
              <InfoRow 
                label="City" 
                value={reg.education.city} 
              />
            )}
          </SectionCard>
        )}

        {reg?.health && (
          <SectionCard title="Health Information" icon={<Heart className="h-5 w-5 text-primary" />}>
            <InfoRow 
              label="Medical Conditions" 
              value={reg.health.conditions} 
              icon={<Heart className="h-4 w-4" />} 
            />
            <InfoRow 
              label="Current Medications" 
              value={reg.health.medications} 
            />
            <InfoRow 
              label="Allergies" 
              value={reg.health.allergies} 
            />
          </SectionCard>
        )}
      </div>

      {!reg && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="font-medium text-foreground mb-1">Registration Details Unavailable</p>
            <p className="text-sm text-muted-foreground">
              Your registration information is not yet available. Please contact the administrator.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
