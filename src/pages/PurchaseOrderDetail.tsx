import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "@/app/hooks";
import {
  ChevronLeft,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from "lucide-react";
import { parseISO, format } from "date-fns";
import clsx from "clsx";
import { PurchaseOrder } from "@/features/purchasing/types";
import { selectCustomers } from "@/features/customers/selectors";
import { POConfirmSheet } from "@/components/shared/POConfirmSheet";
import { RecordPaymentSheet } from "@/components/shared/RecordPaymentSheet";
import {
  markPOItemAccepted,
  markPOItemRejected,
} from "@/features/purchasing/slice";
import { markAsInStock, removePhone } from "@/features/inventory/slice";
import { addEntry } from "@/features/ledger/slice";
import { toast } from "sonner";

export default function PurchaseOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const purchaseOrder = useAppSelector((state) =>
    state.purchasing.orders.find((o) => o.id === id),
  );
  const customers = useAppSelector(selectCustomers);
  const phones = useAppSelector((state) => state.inventory.phones);

  const [showConfirmSheet, setShowConfirmSheet] = useState(false);
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);

  const customer = useMemo(
    () => customers.find((c) => c.id === purchaseOrder?.counterpartyId),
    [customers, purchaseOrder],
  );

  const orderPhones = useMemo(() => {
    if (!purchaseOrder) return [];
    return purchaseOrder.items.map((item) => {
      const phone = phones.find((p) => p.id === item.phoneId);
      return { ...item, phone };
    });
  }, [purchaseOrder, phones]);

  if (!purchaseOrder) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <Package
            className="mx-auto text-slate-300 dark:text-slate-600 mb-3"
            size={48}
          />
          <p className="text-slate-500 dark:text-slate-400">
            Purchase Order not found
          </p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "AWAITING_RECEIPT":
        return "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-800";
      case "RECEIVED":
        return "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-800";
      case "PARTIAL":
        return "bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-400 border-orange-100 dark:border-orange-800";
      case "SETTLED":
        return "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800";
      case "CANCELLED":
        return "bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-400 border-slate-100 dark:border-slate-800";
      default:
        return "bg-slate-50 text-slate-700";
    }
  };

  const getItemStatusColor = (status: string) => {
    switch (status) {
      case "PENDING_INSPECTION":
        return "bg-amber-50 text-amber-700";
      case "ACCEPTED":
        return "bg-emerald-50 text-emerald-700";
      case "REJECTED":
        return "bg-rose-50 text-rose-700";
      default:
        return "bg-slate-50 text-slate-700";
    }
  };

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case "DIRECT":
        return "bg-purple-50 text-purple-700 dark:text-purple-400";
      case "PLATFORM":
        return "bg-teal-50 text-teal-700 dark:text-teal-400";
      case "INTER_TENANT":
        return "bg-indigo-50 text-indigo-700 dark:text-indigo-400";
      default:
        return "bg-slate-50 text-slate-700";
    }
  };

  const totalAccepted = orderPhones.filter(
    (item) => item.status === "ACCEPTED",
  ).length;
  const totalRejected = orderPhones.filter(
    (item) => item.status === "REJECTED",
  ).length;
  const totalPending = orderPhones.filter(
    (item) => item.status === "PENDING_INSPECTION",
  ).length;
  const acceptedTotal = orderPhones
    .filter((item) => item.status === "ACCEPTED")
    .reduce((sum, item) => sum + item.purchasePrice, 0);

  const handleInspectPhones = () => {
    setShowConfirmSheet(true);
  };

  const handleRecordPayment = () => {
    setShowPaymentSheet(true);
  };

  const handleViewInInventory = () => {
    navigate(`/inventory?po=${purchaseOrder.id}`);
  };

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 min-h-screen pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 py-3 flex items-center justify-end gap-3 transition-colors">
        <span
          className={clsx(
            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
            getStatusColor(purchaseOrder.status),
          )}
        >
          {purchaseOrder.status.replace("_", " ")}
        </span>
      </div>

      <div className="p-4 space-y-4">
        {/* Supplier Summary Card */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                {customer?.name || "Unknown Supplier"}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={clsx(
                    "px-2 py-1 rounded-full text-[10px] font-bold",
                    getChannelColor(purchaseOrder.acquisitionChannel),
                  )}
                >
                  {purchaseOrder.acquisitionChannel}
                </span>
                {purchaseOrder.platformName && (
                  <span className="text-xs text-slate-500">
                    via {purchaseOrder.platformName}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Created
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {format(parseISO(purchaseOrder.createdAt), "MMM d, yyyy")}
              </p>
            </div>
          </div>

          {purchaseOrder.platformFee > 0 && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">
                  Platform Fee
                </span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  ₹{(purchaseOrder.platformFee || 0).toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Inspect Phones Banner */}
        {purchaseOrder.status === "AWAITING_RECEIPT" && totalPending > 0 && (
          <div className="bg-amber-50 dark:bg-amber-950 rounded-xl p-4 border border-amber-100 dark:border-amber-800 flex items-center gap-3">
            <Package size={20} className="text-amber-600" />
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-900 dark:text-amber-100">
                Ready to inspect?
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Confirm or reject each device
              </p>
            </div>
            <button
              onClick={handleInspectPhones}
              className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-bold"
            >
              Inspect Now
            </button>
          </div>
        )}

        {/* Line Items Card */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 mb-4">
            Devices ({orderPhones.length})
          </h3>

          <div className="space-y-3">
            {orderPhones.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-3 border-b border-slate-50 dark:border-slate-800/60 last:border-0"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {item.phone?.brand} {item.phone?.model}
                    </h4>
                    <span
                      className={clsx(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold",
                        getItemStatusColor(item.status),
                      )}
                    >
                      {item.status === "PENDING_INSPECTION" && "Pending"}
                      {item.status === "ACCEPTED" && "Accepted"}
                      {item.status === "REJECTED" && "Rejected"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono">
                    {item.phone?.storage} · {item.phone?.color} ·{" "}
                    {item.phone?.imeis?.[0]
                      ? `•••• ${item.phone.imeis[0].slice(-4)}`
                      : "No IMEI"}
                  </p>
                  {item.status === "REJECTED" &&
                    (item as any).rejectionReason && (
                      <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">
                        Reason: {(item as any).rejectionReason}
                      </p>
                    )}
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    ₹{(item.purchasePrice || 0).toLocaleString()}
                  </p>
                  {item.status === "REJECTED" && (
                    <p className="text-xs text-rose-600">Refunded</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {totalAccepted} of {(purchaseOrder.phonesOrdered || 0)} accepted
              </span>
              <span className="text-lg font-black text-slate-900 dark:text-slate-100">
                ₹{(acceptedTotal || 0).toLocaleString()}
              </span>
            </div>
            {totalPending > 0 && (
              <div className="flex justify-between items-center mt-1">
                <span className="text-sm text-amber-600 dark:text-amber-400">
                  {totalPending} pending inspection
                </span>
              </div>
            )}
            {totalRejected > 0 && (
              <div className="flex justify-between items-center mt-1">
                <span className="text-sm text-rose-600 dark:text-rose-400">
                  {totalRejected} rejected
                </span>
                <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                  -₹
                  {(orderPhones
                    .filter((item) => item.status === "REJECTED")
                    .reduce((sum, item) => sum + item.purchasePrice, 0) || 0)
                    .toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Payment Summary Card */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 mb-4">
            Payment Summary
          </h3>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Total Owed
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                ₹{acceptedTotal.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Amount Paid
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                ₹{(purchaseOrder.amountPaid || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Outstanding
              </span>
              <span
                className={clsx(
                  "text-sm font-bold",
                  acceptedTotal - purchaseOrder.amountPaid > 0
                    ? "text-amber-700 dark:text-amber-400"
                    : "text-emerald-700 dark:text-emerald-400",
                )}
              >
                ₹{(acceptedTotal - purchaseOrder.amountPaid || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {purchaseOrder.status === "RECEIVED" &&
            acceptedTotal - purchaseOrder.amountPaid > 0 && (
              <button
                onClick={handleRecordPayment}
                className="w-full bg-primary-500 hover:bg-blue-800 text-white py-3.5 rounded-xl font-bold active:scale-[0.98] transition-all"
              >
                Record Payment
              </button>
            )}

          {purchaseOrder.status === "RECEIVED" && (
            <button
              onClick={handleViewInInventory}
              className="w-full bg-white dark:bg-slate-900 text-primary-500 border border-primary-500 py-3.5 rounded-xl font-bold active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              View Phones in Inventory
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>

      {/* PO Confirm Sheet */}
      <POConfirmSheet
        open={showConfirmSheet}
        onOpenChange={setShowConfirmSheet}
        order={purchaseOrder}
      />

      {/* Record Payment Sheet */}
      <RecordPaymentSheet
        open={showPaymentSheet}
        onOpenChange={setShowPaymentSheet}
        orderId={purchaseOrder.id}
        counterpartyId={purchaseOrder.counterpartyId}
        currentAmountPaid={purchaseOrder.amountPaid}
        totalAmount={acceptedTotal}
        type="AP"
      />
    </div>
  );
}
