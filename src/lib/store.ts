import { configureStore } from '@reduxjs/toolkit'
import sidebarReducer from './sidebarSlice'
import roleReducer from './roleSlice'
import userReducer from './userSlice'

export const store = configureStore({
  reducer: {
    sidebar: sidebarReducer,
    role: roleReducer,
    user: userReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch