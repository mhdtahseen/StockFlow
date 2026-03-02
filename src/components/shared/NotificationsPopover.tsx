import React, { useState, useEffect } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Bell,
  CheckCircle2,
  History,
  TrendingUp,
  ShieldAlert,
} from "lucide-react";
import clsx from "clsx";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

type Notification = {
  id: string;
  type: "ROLE_PROMOTED" | "PHONE_SOLD" | "LEDGER_ENTRY" | "SYSTEM_ALERT";
  title: string;
  message: string;
  read_at: string | null;
  created_at: string;
};

export default function NotificationsPopover() {
  const { session } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!session?.user.id) return;

    // 1. Initial Fetch
    const fetchNotifications = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (data) setNotifications(data as Notification[]);
    };

    fetchNotifications();

    // 2. Realtime Subscription
    const channel = supabase
      .channel(`user-notifications-${session.user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${session.user.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${session.user.id}`,
        },
        (payload) => {
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === payload.new.id ? (payload.new as Notification) : n,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user.id]);

  const unreadCount = notifications.filter((n) => n.read_at === null).length;

  const markAllAsRead = async () => {
    if (!session?.user.id) return;
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", session.user.id)
      .is("read_at", null);

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          read_at: n.read_at || new Date().toISOString(),
        })),
      );
    }
  };

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id);

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, read_at: new Date().toISOString() } : n,
        ),
      );
    }
  };

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "PHONE_SOLD":
        return <TrendingUp size={14} className="text-emerald-500" />;
      case "ROLE_PROMOTED":
        return (
          <CheckCircle2
            size={14}
            className="text-[#064a98] dark:text-blue-500"
          />
        );
      case "LEDGER_ENTRY":
        return <History size={14} className="text-amber-500" />;
      case "SYSTEM_ALERT":
        return <ShieldAlert size={14} className="text-rose-500" />;
      default:
        return <Bell size={14} className="text-slate-500" />;
    }
  };

  const getRelativeTime = (isoString: string) => {
    const diff = Date.now() - new Date(isoString).getTime();
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors relative focus:outline-none focus:ring-2 focus:ring-[#064a98]/20">
          <Bell size={18} className="text-slate-600 dark:text-slate-400" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2.5 size-2.5 bg-rose-500 border-2 border-white dark:border-slate-800 rounded-full animate-pulse z-10"></span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-80 p-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-slate-200 dark:border-slate-800 shadow-2xl dark:shadow-black/50 z-[100] rounded-xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <span className="bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-[11px] font-semibold text-[#064a98] dark:text-blue-500 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
            >
              Mark all read
            </button>
          )}
        </div>

        <div className="max-h-[350px] overflow-y-auto w-full custom-scrollbar divide-y divide-slate-50 dark:divide-slate-800/50">
          {notifications.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center">
              <div className="size-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-3">
                <Bell
                  size={20}
                  className="text-slate-300 dark:text-slate-600"
                />
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                You're all caught up!
              </p>
              <p className="text-xs text-slate-400 mt-1">
                No new alerts to show right now.
              </p>
            </div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => markAsRead(n.id)}
                className={clsx(
                  "w-full text-left flex items-start gap-3 p-4 transition-colors",
                  n.read_at === null
                    ? "bg-blue-50/40 dark:bg-blue-900/10 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    : "bg-white dark:bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 opacity-75",
                )}
              >
                <div
                  className={clsx(
                    "p-2 rounded-full shrink-0 mt-0.5",
                    n.read_at === null
                      ? "bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700"
                      : "bg-slate-100 dark:bg-slate-800/50 text-slate-500",
                  )}
                >
                  {getIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <h4
                      className={clsx(
                        "text-xs font-bold leading-tight truncate",
                        n.read_at === null
                          ? "text-slate-900 dark:text-white"
                          : "text-slate-600 dark:text-slate-400",
                      )}
                    >
                      {n.title}
                    </h4>
                    <span className="text-[10px] font-semibold text-slate-400 shrink-0 mt-0.5">
                      {getRelativeTime(n.created_at)}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 line-clamp-2">
                    {n.message}
                  </p>
                </div>
                {n.read_at === null && (
                  <div className="size-2 rounded-full bg-[#064a98] dark:bg-blue-500 shrink-0 mt-1.5 shadow-sm shadow-blue-500/50" />
                )}
              </button>
            ))
          )}
        </div>

        <div className="p-2 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 text-center">
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
            Live Updates
          </span>
        </div>
      </PopoverContent>
    </Popover>
  );
}
