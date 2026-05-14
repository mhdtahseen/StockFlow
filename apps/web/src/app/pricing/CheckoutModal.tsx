"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, CheckCircle2, XCircle, ExternalLink } from "lucide-react";

declare global {
  interface Window {
    // deno-lint-ignore no-explicit-any
    Razorpay: any;
  }
}

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptionId: string;
  planName: string;
  billingPeriod: "monthly" | "yearly";
  baseAmountPaise: number;
  feePaise: number;
  shortUrl?: string;
  onSuccess: (paymentId: string, subscriptionId: string) => void;
  onFailure: (error: string) => void;
}

type ModalState = "idle" | "loading" | "success" | "failed";

export default function CheckoutModal({
  isOpen,
  onClose,
  subscriptionId,
  planName,
  billingPeriod,
  baseAmountPaise,
  feePaise,
  onSuccess,
  onFailure,
}: CheckoutModalProps) {
  const [state, setState] = useState<ModalState>("idle");
  const [error, setError] = useState<string | null>(null);
  const rzpRef = useRef<unknown>(null);

  const baseAmount = baseAmountPaise / 100;
  const feeAmount  = feePaise / 100;
  const total      = baseAmount + feeAmount;

  // Load Razorpay checkout.js once
  useEffect(() => {
    if (document.getElementById("razorpay-sdk")) return;
    const script = document.createElement("script");
    script.id  = "razorpay-sdk";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (!isOpen || !subscriptionId) return;
    openRazorpay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, subscriptionId]);

  function openRazorpay() {
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    if (!keyId) {
      setError("Payment configuration error. Please contact support.");
      setState("failed");
      return;
    }
    if (!window.Razorpay) {
      // SDK not loaded yet — wait and retry
      setTimeout(openRazorpay, 500);
      return;
    }

    setState("loading");

    const options = {
      key:             keyId,
      subscription_id: subscriptionId,
      name:            "Finventree",
      description:     `${planName} · ${billingPeriod === "monthly" ? "Monthly" : "Yearly"} subscription`,
      image:           "https://finventree.com/icon-192.png",
      handler: function (response: { razorpay_payment_id: string; razorpay_subscription_id: string; razorpay_signature: string }) {
        setState("success");
        onSuccess(response.razorpay_payment_id, response.razorpay_subscription_id);
      },
      prefill: {},
      theme: { color: "#F59E0B" },
      modal: {
        ondismiss: () => {
          setState("idle");
          onClose();
        },
        confirm_close: true,
        escape: false,
      },
      notes: {
        subscription_id: subscriptionId,
      },
    };

    rzpRef.current = new window.Razorpay(options);
    // deno-lint-ignore no-explicit-any
    (rzpRef.current as any).on("payment.failed", (resp: { error: { description: string } }) => {
      setState("failed");
      const msg = resp?.error?.description ?? "Payment failed. Please try again.";
      setError(msg);
      onFailure(msg);
    });
    // deno-lint-ignore no-explicit-any
    (rzpRef.current as any).open();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="glass-card rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
        {state === "loading" && (
          <>
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-amber-500 mb-4" />
            <p className="font-semibold text-lg">Opening payment…</p>
            <p className="text-sm text-[var(--color-text-muted)] mt-2">
              Complete the payment in the Razorpay window.
            </p>
          </>
        )}

        {state === "success" && (
          <>
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400 mb-4" />
            <p className="font-bold text-xl mb-2">Subscription Active!</p>
            <p className="text-sm text-[var(--color-text-muted)] mb-6">
              Your <span className="font-semibold text-white">{planName}</span> plan is
              now active. Open the Finventree app to get started.
            </p>
            <a
              href="https://app.finventree.com"
              className="btn-primary w-full py-3 rounded-xl font-semibold text-sm inline-flex items-center justify-center gap-2"
            >
              Open App <ExternalLink className="h-4 w-4" />
            </a>
          </>
        )}

        {state === "failed" && (
          <>
            <XCircle className="mx-auto h-10 w-10 text-red-400 mb-4" />
            <p className="font-semibold text-lg mb-2">Payment Failed</p>
            <p className="text-sm text-[var(--color-text-muted)] mb-6">
              {error ?? "Something went wrong. Please try again."}
            </p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 btn-secondary py-3 rounded-xl font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => { setState("idle"); setError(null); openRazorpay(); }}
                className="flex-1 btn-primary py-3 rounded-xl font-semibold text-sm"
              >
                Retry
              </button>
            </div>
          </>
        )}

        {/* Fee breakdown — always visible below status */}
        {state !== "success" && (
          <div className="mt-6 rounded-xl bg-white/5 border border-white/10 p-4 text-left text-xs text-[var(--color-text-muted)] space-y-1.5">
            <div className="flex justify-between">
              <span>{planName} ({billingPeriod})</span>
              <span className="font-medium text-white">₹{baseAmount.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between">
              <span>Payment processing fee (~2%)</span>
              <span className="font-medium text-white">₹{feeAmount.toLocaleString("en-IN")}</span>
            </div>
            <div className="border-t border-white/10 pt-1.5 flex justify-between font-semibold text-white">
              <span>Total charged today</span>
              <span>₹{total.toLocaleString("en-IN")}</span>
            </div>
            <p className="text-[10px] text-[var(--color-text-muted)] pt-1">
              14-day free trial. First charge after trial ends.
              Cancel anytime before trial — you won't be billed.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
