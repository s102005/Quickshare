import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FileText, 
  Trash2, 
  Copy, 
  Check, 
  ExternalLink, 
  Lock, 
  Clock, 
  Download, 
  Sparkles, 
  Plus, 
  AlertCircle,
  HardDrive,
  Activity,
  Layers
} from 'lucide-react';

const formatBytes = (bytes, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export default function Dashboard({ onNewUpload, onOpenDownload }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Fetch logged in user files
  const fetchMyFiles = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/api/files/my/files');
      if (res.data.success) {
        setFiles(res.data.files);
      }
    } catch (err) {
      console.error('Fetch files error:', err);
      setError(err.response?.data?.message || 'Failed to load your transfers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyFiles();
  }, []);

  // Delete / Revoke file
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete and revoke this share link?')) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await axios.delete(`/api/files/${id}`);
      if (res.data.success) {
        setFiles((prev) => prev.filter((f) => f.id !== id));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete file.');
    } finally {
      setDeletingId(null);
    }
  };

  // Copy share URL
  const handleCopyLink = (code, id) => {
    const url = `${window.location.origin}/download/${code}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Calculate summary metrics
  const totalFiles = files.length;
  const activeFiles = files.filter((f) => f.status === 'ACTIVE').length;
  const totalDownloads = files.reduce((acc, f) => acc + (f.downloadCount || 0), 0);
  const totalStorage = files.reduce((acc, f) => acc + (f.fileSize || 0), 0);

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      
      {/* Dashboard Top Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '28px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>
            My Transfers & Analytics
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Manage your active share links, track downloads, and revoke access anytime.
          </p>
        </div>

        <button onClick={onNewUpload} className="btn-primary">
          <Plus size={18} /> Upload New File
        </button>
      </div>

      {/* Metric Statistics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-primary)', marginBottom: '8px' }}>
            <Layers size={20} />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Transfers</span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{totalFiles}</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-success)', marginBottom: '8px' }}>
            <Activity size={20} />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Active Links</span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{activeFiles}</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-secondary)', marginBottom: '8px' }}>
            <Download size={20} />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Downloads</span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{totalDownloads}</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-warning)', marginBottom: '8px' }}>
            <HardDrive size={20} />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Storage Used</span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{formatBytes(totalStorage)}</div>
        </div>
      </div>

      {/* Files List */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '20px' }}>
          Transfer History ({files.length})
        </h3>

        {loading && (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Sparkles size={28} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--color-primary)' }} />
            <p>Loading your transfers...</p>
          </div>
        )}

        {!loading && error && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.1)',
            color: '#fb7185',
            padding: '16px',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {!loading && files.length === 0 && !error && (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <FileText size={44} style={{ color: 'var(--text-dim)', margin: '0 auto 12px' }} />
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>No transfers found</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
              You haven't shared any files yet. Upload your first file to get started!
            </p>
            <button onClick={onNewUpload} className="btn-primary">
              <Plus size={16} /> Create Transfer
            </button>
          </div>
        )}

        {!loading && files.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {files.map((file) => {
              const isExpired = file.status === 'EXPIRED';
              return (
                <div
                  key={file.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '16px',
                    opacity: isExpired ? 0.7 : 1
                  }}
                >
                  {/* File icon and title */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '220px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: isExpired ? 'rgba(255, 255, 255, 0.05)' : 'rgba(99, 102, 241, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isExpired ? 'var(--text-dim)' : 'var(--color-primary)'
                    }}>
                      <FileText size={20} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                        {file.originalName}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {formatBytes(file.fileSize)} • Uploaded {new Date(file.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {/* Status Badge */}
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: isExpired ? 'rgba(244, 63, 94, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                      color: isExpired ? '#fb7185' : '#34d399',
                      border: `1px solid ${isExpired ? 'rgba(244, 63, 94, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
                    }}>
                      {file.status}
                    </span>

                    {/* Password Badge */}
                    {file.isPasswordProtected && (
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        background: 'rgba(99, 102, 241, 0.1)',
                        color: '#818cf8',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <Lock size={12} /> Protected
                      </span>
                    )}

                    {/* Download count badge */}
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: 'var(--text-muted)',
                      border: '1px solid var(--border-subtle)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <Download size={12} />
                      {file.downloadCount} {file.maxDownloads ? `/ ${file.maxDownloads}` : ''} downloads
                    </span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {!isExpired && (
                      <>
                        <button
                          onClick={() => handleCopyLink(file.uniqueCode, file.id)}
                          className="btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                          title="Copy Share Link"
                        >
                          {copiedId === file.id ? <Check size={14} /> : <Copy size={14} />}
                          {copiedId === file.id ? 'Copied' : 'Link'}
                        </button>
                        <button
                          onClick={() => onOpenDownload(file.uniqueCode)}
                          className="btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                          title="Preview Recipient Page"
                        >
                          <ExternalLink size={14} />
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => handleDelete(file.id)}
                      disabled={deletingId === file.id}
                      style={{
                        background: 'rgba(244, 63, 94, 0.1)',
                        border: '1px solid rgba(244, 63, 94, 0.2)',
                        color: '#fb7185',
                        padding: '6px 10px',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer'
                      }}
                      title="Permanently delete and revoke file"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
