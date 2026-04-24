"use client";

import { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useSessionStore } from '@/store/filestore';

interface Project {
  id: string;
  name: string;
  createdAt: string;
}

interface ProjectsResponse {
  success: boolean;
  projects: Project[];
}

interface UserResponse {
  userId: string;
  name: string;
  email: string;
}

interface StartSessionResponse {
  success: boolean;
  taskArn: string;
  privateIp: string;
  sessionId: string;
  projectId: string;
  projectName: string;
}

interface CreateProjectResponse {
  success: boolean;
  project: Project;
}

const Page = () => {
  const { user, isLoading: authLoading } = useAuth0();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dbUserId, setDbUserId] = useState<string | null>(null);
  const [startingSession, setStartingSession] = useState<string | null>(null);
  const [creatingProject, setCreatingProject] = useState(false);
  const { setSessionData } = useSessionStore();

  const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:4000';

  // First, get the database userId from Auth0 email
  useEffect(() => {
    const fetchDbUserId = async () => {
      if (!user?.email) {
        return;
      }

      try {
        console.log('Fetching database userId for email:', user.email);
        
        const response = await axios.post<UserResponse>(`${BACKEND_API_URL}/auth/user`, {
          email: user.email
        });

        console.log('Database user data:', response.data);
        setDbUserId(response.data.userId);
      } catch (err: any) {
        console.error('Error fetching database userId:', err);
        setError(err.response?.data?.error || 'Failed to fetch user data');
      }
    };

    if (!authLoading && user?.email) {
      fetchDbUserId();
    }
  }, [user?.email, authLoading, BACKEND_API_URL]);

  // Then, fetch projects using the database userId
  useEffect(() => {
    const fetchProjects = async () => {
      if (!dbUserId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching projects for database userId:', dbUserId);
        
        const response = await axios.get<ProjectsResponse>(`${BACKEND_API_URL}/api/projects`, {
          params: { userId: dbUserId }
        });

        console.log('Projects fetched:', response.data);
        
        if (response.data.success) {
          setProjects(response.data.projects);
        }
      } catch (err: any) {
        console.error('Error fetching projects:', err);
        setError(err.response?.data?.error || 'Failed to load projects');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [dbUserId, BACKEND_API_URL]);

  const handleProjectClick = async (project: Project) => {
    if (!dbUserId) {
      alert('User not loaded yet');
      return;
    }

    try {
      setStartingSession(project.id);
      console.log('Starting session for project:', project);

      const response = await axios.post<StartSessionResponse>(`${BACKEND_API_URL}/aws/startSession`, {
        userId: dbUserId,
        projectId: project.id,
        projectName: project.name
      });

      console.log('Session started:', response.data);

      const { sessionId, taskArn, privateIp, projectId, projectName } = response.data;

      // Store session data using Zustand (which also updates localStorage)
      setSessionData(sessionId, taskArn, privateIp, projectId, projectName, dbUserId);

      console.log('Session data stored, navigating to code-editor...');

      // Navigate to code editor
      router.push('/code-editor');
    } catch (err: any) {
      console.error('Error starting session:', err);
      alert(err.response?.data?.error || 'Failed to start session');
      setStartingSession(null);
    }
  };

  const handleCreateNewProject = async () => {
    if (!dbUserId) {
      alert('User not loaded yet');
      return;
    }

    const projectName = prompt('Enter project name:');
    if (!projectName || projectName.trim() === '') {
      return;
    }

    try {
      setCreatingProject(true);
      console.log('Creating new project:', projectName);

      // Create the project
      const createResponse = await axios.post<CreateProjectResponse>(`${BACKEND_API_URL}/api/projects`, {
        userId: dbUserId,
        projectName: projectName.trim()
      });

      console.log('Project created:', createResponse.data);

      const newProject = createResponse.data.project;

      // Start session for the new project
      console.log('Starting session for new project...');
      const sessionResponse = await axios.post<StartSessionResponse>(`${BACKEND_API_URL}/aws/startSession`, {
        userId: dbUserId,
        projectId: newProject.id,
        projectName: newProject.name
      });

      console.log('Session started:', sessionResponse.data);

      const { sessionId, taskArn, privateIp, projectId, projectName: projName } = sessionResponse.data;

      // Store session data
      setSessionData(sessionId, taskArn, privateIp, projectId, projName, dbUserId);

      console.log('Navigating to code-editor...');

      // Navigate to code editor
      router.push('/code-editor');
    } catch (err: any) {
      console.error('Error creating project:', err);
      alert(err.response?.data?.error || 'Failed to create project');
      setCreatingProject(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#1e1e1e]">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#1e1e1e]">
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1e1e1e] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          
          <button
            onClick={handleCreateNewProject}
            disabled={creatingProject || !dbUserId}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
          >
            {creatingProject ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                <span>Creating...</span>
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 3.5a.5.5 0 0 1 .5.5v3.5H12a.5.5 0 0 1 0 1H8.5V12a.5.5 0 0 1-1 0V8.5H4a.5.5 0 0 1 0-1h3.5V4a.5.5 0 0 1 .5-.5z"/>
                </svg>
                <span>Create New Project</span>
              </>
            )}
          </button>
        </div>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Your Projects</h2>
          
          {projects.length === 0 ? (
            <div className="bg-[#252526] border border-gray-700 rounded-lg p-8 text-center">
              <p className="text-gray-400 mb-4">No projects yet</p>
              <p className="text-sm text-gray-500">Create your first project to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => handleProjectClick(project)}
                  className={`bg-[#252526] border border-gray-700 rounded-lg p-6 hover:border-blue-500 transition-colors cursor-pointer relative ${
                    startingSession === project.id ? 'opacity-50 pointer-events-none' : ''
                  }`}
                >
                  {startingSession === project.id && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                      <div className="flex items-center gap-2 text-white">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                        <span>Starting...</span>
                      </div>
                    </div>
                  )}
                  <h3 className="text-lg font-semibold mb-2">{project.name}</h3>
                  <p className="text-sm text-gray-400">
                    Created: {new Date(project.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">ID: {project.id}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Page
