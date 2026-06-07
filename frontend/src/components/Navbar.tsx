import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Briefcase, Sparkles, Download } from 'lucide-react';

interface NavbarProps {
  onAddManual: () => void;
  onOpenExtract: () => void;
  onDownloadCsv: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onAddManual,
  onOpenExtract,
  onDownloadCsv,
}) => {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="nav-container">
        {/* Brand */}
        <div className="nav-brand">
          <div className="brand-logo">
            <Briefcase size={20} className="logo-icon" />
          </div>
          <span className="brand-name">Trackra</span>
        </div>

        {/* Action Controls */}
        <div className="nav-actions">
          <button onClick={onOpenExtract} className="btn btn-primary btn-sparkle">
            <Sparkles size={16} />
            <span>AI Quick Add</span>
          </button>
          
          <button onClick={onAddManual} className="btn btn-secondary">
            <span>Add Manually</span>
          </button>

          <button onClick={onDownloadCsv} className="btn btn-icon" title="Export pipeline to CSV">
            <Download size={18} />
          </button>

          {/* User Profile & Logout */}
          {user && (
            <div className="user-profile">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="user-avatar" />
              ) : (
                <div className="user-avatar-placeholder">{user.name.charAt(0)}</div>
              )}
              <span className="user-name">{user.name}</span>
              
              <button onClick={logout} className="btn-logout" title="Sign Out">
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
