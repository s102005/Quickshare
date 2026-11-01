import React, { useState } from 'react';
import { Smartphone, Wifi, Globe, Copy, Check, X, Shield, Zap } from 'lucide-react';

export default function MobileConnectModal({ isOpen, onClose, serverIp }) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('wifi'); // 'wifi' | 'tunnel'

  if (!isOpen) return null;

  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const port = window.location.port ? `:${window.location.port}` : '';
  
  // Mobile URL calculation
  const mobileUrl = (isLocalhost && serverIp)
    ? `${window.location.protocol}//${serverIp}${port}`
    : window.location.origin;

  const copyUrl = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(5, 8, 16, 0.8)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '16px',
      animation: 'fadeIn 0.2s ease'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '540px',
        width: '100%',
        padding: '28px',
        position: 'relative',
        background: '#111827',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            color: 'var(--text-muted)',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <Smartphone size={24} color="#fff" />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '6px' }}>
            Open QuickShare on Mobile
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No "localhost" errors — connect seamlessly from your phone browser
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          background: 'rgba(255, 255, 255, 0.04)',
          padding: '4px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '20px',
          border: '1px solid var(--border-subtle)'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('wifi')}
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: activeTab === 'wifi' ? 'var(--color-primary)' : 'transparent',
              color: activeTab === 'wifi' ? '#fff' : 'var(--text-muted)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            <Wifi size={16} /> 1. Same Wi-Fi (Instant)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tunnel')}
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: activeTab === 'tunnel' ? 'var(--color-primary)' : 'transparent',
              color: activeTab === 'tunnel' ? '#fff' : 'var(--text-muted)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            <Globe size={16} /> 2. Anywhere (4G / 5G)
          </button>
        </div>

        {/* Tab 1: Same Wi-Fi */}
        {activeTab === 'wifi' && (
          <div style={{ textAlign: 'center' }}>
            {/* URL Display with Copy Button */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              marginBottom: '20px'
            }}>
              <code style={{ color: '#38bdf8', fontSize: '0.95rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {mobileUrl}
              </code>
              <button
                type="button"
                onClick={() => copyUrl(mobileUrl)}
                className="btn-primary"
                style={{ padding: '8px 16px', fontSize: '0.85rem', flexShrink: 0 }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy URL'}
              </button>
            </div>

            {/* Instructions list */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 18px',
              textAlign: 'left',
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
              lineHeight: 1.6
            }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <span style={{ color: 'var(--color-secondary)', fontWeight: 700 }}>1.</span>
                <span>Ensure your phone is connected to the <strong>same Wi-Fi network</strong> as this PC.</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ color: 'var(--color-secondary)', fontWeight: 700 }}>2.</span>
                <span>Type or paste the URL above directly into Chrome, Safari, or your phone's browser.</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Worldwide Tunnel */}
        {activeTab === 'tunnel' && (
          <div style={{ textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            <div style={{
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '14px',
              marginBottom: '16px',
              color: 'var(--text-main)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#818cf8', marginBottom: '4px' }}>
                <Zap size={16} /> Access from Anywhere in the World
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                If your phone is on <strong>mobile cellular data (4G/5G)</strong> or a different network, you can run a free secure tunnel.
              </p>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                Step 1: Open a terminal in your project and run:
              </div>
              <div style={{
                background: '#0a0f1d',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontFamily: 'monospace'
              }}>
                <code style={{ color: '#34d399' }}>npm run tunnel</code>
                <button
                  type="button"
                  onClick={() => copyUrl('npm run tunnel')}
                  className="btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
                Step 2: Open the generated URL on your phone
              </div>
              <p style={{ fontSize: '0.8rem' }}>
                It generates a public <code style={{ color: '#38bdf8' }}>https://*.loca.lt</code> link that opens securely on any phone anywhere!
              </p>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.75rem',
              color: 'var(--text-dim)'
            }}>
              <Shield size={14} color="#10b981" />
              <span>Full end-to-end HTTPS encryption supported for camera & native share sheet.</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            style={{ width: '100%', padding: '10px', fontSize: '0.88rem' }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
