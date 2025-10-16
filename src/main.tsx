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

// Suppress console errors for expected auth initialization failures
const originalError = console.error;
console.error = function(...args: unknown[]) {
  // Suppress 400 errors on /auth/refresh endpoint during initialization
  if (
    Array.isArray(args) &&
    args.some(arg => 
      typeof arg === 'string' && 
      arg.includes('POST http://localhost:3000/api/v1/auth/refresh 400')
    )
  ) {
    return;
  }
  originalError.apply(console, args as Parameters<typeof console.error>);
};

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
