import React, { useEffect, useState } from 'react';
import { useJobs } from '../hooks/useJobs';
import { Navbar } from '../components/Navbar';
import { KanbanBoard } from '../components/KanbanBoard';
import { JobModal } from '../components/JobModal';
import { ExtractModal } from '../components/ExtractModal';
import { Job } from '../types';
import { Loader } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const {
    jobs,
    loading,
    error,
    fetchJobs,
    addJob,
    updateJobDetail,
    removeJob,
    extractTextJD,
    extractUrlJD,
    downloadCsv,
  } = useJobs();

  // Modals state
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isExtractModalOpen, setIsExtractModalOpen] = useState(false);
  const [jobToEdit, setJobToEdit] = useState<Job | null>(null);

  // Fetch jobs on component load
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleEditJobClick = (job: Job) => {
    setJobToEdit(job);
    setIsManualModalOpen(true);
  };

  const handleCloseManualModal = () => {
    setJobToEdit(null);
    setIsManualModalOpen(false);
  };

  const handleSaveJob = async (jobData: Partial<Job>) => {
    if (jobToEdit) {
      await updateJobDetail(jobToEdit.id, jobData);
    } else {
      await addJob(jobData);
    }
  };

  const handleDeleteJob = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this job application?')) {
      await removeJob(id);
    }
  };

  return (
    <div className="dashboard-layout animate-fade-in" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
      {/* Navbar */}
      <Navbar
        onAddManual={() => setIsManualModalOpen(true)}
        onOpenExtract={() => setIsExtractModalOpen(true)}
        onDownloadCsv={downloadCsv}
      />

      {/* Main Board View */}
      {loading && jobs.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
          <Loader size={40} className="logo-icon" style={{ animation: 'spin 1.5s infinite linear', color: 'var(--primary)' }} />
          <span>Loading your job pipeline...</span>
        </div>
      ) : error ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', color: 'var(--color-rejected)' }}>
          <span>⚠️ {error}</span>
          <button onClick={() => fetchJobs()} className="btn btn-secondary">
            Retry Connection
          </button>
        </div>
      ) : (
        <KanbanBoard
          jobs={jobs}
          onEditJob={handleEditJobClick}
          onDeleteJob={handleDeleteJob}
        />
      )}

      {/* Manual Add/Edit modal */}
      <JobModal
        isOpen={isManualModalOpen}
        onClose={handleCloseManualModal}
        onSubmit={handleSaveJob}
        jobToEdit={jobToEdit}
      />

      {/* AI extraction modal */}
      <ExtractModal
        isOpen={isExtractModalOpen}
        onClose={() => setIsExtractModalOpen(false)}
        onExtractUrl={extractUrlJD}
        onExtractText={extractTextJD}
      />
    </div>
  );
};
