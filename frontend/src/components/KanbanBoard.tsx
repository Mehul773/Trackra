import React from 'react';
import { Job, JobStatus } from '../types';
import { JobCard } from './JobCard';
import { Circle, FileText, CalendarCheck, Award, ThumbsDown } from 'lucide-react';

interface KanbanBoardProps {
  jobs: Job[];
  onEditJob: (job: Job) => void;
  onDeleteJob: (id: string) => void;
}

interface ColumnConfig {
  status: JobStatus;
  title: string;
  color: string;
  icon: React.ReactNode;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  jobs,
  onEditJob,
  onDeleteJob,
}) => {
  // Define columns in the pipelines
  const columns: ColumnConfig[] = [
    {
      status: JobStatus.NOT_APPLIED,
      title: 'Wishlist',
      color: 'column-not-applied',
      icon: <Circle size={14} />,
    },
    {
      status: JobStatus.APPLIED,
      title: 'Applied',
      color: 'column-applied',
      icon: <FileText size={14} />,
    },
    {
      status: JobStatus.INTERVIEW,
      title: 'Interviews',
      color: 'column-interview',
      icon: <CalendarCheck size={14} />,
    },
    {
      status: JobStatus.OFFER,
      title: 'Offers',
      color: 'column-offer',
      icon: <Award size={14} />,
    },
    {
      status: JobStatus.REJECTED,
      title: 'Rejected',
      color: 'column-rejected',
      icon: <ThumbsDown size={14} />,
    },
  ];

  // Group jobs by status
  const getJobsForColumn = (status: JobStatus) => {
    return jobs.filter((job) => job.status === status);
  };

  return (
    <div className="kanban-container">
      <div className="kanban-grid">
        {columns.map((col) => {
          const colJobs = getJobsForColumn(col.status);
          return (
            <div key={col.status} className="kanban-column">
              {/* Column Header */}
              <div className={`column-header ${col.color}`}>
                <div className="header-title">
                  {col.icon}
                  <span>{col.title}</span>
                </div>
                <span className="job-count-badge">{colJobs.length}</span>
              </div>

              {/* Column Cards Container */}
              <div className="column-body">
                {colJobs.length > 0 ? (
                  <div className="cards-stack">
                    {colJobs.map((job) => (
                      <JobCard
                        key={job.id}
                        job={job}
                        onEdit={onEditJob}
                        onDelete={onDeleteJob}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="empty-column-placeholder">
                    <span>No applications</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
