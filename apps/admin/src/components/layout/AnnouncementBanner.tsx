"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { X, AlertTriangle, Info, Megaphone, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Announcement = {
  id: string;
  title: string;
  content: string;
  type: "info" | "warning" | "success" | "critical" | "feature";
  display_type: "banner" | "notification";
  target_role: "all" | "admin" | "super-admin";
};

function getStyles(type: string) {
  switch (type) {
    case "critical":
      return "bg-rose-600 text-white";
    case "warning":
      return "bg-amber-500 text-white";
    case "success":
      return "bg-emerald-600 text-white";
    case "feature":
      return "bg-purple-600 text-white";
    default:
      return "bg-blue-600 text-white";
  }
}

function getIcon(type: string) {
  switch (type) {
    case "critical":
      return <AlertTriangle className="size-4" />;
    case "warning":
      return <AlertTriangle className="size-4" />;
    case "success":
      return <CheckCircle2 className="size-4" />;
    case "feature":
      return <Megaphone className="size-4" />;
    default:
      return <Info className="size-4" />;
  }
}

export default function AnnouncementBanner() {
  const { isSuperAdmin } = useAuth();
  const [activeAnnouncements, setActiveAnnouncements] = useState<
    Announcement[]
  >([]);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("admin_dismissed_banners");
    if (saved) {
      try {
        setDismissed(JSON.parse(saved));
      } catch {}
    }

    fetchAnnouncements();

    const channel = supabase
      .channel("admin_announcement_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "system_announcements" },
        () => fetchAnnouncements()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAnnouncements = async () => {
    const { data } = await supabase
      .from("system_announcements")
      .select("id, title, content, type, display_type, target_role")
      .eq("is_active", true)
      .eq("display_type", "banner")
      .order("created_at", { ascending: false });

    setActiveAnnouncements(data || []);
  };

  const visible = activeAnnouncements.filter((item) => {
    if (dismissed.includes(item.id)) return false;
    if (item.target_role === "all") return true;
    if (item.target_role === "super-admin" && isSuperAdmin) return true;
    return false;
  });

  const handleDismiss = (id: string) => {
    const newList = [...dismissed, id];
    setDismissed(newList);
    localStorage.setItem("admin_dismissed_banners", JSON.stringify(newList));
  };

  if (visible.length === 0) return null;

  const latest = visible[0];

  return (
    <div
      className={cn(
        "relative isolate flex items-center gap-x-6 overflow-hidden px-6 py-2.5 sm:px-3.5 sm:before:flex-1",
        getStyles(latest.type)
      )}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-1.5">
          <div className="flex aspect-square size-6 items-center justify-center rounded-lg bg-black/10 shrink-0">
            {getIcon(latest.type)}
          </div>
          <p className="text-sm leading-6 font-bold tracking-tight">
            {latest.title}
          </p>
        </div>
        <p className="text-sm opacity-90">{latest.content}</p>
      </div>
      <div className="flex flex-1 justify-end">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-white hover:bg-white/20 hover:text-white"
          onClick={() => handleDismiss(latest.id)}
        >
          <X className="size-4" />
          <span className="sr-only">Dismiss</span>
        </Button>
      </div>
    </div>
  );
}
