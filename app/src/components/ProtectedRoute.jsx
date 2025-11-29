import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        console.log("ProtectedRoute: Loading...");
        return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>;
    }

    if (!user) {
        console.log("ProtectedRoute: No user, redirecting to login");
        return <Navigate to="/login" />;
    }

    console.log("ProtectedRoute: User authenticated, rendering children");
    return children;
}
