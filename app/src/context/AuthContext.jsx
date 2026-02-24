import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [organization, setOrganization] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            console.log("AuthContext: Initial session check", session);
            if (session?.user) {
                setUser(session.user);
                fetchProfile(session.user.id);
            } else {
                setUser(null);
                setProfile(null);
                setOrganization(null);
                setLoading(false);
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            console.log("AuthContext: Auth state change", _event, session);
            if (session?.user) {
                setUser(session.user);
                fetchProfile(session.user.id);
            } else {
                setUser(null);
                setProfile(null);
                setOrganization(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (userId) => {
        try {
            // Try to fetch profile using RPC (bypasses RLS issues)
            const { data: profileData, error: profileError } = await supabase
                .rpc('get_user_profile');

            if (profileError) {
                console.error("Error fetching profile via RPC:", profileError);
                // Fallback or handle error
            }

            if (!profileData) {
                setProfile(null);
                setOrganization(null);
            } else {
                setProfile(profileData);

                if (profileData.organization_id) {
                    const { data: orgData, error: orgError } = await supabase
                        .from('organizations')
                        .select('*')
                        .eq('id', profileData.organization_id)
                        .single();

                    if (orgError) {
                        console.error("AuthContext: Error fetching org:", orgError);
                    } else {
                        setOrganization(orgData);
                    }
                } else {
                    console.warn("AuthContext: Profile has no organization_id");
                }
            }
        } catch (error) {
            console.error("Error in fetchProfile:", error);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;

        // Optimistically update user to prevent race condition with ProtectedRoute
        if (data.session) {
            setUser(data.session.user);
        }

        return data;
    };

    const logout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    };

    const value = {
        user,
        profile,
        organization,
        fetchProfile,
        login,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
