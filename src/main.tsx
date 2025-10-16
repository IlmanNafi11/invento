import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/sonner'
import { PermissionsProvider } from '@/hooks/PermissionsProvider'
import { store } from '@/lib/store'
import { setStoreGetter } from '@/lib/tokenManager'
import './index.css'
import App from './App.tsx'

setStoreGetter(() => store);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <PermissionsProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <BrowserRouter>
            <App />
            <Toaster />
          </BrowserRouter>
        </ThemeProvider>
      </PermissionsProvider>
    </Provider>
  </StrictMode>,
)
