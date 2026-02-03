import { createContext, useContext, useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    // const [organization, setOrganization] = useState(null); // Temporarily disabled for Firebase migration
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            console.log("AuthContext: Auth state change", currentUser);
            if (currentUser) {
                setUser(currentUser);
                // Optional: Fetch profile from Firestore if you have a 'users' collection
                // await fetchProfile(currentUser.uid);
                setProfile({ id: currentUser.uid, email: currentUser.email }); // Mock profile for now to pass guards
                setLoading(false);
            } else {
                setUser(null);
                setProfile(null);
                // setOrganization(null);
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    // Helper to fetch extra user data if needed
    // const fetchProfile = async (userId) => {
    //     try {
    //         const docRef = doc(db, "users", userId);
    //         const docSnap = await getDoc(docRef);
    //         if (docSnap.exists()) {
    //             setProfile(docSnap.data());
    //         }
    //     } catch (error) {
    //         console.error("Error fetching profile:", error);
    //     }
    // };

    const login = async (email, password) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return userCredential.user;
        } catch (error) {
            console.error("Login Error:", error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Logout Error:", error);
            throw error;
        }
    };

    const value = {
        user,
        profile,
        // organization,
        // fetchProfile,
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

export function PrivateRoute() {
    const { user, loading } = useAuth(); // Removed profile check constraint for now to ease migration
    const location = useLocation();

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Adapt onboarding check if necessary later
    // if (!profile && location.pathname !== '/onboarding') {
    //     return <Navigate to="/onboarding" replace />;
    // }

    return <Outlet />;
}
