# Quick Task 260413-1vn: UI Parity Research

## 1. Component Comparison

| Element | Orders.tsx (Current) | PurchaseOrders.tsx (Target) |
| :--- | :--- | :--- |
| **Card Radius**| `rounded-[24px]` | `rounded-[24px]` (Matches) |
| **Hover Effect** | `hover:shadow-2xl hover:border-primary-400/30` | `hover:shadow-2xl hover:border-primary-400/30` (Matches) |
| **Typography (ID)** | `text-[15px] font-black` | `text-[15px] font-black` |
| **Typography (Name)**| `text-[11px] font-bold` | `text-[11px] font-bold` |

## 2. Identified Discrepancies
- **Visual Hierarchy**: To make the ID "more prominent", we should increase its font size relative to the customer name, or potentially swap their vertical placement/spacing.
- **Header Density**: `PurchaseOrders.tsx` uses a slightly more refined glassmorphism blur and border opacity in its sticky header.
- **Empty State**: `Orders.tsx` uses the `Package` icon; `PurchaseOrders.tsx` also uses `Package`.

## 3. Recommended Approach
1. **Prominence Shift**: Increase ID size to `text-base` (16px) and keep Name at `text-[11px]`.
2. **Glassmorphism Refinement**: Ensure the header matches the `backdrop-blur-xl` and `bg-slate-50/80` tokens exactly as defined in the high-fidelity PO screen.
3. **Card Meta**: Ensure the bottom timestamp and "View Details" section uses identical border-t colors (`border-slate-50` or `dark:border-slate-800/40`).
