import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

const AdminRoute = () => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [session, setSession] = useState(null);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;

    const checkAdmin = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        
        if (!mounted) return;
        setSession(session);

        if (session?.user) {
          // Check role in profiles table
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            console.error('Error fetching profile:', profileError);
          }

          if (mounted) {
            setIsAdmin(profile?.role === 'admin');
          }
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkAdmin();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (mounted) {
          if (!session) {
            setSession(null);
            setIsAdmin(false);
            setLoading(false);
          } else {
            // Re-check admin status if session changes
            checkAdmin();
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Access Denied</h1>
        <p className="text-gray-600 mb-8 text-center max-w-md">
          You do not have permission to view the admin panel. Please contact an administrator if you believe this is a mistake.
        </p>
        <button 
          onClick={() => supabase.auth.signOut()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Logout
        </button>
      </div>
    );
  }

  return <Outlet />;
};

export default AdminRoute;
