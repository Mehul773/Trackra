import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Briefcase, Bot, FileSpreadsheet } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { login } = useAuth();

  return (
    <div className="landing-container animate-fade-in">
      {/* Background radial glow */}
      <div className="radial-glow"></div>

      {/* Main Hero Container */}
      <div className="hero-box">
        <div className="hero-header">
          <div className="hero-logo-box">
            <Briefcase size={32} className="logo-icon" />
          </div>
          <h1 className="hero-brand">Trackra</h1>
        </div>

        <h2 className="hero-title">
          The Intelligent <span className="text-gradient">Job Application</span> Pipeline
        </h2>
        
        <p className="hero-subtitle">
          Stop copying and pasting manually. Paste a job URL or description, and let our AI automatically extract company details, skills, salary, and calculate your fit rating.
        </p>

        {/* Google Login Button */}
        <button onClick={login} className="btn-google">
          <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.77-.07-1.54-.19-2.27H12v4.51h6.6c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.68-5.17 3.68-8.82z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.37 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.27 14.29a7.18 7.18 0 0 1 0-4.58V6.62H1.29a11.94 11.94 0 0 0 0 10.76l3.98-3.09z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Feature Grid */}
        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon-box url-box">
              <Sparkles size={20} />
            </div>
            <h4>AI URL Import</h4>
            <p>Paste a job listing URL from LinkedIn, Indeed, etc., and let Gemini extract the details.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box text-box">
              <Bot size={20} />
            </div>
            <h4>Skill Fit Engine</h4>
            <p>AI automatically grades the job fit based on core requirements and lists key skills.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box csv-box">
              <FileSpreadsheet size={20} />
            </div>
            <h4>CSV Exports</h4>
            <p>Download your entire job pipeline history as a beautifully structured CSV spreadsheet.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
