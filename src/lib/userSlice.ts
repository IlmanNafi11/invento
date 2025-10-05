import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { mockUsers } from '@/data/mock/users';
import type { UserItem } from '@/types';

interface UserState {
  users: UserItem[];
  currentUser: UserItem | null;
}

const initialState: UserState = {
  users: mockUsers,
  currentUser: mockUsers[0], // Assume first user is logged in
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    addUser: (state, action: PayloadAction<Omit<UserItem, 'id' | 'createdAt'>>) => {
      const newUser: UserItem = {
        ...action.payload,
        id: Date.now().toString(),
        createdAt: new Date(),
      };
      state.users.push(newUser);
    },
    updateUser: (state, action: PayloadAction<UserItem>) => {
      const index = state.users.findIndex(user => user.id === action.payload.id);
      if (index !== -1) {
        state.users[index] = action.payload;
      }
    },
    deleteUser: (state, action: PayloadAction<string>) => {
      state.users = state.users.filter(user => user.id !== action.payload);
    },
    setCurrentUser: (state, action: PayloadAction<UserItem | null>) => {
      state.currentUser = action.payload;
    },
  },
});

export const { addUser, updateUser, deleteUser, setCurrentUser } = userSlice.actions;
export default userSlice.reducer;