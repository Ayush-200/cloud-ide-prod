"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useSessionStore } from '@/store/filestore';
import { useAuth0 } from "@auth0/auth0-react";

const DashboardPage = () => {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth0();
  const [loading, setLoading] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const { sessionId, taskArn, privateIp, setSessionData, clearSessionData } = useSessionStore();

  const VERCEL_BACKEND_URL = 'http://localhost:4000';

  // Fetch userId from database when user is authenticated
  useEffect(() => {
    const fetchUserId = async () => {
      if (user?.email) {
        try {
          const response = await axios.post(`${VERCEL_BACKEND_URL}/auth/user`, {
            email: user.email
          });
          const data = response.data as { userId: string; name: string; email: string };
          setUserId(data.userId);
          console.log('Fetched userId from database:', data.userId);
        } catch (err) {
          console.error('Failed to fetch userId:', err);
          setError('Failed to fetch user information');
        }
      }
    };

    fetchUserId();
  }, [user]);

  const startSession = async () => {
    if (!userId) {
      setError('User ID not available. Please try again.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Starting session for userId:', userId);
      // Call the vercel-backend to start a session
      const response = await axios.post(`${VERCEL_BACKEND_URL}/aws/startSession`, {
        userId: userId
      });

      const { sessionId, taskArn, privateIp } = response.data as {
        sessionId: string;
        taskArn: string;
        privateIp: string;
      };

      console.log('Session started:', { sessionId, taskArn, privateIp });

      // Store session data
      setSessionData(sessionId, taskArn, privateIp);

      // Navigate to code editor
      router.push('/code-editor');
    } catch (err: any) {
      console.error('Failed to start session:', err);
      setError(err.response?.data?.error || 'Failed to start session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const stopSession = async () => {
    if (!sessionId || !taskArn || !privateIp) {
      setError('No active session to stop');
      return;
    }

    setStopping(true);
    setError(null);

    try {
      console.log('Stopping session:', { sessionId, taskArn, privateIp });
      
      await axios.post(`${VERCEL_BACKEND_URL}/aws/stopSession`, {
        sessionId,
        taskArn,
        privateIp
      });

      console.log('Session stopped successfully');
      clearSessionData();
    } catch (err: any) {
      console.error('Failed to stop session:', err);
      setError(err.response?.data?.error || 'Failed to stop session. Please try again.');
    } finally {
      setStopping(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="max-w-md w-full p-8 bg-gray-800 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        
        {authLoading ? (
          <div className="text-center text-gray-400">Loading user information...</div>
        ) : !user ? (
          <div className="text-center text-gray-400">Please log in to continue</div>
        ) : !userId ? (
          <div className="text-center text-gray-400">Fetching user data...</div>
        ) : sessionId ? (
          <div className="space-y-4">
            <div className="bg-gray-700 p-4 rounded">
              <p className="text-green-400 font-semibold mb-2">Session Active</p>
              <p className="text-sm text-gray-300">Session ID: {sessionId.substring(0, 8)}...</p>
              <p className="text-sm text-gray-300">Task ARN: {taskArn?.substring(taskArn.length - 12)}</p>
              <p className="text-sm text-gray-300">Private IP: {privateIp}</p>
            </div>
            
            <button
              onClick={() => router.push('/code-editor')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition"
            >
              Go to Code Editor
            </button>

            <button
              onClick={stopSession}
              disabled={stopping}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition"
            >
              {stopping ? 'Stopping Session...' : 'Stop Session'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-400 mb-4">
              Start a new coding session to access your cloud IDE
            </p>
            
            {error && (
              <div className="bg-red-600 text-white p-3 rounded">
                {error}
              </div>
            )}

            <button
              onClick={startSession}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition"
            >
              {loading ? 'Starting Session...' : 'Start New Session'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
