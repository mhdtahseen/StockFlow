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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const { session } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [email, setEmail] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [modalAvatars, setModalAvatars] = useState<string[]>([]);

  useEffect(() => {
    async function loadProfile() {
      if (!session?.user.id) return;
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("full_name, avatar_url, email, raw_user_meta_data")
          .eq("id", session.user.id)
          .single();

        if (error) throw error;

        if (data) {
          setFullName(data.full_name || "");
          setAvatarUrl(data.avatar_url || "");
          setEmail(data.email || session.user.email || "");
          setPhone(data.raw_user_meta_data?.phone || "");
        }
      } catch (err: any) {
        toast.error("Error loading profile", { description: err.message });
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, [session]);

  const handleUpdateProfile = async () => {
    if (!session?.user.id) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          avatar_url: avatarUrl,
        })
        .eq("id", session.user.id);

      if (error) throw error;

      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          avatar_url: avatarUrl,
          phone: phone,
        },
      });

      if (authError) throw authError;

      toast.success("Profile updated successfully");
    } catch (err: any) {
      toast.error("Failed to update profile", { description: err.message });
    } finally {
      setIsSaving(false);
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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 p-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#064a98] dark:text-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 font-sans antialiased text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <header className="sticky top-0 z-30 flex items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <Link
          to="/"
          className="mr-3 p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft size={20} className="text-slate-600 dark:text-slate-300" />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Your Profile</h1>
          <p className="text-slate-400 dark:text-slate-500 text-[11px] font-semibold uppercase tracking-wider mt-0.5">
            Manage your account
          </p>
        </div>
      </header>

      <main className="flex-1 p-4 max-w-lg mx-auto w-full space-y-6">
        <div className="flex flex-col items-center pt-2">
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
            <div className="absolute bottom-0 right-0 bg-[#064a98] dark:bg-blue-600 p-2 rounded-full border-2 border-white dark:border-slate-900 text-white shadow-md">
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
                  onChange={(e) => setFullName(e.target.value)}
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
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="pl-10 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                />
              </div>
            </div>

            <Button
              onClick={handleUpdateProfile}
              disabled={isSaving}
              className="w-full bg-[#064a98] hover:bg-blue-800 text-white font-semibold mt-2"
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

        <Card className="border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-black/20 bg-white dark:bg-slate-900 overflow-hidden border-t-[3px] border-t-amber-500">
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
                  onChange={(e) => setNewPassword(e.target.value)}
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
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                    ? "border-[#064a98] dark:border-blue-500 shadow-xl shadow-blue-900/10"
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
