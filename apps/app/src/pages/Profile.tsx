import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowLeft,
  User,
  Mail,
  Lock,
  Loader2,
  Pencil,
  Save,
  Phone,
  Building2,
  MapPin,
  ClipboardCheck,
  LogOut,
  Copy,
  CheckCheck,
  Share2,
} from "lucide-react";
import { usePlan } from "@/hooks/usePlan";
import { Clipboard } from "@capacitor/clipboard";
import { Share } from "@capacitor/share";
import { Capacitor } from "@capacitor/core";
import { QRCodeSVG } from "qrcode.react";
import { Loader } from "@/components/shared/Loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea.tsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

import { createAvatar } from "@dicebear/core";
import { botttsNeutral } from "@dicebear/collection";

// Generator helper to create unique avatar arrays dynamically
const generateRandomAvatars = () => {
  return Array.from({ length: 16 }).map(() => {
    const randomSeed = Math.random().toString(36).substring(2, 10);
    return createAvatar(botttsNeutral, {
      seed: randomSeed,
      backgroundColor: ["b6e3f4", "c0aede", "d1d4f9", "ffd5dc", "ffdfbf"],
    }).toDataUri();
  });
};

export default function ProfilePage() {
  const { session, tenant, refreshTenant, refreshProfile, signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingBusiness, setIsSavingBusiness] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const { canUse } = usePlan();

  const handleCopyTradeCode = () => {
    if (!tenant?.tradeCode) return;
    if (Capacitor.isNativePlatform()) {
      Clipboard.write({ string: tenant.tradeCode }).then(() => {
        setCodeCopied(true);
        setTimeout(() => setCodeCopied(false), 2000);
      });
    } else {
      navigator.clipboard.writeText(tenant.tradeCode).then(() => {
        setCodeCopied(true);
        setTimeout(() => setCodeCopied(false), 2000);
      });
    }
  };

  const handleShareConnectLink = async () => {
    if (!tenant?.tradeCode) return;
    const url = `https://finventree.app/connect/${tenant.tradeCode}`;
    if (Capacitor.isNativePlatform()) {
      await Share.share({
        title: `Connect with ${tenant.name} on Finventree`,
        text: `Scan my Trade Code to connect on Finventree: ${tenant.tradeCode}`,
        url,
      });
    } else if (navigator.share) {
      await navigator.share({ title: `Connect with ${tenant.name} on Finventree`, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Connect link copied!");
    }
  };

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [email, setEmail] = useState("");

  // Business State
  const [storeName, setStoreName] = useState("");
  const [storeAddress, setStoreAddress] = useState("");
  const [storeGSTIN, setStoreGSTIN] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [modalAvatars, setModalAvatars] = useState<string[]>([]);

  useEffect(() => {
    async function loadProfileData() {
      if (!session?.user.id) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("full_name, avatar_url, email")
          .eq("id", session.user.id)
          .single();

        if (error && error.code !== "PGRST116") {
          console.error("Error loading profile:", error);
        }

        if (data) {
          setFullName(data.full_name || "");
          setAvatarUrl(data.avatar_url || "");
          setEmail(data.email || session.user.email || "");
        } else {
          setEmail(session.user.email || "");
          setFullName(session.user.user_metadata?.full_name || "");
          setAvatarUrl(session.user.user_metadata?.avatar_url || "");
        }
        
        setPhone(session.user.user_metadata?.phone || "");
      } catch (err: any) {
        console.error("Profile load catch:", err);
      } finally {
        setIsLoading(false);
      }
    }

    // Proactive sync for business details from tenant source-of-truth
    if (tenant) {
      setStoreName(tenant.name || session?.user.user_metadata?.org_name || "");
      setStoreAddress(tenant.address || "");
      setStoreGSTIN(tenant.gstin || "");
    }

    loadProfileData();
  }, [session, tenant]);

  const handleUpdateProfile = async () => {
    if (!session?.user.id) return;
    const trimmedFullName = fullName.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedFullName) {
      toast.error("Full name is required");
      setIsSaving(false);
      return;
    }

    try {
      // Use upsert to ensure the profile record exists
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: session.user.id,
          tenant_id: tenant?.id || session.user.user_metadata.tenant_id,
          full_name: trimmedFullName,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });


      if (error) throw error;

      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: trimmedFullName,
          avatar_url: avatarUrl,
          phone: trimmedPhone,
        },
      });

      if (authError) throw authError;

      // Also sync to tenant if it exists
      if (tenant?.id) {
        const { error: tenantError } = await supabase
          .from("tenants")
          .update({ phone: trimmedPhone })
          .eq("id", tenant.id);
        
        if (tenantError) {
          console.warn("Could not update phone in tenant table (likely RLS), but auth metadata updated.", tenantError);
        }
      }

      await refreshTenant();
      await refreshProfile();
      
      toast.success("Profile updated successfully");
    } catch (err: any) {
      console.error("Error updating profile:", err);
      toast.error(err.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateBusiness = async () => {
    const trimmedStoreName = storeName.trim();
    const trimmedStoreAddress = storeAddress.trim();
    const trimmedPhone = phone.trim();
    const trimmedGSTIN = storeGSTIN.trim().toUpperCase();

    if (!trimmedStoreName || !trimmedStoreAddress || !trimmedPhone) {
      toast.error("Please fill in all mandatory fields (Name, Address, Phone)");
      return;
    }

    if (!tenant?.id) {
      toast.error("No business account associated with your profile.");
      return;
    }

    setIsSavingBusiness(true);
    try {
      const { error } = await supabase
        .from("tenants")
        .update({
          name: trimmedStoreName,
          address: trimmedStoreAddress,
          phone: trimmedPhone,
          gstin: trimmedGSTIN || null,
        })
        .eq("id", tenant.id);

      if (error) throw error;

      // Also sync to auth metadata
      await supabase.auth.updateUser({
        data: {
          phone: trimmedPhone,
          org_name: trimmedStoreName,
        },
      });

      await refreshTenant();
      toast.success("Business profile updated successfully");
      // Note: Tenant info in AuthContext will refresh on next poll or page reload
    } catch (err: any) {
      toast.error("Failed to update business profile", {
        description: err.message,
      });
    } finally {
      setIsSavingBusiness(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      toast.success("Password updated successfully");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error("Failed to update password", { description: err.message });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleOpenAvatarModal = () => {
    setModalAvatars(generateRandomAvatars());
    setIsAvatarModalOpen(true);
  };

  const handleSelectAvatar = (url: string) => {
    setAvatarUrl(url);
    setIsAvatarModalOpen(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 pb-6 font-sans antialiased text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <Loader isLoading={isLoading} />

      <main className="flex-1 p-4 max-w-lg mx-auto w-full space-y-6">
        <div className="flex flex-col items-center pt-2">
          {tenant?.name && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-primary-500/10 dark:bg-blue-500/10 text-primary-500 dark:text-blue-400 rounded-full border border-primary-500/10 dark:border-blue-500/10 mb-5">
              <Building2 size={12} className="fill-current/10" />
              <span className="text-[10px] font-black uppercase tracking-[0.15em] leading-none">
                {tenant.name}
              </span>
            </div>
          )}
          
          <div
            className="relative mb-4 group cursor-pointer"
            onClick={handleOpenAvatarModal}
          >
            <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-800 border-4 border-white dark:border-slate-900 shadow-xl overflow-hidden flex items-center justify-center">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={40} className="text-slate-400" />
              )}
            </div>
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Pencil className="text-white" size={24} />
            </div>
            <div className="absolute bottom-0 right-0 bg-primary-500 dark:bg-blue-600 p-2 rounded-full border-2 border-white dark:border-slate-900 text-white shadow-md transition-transform hover:scale-110">
              <Pencil size={14} />
            </div>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {fullName || "User"}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{email}</p>
        </div>

        <Card className="border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-black/20 bg-white dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="text-lg">Personal Information</CardTitle>
            <CardDescription>
              Update your personal details here.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  readOnly
                  disabled
                  className="pl-10 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 opacity-100 cursor-not-allowed"
                />
              </div>
              <p className="text-[10px] text-slate-400">
                Email cannot be changed directly.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFullName(e.target.value)
                  }
                  placeholder="John Doe"
                  className="pl-10 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPhone(e.target.value)
                  }
                  placeholder="+1 (555) 000-0000"
                  className="pl-10 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                />
              </div>
            </div>

            <Button
              onClick={handleUpdateProfile}
              disabled={isSaving}
              className="w-full bg-primary-500 hover:bg-blue-800 text-white font-semibold mt-2"
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Profile
            </Button>
          </CardContent>
        </Card>

        {/* Business Profile Card */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-black/20 bg-white dark:bg-slate-900 border-t-[3px]">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="text-primary-500" size={20} />
              <CardTitle className="text-lg">Business Identity</CardTitle>
            </div>
            <CardDescription>
              Details used for invoices and financial headers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="storeName">Business Name</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="storeName"
                  value={storeName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setStoreName(e.target.value)
                  }
                  placeholder="Smart Inventory HQ"
                  className="pl-10 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="storeAddress">Business Address</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Textarea
                  id="storeAddress"
                  value={storeAddress}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setStoreAddress(e.target.value)
                  }
                  placeholder="Full address with city, state, and pincode"
                  className="pl-10 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 resize-none"
                  rows={3}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="storeGSTIN">GSTIN (Optional)</Label>
              <div className="relative">
                <ClipboardCheck className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="storeGSTIN"
                  value={storeGSTIN}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setStoreGSTIN(e.target.value.toUpperCase())
                  }
                  placeholder="29AAAAA0000A1Z5"
                  className="pl-10 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 uppercase"
                />
              </div>
            </div>

            <Button
              onClick={handleUpdateBusiness}
              disabled={isSavingBusiness}
              className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold mt-2"
            >
              {isSavingBusiness ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Business Details
            </Button>
          </CardContent>
        </Card>

        {canUse("trade_network") && (
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-black/20 bg-white dark:bg-slate-900">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
                  <Building2 size={18} />
                </div>
                <div>
                  <CardTitle className="text-lg">Trade Network</CardTitle>
                  <CardDescription>Share your Trade Code or QR to connect with other Finventree businesses</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* QR Code */}
              {tenant?.tradeCode && (
                <div className="flex flex-col items-center gap-3 py-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="bg-white p-3 rounded-2xl shadow-sm">
                    <QRCodeSVG
                      value={`com.hyllos.finventree://connect/${tenant.tradeCode}`}
                      size={160}
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Scan to connect on Finventree
                  </p>
                </div>
              )}
              {/* Trade code + copy + share */}
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3">
                  <span className="text-2xl font-black tracking-[0.3em] text-slate-900 dark:text-white">
                    {tenant?.tradeCode ?? "------"}
                  </span>
                </div>
                <button
                  onClick={handleCopyTradeCode}
                  disabled={!tenant?.tradeCode}
                  className={`size-12 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                    codeCopied
                      ? "bg-emerald-500 text-white"
                      : "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 hover:bg-violet-200 dark:hover:bg-violet-900/50"
                  }`}
                >
                  {codeCopied ? <CheckCheck size={18} /> : <Copy size={18} />}
                </button>
                <button
                  onClick={handleShareConnectLink}
                  disabled={!tenant?.tradeCode}
                  className="size-12 rounded-xl flex items-center justify-center transition-all shrink-0 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 hover:bg-violet-200 dark:hover:bg-violet-900/50"
                >
                  <Share2 size={18} />
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-black/20 bg-white dark:bg-slate-900 overflow-hidden border-t-[3px] mb-30">
          <CardHeader>
            <CardTitle className="text-lg">Security Settings</CardTitle>
            <CardDescription>
              Update your password to keep your account secure.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewPassword(e.target.value)
                  }
                  placeholder="••••••••"
                  className="pl-10 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setConfirmPassword(e.target.value)
                  }
                  placeholder="••••••••"
                  className="pl-10 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                />
              </div>
            </div>
            <Button
              onClick={handleUpdatePassword}
              disabled={isSavingPassword || !newPassword}
              variant="outline"
              className="w-full border-amber-200 dark:border-amber-900/30 text-amber-700 dark:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20 mt-2"
            >
              {isSavingPassword ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Lock className="mr-2 h-4 w-4" />
              )}
              Update Password
            </Button>
          </CardContent>
        </Card>

        <Button
          onClick={() => signOut()}
          variant="ghost"
          className="w-full h-14 rounded-2xl text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-950/40 border border-rose-100 dark:border-rose-900/30 shadow-xs mt-4 transition-all active:scale-[0.98]"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Sign Out of Account
        </Button>
      </main>

      <Dialog open={isAvatarModalOpen} onOpenChange={setIsAvatarModalOpen}>
        <DialogContent className="sm:max-w-md max-w-[90%] w-[400px] p-5 border-none bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl rounded-3xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Choose an Avatar
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
              Select a new profile picture from the gallery below.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-4 gap-4 pb-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {modalAvatars.map((url, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectAvatar(url)}
                className={`w-full aspect-square rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden border-2 transition-all hover:scale-105 hover:shadow-lg ${
                  avatarUrl === url
                    ? "border-primary-500 dark:border-blue-500 shadow-xl shadow-blue-900/10"
                    : "border-transparent hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <img
                  src={url}
                  alt={`Avatar option ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="outline"
              className="w-full rounded-xl"
              onClick={() => setIsAvatarModalOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
