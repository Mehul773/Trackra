import React, { useState, useEffect } from 'react';
import { Job, JobStatus, FitRating } from '../types';
import { X } from 'lucide-react';

interface JobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Job>) => Promise<void>;
  jobToEdit?: Job | null;
}

export const JobModal: React.FC<JobModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  jobToEdit,
}) => {
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [salary, setSalary] = useState('');
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<JobStatus>(JobStatus.NOT_APPLIED);
  const [fit, setFit] = useState<FitRating>(FitRating.STRONG);
  const [notes, setNotes] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // If editing an existing job, prepopulate the fields
  useEffect(() => {
    if (jobToEdit) {
      setTitle(jobToEdit.title || '');
      setCompany(jobToEdit.company || '');
      setLocation(jobToEdit.location || '');
      setSalary(jobToEdit.salary || '');
      setUrl(jobToEdit.url || '');
      setStatus(jobToEdit.status || JobStatus.NOT_APPLIED);
      setFit(jobToEdit.fit || FitRating.STRONG);
      setNotes(jobToEdit.notes || '');
    } else {
      // Clear fields for new manual creation
      setTitle('');
      setCompany('');
      setLocation('');
      setSalary('');
      setUrl('');
      setStatus(JobStatus.NOT_APPLIED);
      setFit(FitRating.STRONG);
      setNotes('');
    }
    setFormError(null);
  }, [jobToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Simple validation (must match Joi validations)
    if (!title.trim()) {
      setFormError('Title is required.');
      return;
    }
    if (!company.trim()) {
      setFormError('Company name is required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: Partial<Job> = {
        title: title.trim(),
        company: company.trim(),
        location: location.trim() || null,
        salary: salary.trim() || null,
        url: url.trim() || null,
        status,
        fit,
        notes: notes.trim() || null,
      };

      await onSubmit(payload);
      onClose();
    } catch (err: any) {
      console.error(err);
      setFormError(err.response?.data?.message || 'Failed to save job application.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="modal-header">
          <h3 className="modal-title">
            {jobToEdit ? 'Edit Job Application' : 'Add Job Manually'}
          </h3>
          <button onClick={onClose} className="btn-close">
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {formError && (
              <div className="form-error-alert" style={{ color: 'var(--color-rejected)', marginBottom: '1rem', fontSize: '0.875rem' }}>
                ⚠️ {formError}
              </div>
            )}

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Job Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Software Engineer"
                  className="input-field"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Company *</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Stripe"
                  className="input-field"
                  required
                />
              </div>
            </div>

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Remote / San Francisco"
                  className="input-field"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Salary</label>
                <input
                  type="text"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  placeholder="e.g. $140k/yr or £80k"
                  className="input-field"
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '0.5rem' }}>
              <label className="form-label">Job Posting URL</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://careers.company.com/role"
                className="input-field"
              />
            </div>

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
              <div className="form-group">
                <label className="form-label">Application Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as JobStatus)}
                  className="select-field"
                >
                  <option value={JobStatus.NOT_APPLIED}>Not Applied</option>
                  <option value={JobStatus.APPLIED}>Applied</option>
                  <option value={JobStatus.INTERVIEW}>Interview</option>
                  <option value={JobStatus.OFFER}>Offer</option>
                  <option value={JobStatus.REJECTED}>Rejected</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Skill Fit Rating</label>
                <select
                  value={fit}
                  onChange={(e) => setFit(e.target.value as FitRating)}
                  className="select-field"
                >
                  <option value={FitRating.STRONG}>Strong Fit (Matches 80%+ skills)</option>
                  <option value={FitRating.STRETCH}>Stretch (Good fit, some skill gaps)</option>
                  <option value={FitRating.WEAK}>Weak Fit (Missing core skillsets)</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '0.5rem' }}>
              <label className="form-label">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Write interview notes, timeline, key contact person..."
                className="input-field textarea-field"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : jobToEdit ? 'Save Changes' : 'Create Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
