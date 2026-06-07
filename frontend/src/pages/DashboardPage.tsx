import React, { useEffect, useState } from 'react';
import { useJobs } from '../hooks/useJobs';
import { Navbar } from '../components/Navbar';
import { KanbanBoard } from '../components/KanbanBoard';
import { JobModal } from '../components/JobModal';
import { ExtractModal } from '../components/ExtractModal';
import { JobDetailModal } from '../components/JobDetailModal';
import { Job } from '../types';
import { Loader } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const {
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
  } = useJobs();

  // Modals state
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isExtractModalOpen, setIsExtractModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [jobToEdit, setJobToEdit] = useState<Job | null>(null);
  const [jobToView, setJobToView] = useState<Job | null>(null);

  // Fetch jobs on component load
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleEditJobClick = (job: Job) => {
    setJobToEdit(job);
    setIsManualModalOpen(true);
  };

  const handleViewJobClick = (job: Job) => {
    setJobToView(job);
    setIsDetailModalOpen(true);
  };

  const handleCloseManualModal = () => {
    setJobToEdit(null);
    setIsManualModalOpen(false);
  };

  const handleCloseDetailModal = () => {
    setJobToView(null);
    setIsDetailModalOpen(false);
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

  const handleEditFromDetail = (job: Job) => {
    setIsDetailModalOpen(false);
    setJobToView(null);
    handleEditJobClick(job);
  };

  return (
    <div className="dashboard-layout animate-fade-in" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
      {/* Navbar with Search */}
      <Navbar
        onAddManual={() => setIsManualModalOpen(true)}
        onOpenExtract={() => setIsExtractModalOpen(true)}
        onDownloadCsv={downloadCsv}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchCategory={searchCategory}
        onCategoryChange={setSearchCategory}
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
      />

      {/* Main Board View */}
      {loading && filteredJobs.length === 0 ? (
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
        <>
          {/* Search results indicator */}
          {searchQuery && (
            <div className="search-results-bar">
              <span>
                Showing <strong>{filteredJobs.length}</strong> result{filteredJobs.length !== 1 ? 's' : ''} for "<strong>{searchQuery}</strong>"
              </span>
            </div>
          )}
          <KanbanBoard
            jobs={filteredJobs}
            onEditJob={handleEditJobClick}
            onDeleteJob={handleDeleteJob}
            onViewJob={handleViewJobClick}
            onStatusChange={updateJobStatus}
          />
        </>
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

      {/* Job Detail View Modal */}
      <JobDetailModal
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        job={jobToView}
        onEdit={handleEditFromDetail}
      />
    </div>
  );
};
