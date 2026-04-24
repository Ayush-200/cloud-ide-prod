"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionStore } from '@/store/filestore';
import { CodeEditor } from './CodeEditor'
import FolderPane from './FolderPane';
import { TerminalComp } from './TerminalComp'
import { OutputPreview } from './OutputPreview';

const Page = () => {
  const router = useRouter();
  const { sessionId, taskArn, privateIp, clearSessionData } = useSessionStore();
  const [showOutput, setShowOutput] = useState(false);
  const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:4000';

  // Redirect to dashboard if no session
  useEffect(() => {
    if (!sessionId || !taskArn || !privateIp) {
      router.push('/dashboard');
    }
  }, [sessionId, taskArn, privateIp, router]);

  // Auto-stop session when window/tab closes (but not on reload)
  useEffect(() => {
    let isReloading = false;

    const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
      // Check if it's a reload by looking at the navigation type
      if (performance.getEntriesByType('navigation')[0]) {
        const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        isReloading = navEntry.type === 'reload';
      }

      // Only stop session if actually closing (not reloading)
      if (!isReloading && sessionId && taskArn && privateIp) {
        // Use sendBeacon for reliable cleanup on page unload
        const data = JSON.stringify({ sessionId, taskArn, privateIp });
        const blob = new Blob([data], { type: 'application/json' });
        navigator.sendBeacon(`${BACKEND_API_URL}/aws/stopSession`, blob);
        
        // Clear local storage
        clearSessionData();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [sessionId, taskArn, privateIp, clearSessionData, BACKEND_API_URL]);

  return (
    <>
      <div className="h-screen flex flex-col">
        {/* Top Section: Editor Area */}
        <div className="flex-[7] flex overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 border-r border-gray-700 overflow-auto">
            <FolderPane />
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex overflow-hidden">
            {/* Code Editor */}
            <div className={`${showOutput ? 'flex-1' : 'w-full'} overflow-hidden border-r border-gray-700`}>
              <CodeEditor />
            </div>

            {/* Output Preview (toggleable) */}
            {showOutput && (
              <div className="flex-1 overflow-hidden">
                <OutputPreview />
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section: Terminal with Output Toggle */}
        <div className="flex-[3] border-t border-gray-700 overflow-hidden relative">
          {/* Toggle Button */}
          <button
            onClick={() => setShowOutput(!showOutput)}
            className="absolute top-2 right-2 z-10 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs transition flex items-center gap-1"
            title={showOutput ? 'Hide Output Preview' : 'Show Output Preview'}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M1.5 1a.5.5 0 0 0-.5.5v13a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 .5-.5v-13a.5.5 0 0 0-.5-.5h-13zm1 2h11v10h-11V3z"/>
            </svg>
            {showOutput ? 'Hide Output' : 'Show Output'}
          </button>
          <TerminalComp />
        </div>
      </div>
    </>
  )
}

export default Page
