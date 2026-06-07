import React, { useState } from 'react';
import { X, Sparkles, Link2, FileText, Loader } from 'lucide-react';

interface ExtractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExtractUrl: (url: string) => Promise<any>;
  onExtractText: (text: string) => Promise<any>;
}

type TabType = 'url' | 'text';

export const ExtractModal: React.FC<ExtractModalProps> = ({
  isOpen,
  onClose,
  onExtractUrl,
  onExtractText,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('url');
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (activeTab === 'url') {
        if (!url.trim()) {
          setError('URL is required.');
          setLoading(false);
          return;
        }
        await onExtractUrl(url.trim());
        setUrl('');
      } else {
        if (!text.trim()) {
          setError('Job description text is required.');
          setLoading(false);
          return;
        }
        if (text.trim().length < 50) {
          setError('Job description must be at least 50 characters to allow meaningful AI analysis.');
          setLoading(false);
          return;
        }
        await onExtractText(text.trim());
        setText('');
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          'AI extraction failed. Please check your inputs and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h3 className="modal-title">
            <Sparkles size={18} className="logo-icon" style={{ color: '#8b5cf6' }} />
            <span>AI Smart Import</span>
          </h3>
          <button onClick={onClose} className="btn-close" disabled={loading}>
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleExtract}>
          <div className="modal-body">
            {/* Tabs */}
            <div className="tab-container" style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem', gap: '1.5rem' }}>
              <button
                type="button"
                className={`tab-btn ${activeTab === 'url' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('url');
                  setError(null);
                }}
                disabled={loading}
                style={{
                  paddingBottom: '0.75rem',
                  borderBottom: activeTab === 'url' ? '2px solid var(--primary)' : '2px solid transparent',
                  color: activeTab === 'url' ? 'var(--text-headers)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <Link2 size={16} />
                <span>Job URL</span>
              </button>
              <button
                type="button"
                className={`tab-btn ${activeTab === 'text' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('text');
                  setError(null);
                }}
                disabled={loading}
                style={{
                  paddingBottom: '0.75rem',
                  borderBottom: activeTab === 'text' ? '2px solid var(--primary)' : '2px solid transparent',
                  color: activeTab === 'text' ? 'var(--text-headers)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <FileText size={16} />
                <span>Job Description</span>
              </button>
            </div>

            {error && (
              <div className="form-error-alert" style={{ color: 'var(--color-rejected)', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
                ⚠️ {error}
              </div>
            )}

            {/* Active Content */}
            {loading ? (
              <div className="extract-loading" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '2rem 0', textAlign: 'center' }}>
                <Loader size={40} className="logo-icon" style={{ animation: 'spin 1.5s infinite linear', color: 'var(--primary)' }} />
                <div>
                  <h4 style={{ color: 'var(--text-headers)', marginBottom: '0.25rem' }}>
                    {activeTab === 'url' ? 'Scraping web page...' : 'Parsing job details...'}
                  </h4>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    Gemini 1.5 Flash is analyzing requirements, location, skills, and match rating.
                  </p>
                </div>
              </div>
            ) : activeTab === 'url' ? (
              <div className="form-group">
                <label className="form-label">Paste Job Posting URL</label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://linkedin.com/jobs/view/12345 or indeed.com/..."
                  className="input-field"
                  required
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  We will scrape the job posting text server-side and extract the key details instantly.
                </p>
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label">Paste Job Description Text (Min 50 chars)</label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste the raw text of the job description here..."
                  className="input-field textarea-field"
                  required
                />
              </div>
            )}
          </div>

          {/* Footer Actions */}
          {!loading && (
            <div className="modal-footer">
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sparkle">
                <Sparkles size={16} />
                <span>Extract details</span>
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
