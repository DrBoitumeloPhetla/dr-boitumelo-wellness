import { createContext, useContext, useState, useEffect } from 'react';
import { verifyAdminLogin, supabase } from '../lib/supabase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminData, setAdminData] = useState(null);

  useEffect(() => {
    // Check Supabase session first
    checkSupabaseSession();
  }, []);

  const checkSupabaseSession = async () => {
    try {
      // Check localStorage first for admin session (primary authentication)
      const adminSession = localStorage.getItem('adminSession');

      if (adminSession) {
        try {
          const sessionData = JSON.parse(adminSession);

          // Check if session is less than 24 hours old
          const loginTime = new Date(sessionData.loginTime);
          const now = new Date();
          const hoursSinceLogin = (now - loginTime) / (1000 * 60 * 60);

          if (hoursSinceLogin < 24) {
            // Session is still valid - keep user logged in
            setAdminData(sessionData);
            setIsAuthenticated(true);
            setIsLoading(false);
            return;
          } else {
            // Session expired (24 hours passed)
            console.log('Admin session expired after 24 hours');
            localStorage.removeItem('adminSession');
            setIsAuthenticated(false);
            setAdminData(null);
          }
        } catch (parseError) {
          console.error('Error parsing admin session:', parseError);
          localStorage.removeItem('adminSession');
          setIsAuthenticated(false);
          setAdminData(null);
        }
      } else {
        // No admin session found
        setIsAuthenticated(false);
        setAdminData(null);
      }
    } catch (error) {
      console.error('Error checking session:', error);
      setIsAuthenticated(false);
      setAdminData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      // Verify admin credentials first
      const result = await verifyAdminLogin(username, password);

      if (result.success && result.user) {
        // Sign in with Supabase Auth using the email
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: result.user.email,
          password: password
        });

        if (authError) {
          console.error('Supabase auth error:', authError);
          // Continue anyway if custom RPC succeeded
        }

        // Store admin session
        const adminSession = {
          adminId: result.user.id,
          username: result.user.username,
          email: result.user.email,
          fullName: result.user.fullName,
          role: result.user.role,
          loginTime: new Date().toISOString()
        };
        localStorage.setItem('adminSession', JSON.stringify(adminSession));
        setAdminData(adminSession);
        setIsAuthenticated(true);
        return { success: true };
      }

      // If Supabase fails, fallback to hardcoded credentials (development mode)
      if (username === 'admin' && password === 'admin123') {
        // Try to sign in with demo credentials
        const demoEmail = 'admin@drboitumelowellness.co.za';
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: demoEmail,
          password: password
        });

        if (authError) {
          console.warn('Demo Supabase auth failed:', authError.message);
        }

        const demoSession = {
          adminId: 'demo-admin',
          username: 'admin',
          email: demoEmail,
          fullName: 'Admin User',
          role: 'admin',
          loginTime: new Date().toISOString()
        };
        localStorage.setItem('adminSession', JSON.stringify(demoSession));
        setAdminData(demoSession);
        setIsAuthenticated(true);
        return { success: true };
      }

      return { success: false, error: 'Invalid credentials' };
    } catch (error) {
      console.error('Login error:', error);

      // Fallback to hardcoded credentials if there's an error
      if (username === 'admin' && password === 'admin123') {
        const demoSession = {
          adminId: 'demo-admin',
          username: 'admin',
          email: 'admin@drboitumelowellness.co.za',
          fullName: 'Admin User',
          role: 'admin',
          loginTime: new Date().toISOString()
        };
        localStorage.setItem('adminSession', JSON.stringify(demoSession));
        setAdminData(demoSession);
        setIsAuthenticated(true);
        return { success: true };
      }

      return { success: false, error: error.message || 'Login failed. Please try again.' };
    }
  };

  const logout = async () => {
    // Sign out from Supabase Auth
    await supabase.auth.signOut();

    // Clear local storage
    localStorage.removeItem('adminSession');
    setAdminData(null);
    setIsAuthenticated(false);
  };

  const value = {
    isAuthenticated,
    isLoading,
    adminData,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
