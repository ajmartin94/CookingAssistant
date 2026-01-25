/**
 * Feedback API Client
 *
 * API functions for submitting user feedback
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Request types (frontend camelCase)
export interface FeedbackRequest {
  message: string;
  pageUrl: string;
}

// Response types (frontend camelCase, transformed from backend snake_case)
export interface FeedbackResponse {
  id: string;
  message: string;
  createdAt: string;
}

// Backend response type (snake_case)
interface BackendFeedbackResponse {
  id: string;
  message: string;
  created_at: string;
}

/**
 * Submit user feedback to the API
 *
 * Sends feedback message and page URL to the backend.
 * Includes auth token if user is logged in (optional).
 */
export const submitFeedback = async (request: FeedbackRequest): Promise<FeedbackResponse> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Include auth token if available (but don't require it)
  const token = localStorage.getItem('auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Transform to backend format (snake_case)
  const body = {
    message: request.message,
    page_url: request.pageUrl,
  };

  const response = await fetch(`${API_BASE_URL}/api/v1/feedback`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Failed to submit feedback: ${response.status}`);
  }

  const data: BackendFeedbackResponse = await response.json();

  // Transform to frontend format (camelCase)
  return {
    id: data.id,
    message: data.message,
    createdAt: data.created_at,
  };
};
