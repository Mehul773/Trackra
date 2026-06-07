import { useState, useCallback } from 'react';
import { Job, JobStatus } from '../types';
import * as jobsService from '../services/jobs.service';

/**
 * Custom Hook for Jobs Pipeline Management.
 * Encapsulates loading states, operations, and list fetching.
 */
export const useJobs = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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

  return {
    jobs,
    loading,
    error,
    fetchJobs,
    addJob,
    updateJobDetail,
    removeJob,
    extractTextJD,
    extractUrlJD,
    downloadCsv: jobsService.downloadCsv,
  };
};
