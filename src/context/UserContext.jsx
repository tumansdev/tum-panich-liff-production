import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import liff from '@line/liff';
import { registerUser } from '../services/api';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    initLiff();
  }, []);

  const initLiff = async () => {
    try {
      setIsLoading(true);
      setError(null);

      await liff.init({ liffId: import.meta.env.VITE_LIFF_ID });

      if (!liff.isLoggedIn()) {
        // In LIFF browser, redirect to login
        if (liff.isInClient()) {
          liff.login();
          return;
        }
        // In external browser during development
        if (import.meta.env.DEV) {
          setUser({
            userId: 'DEV_USER_123',
            displayName: 'Developer Mode',
            pictureUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Dev',
          });
          setAccessToken(null); // No token in dev mode - server needs ENABLE_DEV_AUTH=true
          setIsLoggedIn(true);
          setIsLoading(false);
          return;
        }
        liff.login();
        return;
      }

      // Get LINE profile & access token
      const profile = await liff.getProfile();
      const token = liff.getAccessToken();

      const userData = {
        userId: profile.userId,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl,
      };

      setUser(userData);
      setAccessToken(token);
      setIsLoggedIn(true);

      // Register/update user in database
      try {
        await registerUser(userData.userId, userData.displayName, userData.pictureUrl);
      } catch (err) {
        console.error('Failed to register user:', err);
        // Don't block on this error
      }
    } catch (err) {
      console.error('LIFF init error:', err);
      setError(err.message);

      // Fallback for development
      if (import.meta.env.DEV) {
        setUser({
          userId: 'DEV_USER_123',
          displayName: 'Developer Mode',
          pictureUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Dev',
        });
        setAccessToken(null);
        setIsLoggedIn(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Get current access token (refreshes if needed)
  const getAccessToken = useCallback(() => {
    if (liff.isLoggedIn()) {
      return liff.getAccessToken();
    }
    return accessToken;
  }, [accessToken]);

  // Get auth object for API calls
  const getAuthForApi = useCallback(() => {
    const token = getAccessToken();
    return {
      lineUserId: user?.userId,
      accessToken: token,
    };
  }, [user, getAccessToken]);

  const logout = () => {
    if (liff.isLoggedIn()) {
      liff.logout();
      window.location.reload();
    }
  };

  const closeLiff = () => {
    if (liff.isInClient()) {
      liff.closeWindow();
    }
  };

  const shareMessage = async (messages) => {
    if (liff.isApiAvailable('shareTargetPicker')) {
      try {
        await liff.shareTargetPicker(messages);
        return true;
      } catch (err) {
        console.error('Share failed:', err);
        return false;
      }
    }
    return false;
  };

  const value = {
    user,
    accessToken,
    isLoading,
    isLoggedIn,
    error,
    logout,
    closeLiff,
    shareMessage,
    getAccessToken,
    getAuthForApi,
    liff,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

export default UserContext;
