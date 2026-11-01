import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Download, 
  Lock, 
  Clock, 
  FileText, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  ArrowLeft,
  KeyRound,
  FileCheck
} from 'lucide-react';

const formatBytes = (bytes, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export default function DownloadPage({ uniqueCode, onGoHome }) {
  const [fileInfo, setFileInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Passcode state
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Fetch metadata on mount or code change
  const fetchMetadata = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`/api/files/${uniqueCode}/info`);
      if (response.data.success) {
        setFileInfo(response.data.file);
      }
    } catch (err) {
      console.error('Fetch metadata error:', err);
      setError(err.response?.data?.message || 'Unable to retrieve file details. Link may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (uniqueCode) {
      fetchMetadata();
    }
  }, [uniqueCode]);

  // Universal Direct Download Handler (Optimized for Mobile & Desktop)
  const handleDownload = async (e) => {
    e?.preventDefault();
    setPasswordError('');

    // If password protected, check that passcode is entered
    if (fileInfo?.isPasswordProtected && !password.trim()) {
      setPasswordError('Please enter the passcode to unlock this file.');
      return;
    }

    setDownloading(true);

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const downloadQuery = password.trim() ? `?password=${encodeURIComponent(password.trim())}` : '';
    const downloadEndpoint = `/api/files/${uniqueCode}/download${downloadQuery}`;

    // On mobile devices, direct window navigation triggers native iOS/Android file download dialog reliably
    if (isMobile) {
      try {
        if (fileInfo?.isPasswordProtected) {
          // Pre-validate password so we don't navigate to a 401 error page
          const testRes = await axios.post(`/api/files/${uniqueCode}/download`, { password: password.trim() }, { responseType: 'blob' });
          if (testRes.status !== 200) {
            throw new Error('Passcode verification failed');
          }
        }
        window.location.href = downloadEndpoint;
        setDownloadSuccess(true);
        setTimeout(() => {
          setDownloading(false);
          fetchMetadata();
        }, 2000);
        return;
      } catch (err) {
        setDownloading(false);
        if (err.response?.data instanceof Blob) {
          try {
            const text = await err.response.data.text();
            const json = JSON.parse(text);
            setPasswordError(json.message || 'Incorrect passcode or transfer expired.');
            return;
          } catch {
            setPasswordError('Incorrect passcode. Access denied.');
            return;
          }
        }
        setPasswordError(err.response?.data?.message || 'Incorrect passcode. Access denied.');
        return;
      }
    }

    // Desktop fallback with Blob streaming
    try {
      const response = await axios.post(
        `/api/files/${uniqueCode}/download`,
        { password: password.trim() },
        { responseType: 'blob' }
      );

      // Create a Blob from the response data and trigger download
      const blob = new Blob([response.data], {
        type: response.headers['content-type'] || 'application/octet-stream',
      });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', fileInfo?.originalName || 'downloaded-file');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      setDownloadSuccess(true);
      setTimeout(() => {
        setDownloading(false);
        fetchMetadata();
      }, 1500);
    } catch (err) {
      setDownloading(false);
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          setPasswordError(json.message || 'Incorrect passcode or transfer expired.');
        } catch {
          setPasswordError('Incorrect passcode. Access denied.');
        }
      } else {
        setPasswordError(err.response?.data?.message || 'Incorrect passcode. Access denied.');
      }
    }
  };

  // Helper to calculate remaining time
  const getRemainingTime = (expiryDate) => {
    const diff = new Date(expiryDate) - new Date();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} day${days > 1 ? 's' : ''} left`;
    }
    return `${hours}h ${mins}m left`;
  };

  return (
    <div style={{ maxWidth: '580px', margin: '20px auto', padding: '0 16px' }}>
      
      {/* Loading state */}
      {loading && (
        <div className="glass-panel" style={{ padding: '50px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Sparkles size={36} color="var(--color-primary)" style={{ margin: '0 auto 16px', animation: 'spin 2s linear infinite' }} />
          <p>Retrieving secure transfer details...</p>
        </div>
      )}

      {/* Error / Expired state */}
      {!loading && error && (
        <div className="glass-panel" style={{ padding: '40px 30px', textAlign: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'rgba(244, 63, 94, 0.15)',
            border: '2px solid rgba(244, 63, 94, 0.4)',
            color: 'var(--color-accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <AlertCircle size={30} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px' }}>
            Transfer Unavailable
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
            {error}
          </p>
          <button onClick={onGoHome} className="btn-primary" style={{ margin: '0 auto' }}>
            Upload a File Instead
          </button>
        </div>
      )}

      {/* Active File Download Card */}
      {!loading && fileInfo && (
        <div className="glass-panel" style={{ padding: '36px 24px', textAlign: 'center' }}>
          
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(6, 182, 212, 0.2))',
            border: '1px solid var(--border-glow)',
            color: 'var(--color-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <FileText size={36} />
          </div>

          <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: 800, 
            marginBottom: '6px', 
            wordBreak: 'break-word',
            color: 'var(--text-main)'
          }}>
            {fileInfo.originalName}
          </h2>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '20px' }}>
            {formatBytes(fileInfo.fileSize)} • Ready to download
          </p>

          {/* Badges Info Bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '12px',
            flexWrap: 'wrap',
            marginBottom: '28px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '6px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-subtle)'
            }}>
              <Clock size={14} color="var(--color-warning)" />
              <span>{getRemainingTime(fileInfo.expiresAt)}</span>
            </div>

            {fileInfo.maxDownloads && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '6px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
                border: '1px solid var(--border-subtle)'
              }}>
                <Download size={14} color="var(--color-secondary)" />
                <span>{fileInfo.downloadCount} / {fileInfo.maxDownloads} downloads</span>
              </div>
            )}

            {fileInfo.isPasswordProtected && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(99, 102, 241, 0.1)',
                padding: '6px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                color: '#a5b4fc',
                border: '1px solid rgba(99, 102, 241, 0.3)'
              }}>
                <Lock size={14} />
                <span>Passcode Protected</span>
              </div>
            )}
          </div>

          {/* Download Form */}
          <form onSubmit={handleDownload} style={{ maxWidth: '420px', margin: '0 auto' }}>
            
            {/* Password input (only shown if file is protected) */}
            {fileInfo.isPasswordProtected && (
              <div style={{ marginBottom: '20px', textAlign: 'left' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>
                  Enter Passcode to Unlock:
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="password"
                    placeholder="Enter file passcode"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px 12px 38px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      background: 'rgba(0, 0, 0, 0.35)',
                      color: '#fff',
                      fontSize: '0.95rem',
                      outline: 'none'
                    }}
                  />
                  <KeyRound size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                </div>

                {passwordError && (
                  <div style={{ color: '#fb7185', fontSize: '0.85rem', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertCircle size={14} />
                    <span>{passwordError}</span>
                  </div>
                )}
              </div>
            )}

            {/* Direct Download Button */}
            <button
              type="submit"
              disabled={downloading}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '16px',
                fontSize: '1.05rem',
                fontWeight: 700,
                justifyContent: 'center',
                gap: '10px'
              }}
            >
              {downloading ? (
                <>
                  <Sparkles size={20} /> Starting Download...
                </>
              ) : (
                <>
                  <Download size={20} /> Download File ({formatBytes(fileInfo.fileSize)})
                </>
              )}
            </button>

            {downloadSuccess && (
              <div style={{
                marginTop: '16px',
                padding: '10px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: 'var(--color-success)',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}>
                <CheckCircle2 size={16} /> File downloaded successfully!
              </div>
            )}
          </form>

        </div>
      )}

    </div>
  );
}
