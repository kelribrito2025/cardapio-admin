import { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-6 sm:p-8">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
