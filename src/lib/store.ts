import { configureStore } from '@reduxjs/toolkit'
import sidebarReducer from './sidebarSlice'
import roleReducer from './roleSlice'
import userReducer from './userSlice'
import authReducer from './authSlice'
import profileReducer from './profileSlice'
import modulReducer from './modulSlice'
import projectReducer from './projectSlice'
import permissionReducer from './permissionSlice'

export const store = configureStore({
  reducer: {
    sidebar: sidebarReducer,
    role: roleReducer,
    user: userReducer,
    auth: authReducer,
    profile: profileReducer,
    modul: modulReducer,
    project: projectReducer,
    permission: permissionReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch