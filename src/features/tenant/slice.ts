import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface TeamMember {
  id: string;
  email: string;
  full_name: string;
  role: string;
  tenant_id: string;
}

export interface TenantState {
  lastUpdated: string | null;
  teamMembers: TeamMember[];
}

const initialState: TenantState = {
  lastUpdated: null,
  teamMembers: [],
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
    setTeam: (state, action: PayloadAction<TeamMember[]>) => {
      state.teamMembers = action.payload;
    },
    updateMemberRole: (state, action: PayloadAction<{ id: string; role: string }>) => {
      const member = state.teamMembers.find(m => m.id === action.payload.id);
      if (member) {
        member.role = action.payload.role;
      }
      state.lastUpdated = new Date().toISOString();
    },
  },
});

export const { updateTenant, setTeam, updateMemberRole } = tenantSlice.actions;
export default tenantSlice.reducer;
