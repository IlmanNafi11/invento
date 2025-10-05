import { configureStore } from '@reduxjs/toolkit'
import sidebarReducer from './sidebarSlice'
import roleReducer from './roleSlice'

export const store = configureStore({
  reducer: {
    sidebar: sidebarReducer,
    role: roleReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch