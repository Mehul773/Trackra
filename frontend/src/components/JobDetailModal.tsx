import React, { useState, useCallback } from 'react';
import { Job, JobStatus, FitRating, Contact } from '../types';
import {
  X,
  Copy,
  Check,
  MapPin,
  DollarSign,
  Calendar,
  ExternalLink,
  User,
  Mail,
  Phone,
  Briefcase,
  Edit2,
  FileText,
  Star,
} from 'lucide-react';

interface JobDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job | null;
  onEdit: (job: Job) => void;
}

const STATUS_CONFIG: Record<JobStatus, { label: string; colorVar: string; bgVar: string }> = {
  [JobStatus.NOT_APPLIED]: { label: 'Not Applied', colorVar: 'var(--color-not-applied)', bgVar: 'var(--bg-not-applied)' },
  [JobStatus.APPLIED]: { label: 'Applied', colorVar: 'var(--color-applied)', bgVar: 'var(--bg-applied)' },
  [JobStatus.INTERVIEW]: { label: 'Interview', colorVar: 'var(--color-interview)', bgVar: 'var(--bg-interview)' },
  [JobStatus.OFFER]: { label: 'Offer', colorVar: 'var(--color-offer)', bgVar: 'var(--bg-offer)' },
  [JobStatus.REJECTED]: { label: 'Rejected', colorVar: 'var(--color-rejected)', bgVar: 'var(--bg-rejected)' },
};

const getFitLabel = (fit: FitRating | null): { text: string; className: string } | null => {
  switch (fit) {
    case FitRating.STRONG:
      return { text: 'Strong Fit', className: 'fit-strong' };
    case FitRating.STRETCH:
      return { text: 'Stretch', className: 'fit-stretch' };
    case FitRating.WEAK:
      return { text: 'Weak Fit', className: 'fit-weak' };
    default:
      return null;
  }
};

const formatDate = (dateString: string | null): string => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const buildCopyText = (job: Job): string => {
  const lines: string[] = [];

  lines.push(`Job Title: ${job.title}`);
  lines.push(`Company: ${job.company}`);
  lines.push(`Location: ${job.location || '—'}`);
  lines.push(`Salary: ${job.salary || '—'}`);
  lines.push(`Status: ${STATUS_CONFIG[job.status].label}`);
  lines.push(`Fit Rating: ${getFitLabel(job.fit)?.text || '—'}`);
  lines.push(`Applied On: ${formatDate(job.appliedOn || job.createdAt)}`);

  if (job.briefJD) {
    lines.push('');
    lines.push('Brief JD:');
    lines.push(job.briefJD);
  }

  if (job.skills && job.skills.length > 0) {
    lines.push('');
    lines.push(`Skills: ${job.skills.join(', ')}`);
  }

  if (job.contacts && job.contacts.length > 0) {
    lines.push('');
    lines.push('Contacts:');
    job.contacts.forEach((c: Contact) => {
      const parts = [c.name];
      if (c.role) parts.push(`(${c.role})`);
      if (c.email) parts.push(`- ${c.email}`);
      if (c.phone) parts.push(`- ${c.phone}`);
      lines.push(`- ${parts.join(' ')}`);
    });
  }

  if (job.notes) {
    lines.push('');
    lines.push(`Notes: ${job.notes}`);
  }

  if (job.url) {
    lines.push(`URL: ${job.url}`);
  }

  return lines.join('\n');
};

export const JobDetailModal: React.FC<JobDetailModalProps> = ({
  isOpen,
  onClose,
  job,
  onEdit,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!job) return;
    try {
      await navigator.clipboard.writeText(buildCopyText(job));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [job]);

  if (!isOpen || !job) return null;

  const statusConfig = STATUS_CONFIG[job.status];
  const fitDetails = getFitLabel(job.fit);
  const dateLabel = formatDate(job.appliedOn || job.createdAt);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content detail-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="modal-header">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, minWidth: 0 }}>
            <h3 className="modal-title" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {job.title}
            </h3>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              {job.company}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
            {/* Status Badge */}
            <span
              className="detail-status-badge"
              style={{
                background: statusConfig.bgVar,
                color: statusConfig.colorVar,
                border: `1px solid ${statusConfig.colorVar}`,
                padding: '0.25rem 0.75rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              {statusConfig.label}
            </span>

            {/* Edit Button */}
            <button
              onClick={() => onEdit(job)}
              className="btn btn-secondary"
              style={{ padding: '0.5rem 0.75rem', fontSize: '0.8125rem' }}
              title="Edit application"
            >
              <Edit2 size={14} />
              <span>Edit</span>
            </button>

            {/* Close Button */}
            <button onClick={onClose} className="btn-close" title="Close">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Info Grid: Location · Salary · Date · Fit */}
          <div className="detail-section">
            <div className="detail-info-grid">
              <div className="detail-info-item">
                <MapPin size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <div>
                  <span className="detail-info-label">Location</span>
                  <span className="detail-info-value">{job.location || '—'}</span>
                </div>
              </div>

              <div className="detail-info-item">
                <DollarSign size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <div>
                  <span className="detail-info-label">Salary</span>
                  <span className="detail-info-value">{job.salary || '—'}</span>
                </div>
              </div>

              <div className="detail-info-item">
                <Calendar size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <div>
                  <span className="detail-info-label">{job.appliedOn ? 'Applied On' : 'Added On'}</span>
                  <span className="detail-info-value">{dateLabel}</span>
                </div>
              </div>

              <div className="detail-info-item">
                <Star size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <div>
                  <span className="detail-info-label">Fit Rating</span>
                  {fitDetails ? (
                    <span className="detail-info-value">
                      <span className={`fit-indicator ${fitDetails.className}`}>
                        <span className="fit-dot"></span>
                        {fitDetails.text}
                      </span>
                    </span>
                  ) : (
                    <span className="detail-info-value">—</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Interview Date (if available) */}
          {job.interviewOn && (
            <div className="detail-section">
              <h4 className="detail-section-title">
                <Calendar size={14} />
                Interview Scheduled
              </h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-interview)', fontWeight: 500 }}>
                {formatDate(job.interviewOn)}
              </p>
            </div>
          )}

          {/* Brief JD */}
          {job.briefJD && (
            <div className="detail-section">
              <h4 className="detail-section-title">
                <FileText size={14} />
                Job Description
              </h4>
              <p className="detail-jd">{job.briefJD}</p>
            </div>
          )}

          {/* Skills */}
          {job.skills && job.skills.length > 0 && (
            <div className="detail-section">
              <h4 className="detail-section-title">
                <Briefcase size={14} />
                Skills
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {job.skills.map((skill, index) => (
                  <span key={index} className="skill-pill">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Contacts */}
          {job.contacts && job.contacts.length > 0 && (
            <div className="detail-section">
              <h4 className="detail-section-title">
                <User size={14} />
                Contacts
              </h4>
              <div className="detail-contacts-table">
                {job.contacts.map((contact) => (
                  <div
                    key={contact.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '0.625rem 0',
                      borderBottom: '1px solid var(--border)',
                      flexWrap: 'wrap',
                      fontSize: '0.8125rem',
                    }}
                  >
                    <span style={{ color: 'var(--text-headers)', fontWeight: 500, minWidth: '100px' }}>
                      {contact.name}
                    </span>
                    {contact.role && (
                      <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Briefcase size={12} />
                        {contact.role}
                      </span>
                    )}
                    {contact.email && (
                      <a
                        href={`mailto:${contact.email}`}
                        style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        <Mail size={12} />
                        {contact.email}
                      </a>
                    )}
                    {contact.phone && (
                      <a
                        href={`tel:${contact.phone}`}
                        style={{ color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        <Phone size={12} />
                        {contact.phone}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {job.notes && (
            <div className="detail-section">
              <h4 className="detail-section-title">
                <FileText size={14} />
                Notes
              </h4>
              <p className="detail-jd">{job.notes}</p>
            </div>
          )}

          {/* External Links */}
          {(job.url || job.sourceUrl) && (
            <div className="detail-section">
              <h4 className="detail-section-title">
                <ExternalLink size={14} />
                Links
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {job.url && (
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: 'var(--primary)',
                      fontSize: '0.8125rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      wordBreak: 'break-all',
                    }}
                  >
                    <ExternalLink size={13} />
                    {job.url}
                  </a>
                )}
                {job.sourceUrl && (
                  <a
                    href={job.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: 'var(--text-muted)',
                      fontSize: '0.8125rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      wordBreak: 'break-all',
                    }}
                  >
                    <ExternalLink size={13} />
                    Source: {job.sourceUrl}
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="modal-footer">
          <button
            onClick={handleCopy}
            className={`btn btn-secondary btn-copy${copied ? ' copied' : ''}`}
            title="Copy all details to clipboard"
          >
            {copied ? (
              <>
                <Check size={15} style={{ color: 'var(--fit-strong)' }} />
                <span style={{ color: 'var(--fit-strong)' }}>Copied!</span>
              </>
            ) : (
              <>
                <Copy size={15} />
                <span>Copy Details</span>
              </>
            )}
          </button>
          <button onClick={onClose} className="btn btn-primary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
