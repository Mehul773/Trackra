import { useState, useCallback, useMemo } from 'react';
import { Job, JobStatus, Contact } from '../types';
import * as jobsService from '../services/jobs.service';

/**
 * Custom Hook for Jobs Pipeline Management.
 * Encapsulates loading states, search/filter, drag-and-drop status update,
 * and list fetching with client-side global search.
 */
export const useJobs = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  /**
   * Client-side global search across job title, company, location,
   * salary, and contact details (name, email, phone, role).
   */
  const filteredJobs = useMemo(() => {
    if (!searchQuery.trim()) return jobs;
    const query = searchQuery.toLowerCase().trim();
    return jobs.filter((job) => {
      // Match core job fields
      if (job.title.toLowerCase().includes(query)) return true;
      if (job.company.toLowerCase().includes(query)) return true;
      if (job.location?.toLowerCase().includes(query)) return true;
      if (job.salary?.toLowerCase().includes(query)) return true;
      if (job.briefJD?.toLowerCase().includes(query)) return true;
      // Match contact details
      if (job.contacts && job.contacts.length > 0) {
        return job.contacts.some((contact: Contact) =>
          contact.name.toLowerCase().includes(query) ||
          contact.email?.toLowerCase().includes(query) ||
          contact.phone?.toLowerCase().includes(query) ||
          contact.role?.toLowerCase().includes(query)
        );
      }
      return false;
    });
  }, [jobs, searchQuery]);

  // Fetch all jobs
  const fetchJobs = useCallback(async (status?: JobStatus) => {
    setLoading(true);
    setError(null);
    try {
      const data = await jobsService.getAllJobs(status);
      setJobs(data);
    } catch (err) {
      setError('Failed to fetch jobs pipeline. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create manual job
  const addJob = async (jobData: Partial<Job>) => {
    setLoading(true);
    setError(null);
    try {
      const newJob = await jobsService.createJob(jobData);
      setJobs((prev) => [newJob, ...prev]);
      return newJob;
    } catch (err) {
      setError('Failed to add job application.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update job details (status, notes, etc.)
  const updateJobDetail = async (id: string, jobData: Partial<Job>) => {
    setError(null);
    try {
      const updatedJob = await jobsService.updateJob(id, jobData);
      setJobs((prev) =>
        prev.map((job) => (job.id === id ? updatedJob : job))
      );
      return updatedJob;
    } catch (err) {
      setError('Failed to update job details.');
      throw err;
    }
  };

  /**
   * Optimistic drag-and-drop status update.
   * Immediately moves the card visually, then persists via API.
   * Rolls back on failure.
   */
  const updateJobStatus = async (id: string, newStatus: JobStatus) => {
    // Optimistic update
    setJobs((prev) =>
      prev.map((job) =>
        job.id === id ? { ...job, status: newStatus } : job
      )
    );
    try {
      await jobsService.updateJob(id, { status: newStatus } as Partial<Job>);
    } catch (err) {
      // Rollback: re-fetch all jobs
      setError('Failed to update job status. Reverting...');
      await fetchJobs();
    }
  };

  // Delete job
  const removeJob = async (id: string) => {
    setError(null);
    try {
      await jobsService.deleteJob(id);
      setJobs((prev) => prev.filter((job) => job.id !== id));
    } catch (err) {
      setError('Failed to delete job.');
      throw err;
    }
  };

  // Extract from Text
  const extractTextJD = async (text: string) => {
    setLoading(true);
    setError(null);
    try {
      const newJob = await jobsService.extractFromText(text);
      setJobs((prev) => [newJob, ...prev]);
      return newJob;
    } catch (err) {
      setError('AI text extraction failed. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Extract from URL
  const extractUrlJD = async (url: string) => {
    setLoading(true);
    setError(null);
    try {
      const newJob = await jobsService.extractFromUrl(url);
      setJobs((prev) => [newJob, ...prev]);
      return newJob;
    } catch (err) {
      setError('AI URL extraction failed. Check the URL or try pasting text.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // CSV download with search filter support
  const downloadCsv = async () => {
    await jobsService.downloadCsv(searchQuery || undefined);
  };

  return {
    jobs,
    filteredJobs,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    fetchJobs,
    addJob,
    updateJobDetail,
    updateJobStatus,
    removeJob,
    extractTextJD,
    extractUrlJD,
    downloadCsv,
  };
};
