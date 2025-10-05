import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { mockRoles } from '@/data/mock/roles';
import type { RoleItem } from '@/types';

interface RoleState {
  roles: RoleItem[];
}

const initialState: RoleState = {
  roles: mockRoles,
};

const roleSlice = createSlice({
  name: 'role',
  initialState,
  reducers: {
    addRole: (state, action: PayloadAction<Omit<RoleItem, 'id' | 'lastUpdated'>>) => {
      const newRole: RoleItem = {
        ...action.payload,
        id: Date.now().toString(),
        lastUpdated: new Date(),
      };
      state.roles.push(newRole);
    },
    updateRole: (state, action: PayloadAction<RoleItem>) => {
      const index = state.roles.findIndex(role => role.id === action.payload.id);
      if (index !== -1) {
        state.roles[index] = {
          ...action.payload,
          lastUpdated: new Date(),
        };
      }
    },
    deleteRole: (state, action: PayloadAction<string>) => {
      state.roles = state.roles.filter(role => role.id !== action.payload);
    },
  },
});

export const { addRole, updateRole, deleteRole } = roleSlice.actions;
export default roleSlice.reducer;