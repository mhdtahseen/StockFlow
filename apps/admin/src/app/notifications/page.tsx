"use client";

import AdminShell from "@/components/AdminShell";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  Bell,
  Send,
  Trash2,
  Eye,
  EyeOff,
  AlertTriangle,
  Info,
  Megaphone,
  Smartphone,
  Plus,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

type Announcement = {
  id: string;
  title: string;
  content: string;
  type: "info" | "warning" | "success" | "critical" | "feature";
  display_type: "banner" | "notification";
  target_role: "all" | "admin" | "super-admin";
  is_active: boolean;
  starts_at: string;
  expires_at: string | null;
  created_at: string;
};

function getTypeIcon(type: string) {
  switch (type) {
    case "critical":
      return <AlertTriangle className="size-4 text-rose-500" />;
    case "warning":
      return <AlertTriangle className="size-4 text-amber-500" />;
    case "success":
      return <CheckCircle2 className="size-4 text-emerald-500" />;
    case "feature":
      return <Megaphone className="size-4 text-purple-500" />;
    default:
      return <Info className="size-4 text-blue-500" />;
  }
}

function NotificationsContent() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<Announcement["type"]>("info");
  const [displayType, setDisplayType] =
    useState<Announcement["display_type"]>("banner");
  const [targetRole, setTargetRole] =
    useState<Announcement["target_role"]>("all");

  const [pushTitle, setPushTitle] = useState("");
  const [pushMessage, setPushMessage] = useState("");
  const [pushTarget, setPushTarget] =
    useState<Announcement["target_role"]>("all");
  const [pushPlatform, setPushPlatform] = useState<"all" | "mobile" | "web">("all");
  const [isSendingPush, setIsSendingPush] = useState(false);
  const [pushBreakdown, setPushBreakdown] = useState<{ web: { success: number; failed: number }; native: { success: number; failed: number } } | null>(null);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("system_announcements")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load announcements");
    } else {
      setAnnouncements(data || []);
    }
    setIsLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    setIsSubmitting(true);
    const { error } = await supabase.from("system_announcements").insert([
      {
        title,
        content,
        type,
        display_type: displayType,
        target_role: targetRole,
        is_active: true,
      },
    ]);

    if (error) {
      toast.error("Failed to create announcement record");
      setIsSubmitting(false);
      return;
    }

    if (displayType === "notification") {
      const { error: broadcastError } = await supabase.rpc(
        "broadcast_system_notification",
        {
          p_title: title,
          p_message: content,
          p_target_role: targetRole,
        }
      );
      if (broadcastError) toast.error("Failed to send multi-user alerts");
    }

    setIsSubmitting(false);
    toast.success("Broadcast started!");
    setTitle("");
    setContent("");
    fetchAnnouncements();
  };

  const handleSendPush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pushTitle || !pushMessage) {
      toast.error("Please fill in both title and message");
      return;
    }

    setIsSendingPush(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "send-push-broadcast",
        {
          body: {
            title: pushTitle,
            message: pushMessage,
            target_role: pushTarget,
            platform: pushPlatform,
            url: "/",
          },
        }
      );

      if (error) throw error;

      if (data?.error) {
        toast.error(`Push failed: ${data.error}`);
      } else {
        setPushBreakdown(data.breakdown ?? null);
        toast.success(
          `Sent to ${data.successCount} device${data.successCount !== 1 ? 's' : ''} ` +
          (data.breakdown ? `(web: ${data.breakdown.web.success}, native: ${data.breakdown.native.success})` : ''),
        );
        setPushTitle("");
        setPushMessage("");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to trigger push notification");
    } finally {
      setIsSendingPush(false);
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from("system_announcements")
      .update({ is_active: !current })
      .eq("id", id);

    if (error) {
      toast.error("Update failed");
    } else {
      fetchAnnouncements();
    }
  };

  const deleteAnnouncement = async (id: string) => {
    const { error } = await supabase
      .from("system_announcements")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Delete failed");
    } else {
      toast.success("Broadcast removed");
      fetchAnnouncements();
    }
  };

  return (
    <div className="p-4 sm:p-5 w-full space-y-6 overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 uppercase">
            Broadcast Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage system-wide announcements and push notifications.
          </p>
        </div>
      </div>

      <Tabs defaultValue="in-app" className="w-full">
        <TabsList className="bg-slate-100 dark:bg-slate-900 p-1 rounded-xl mb-6">
          <TabsTrigger
            value="in-app"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Megaphone className="size-4 mr-2" />
            In-App Broadcast
          </TabsTrigger>
          <TabsTrigger
            value="push"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Smartphone className="size-4 mr-2" />
            Push Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="in-app" className="space-y-6 outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5">
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2 text-sm uppercase">
                  <Plus className="size-4 text-primary-500" />
                  New Broadcast
                </h3>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Title
                    </label>
                    <Input
                      placeholder="e.g. Scheduled Maintenance"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="rounded-lg h-10 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Content
                    </label>
                    <Textarea
                      placeholder="Enter the broadcast message..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="rounded-lg min-h-[100px] text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Display As
                      </label>
                      <select
                        className="w-full h-10 px-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-bold"
                        value={displayType}
                        onChange={(e) =>
                          setDisplayType(
                            e.target.value as Announcement["display_type"]
                          )
                        }
                      >
                        <option value="banner">Banner (Topbar)</option>
                        <option value="notification">Popup (Inbox)</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Type Color
                      </label>
                      <select
                        className="w-full h-10 px-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-bold"
                        value={type}
                        onChange={(e) =>
                          setType(e.target.value as Announcement["type"])
                        }
                        disabled={displayType === "notification"}
                      >
                        <option value="info">Info (Blue)</option>
                        <option value="warning">Warning (Amber)</option>
                        <option value="critical">Critical (Red)</option>
                        <option value="success">Success (Green)</option>
                        <option value="feature">Feature (Purple)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Target Audience
                    </label>
                    <select
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm font-medium"
                      value={targetRole}
                      onChange={(e) =>
                        setTargetRole(
                          e.target.value as Announcement["target_role"]
                        )
                      }
                    >
                      <option value="all">Everyone</option>
                      <option value="admin">Admins Only</option>
                      <option value="super-admin">Super Admins</option>
                    </select>
                  </div>

                  <Button
                    type="submit"
                    className="w-full rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-bold"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="animate-spin size-4" />
                    ) : (
                      <Send className="size-4 mr-2" />
                    )}
                    Broadcast Live
                  </Button>
                </form>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 text-sm uppercase">
                <Bell className="size-4 text-slate-400" />
                Recent History
              </h3>

              {isLoading ? (
                <div className="flex justify-center p-12">
                  <Loader2 className="animate-spin text-primary-500 h-8 w-8" />
                </div>
              ) : announcements.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                  <p className="text-slate-400 text-sm">No recent broadcasts.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {announcements.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {getTypeIcon(item.type)}
                            <h4 className="font-bold text-slate-900 dark:text-slate-100 truncate text-sm">
                              {item.title}
                            </h4>
                            <Badge
                              variant="outline"
                              className="text-[10px] font-bold"
                            >
                              {item.target_role.toUpperCase()}
                            </Badge>
                            <Badge
                              variant="secondary"
                              className="text-[9px] font-medium uppercase tracking-tighter bg-slate-100 dark:bg-slate-800"
                            >
                              {item.display_type}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                            {item.content}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-2 lowercase">
                            Sent {new Date(item.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg"
                            onClick={() => toggleActive(item.id, item.is_active)}
                          >
                            {item.is_active ? (
                              <Eye className="size-4 text-emerald-500" />
                            ) : (
                              <EyeOff className="size-4 text-slate-400" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                            onClick={() => deleteAnnouncement(item.id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="push" className="outline-none">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="size-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                Push Broadcaster
              </h3>
              <p className="text-slate-500 text-sm">
                Send a push notification to Android, iOS, and/or web subscribers.
              </p>
            </div>

            <form onSubmit={handleSendPush} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Heading
                </label>
                <Input
                  placeholder="e.g. 🚀 Stock Revamped!"
                  value={pushTitle}
                  onChange={(e) => setPushTitle(e.target.value)}
                  className="rounded-lg h-11"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Message Body
                </label>
                <Textarea
                  placeholder="We've added new features to help you track faster. Check it out now!"
                  value={pushMessage}
                  onChange={(e) => setPushMessage(e.target.value)}
                  className="rounded-lg min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Target Segment
                  </label>
                  <select
                    className="w-full h-11 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm font-medium"
                    value={pushTarget}
                    onChange={(e) =>
                      setPushTarget(e.target.value as Announcement["target_role"])
                    }
                  >
                    <option value="all">Everyone subscribed</option>
                    <option value="admin">Admins Only</option>
                    <option value="super-admin">Super Admins</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Platform
                  </label>
                  <select
                    className="w-full h-11 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm font-medium"
                    value={pushPlatform}
                    onChange={(e) => setPushPlatform(e.target.value as "all" | "mobile" | "web")}
                  >
                    <option value="all">All Platforms</option>
                    <option value="mobile">Mobile Only (Android + iOS)</option>
                    <option value="web">Web Only (PWA)</option>
                  </select>
                </div>
              </div>

              {pushBreakdown && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Web</p>
                    <p className="text-lg font-black text-slate-900 dark:text-slate-100">{pushBreakdown.web.success}</p>
                    {pushBreakdown.web.failed > 0 && (
                      <p className="text-[10px] text-rose-400">{pushBreakdown.web.failed} failed</p>
                    )}
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Native</p>
                    <p className="text-lg font-black text-slate-900 dark:text-slate-100">{pushBreakdown.native.success}</p>
                    {pushBreakdown.native.failed > 0 && (
                      <p className="text-[10px] text-rose-400">{pushBreakdown.native.failed} failed</p>
                    )}
                  </div>
                </div>
              )}

              <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/20">
                <div className="flex gap-3 text-blue-700 dark:text-blue-400">
                  <Info className="size-4 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    This notification will appear even if the app is closed.
                    Drive users back with something quirky!
                  </p>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 rounded-xl bg-slate-950 dark:bg-white dark:text-slate-950 text-white font-bold text-md shadow-lg hover:scale-[1.01] active:scale-95 transition-all"
                disabled={isSendingPush}
              >
                {isSendingPush ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <>
                    <Send className="size-4 mr-2" /> Blast Push Notification
                  </>
                )}
              </Button>
            </form>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <AdminShell>
      <NotificationsContent />
    </AdminShell>
  );
}
