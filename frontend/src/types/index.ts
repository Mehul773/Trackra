/**
 * TypeScript type definitions for the Trackra frontend.
 * Enforces strict type checking for API requests and state management.
 */

export enum JobStatus {
  NOT_APPLIED = 'NOT_APPLIED',
  APPLIED = 'APPLIED',
  INTERVIEW = 'INTERVIEW',
  OFFER = 'OFFER',
  REJECTED = 'REJECTED',
}

export enum FitRating {
  STRONG = 'STRONG',
  STRETCH = 'STRETCH',
  WEAK = 'WEAK',
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  jobId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string | null;
  salary: string | null;
  url: string | null;
  sourceUrl: string | null;
  skills: string[];
  fit: FitRating | null;
  status: JobStatus;
  notes: string | null;
  rawJD: string | null;
  briefJD: string | null;
  contacts: Contact[];
  userId: string;
  appliedOn: string | null;
  interviewOn: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExtractedJob {
  title: string;
  company: string;
  location: string | null;
  salary: string | null;
  url: string | null;
  skills: string[];
  fit: FitRating;
  experience: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
}
