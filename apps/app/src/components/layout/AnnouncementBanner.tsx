import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { X, Bell, AlertTriangle, Info, Megaphone, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Announcement = {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'critical' | 'feature';
  display_type: 'banner' | 'notification';
  target_role: 'all' | 'admin' | 'super-admin';
};

export default function AnnouncementBanner() {
  const { session, isAdmin, isSuperAdmin } = useAuth();
  const [activeAnnouncements, setActiveAnnouncements] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    // Load dismissed list from LocalStorage
    const saved = localStorage.getItem("stockflow_dismissed_banners");
    if (saved) {
      try {
        setDismissed(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse dismissed banners");
      }
    }

    fetchAnnouncements();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('announcement_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'system_announcements' },
        () => {
          fetchAnnouncements();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAnnouncements = async () => {
    const { data, error } = await supabase
      .from("system_announcements")
      .select("id, title, content, type, display_type, target_role")
      .eq("is_active", true)
      .eq("display_type", "banner")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch announcements:", error);
      return;
    }

    setActiveAnnouncements(data || []);
  };

  const currentRole = isSuperAdmin ? 'super-admin' : isAdmin ? 'admin' : 'all';
  
  // Filter by role and dismissal status
  const visible = activeAnnouncements.filter(item => {
    if (dismissed.includes(item.id)) return false;
    if (item.target_role === 'all') return true;
    if (item.target_role === 'admin' && (isAdmin || isSuperAdmin)) return true;
    if (item.target_role === 'super-admin' && isSuperAdmin) return true;
    return false;
  });

  const handleDismiss = (id: string) => {
    const newList = [...dismissed, id];
    setDismissed(newList);
    localStorage.setItem("stockflow_dismissed_banners", JSON.stringify(newList));
  };

  if (visible.length === 0) return null;

  // Only show the most recent one to keep UI clean
  const latest = visible[0];

  return (
    <div className={cn(
      "relative isolate flex items-center gap-x-6 overflow-hidden px-6 py-2.5 sm:px-3.5 sm:before:flex-1",
      getStyles(latest.type)
    )}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-1.5">
          <div className="flex aspect-square size-6 items-center justify-center rounded-lg bg-black/5 dark:bg-white/10 shrink-0">
             <img src="/logo.svg" className="size-4 grayscale invert brightness-0" alt="SF" />
          </div>
          <p className="text-sm leading-6 font-bold tracking-tight">
            {latest.title}
          </p>
        </div>
        
        <p className="text-sm leading-6 font-medium opacity-90 hidden sm:block">
          <svg viewBox="0 0 2 2" className="mx-2 inline h-0.5 w-0.5 fill-current" aria-hidden="true">
            <circle cx="1" cy="1" r="1" />
          </svg>
          {latest.content}
        </p>
      </div>

      <div className="flex flex-1 justify-end">
        <button 
          type="button" 
          className="-m-3 p-3 focus-visible:-outline-offset-4"
          onClick={() => handleDismiss(latest.id)}
        >
          <span className="sr-only">Dismiss</span>
          <X className="size-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function getStyles(type: Announcement['type']) {
  switch (type) {
    case 'critical': return "bg-rose-600 text-white";
    case 'warning': return "bg-amber-500 text-slate-900";
    case 'success': return "bg-emerald-600 text-white";
    case 'feature': return "bg-primary-600 text-white";
    default: return "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900";
  }
}
