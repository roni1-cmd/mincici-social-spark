import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { FeedSkeleton } from "./LoadingSkeleton";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-2xl w-full p-4">
          <FeedSkeleton />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
