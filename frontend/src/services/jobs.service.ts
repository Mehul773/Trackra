import api from './api';
import { ApiResponse, Job, JobStatus } from '../types';

/**
 * Jobs Service.
 * Coordinates all job tracking, AI extraction, and CSV export logic.
 */

/**
 * Fetch all jobs for the authenticated user, optionally filtered by status.
 */
export const getAllJobs = async (status?: JobStatus): Promise<Job[]> => {
  const url = status ? `/jobs?status=${status}` : '/jobs';
  const response = await api.get<ApiResponse<Job[]>>(url);
  return response.data.data;
};

/**
 * Fetch a single job details by ID.
 */
export const getJobById = async (id: string): Promise<Job> => {
  const response = await api.get<ApiResponse<Job>>(`/jobs/${id}`);
  return response.data.data;
};

/**
 * Manually create a new job application.
 */
export const createJob = async (data: Partial<Job>): Promise<Job> => {
  const response = await api.post<ApiResponse<Job>>('/jobs', data);
  return response.data.data;
};

/**
 * Update an existing job status, notes, or details.
 */
export const updateJob = async (id: string, data: Partial<Job>): Promise<Job> => {
  const response = await api.put<ApiResponse<Job>>(`/jobs/${id}`, data);
  return response.data.data;
};

/**
 * Delete a job from the user's pipeline.
 */
export const deleteJob = async (id: string): Promise<void> => {
  await api.delete<ApiResponse<null>>(`/jobs/${id}`);
};

/**
 * Trigger AI extraction from job description text.
 */
export const extractFromText = async (text: string): Promise<Job> => {
  const response = await api.post<ApiResponse<Job>>('/extract/text', { text });
  return response.data.data;
};

/**
 * Trigger AI extraction from a job posting URL.
 */
export const extractFromUrl = async (url: string): Promise<Job> => {
  const response = await api.post<ApiResponse<Job>>('/extract/url', { url });
  return response.data.data;
};

/**
 * Download the pipeline as a CSV file.
 * Creates an invisible link to trigger browser download with correct headers.
 */
export const downloadCsv = async (): Promise<void> => {
  const response = await api.get('/jobs/export/csv', { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'trackra-pipeline.csv');
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
