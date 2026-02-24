"use client"
import { useAuth0 } from "@auth0/auth0-react";
const page = () => { 
    const { loginWithRedirect } = useAuth0();
  return (
    <button 
      onClick={() => loginWithRedirect()} 
      className="button login bg-red-400 p-5"
    >
      Log In
    </button>
  );
}

export default page