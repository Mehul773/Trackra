import { useState, useCallback, useMemo } from 'react';
import { Job, JobStatus, Contact } from '../types';
import * as jobsService from '../services/jobs.service';

/**
 * Custom Hook for Jobs Pipeline Management.
 * Encapsulates loading states, search/filter, drag-and-drop status update,
 * and list fetching with client-side global search.
 */
// Simple Levenshtein distance implementation for typo tolerance
const getLevenshteinDistance = (a: string, b: string): number => {
  const matrix = Array.from({ length: a.length + 1 }, () =>
    Array(b.length + 1).fill(0)
  );

  for (let i = 0; i <= a.length; i++) matrix[i]![0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0]![j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[i]![j] = matrix[i - 1]![j - 1]!;
      } else {
        matrix[i]![j] = Math.min(
          matrix[i - 1]![j]! + 1,    // deletion
          matrix[i]![j - 1]! + 1,    // insertion
          matrix[i - 1]![j - 1]! + 1 // substitution
        );
      }
    }
  }
  return matrix[a.length]![b.length]!;
};

// Check if a text matches a query fuzzy-tolerantly
const isFuzzyMatch = (text: string, query: string): boolean => {
  if (!text) return false;
  const t = text.toLowerCase();
  const q = query.toLowerCase();

  // 1. Direct substring match
  if (t.includes(q)) return true;

  // 2. Character sequence matching (subsequence check)
  let qIdx = 0;
  for (let tIdx = 0; tIdx < t.length; tIdx++) {
    if (t[tIdx] === q[qIdx]) {
      qIdx++;
      if (qIdx === q.length) return true;
    }
  }

  // 3. Typo tolerance check
  const distance = getLevenshteinDistance(t, q);
  const allowedDistance = q.length <= 5 ? 1 : 2;
  return distance <= allowedDistance;
};

export const useJobs = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchCategory, setSearchCategory] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  /**
   * Client-side search and date filters logic with typo tolerance.
   */
  const filteredJobs = useMemo(() => {
    let result = jobs;

    // 1. Filter by Date
    if (dateFilter !== 'all') {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

      result = result.filter((job) => {
        const createdTime = new Date(job.createdAt).getTime();
        if (dateFilter === 'today') {
          return createdTime >= todayStart;
        } else if (dateFilter === 'week') {
          const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
          return createdTime >= sevenDaysAgo;
        } else if (dateFilter === 'month') {
          const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;
          return createdTime >= thirtyDaysAgo;
        }
        return true;
      });
    }

    // 2. Filter by Scoped Search Query
    if (!searchQuery.trim()) return result;
    const query = searchQuery.trim();

    return result.filter((job) => {
      const checkTitle = () => isFuzzyMatch(job.title, query);
      const checkCompany = () => isFuzzyMatch(job.company, query);
      const checkLocation = () => job.location ? isFuzzyMatch(job.location, query) : false;
      const checkSalary = () => job.salary ? isFuzzyMatch(job.salary, query) : false;
      const checkBriefJd = () => job.briefJD ? isFuzzyMatch(job.briefJD, query) : false;
      const checkContacts = () => {
        if (!job.contacts || job.contacts.length === 0) return false;
        return job.contacts.some((contact: Contact) =>
          isFuzzyMatch(contact.name, query) ||
          (contact.email ? isFuzzyMatch(contact.email, query) : false) ||
          (contact.phone ? isFuzzyMatch(contact.phone, query) : false) ||
          (contact.role ? isFuzzyMatch(contact.role, query) : false)
        );
      };

      if (searchCategory === 'title') return checkTitle();
      if (searchCategory === 'company') return checkCompany();
      if (searchCategory === 'location') return checkLocation();
      if (searchCategory === 'salary') return checkSalary();
      if (searchCategory === 'contacts') return checkContacts();

      // 'all' searches across everything
      return (
        checkTitle() ||
        checkCompany() ||
        checkLocation() ||
        checkSalary() ||
        checkBriefJd() ||
        checkContacts()
      );
    });
  }, [jobs, searchQuery, searchCategory, dateFilter]);

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

  // CSV download with search, category, and date filter support
  const downloadCsv = async () => {
    await jobsService.downloadCsv(searchQuery || undefined, searchCategory, dateFilter);
  };

  return {
    jobs,
    filteredJobs,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    searchCategory,
    setSearchCategory,
    dateFilter,
    setDateFilter,
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
