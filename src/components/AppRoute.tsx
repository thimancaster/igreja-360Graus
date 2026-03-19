import React, { useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { useRole } from "@/hooks/useRole";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { toast } from "sonner";

interface AppRouteProps {
  children: React.ReactNode;
}

export const AppRoute: React.FC<AppRouteProps> = ({ children }) => {
  const { isAdmin, isTesoureiro, isPastor, isLider, isLoading } = useRole();
  const hasShownToast = useRef(false);

  const hasPrivilegedRole = isAdmin || isTesoureiro || isPastor || isLider;

  useEffect(() => {
    if (!isLoading && !hasPrivilegedRole && !hasShownToast.current) {
      hasShownToast.current = true;
      toast.info("Seu acesso é pelo Portal do Membro.");
    }
  }, [isLoading, hasPrivilegedRole]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!hasPrivilegedRole) {
    return <Navigate to="/portal" replace />;
  }

  return <>{children}</>;
};
