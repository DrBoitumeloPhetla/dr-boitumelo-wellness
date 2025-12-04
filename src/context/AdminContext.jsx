import { createContext, useContext, useState, useEffect } from 'react';
import { isSuperAdmin, isStaff, logActivity } from '../lib/supabase';

const AdminContext = createContext();

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

export const AdminProvider = ({ children }) => {
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load admin from localStorage on mount
  useEffect(() => {
    const storedAdmin = localStorage.getItem('adminUser');
    if (storedAdmin) {
      try {
        const admin = JSON.parse(storedAdmin);
        setCurrentAdmin(admin);
      } catch (error) {
        console.error('Error parsing stored admin:', error);
        localStorage.removeItem('adminUser');
      }
    }
    setLoading(false);
  }, []);

  const login = (adminUser) => {
    setCurrentAdmin(adminUser);
    localStorage.setItem('adminUser', JSON.stringify(adminUser));

    // Log login activity
    logActivity({
      adminUserId: adminUser.id,
      adminUsername: adminUser.username,
      actionType: 'login',
      resourceType: 'admin',
      resourceId: adminUser.id,
      resourceName: adminUser.username,
      details: { loginTime: new Date().toISOString() }
    });
  };

  const logout = () => {
    if (currentAdmin) {
      // Log logout activity
      logActivity({
        adminUserId: currentAdmin.id,
        adminUsername: currentAdmin.username,
        actionType: 'logout',
        resourceType: 'admin',
        resourceId: currentAdmin.id,
        resourceName: currentAdmin.username,
        details: { logoutTime: new Date().toISOString() }
      });
    }

    setCurrentAdmin(null);
    localStorage.removeItem('adminUser');
  };

  /**
   * Helper function to log activity with current admin context
   * @param {Object} activityData - Activity data (action, resource, etc.)
   */
  const log = async (activityData) => {
    if (!currentAdmin) {
      console.warn('Cannot log activity: no admin user logged in');
      return null;
    }

    return await logActivity({
      adminUserId: currentAdmin.id,
      adminUsername: currentAdmin.username,
      ...activityData
    });
  };

  /**
   * Check if current user has super admin privileges
   */
  const hasSuperAdminAccess = () => {
    return isSuperAdmin(currentAdmin);
  };

  /**
   * Check if current user is staff
   */
  const isStaffUser = () => {
    return isStaff(currentAdmin);
  };

  /**
   * Check if user can perform an action
   * @param {string} action - Action to check (delete, approve_prescription, view_logs, etc.)
   */
  const canPerform = (action) => {
    if (!currentAdmin) return false;

    // Super admin can do everything
    if (isSuperAdmin(currentAdmin)) return true;

    // Staff restrictions
    const restrictedActions = [
      'delete',
      'approve_prescription',
      'reject_prescription',
      'delete_prescription',
      'view_logs',
      'view_dashboard'
    ];

    return !restrictedActions.includes(action);
  };

  const value = {
    currentAdmin,
    loading,
    login,
    logout,
    log,
    hasSuperAdminAccess,
    isStaffUser,
    canPerform,
    isSuperAdmin: () => isSuperAdmin(currentAdmin),
    isStaff: () => isStaff(currentAdmin)
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};
