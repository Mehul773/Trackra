import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Briefcase, Sparkles, Download, Search, X, ExternalLink, Menu } from 'lucide-react';

interface NavbarProps {
  onAddManual: () => void;
  onOpenExtract: () => void;
  onDownloadCsv: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onAddManual,
  onOpenExtract,
  onDownloadCsv,
  searchQuery,
  onSearchChange,
}) => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

        {/* Global Search Bar (center) */}
        <div className="nav-search">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search jobs, companies, contacts..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button
              className="search-clear"
              onClick={() => onSearchChange('')}
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          className="nav-hamburger"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          title="Toggle menu"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* Action Controls */}
        <div className={`nav-actions${mobileMenuOpen ? ' nav-actions--open' : ''}`}>
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

          {/* Portfolio Link */}
          <a
            href="https://mehul773.github.io/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-icon portfolio-link"
            title="Developer Portfolio"
          >
            <ExternalLink size={18} />
          </a>

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
