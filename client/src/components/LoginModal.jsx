import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginModal({ onClose }) {
  const { loginGoogle, loginGithub, loginLocal, registerLocal } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        if (!name || !email || !password) throw new Error('All fields are required');
        await registerLocal(name, email, password);
      } else {
        if (!email || !password) throw new Error('Email and password required');
        await loginLocal(email, password);
      }
      onClose(); // Close modal on success
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isSignUp ? 'Create an Account' : 'Sign in to SwingRadar'}</h2>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>
        
        <p className="modal-desc">
          {isSignUp 
            ? 'Sign up to unlock your dashboard and save personal preferences.'
            : 'Log in to securely access your personalized dashboard.'}
        </p>

        {error && <div className="toast error" style={{ position: 'relative', marginBottom: 15, padding: 10 }}>{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {isSignUp && (
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} disabled={loading} />
            </div>
          )}
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" placeholder="you@domain.com" value={email} onChange={e => setEmail(e.target.value)} disabled={loading} />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} disabled={loading} />
          </div>
          <button type="submit" className="btn btn-primary btn-submit" disabled={loading}>
            {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <div className="auth-divider">
          <span>or continue with</span>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn-social google" onClick={loginGoogle} disabled={loading}>
             Google
          </button>
          <button type="button" className="btn-social github" onClick={loginGithub} disabled={loading}>
             GitHub
          </button>
        </div>

        <div className="auth-switch">
          {isSignUp ? 'Already have an account?' : 'Need an account?'}
          <button type="button" className="btn-text" onClick={() => setIsSignUp(!isSignUp)} disabled={loading}>
            {isSignUp ? 'Sign In' : 'Create One'}
          </button>
        </div>
      </div>
    </div>
  );
}
