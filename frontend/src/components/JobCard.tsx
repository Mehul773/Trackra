import React from 'react';
import { Job, FitRating } from '../types';
import { MapPin, DollarSign, Calendar, Edit2, Trash2, ExternalLink } from 'lucide-react';

interface JobCardProps {
  job: Job;
  onEdit: (job: Job) => void;
  onDelete: (id: string) => void;
}

export const JobCard: React.FC<JobCardProps> = ({ job, onEdit, onDelete }) => {
  const getFitLabel = (fit: FitRating | null) => {
    switch (fit) {
      case FitRating.STRONG:
        return { text: 'Strong Fit', class: 'fit-strong' };
      case FitRating.STRETCH:
        return { text: 'Stretch', class: 'fit-stretch' };
      case FitRating.WEAK:
        return { text: 'Weak Fit', class: 'fit-weak' };
      default:
        return null;
    }
  };

  const fitDetails = getFitLabel(job.fit);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  };

  const dateLabel = formatDate(job.appliedOn || job.createdAt);

  return (
    <div className="job-card animate-fade-in">
      {/* Header */}
      <div className="card-header">
        <div className="card-brand">
          <h4 className="job-title" title={job.title}>
            {job.title}
          </h4>
          <span className="company-name">{job.company}</span>
        </div>

        {/* Action Controls */}
        <div className="card-actions">
          {job.url && (
            <a href={job.url} target="_blank" rel="noopener noreferrer" className="action-btn" title="View Job Description">
              <ExternalLink size={14} />
            </a>
          )}
          <button onClick={() => onEdit(job)} className="action-btn" title="Edit application">
            <Edit2 size={14} />
          </button>
          <button onClick={() => onDelete(job.id)} className="action-btn delete-btn" title="Delete application">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Meta Info */}
      <div className="card-meta">
        {job.location && (
          <div className="meta-item">
            <MapPin size={12} />
            <span title={job.location}>{job.location}</span>
          </div>
        )}
        {job.salary && (
          <div className="meta-item">
            <DollarSign size={12} />
            <span title={job.salary}>{job.salary}</span>
          </div>
        )}
        <div className="meta-item">
          <Calendar size={12} />
          <span>{dateLabel}</span>
        </div>
      </div>

      {/* Skills */}
      {job.skills && job.skills.length > 0 && (
        <div className="card-skills">
          {job.skills.map((skill, index) => (
            <span key={index} className="skill-pill">
              {skill}
            </span>
          ))}
        </div>
      )}

      {/* Fit Rating Banner */}
      {fitDetails && (
        <div className="card-footer">
          <div className={`fit-indicator ${fitDetails.class}`}>
            <span className="fit-dot"></span>
            <span>{fitDetails.text}</span>
          </div>
        </div>
      )}
    </div>
  );
};
