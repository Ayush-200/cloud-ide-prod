'use client'

import { Auth0Provider } from "@auth0/auth0-react";
import { ReactNode, useEffect } from "react";

export default function Providers( {children} : {children: ReactNode} ){
    useEffect(() => {
        console.log('=== AUTH0 PROVIDER CONFIG ===');
        console.log('Domain:', process.env.NEXT_PUBLIC_AUTH0_DOMAIN);
        console.log('Client ID:', process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID);
        console.log('Redirect URI:', typeof window !== 'undefined' 
            ? `${window.location.origin}/dashboard`
            : process.env.NEXT_PUBLIC_APP_URL + '/dashboard');
        console.log('============================');
    }, []);

    return (
        <>
            <Auth0Provider
                domain={process.env.NEXT_PUBLIC_AUTH0_DOMAIN!}
                clientId={process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID!}
                authorizationParams={{
                    redirect_uri: typeof window !== 'undefined' 
                        ? `${window.location.origin}/dashboard`
                        : process.env.NEXT_PUBLIC_APP_URL + '/dashboard'
                }}
                cacheLocation="localstorage"
                useRefreshTokens={true}
            >
                {children}
            </Auth0Provider>
        </>
    )
}
