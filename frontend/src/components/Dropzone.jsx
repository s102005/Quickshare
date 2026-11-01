import React, { useState, useRef } from 'react';
import axios from 'axios';
import { 
  UploadCloud, 
  FileText, 
  Lock, 
  Clock, 
  Download, 
  Copy, 
  Check, 
  Sparkles, 
  X, 
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  MessageCircle,
  Mail,
  ExternalLink
} from 'lucide-react';

const formatBytes = (bytes, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export default function Dropzone({ onOpenDownload }) {
  const fileInputRef = useRef(null);
  
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Restriction settings
  const [password, setPassword] = useState('');
  const [hasPassword, setHasPassword] = useState(false);
  const [expiryHours, setExpiryHours] = useState('24');
  const [maxDownloads, setMaxDownloads] = useState('');

  // Upload status & progress
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setErrorMessage('');
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setErrorMessage('');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setErrorMessage('Please select a file to upload');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setErrorMessage('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('expiryHours', expiryHours);
    if (hasPassword && password.trim()) {
      formData.append('password', password.trim());
    }
    if (maxDownloads && Number(maxDownloads) > 0) {
      formData.append('maxDownloads', maxDownloads);
    }

    try {
      const response = await axios.post('/api/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        },
      });

      if (response.data.success) {
        const code = response.data.data.uniqueCode;
        
        // Construct reliable download URL using current origin
        const currentOrigin = window.location.origin;
        const fullDownloadUrl = `${currentOrigin}/download/${code}`;

        setUploadResult({
          ...response.data.data,
          downloadUrl: fullDownloadUrl,
          passcode: hasPassword ? password : null,
        });
      }
    } catch (err) {
      console.error('Upload Error:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = () => {
    if (uploadResult?.downloadUrl) {
      navigator.clipboard.writeText(uploadResult.downloadUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };



  // WhatsApp Share Handler
  const shareToWhatsApp = async () => {
    if (!uploadResult?.downloadUrl) return;

    const url = uploadResult.downloadUrl;
    let messageText = `Download "${uploadResult.file.originalName}" (${formatBytes(uploadResult.file.fileSize)}):\n${url}`;
    if (uploadResult.passcode) {
      messageText += `\nPasscode: ${uploadResult.passcode}`;
    }

    // Native Mobile Share Sheet if supported
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Download ${uploadResult.file.originalName}`,
          text: messageText,
          url: url,
        });
        return;
      } catch (err) {
        // Fallback to WhatsApp URL intent
      }
    }

    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(messageText)}`;
    window.open(whatsappUrl, '_blank');
  };

  // Email Share Handler
  const shareViaEmail = () => {
    if (!uploadResult?.downloadUrl) return;

    const url = uploadResult.downloadUrl;
    const subject = encodeURIComponent(`File shared with you: ${uploadResult.file.originalName}`);
    let body = `Hello,\n\nI have shared "${uploadResult.file.originalName}" (${formatBytes(uploadResult.file.fileSize)}) with you via QuickShare.\n\nClick the link below to download:\n${url}\n\n`;
    if (uploadResult.passcode) {
      body += `Passcode to unlock: ${uploadResult.passcode}\n\n`;
    }
    body += `This link will expire in ${expiryHours} hours.\n\nBest regards,\nQuickShare`;

    window.open(`mailto:?subject=${subject}&body=${encodeURIComponent(body)}`, '_blank');
  };

  const resetForm = () => {
    setFile(null);
    setUploadResult(null);
    setUploadProgress(0);
    setPassword('');
    setHasPassword(false);
    setMaxDownloads('');
    setExpiryHours('24');
    setErrorMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '32px', marginBottom: '32px' }}>
      
      {/* Upload Success Screen */}
      {uploadResult ? (
        <div style={{ textAlign: 'center', padding: '10px 0', animation: 'fadeIn 0.3s ease' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '2px solid rgba(16, 185, 129, 0.4)',
            color: 'var(--color-success)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <Sparkles size={32} />
          </div>

          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '6px' }}>
            File Ready to Share!
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '24px' }}>
            Click the link below or tap <strong>Share on WhatsApp</strong> to send.
          </p>

          {/* Clickable Shareable Link Box */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid var(--border-glow)',
            padding: '14px 18px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            maxWidth: '600px',
            margin: '0 auto 20px',
            textAlign: 'left'
          }}>
            <a 
              href={uploadResult.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ 
                color: '#38bdf8', 
                fontWeight: 700, 
                fontSize: '0.95rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                textDecoration: 'underline',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <ExternalLink size={16} style={{ flexShrink: 0 }} />
              <span>{uploadResult.downloadUrl}</span>
            </a>
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
              {onOpenDownload && (
                <button 
                  type="button"
                  onClick={() => onOpenDownload(uploadResult.uniqueCode)} 
                  className="btn-secondary" 
                  style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                >
                  <ExternalLink size={15} /> Open Link
                </button>
              )}
              <button 
                type="button"
                onClick={copyToClipboard} 
                className="btn-primary" 
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>



          {/* Share Buttons (WhatsApp, Email) */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '12px',
            flexWrap: 'wrap',
            marginBottom: '24px'
          }}>
            <button
              onClick={shareToWhatsApp}
              style={{
                background: '#25D366',
                color: '#ffffff',
                border: 'none',
                padding: '12px 24px',
                borderRadius: 'var(--radius-md)',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 6px 20px rgba(37, 211, 102, 0.35)',
                transition: 'transform 0.2s ease'
              }}
            >
              <MessageCircle size={20} /> Share on WhatsApp
            </button>

            <button
              onClick={shareViaEmail}
              className="btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 18px', fontSize: '0.9rem' }}
            >
              <Mail size={16} /> Email
            </button>
          </div>

          {/* File summary badge */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center',
            gap: '16px', 
            background: 'rgba(255, 255, 255, 0.03)', 
            padding: '10px 20px', 
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            marginBottom: '24px',
            flexWrap: 'wrap'
          }}>
            <span>📄 {uploadResult.file.originalName}</span>
            <span>📦 {formatBytes(uploadResult.file.fileSize)}</span>
            <span>⏳ Expires in {expiryHours}h</span>
            {uploadResult.passcode && <span>🔒 Passcode: <strong>{uploadResult.passcode}</strong></span>}
          </div>

          <div>
            <button onClick={resetForm} className="btn-secondary">
              Upload Another File
            </button>
          </div>
        </div>
      ) : (
        /* Upload Form Screen */
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '4px' }}>
                Upload & Share Files
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Tap or drag files to upload directly from your device (up to 500 MB).
              </p>
            </div>
          </div>

          {/* 100% Mobile Compatible Dropzone with Native File Input Overlay */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
              position: 'relative',
              border: `2px dashed ${isDragging ? 'var(--color-primary)' : 'var(--border-subtle)'}`,
              borderRadius: 'var(--radius-md)',
              padding: file ? '24px' : '48px 24px',
              textAlign: 'center',
              cursor: 'pointer',
              background: isDragging ? 'rgba(99, 102, 241, 0.08)' : 'rgba(0, 0, 0, 0.15)',
              transition: 'all 0.2s ease',
              marginBottom: '24px',
              overflow: 'hidden'
            }}
          >
            {!file && (
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect}
                aria-label="Select file to upload"
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  cursor: 'pointer',
                  zIndex: 10,
                }} 
              />
            )}

            {file ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 11 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', textAlign: 'left' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    background: 'rgba(99, 102, 241, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-primary)',
                    flexShrink: 0
                  }}>
                    <FileText size={24} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', wordBreak: 'break-word' }}>
                      {file.name}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {formatBytes(file.size)} • {file.type || 'Document'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <div style={{ pointerEvents: 'none' }}>
                <UploadCloud size={44} style={{ color: 'var(--color-primary)', margin: '0 auto 12px' }} />
                <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '4px' }}>
                  Tap to choose from Phone or Drag file here
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                  Photos, Videos, PDFs, ZIP, DOCX up to 500MB
                </div>
              </div>
            )}
          </div>

          {/* Access Control & Restrictions Accordion */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '20px',
            marginBottom: '24px'
          }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} color="var(--color-secondary)" /> Transfer Restrictions (Optional)
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              
              {/* Expiration Setting */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  <Clock size={14} /> Expiration Time
                </label>
                <select
                  value={expiryHours}
                  onChange={(e) => setExpiryHours(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    background: 'rgba(0, 0, 0, 0.3)',
                    color: '#fff',
                    outline: 'none',
                    fontSize: '0.9rem'
                  }}
                >
                  <option value="1">1 Hour</option>
                  <option value="24">24 Hours (1 Day)</option>
                  <option value="72">3 Days</option>
                  <option value="168">7 Days</option>
                </select>
              </div>

              {/* Max Downloads Limit */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  <Download size={14} /> Max Download Limit
                </label>
                <input
                  type="number"
                  placeholder="Leave empty for unlimited"
                  min="1"
                  value={maxDownloads}
                  onChange={(e) => setMaxDownloads(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    background: 'rgba(0, 0, 0, 0.3)',
                    color: '#fff',
                    outline: 'none',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              {/* Optional Passcode Protection */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  <Lock size={14} /> Passcode (Optional)
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="password"
                    placeholder="Optional secret passcode"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setHasPassword(e.target.value.length > 0);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      background: 'rgba(0, 0, 0, 0.3)',
                      color: '#fff',
                      outline: 'none',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
              </div>

            </div>
          </div>

          {/* Error Message Display */}
          {errorMessage && (
            <div style={{
              background: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#fb7185',
              padding: '12px',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '20px',
              fontSize: '0.85rem'
            }}>
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Progress Bar */}
          {uploading && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Uploading file...</span>
                <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>{uploadProgress}%</span>
              </div>
              <div style={{
                height: '8px',
                background: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${uploadProgress}%`,
                  background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))',
                  transition: 'width 0.2s ease'
                }} />
              </div>
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '16px', fontSize: '1rem' }}
          >
            {uploading ? `Uploading (${uploadProgress}%)...` : 'Generate Secure Link'}
            {!uploading && <ArrowRight size={18} />}
          </button>
        </div>
      )}

    </div>
  );
}
