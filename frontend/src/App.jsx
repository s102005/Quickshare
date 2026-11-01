import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Dropzone from './components/Dropzone';
import DownloadPage from './pages/DownloadPage';
import Dashboard from './pages/Dashboard';
import MobileConnectModal from './components/MobileConnectModal';
import { 
  KeyRound, 
  User as UserIcon, 
  LogOut, 
  Sparkles, 
  Lock, 
  Clock, 
  Share2, 
  Layers, 
  UploadCloud,
  Mail,
  UserPlus,
  ArrowRight,
  AlertCircle,
  Smartphone
} from 'lucide-react';

function QuickShareMain() {
  const { user, login, register, logout, isAuthenticated, loading: authLoading } = useAuth();
  
  // Navigation views: 'upload', 'dashboard', 'download'
  const [currentView, setCurrentView] = useState('upload');
  const [activeDownloadCode, setActiveDownloadCode] = useState('');

  // Mandatory Auth Portal State (Sign In / Sign Up)
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // Mobile pairing & local network IP state
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [serverIp, setServerIp] = useState('');

  // Fetch server health to resolve dynamic host Wi-Fi IP
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data.serverIp) {
          setServerIp(data.serverIp);
        }
      })
      .catch((err) => {
        console.warn('Could not retrieve local server IP:', err);
      });
  }, []);

  // Detect direct download links from URL path (e.g., /download/qs-xxxx or ?code=qs-xxxx)
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      const searchParams = new URLSearchParams(window.location.search);
      const queryCode = searchParams.get('code');

      if (path.startsWith('/download/')) {
        const code = path.replace('/download/', '').split('/')[0].trim();
        if (code) {
          setActiveDownloadCode(code);
          setCurrentView('download');
          return;
        }
      }

      if (queryCode) {
        setActiveDownloadCode(queryCode.trim());
        setCurrentView('download');
        return;
      }

      if (path.startsWith('/dashboard')) {
        setCurrentView('dashboard');
        return;
      }

      setCurrentView('upload');
    };

    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const navigateToDownload = (code) => {
    if (!code) return;
    const cleanCode = code.trim();
    setActiveDownloadCode(cleanCode);
    setCurrentView('download');
    window.history.pushState({}, '', `/download/${cleanCode}`);
  };

  const navigateToUpload = () => {
    setCurrentView('upload');
    setActiveDownloadCode('');
    window.history.pushState({}, '', '/');
  };

  const navigateToDashboard = () => {
    setCurrentView('dashboard');
    window.history.pushState({}, '', '/dashboard');
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSubmitting(true);

    try {
      if (authMode === 'login') {
        const res = await login(authEmail, authPassword);
        if (!res.success) {
          setAuthError(res.message || 'Invalid email or password');
        }
      } else {
        if (!authName.trim()) {
          setAuthError('Please enter your full name');
          setAuthSubmitting(false);
          return;
        }
        const res = await register(authName.trim(), authEmail, authPassword);
        if (!res.success) {
          setAuthError(res.message || 'Registration failed');
        }
      }
    } catch (err) {
      setAuthError('Authentication failed. Please try again.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  // =========================================================================
  // VIEW 1: DEDICATED RECIPIENT DOWNLOAD PAGE (Accessible to shared link recipients)
  // =========================================================================
  if (currentView === 'download') {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '32px 16px', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        
        {/* Clean Logo Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div 
            onClick={navigateToUpload} 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '10px', 
              cursor: 'pointer',
              background: 'rgba(255, 255, 255, 0.04)',
              padding: '8px 18px',
              borderRadius: '50px',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div style={{
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Sparkles size={16} color="#fff" />
            </div>
            <span style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.3px' }}>
              Quick<span style={{ color: 'var(--color-secondary)' }}>Share</span>
            </span>
          </div>
        </div>

        {/* The Dedicated File Download Portal */}
        <DownloadPage uniqueCode={activeDownloadCode} onGoHome={navigateToUpload} />

        {/* Minimal Footer */}
        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <button 
            onClick={navigateToUpload}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-primary)',
              cursor: 'pointer',
              fontSize: '0.9rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 600
            }}
          >
            <UploadCloud size={16} /> Send your own files with QuickShare
          </button>
        </div>

      </div>
    );
  }

  // Authentication Loading Spinner
  if (authLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', gap: '16px' }}>
        <Sparkles size={40} color="var(--color-primary)" />
        <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Loading QuickShare...</span>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: MANDATORY AUTHENTICATION GATE (Sign In or Sign Up Required)
  // =========================================================================
  if (!isAuthenticated) {
    return (
      <div style={{ maxWidth: '460px', margin: '60px auto', padding: '0 20px' }}>
        
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <Sparkles size={30} color="#fff" />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '6px' }}>
            Quick<span style={{ color: 'var(--color-secondary)' }}>Share</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Please sign in or create an account to start sharing files.
          </p>
        </div>

        {/* Auth Card */}
        <div className="glass-panel" style={{ padding: '32px 28px' }}>
          
          {/* Mode Switcher Tabs */}
          <div style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.04)',
            borderRadius: 'var(--radius-sm)',
            padding: '4px',
            marginBottom: '24px',
            border: '1px solid var(--border-subtle)'
          }}>
            <button
              onClick={() => { setAuthMode('login'); setAuthError(''); }}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: authMode === 'login' ? 'var(--color-primary)' : 'transparent',
                color: authMode === 'login' ? '#fff' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Sign In
            </button>
            <button
              onClick={() => { setAuthMode('register'); setAuthError(''); }}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: authMode === 'register' ? 'var(--color-primary)' : 'transparent',
                color: authMode === 'register' ? '#fff' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Create Account
            </button>
          </div>

          {/* Error message */}
          {authError && (
            <div style={{
              background: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#fb7185',
              padding: '12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '20px'
            }}>
              <AlertCircle size={16} />
              <span>{authError}</span>
            </div>
          )}

          {/* Auth Form */}
          <form onSubmit={handleAuthSubmit}>
            {authMode === 'register' && (
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>
                  Full Name
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px 12px 38px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      background: 'rgba(0, 0, 0, 0.35)',
                      color: '#fff',
                      fontSize: '0.95rem',
                      outline: 'none'
                    }}
                  />
                  <UserPlus size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                </div>
              </div>
            )}

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 38px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    background: 'rgba(0, 0, 0, 0.35)',
                    color: '#fff',
                    fontSize: '0.95rem',
                    outline: 'none'
                  }}
                />
                <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 38px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    background: 'rgba(0, 0, 0, 0.35)',
                    color: '#fff',
                    fontSize: '0.95rem',
                    outline: 'none'
                  }}
                />
                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              </div>
            </div>

            <button
              type="submit"
              disabled={authSubmitting}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '1rem',
                fontWeight: 700,
                justifyContent: 'center'
              }}
            >
              {authSubmitting ? 'Authenticating...' : (authMode === 'login' ? 'Sign In to QuickShare' : 'Create QuickShare Account')}
              {!authSubmitting && <ArrowRight size={18} />}
            </button>
          </form>

        </div>

        {/* Mobile Pairing Quick Access */}
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <button
            type="button"
            onClick={() => setShowMobileModal(true)}
            style={{
              background: 'none',
              border: 'none',
              color: '#38bdf8',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Smartphone size={15} /> Open on mobile phone without localhost
          </button>
        </div>

        <MobileConnectModal 
          isOpen={showMobileModal} 
          onClose={() => setShowMobileModal(false)} 
          serverIp={serverIp} 
        />

      </div>
    );
  }

  // =========================================================================
  // VIEW 3: AUTHENTICATED USER APPLICATION (Sender Upload & Dashboard)
  // =========================================================================
  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '20px' }}>
      
      {/* Top Navigation Bar */}
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 0',
        marginBottom: '32px',
        borderBottom: '1px solid var(--border-subtle)',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        {/* Brand Logo */}
        <div 
          onClick={navigateToUpload} 
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
        >
          <div style={{
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <Sparkles size={22} color="#fff" />
          </div>
          <div>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
              Quick<span style={{ color: 'var(--color-secondary)' }}>Share</span>
            </span>
          </div>
        </div>

        {/* View Switch Tabs */}
        <div style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.04)',
          borderRadius: 'var(--radius-md)',
          padding: '4px',
          border: '1px solid var(--border-subtle)'
        }}>
          <button
            onClick={navigateToUpload}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: currentView === 'upload' ? 'var(--color-primary)' : 'transparent',
              color: currentView === 'upload' ? '#fff' : 'var(--text-muted)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <UploadCloud size={16} /> Send Files
          </button>
          
          <button
            onClick={navigateToDashboard}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: currentView === 'dashboard' ? 'var(--color-primary)' : 'transparent',
              color: currentView === 'dashboard' ? '#fff' : 'var(--text-muted)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <Layers size={16} /> My Transfers
          </button>
        </div>

        {/* User Account & Mobile Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            type="button"
            onClick={() => setShowMobileModal(true)} 
            className="btn-secondary" 
            style={{ 
              padding: '6px 14px', 
              fontSize: '0.85rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              borderColor: 'rgba(56, 189, 248, 0.35)',
              color: '#38bdf8'
            }}
            title="Open on Mobile Phone"
          >
            <Smartphone size={15} /> <span>Open on Mobile</span>
          </button>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '6px 12px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)'
          }}>
            <UserIcon size={15} color="var(--color-secondary)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user?.name || 'User'}</span>
          </div>
          <button onClick={logout} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }} title="Sign Out">
            <LogOut size={15} />
          </button>
        </div>
      </nav>

      {/* User Dashboard */}
      {currentView === 'dashboard' && (
        <Dashboard 
          onNewUpload={navigateToUpload} 
          onOpenDownload={navigateToDownload} 
        />
      )}

      {/* Main Upload Dropzone */}
      {currentView === 'upload' && (
        <div>
          <header style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{ 
              fontSize: '2.5rem', 
              fontWeight: 800, 
              background: 'linear-gradient(135deg, #ffffff 30%, #94a3b8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '8px'
            }}>
              Secure File Sharing & Digital Transfer
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
              Upload files, set optional restrictions, and share instantly via WhatsApp or direct links.
            </p>
          </header>

          {/* Upload Dropzone */}
          <Dropzone onOpenDownload={navigateToDownload} />

          {/* Feature Highlights */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
            marginTop: '24px'
          }}>
            <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
              <Share2 size={24} color="var(--color-primary)" style={{ margin: '0 auto 10px' }} />
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '4px' }}>Direct File Links</h4>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>Recipients open the file directly without website clutter</p>
            </div>

            <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
              <Lock size={24} color="var(--color-secondary)" style={{ margin: '0 auto 10px' }} />
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '4px' }}>Optional Password Protection</h4>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>Set passcodes only when you want to lock sensitive files</p>
            </div>

            <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
              <Clock size={24} color="var(--color-warning)" style={{ margin: '0 auto 10px' }} />
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '4px' }}>Auto Expiration</h4>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>Self-destructing links that delete files from storage</p>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Connect Pairing Modal */}
      <MobileConnectModal 
        isOpen={showMobileModal} 
        onClose={() => setShowMobileModal(false)} 
        serverIp={serverIp} 
      />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <QuickShareMain />
    </AuthProvider>
  );
}
