import React from "react";
import { clsx } from "clsx";
import { Smartphone } from "lucide-react";
import {
  SiApple,
  SiSamsung,
  SiGoogle,
  SiXiaomi,
  SiMotorola,
  SiOppo,
  SiVivo,
  SiOneplus,
  SiHuawei,
  SiNokia,
  SiAsus,
  SiSony,
} from "react-icons/si";

export const BrandIcon = ({ brand }: { brand: string }) => {
  const b = brand.toLowerCase().trim();

  // Square/Icon-dominant logos (Smaller size works)
  if (b.includes("apple") || b.includes("iphone")) return <SiApple size={18} />;
  if (b.includes("google") || b.includes("pixel"))
    return <SiGoogle size={18} />;
  if (b.includes("xiaomi") || b.includes("redmi") || b.includes("mi "))
    return <SiXiaomi size={20} />;
  if (b.includes("nothing")) return <Smartphone size={18} />;
  if (b.includes("oneplus")) return <SiOneplus size={18} />;
  if (b.includes("motorola") || b.includes("moto"))
    return <SiMotorola size={18} />;

  // Text-dominant/Wide logos (Needs larger size to be readable)
  if (b.includes("samsung")) return <SiSamsung size={26} />;
  if (b.includes("oppo")) return <SiOppo size={26} />;
  if (b.includes("vivo")) return <SiVivo size={26} />;
  if (b.includes("huawei")) return <SiHuawei size={24} />;
  if (b.includes("realme")) return <Smartphone size={18} />;
  if (b.includes("infinix")) return <Smartphone size={18} />;
  if (b.includes("nokia")) return <SiNokia size={24} />;
  if (b.includes("asus")) return <SiAsus size={24} />;
  if (b.includes("sony")) return <SiSony size={24} />;

  return <Smartphone size={18} />;
};

export interface DeviceListItemProps {
  brand: string;
  model: string;
  storage: string;
  ram?: string;
  color: string;
  imeis: string[];
  price: number;
  isPurchaseOrder?: boolean;
  unitProfit?: number;
  rejectionReason?: string;
  config: {
    container: string;
    icon: string;
    label: string;
  };
}

export function DeviceListItem({
  brand,
  model,
  storage,
  ram,
  color,
  imeis = [],
  price,
  isPurchaseOrder = false,
  unitProfit = 0,
  rejectionReason,
  config,
}: DeviceListItemProps) {
  return (
    <div className="p-4 flex items-center gap-4">
      <div
        className={clsx(
          "size-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
          config.icon,
        )}
      >
        <BrandIcon brand={brand} />
      </div>
      <div className="flex-1 min-w-0 flex justify-between items-center gap-2">
        {/* Left: 3-line stack Info */}
        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
          <h4 className="font-bold text-slate-900 dark:text-slate-100 truncate text-sm leading-tight tracking-tight">
            {brand} {model}
          </h4>
          
          <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider leading-none">
            {ram && ram !== "N/A" ? `${ram} / ` : ""}{storage} • {color}
          </p>
          
          <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 leading-none">
            {imeis && imeis.length > 0 ? (
              `IMEI: ${imeis.map(i => `**** ${i.slice(-4)}`).join(" / ")}`
            ) : (
              <span className="italic opacity-50">IMEI Not Assigned</span>
            )}
          </p>
        </div>

        {/* Right: Meta (Price, Profit, Status) */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className="font-black text-slate-900 dark:text-slate-100 whitespace-nowrap text-sm tracking-tight leading-none">
            ₹{price.toLocaleString()}
          </span>
          
          <div className="flex items-center gap-1.5">
            {!isPurchaseOrder && unitProfit !== 0 && (
              <span
                className={clsx(
                  "font-black px-1.5 py-0.5 rounded text-[9px] leading-none",
                  unitProfit > 0
                    ? "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10"
                    : "text-rose-500 bg-rose-50 dark:bg-rose-500/10",
                )}
              >
                {unitProfit > 0 ? "+" : ""}
                {Math.abs(unitProfit).toLocaleString()}
              </span>
            )}
            {rejectionReason && (
              <span className="font-black px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 uppercase tracking-widest whitespace-nowrap text-[8px] leading-none shadow-sm">
                Reason: {rejectionReason}
              </span>
            )}
            <span
              className={clsx(
                "font-black px-1.5 py-0.5 rounded border uppercase tracking-tighter whitespace-nowrap text-[9px] leading-none",
                config.container,
              )}
            >
              {config.label}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
