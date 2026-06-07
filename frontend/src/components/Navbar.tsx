import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Briefcase, Sparkles, Download, Search, X, ExternalLink, MoreVertical, Plus } from 'lucide-react';

interface NavbarProps {
  onAddManual: () => void;
  onOpenExtract: () => void;
  onDownloadCsv: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchCategory: string;
  onCategoryChange: (category: string) => void;
  dateFilter: string;
  onDateFilterChange: (filter: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onAddManual,
  onOpenExtract,
  onDownloadCsv,
  searchQuery,
  onSearchChange,
  searchCategory,
  onCategoryChange,
  dateFilter,
  onDateFilterChange,
}) => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [localQuery, setLocalQuery] = useState(searchQuery);

  // Keep local query in sync if parent updates it (e.g. cleared externally)
  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  // Debounce query propagation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localQuery !== searchQuery) {
        onSearchChange(localQuery);
      }
    }, 150); // 150ms is optimal to feel snappy yet debounce fast typing
    return () => clearTimeout(timer);
  }, [localQuery, searchQuery, onSearchChange]);

  const handleClear = () => {
    setLocalQuery('');
    onSearchChange('');
  };

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

        {/* Global Search Bar & Filters */}
        <div className="nav-search-container">
          <div className="nav-search">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search..."
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
            />
            {localQuery && (
              <button
                className="search-clear"
                onClick={handleClear}
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>


          <select
            className="search-category-select"
            value={searchCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            title="Search field category"
          >
            <option value="all">All Fields</option>
            <option value="title">Job Title</option>
            <option value="company">Company</option>
            <option value="location">Location</option>
            <option value="salary">Salary</option>
            <option value="contacts">Contacts</option>
          </select>

          <select
            className="date-filter-select"
            value={dateFilter}
            onChange={(e) => onDateFilterChange(e.target.value)}
            title="Filter by creation date"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>

        {/* Mobile Hamburger / Three Dots */}
        <button
          className="nav-hamburger"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          title="Toggle menu"
        >
          {mobileMenuOpen ? <X size={22} /> : <MoreVertical size={22} />}
        </button>

        {/* Action Controls */}
        <div className={`nav-actions${mobileMenuOpen ? ' nav-actions--open' : ''}`}>
          <button onClick={() => { onOpenExtract(); setMobileMenuOpen(false); }} className="btn btn-primary btn-sparkle">
            <Sparkles size={16} />
            <span>AI Quick Add</span>
          </button>
          
          <button onClick={() => { onAddManual(); setMobileMenuOpen(false); }} className="btn btn-secondary">
            <Plus size={16} />
            <span>Add Manually</span>
          </button>

          <button onClick={() => { onDownloadCsv(); setMobileMenuOpen(false); }} className="btn btn-icon" title="Export pipeline to CSV">
            <Download size={18} />
            <span className="nav-action-text">Export to CSV</span>
          </button>

          {/* Portfolio Link */}
          <a
            href="https://mehul773.github.io/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-icon portfolio-link"
            title="Developer Portfolio"
            onClick={() => setMobileMenuOpen(false)}
          >
            <ExternalLink size={18} />
            <span className="nav-action-text">Developer Portfolio</span>
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
              
              <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="btn-logout" title="Sign Out">
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
