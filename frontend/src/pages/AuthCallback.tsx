import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as authService from '../services/auth.service';
import { Loader } from 'lucide-react';

export const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { setTokenAndUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processToken = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setError('No authentication token received from Google.');
        return;
      }

      try {
        // Temp save token to local storage so getMe() interceptor can read it
        localStorage.setItem('trackra_token', token);

        // Retrieve user profile information
        const userProfile = await authService.getMe();

        // Update global context state
        setTokenAndUser(token, userProfile);

        // Redirect to main pipeline view
        navigate('/dashboard');
      } catch (err) {
        console.error('Failed to log in user:', err);
        localStorage.removeItem('trackra_token');
        setError('Failed to fetch user profile details. Please try logging in again.');
      }
    };

    processToken();
  }, [searchParams, setTokenAndUser, navigate]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', backgroundColor: 'var(--bg)' }}>
      {error ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', color: 'var(--color-rejected)', maxWidth: '400px', textAlign: 'center' }}>
          <span>⚠️ {error}</span>
          <button onClick={() => navigate('/')} className="btn btn-secondary">
            Back to Home
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
          <Loader size={40} className="logo-icon" style={{ animation: 'spin 1.5s infinite linear', color: 'var(--primary)' }} />
          <span>Completing your secure sign in...</span>
        </div>
      )}
    </div>
  );
};
