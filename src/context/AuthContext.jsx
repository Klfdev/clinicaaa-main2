import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    // --- MOCK AUTHENTICATION START ---
    const [user, setUser] = useState({ id: 'mock-user-id', email: 'admin@barberpro.com' });
    const [profile, setProfile] = useState({ full_name: 'Barbeiro Admin', role: 'admin', email: 'admin@barberpro.com' });
    const [organization, setOrganization] = useState({
        id: 'mock-org-id',
        name: 'BarberPro Demo',
        slug: 'barberpro-demo'
    });
    const [loading, setLoading] = useState(false); // No loading, instant access
    // --- MOCK AUTHENTICATION END ---

    useEffect(() => {
        // ACTIVATED BYPASS: Real auth logic disabled for development
        console.log("⚠️ Auth Bypass Active: Using mock admin user.");
        /*
        // Check active session
        checkUser();

        const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                setUser(session.user);
                setProfile(session.user); // In our mock, user object has profile data
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setProfile(null);
            }
        });

        return () => {
            if (listener?.subscription) listener.subscription.unsubscribe();
        };
        */
    }, []);

    const checkUser = async () => {
        try {
            const { data } = await supabase.auth.getUser();
            if (data?.user) {
                setUser(data.user);
                setProfile(data.user);
                // Mock Org
                setOrganization({
                    id: 'org-123',
                    name: data.user.clinic_name || 'Minha Barbearia',
                    slug: 'minha-barbearia'
                });
            }
        } catch (error) {
            console.error("Auth Check Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data;
    };

    const register = async (email, password, data) => {
        const { data: result, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data }
        });
        if (error) throw error;
        return result;
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
    };

    const fetchProfile = async () => {
        // Refetch profile if needed
        await checkUser();
    };

    return (
        <AuthContext.Provider value={{
            user,
            profile,
            organization,
            login,
            register, // Exposed as register
            signUp: register, // Exposed alias
            signOut,
            loading,
            fetchProfile
        }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

// Private Route Component
import { Navigate, Outlet } from 'react-router-dom';

export const PrivateRoute = () => {
    const { user, loading } = useAuth();

    if (loading) return <div className="h-screen flex items-center justify-center">Carregando...</div>;

    return user ? <Outlet /> : <Navigate to="/login" replace />;
};
