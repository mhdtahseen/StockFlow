import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowLeft,
  Users,
  Shield,
  User,
  Plus,
  Copy,
  Check,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import clsx from "clsx";

interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  tenant_id: string;
}

export default function ManageTeam() {
  const { session, isAdmin } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [showInviteDetails, setShowInviteDetails] = useState(false);

  const [orgName, setOrgName] = useState<string>("");

  useEffect(() => {
    async function fetchTeam() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, email, full_name, role, tenant_id, tenants(name)")
          .order("role", { ascending: true });

        if (error) throw error;

        if (data) {
          setProfiles(data);
          if (data.length > 0) {
            setTenantId(data[0].tenant_id);
            // Extracted from related tenant table
            const tenantObj = data[0].tenants as any;
            if (tenantObj && tenantObj.name) {
              setOrgName(tenantObj.name);
            }
          }
        }
      } catch (err: any) {
        toast.error("Error fetching team", { description: err.message });
      } finally {
        setIsLoading(false);
      }
    }

    if (session) {
      fetchTeam();
    }
  }, [session]);

  const inviteLink = tenantId
    ? `${window.location.origin}/join?tenant_id=${tenantId}&org_name=${encodeURIComponent(orgName)}`
    : "";

  const handleCopy = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    setIsCopied(true);
    toast.success("Copied to clipboard!", {
      description: "Send this link to your associate to join your team.",
    });
    setTimeout(() => setIsCopied(false), 2000);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "super-admin":
        return (
          <span className="flex items-center gap-1 bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
            <Shield size={12} className="fill-current" /> Super-admin
          </span>
        );
      case "admin":
        return (
          <span className="flex items-center gap-1 bg-red-100 dark:bg-rose-950/50 text-red-700 dark:text-rose-400 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
            <Shield size={12} /> Admin
          </span>
        );
      case "manager":
        return (
          <span className="flex items-center gap-1 bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
            <Shield size={12} /> Manager
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
            <User size={12} /> Associate
          </span>
        );
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", userId);

      if (error) throw error;

      setProfiles((prev) =>
        prev.map((p) => (p.id === userId ? { ...p, role: newRole } : p)),
      );
      toast.success("Role updated successfully.");
    } catch (err: any) {
      toast.error("Failed to update role", { description: err.message });
    }
  };


  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 pb-6 font-sans antialiased text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] pb-3 border-b border-slate-100 dark:border-slate-800">
        <Link
          to="/"
          className="mr-3 p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft size={20} className="text-slate-600 dark:text-slate-300" />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Manage Team</h1>
          <p className="text-slate-400 dark:text-slate-500 text-[11px] font-semibold uppercase tracking-wider mt-0.5">
            Organization Access
          </p>
        </div>
      </header>

      <main className="flex-1 p-4">
        {/* Invite Section (Only Admins) */}
        {isAdmin && (
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm dark:shadow-black/20 border border-slate-200 dark:border-slate-800 mb-6">
            <div className="flex items-start gap-4">
              <div className="size-12 rounded-full bg-[#064a98]/10 dark:bg-blue-500/10 text-[#064a98] dark:text-blue-400 flex items-center justify-center shrink-0">
                <Users size={24} />
              </div>
              <div className="flex-1">
                <h2 className="text-base font-bold tracking-tight mb-1">
                  Invite Teammates
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                  Add associates to your organization. They will automatically
                  be granted limited associate access permissions.
                </p>
                {!showInviteDetails ? (
                  <Button
                    onClick={() => setShowInviteDetails(true)}
                    className="w-full bg-[#064a98] hover:bg-blue-800 text-white font-semibold py-2"
                  >
                    <Plus size={16} className="mr-2" />
                    Generate Invite Link
                  </Button>
                ) : (
                  <div className="space-y-3 mt-4">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Secret Invite Link
                    </label>
                    <div className="flex gap-2">
                      <Input
                        value={inviteLink}
                        readOnly
                        className="bg-slate-50 dark:bg-slate-950 flex-1 font-mono text-xs border-slate-200 dark:border-slate-800"
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                      />
                      <Button
                        onClick={handleCopy}
                        variant="secondary"
                        className={clsx(
                          "shrink-0 transition-colors w-12 flex justify-center",
                          isCopied
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-400"
                            : "",
                        )}
                      >
                        {isCopied ? <Check size={16} /> : <Copy size={16} />}
                      </Button>
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">
                      Warning: Anyone with this link can join your specified
                      organization and view your entire stock inventory and
                      specific sales ledgers.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Team List */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 pl-1">
            Current Members ({profiles.length})
          </h3>

          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm dark:shadow-black/20 border border-slate-100 dark:border-slate-800 overflow-hidden divide-y divide-slate-50 dark:divide-slate-800">
            {isLoading ? (
              <div className="p-8 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : profiles.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                No members found.
              </div>
            ) : (
              profiles.map((profile) => (
                <div key={profile.id} className="p-4 flex items-center gap-4">
                  <div className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 uppercase font-bold text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700">
                    {profile.full_name
                      ? profile.full_name.charAt(0)
                      : profile.email.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 truncate text-sm">
                        {profile.full_name || "Unknown User"}
                        {profile.id === session?.user.id && (
                          <span className="ml-1.5 text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded font-semibold uppercase">
                            You
                          </span>
                        )}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {profile.email}
                    </p>
                  </div>
                  <div>
                    {isAdmin && profile.id !== session?.user.id ? (
                      <Select
                        defaultValue={profile.role}
                        onValueChange={(val) =>
                          handleRoleChange(profile.id, val)
                        }
                      >
                        <SelectTrigger className="w-[120px] h-8 text-xs font-semibold bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                          <SelectValue placeholder="Role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">
                            <span className="flex items-center gap-1.5 font-bold text-rose-600 dark:text-rose-400">
                              <Shield size={12} /> Admin
                            </span>
                          </SelectItem>
                          <SelectItem value="manager">
                            <span className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
                              <Shield size={12} /> Manager
                            </span>
                          </SelectItem>
                          <SelectItem value="associate">
                            <span className="flex items-center gap-1.5 font-bold text-blue-600 dark:text-blue-400">
                              <User size={12} /> Associate
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      getRoleBadge(profile.role)
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
