/**
 * Feedback API Client
 *
 * API functions for submitting user feedback
 */

import apiClient from './api';

// Request types (frontend camelCase)
export interface FeedbackRequest {
  message: string;
  pageUrl: string;
  screenshot?: string | null;
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
 * Auth token is added automatically by the apiClient interceptor.
 */
export const submitFeedback = async (request: FeedbackRequest): Promise<FeedbackResponse> => {
  // Transform to backend format (snake_case)
  const body: Record<string, string> = {
    message: request.message,
    page_url: request.pageUrl,
  };

  if (request.screenshot) {
    body.screenshot = request.screenshot;
  }

  const response = await apiClient.post<BackendFeedbackResponse>('/api/v1/feedback', body);

  // Transform to frontend format (camelCase)
  return {
    id: response.data.id,
    message: response.data.message,
    createdAt: response.data.created_at,
  };
};
