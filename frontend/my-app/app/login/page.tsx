"use client";

import { useAuth0 } from "@auth0/auth0-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const LoginPage = () => { 
  const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null; // Will redirect to dashboard
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="max-w-md w-full p-8 bg-gray-800 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-6 text-center">Welcome to Cloud IDE</h1>
        <p className="text-gray-400 mb-8 text-center">
          Sign in to access your development environment
        </p>
        <button 
          onClick={() => loginWithRedirect()} 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition"
        >
          Log In with Auth0
        </button>
      </div>
    </div>
  );
}

export default LoginPage;