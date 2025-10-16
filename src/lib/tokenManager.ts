type StoreGetter = () => {
  getState: () => { auth: { accessToken: string | null } };
  dispatch: (action: { type: string; payload?: unknown }) => void;
};

let storeGetter: StoreGetter | null = null;

export const setStoreGetter = (getter: StoreGetter): void => {
  storeGetter = getter;
};

export const getAccessToken = (): string | null => {
  if (!storeGetter) {
    return null;
  }
  
  try {
    const store = storeGetter();
    return store.getState().auth.accessToken;
  } catch {
    return null;
  }
};

export const setAccessToken = (token: string): void => {
  if (!storeGetter) {
    console.warn('Store not initialized');
    return;
  }
  
  try {
    const store = storeGetter();
    store.dispatch({ type: 'auth/setAccessToken', payload: token });
  } catch (error) {
    console.error('Failed to set access token:', error);
  }
};

export const clearAuth = (): void => {
  if (!storeGetter) {
    console.warn('Store not initialized');
    return;
  }
  
  try {
    const store = storeGetter();
    store.dispatch({ type: 'auth/clearAuthState' });
  } catch (error) {
    console.error('Failed to clear auth:', error);
  }
};
