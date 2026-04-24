"use client";

import { useState } from 'react';
import { useSessionStore } from '@/store/filestore';

export const OutputPreview = () => {
  const [port, setPort] = useState('5173');
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const { sessionId } = useSessionStore();
  const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:4000';

  const previewUrl = `${BACKEND_API_URL}/output/${port}?sessionId=${sessionId}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e]">
      {/* Header */}
      <div className="flex flex-col gap-2 px-4 py-2 bg-[#252526] border-b border-gray-700">
        {/* Session Info */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-400">Session ID:</span>
          <code className="bg-[#1e1e1e] text-green-400 px-2 py-1 rounded flex-1 truncate">
            {sessionId || 'No session'}
          </code>
          <button
            onClick={() => sessionId && copyToClipboard(sessionId)}
            className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-xs transition"
            title="Copy Session ID"
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
        
        {/* Preview Controls */}
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={port}
            onChange={(e) => setPort(e.target.value)}
            placeholder="Port"
            className="w-24 bg-[#3c3c3c] text-white px-3 py-1 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded text-sm transition"
          >
            {showPreview ? 'Hide' : 'Preview'}
          </button>
          {showPreview && (
            <>
              <button
                onClick={() => {
                  const iframe = document.getElementById('preview-iframe') as HTMLIFrameElement;
                  if (iframe) iframe.src = iframe.src;
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-1 rounded text-sm transition"
              >
                Refresh
              </button>
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-1 rounded text-sm transition"
              >
                Open in New Tab
              </a>
              <button
                onClick={() => copyToClipboard(previewUrl)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm transition"
                title="Copy Preview URL"
              >
                {copied ? '✓' : '📋'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Preview */}
      {showPreview ? (
        <iframe
          id="preview-iframe"
          src={previewUrl}
          className="flex-1 w-full border-0"
          title="Application Preview"
        />
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="text-center max-w-md px-4">
            <svg width="64" height="64" viewBox="0 0 16 16" fill="currentColor" className="mx-auto mb-4 opacity-50">
              <path d="M1.5 1a.5.5 0 0 0-.5.5v13a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 .5-.5v-13a.5.5 0 0 0-.5-.5h-13zm1 2h11v10h-11V3z"/>
              <path d="M3 5h10v1H3V5zm0 2h10v1H3V7zm0 2h10v1H3V9z"/>
            </svg>
            <p className="text-sm mb-3">Enter a port number and click Preview</p>
            <div className="text-xs text-gray-500 space-y-2 text-left bg-[#252526] p-3 rounded">
              <p className="font-semibold text-gray-400">Common ports:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>5173 - Vite (React/Vue)</li>
                <li>3000 - Next.js / Create React App</li>
                <li>8080 - General web servers</li>
                <li>4200 - Angular</li>
              </ul>
              <p className="mt-3 pt-2 border-t border-gray-700">
                💡 Run your dev server with <code className="bg-[#1e1e1e] px-1 py-0.5 rounded">--host 0.0.0.0</code>
              </p>
              <p className="text-xs">
                Example: <code className="bg-[#1e1e1e] px-1 py-0.5 rounded">npm run dev -- --host 0.0.0.0</code>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
