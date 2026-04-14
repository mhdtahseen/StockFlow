import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Rocket } from "lucide-react";

interface ComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

export default function ComingSoonModal({
  isOpen,
  onClose,
  title = "Feature Coming Soon",
  description = "We are currently hard at work building this feature! It will be available in our next major release.",
  icon = (
    <Rocket className="h-10 w-10 text-primary-500 dark:text-blue-500 mb-2 animate-bounce" />
  ),
}: ComingSoonModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-slate-200 dark:border-slate-800 text-center">
        <DialogHeader className="flex flex-col items-center pt-6">
          <div className="size-16 rounded-full bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center mb-4 border border-blue-100 dark:border-blue-900">
            {icon}
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500 dark:text-slate-400 mt-2 px-4 leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center py-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/30 px-3 py-1.5 rounded-full border border-amber-100 dark:border-amber-900/50">
            <Loader2 size={12} className="animate-spin" />
            Work in Progress
          </div>
        </div>
        <DialogFooter className="sm:justify-center pb-2">
          <Button
            type="button"
            onClick={onClose}
            className="bg-primary-500 hover:bg-blue-800 text-white w-full sm:w-auto"
          >
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
