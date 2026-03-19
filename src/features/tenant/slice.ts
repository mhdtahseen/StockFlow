import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface TenantState {
  // We don't necessarily need to store the whole tenant here if AuthContext has it,
  // but we need the action to be trackable and syncable.
  lastUpdated: string | null;
}

const initialState: TenantState = {
  lastUpdated: null,
};

const tenantSlice = createSlice({
  name: 'tenant',
  initialState,
  reducers: {
    updateTenant: (state, _action: PayloadAction<{
      name: string;
      address: string;
      gstin: string;
      phone: string;
    }>) => {
      state.lastUpdated = new Date().toISOString();
    },
  },
});

export const { updateTenant } = tenantSlice.actions;
export default tenantSlice.reducer;
