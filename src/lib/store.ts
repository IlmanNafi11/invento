import { configureStore } from '@reduxjs/toolkit'
import sidebarReducer from './sidebarSlice'
import roleReducer from './roleSlice'
import userReducer from './userSlice'
import authReducer from './authSlice'
import profileReducer from './profileSlice'
import modulReducer from './modulSlice'
import projectReducer from './projectSlice'
import permissionReducer from './permissionSlice'
import uploadReducer from './uploadSlice'
import { default as tusReducer } from './tus/tusSlice'

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
    upload: uploadReducer,
    tus: tusReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch