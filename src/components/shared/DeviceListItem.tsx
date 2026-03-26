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
  color: string;
  imeis: string[];
  price: number;
  isPurchaseOrder?: boolean;
  unitProfit?: number;
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
  color,
  imeis = [],
  price,
  isPurchaseOrder = false,
  unitProfit = 0,
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
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-0.5">
          <h4 className="font-bold text-slate-900 dark:text-slate-100 truncate pr-2 text-sm  tracking-tight">
            {brand} {model}
          </h4>
          <span className="font-black text-slate-900 dark:text-slate-100 whitespace-nowrap text-sm tracking-tight">
            ₹{price.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between items-center text-[10px]">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <span className="text-slate-500 dark:text-slate-400 truncate font-bold uppercase tracking-wider">
              {storage} • {color}
            </span>
            {imeis.length > 0 && (
              <span className="text-slate-300 dark:text-slate-700 font-bold shrink-0">
                |
              </span>
            )}
            <div className="flex gap-1 overflow-x-auto no-scrollbar py-0.5">
              {imeis.map((imei, idx) => (
                <span
                  key={idx}
                  className="bg-slate-50 dark:bg-slate-950 px-1.5 py-0.5 rounded text-slate-500 border border-slate-100 dark:border-slate-800 font-black shrink-0"
                >
                  {imei.slice(-6)}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 pl-2">
            {!isPurchaseOrder && unitProfit !== 0 && (
              <span
                className={clsx(
                  "font-black px-1.5 py-0.5 rounded",
                  unitProfit > 0
                    ? "text-emerald-500 bg-emerald-50"
                    : "text-rose-500 bg-rose-50",
                )}
              >
                {unitProfit > 0 ? "+" : ""}₹
                {Math.abs(unitProfit).toLocaleString()}
              </span>
            )}
            <span
              className={clsx(
                "font-black px-1.5 py-0.5 rounded border uppercase tracking-tighter whitespace-nowrap",
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
