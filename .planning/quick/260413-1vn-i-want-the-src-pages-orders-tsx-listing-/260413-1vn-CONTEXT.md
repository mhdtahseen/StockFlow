# Quick Task 260413-1vn: Align Orders UI with PurchaseOrders - Context

**Gathered:** 2026-04-12
**Status:** Ready for planning

<domain>
## Task Boundary

Align the visual layout of the Sales Order (`Orders.tsx`) listing cards with the high-fidelity design of the Purchase Order (`PurchaseOrders.tsx`) listing. Focus specifically on typography hierarchy (Order ID priority) and card modernism.

</domain>

<decisions>
## Implementation Decisions

### Typography Hierarchy
- **Order ID**: Must be highly prominent (Mono font, bolder/larger).
- **Customer Name**: Should be adjacent but slightly less prominent (smaller font or lighter weight).

### Visual Tokens
- **Card Structure**: Use the 24px rounded-corner design, hover shadows, and glassmorphism headers from `PurchaseOrders.tsx`.
- **Badges/Filters**: Keep existing Sales-specific statuses (`OPEN`, `SETTLED`, etc.) and badge logic. Do NOT sync colors or labels to the PO "Awaiting" style.

### Functionality
- **Logic**: No changes to state management, filtering logic, or routing. Keep SO-specific data handling.

### Agent Discretion
- The agent should decide on exact tailwind spacing (e.g., `gap-2` vs `gap-3`) to ensure the most premium/breathable feel.

</decisions>

<specifics>
## Specific Ideas
- The user specifically requested the Order ID to be "more prominent" than the customer name.

</specifics>
