import { useState, useEffect } from 'react';
import {
  FolderOpen, Loader, Settings, AlertCircle, CheckCircle, FileText, Sparkles, FolderMinus
} from 'lucide-react';

export default function MetadataPackager() {
  const [folderPath, setFolderPath] = useState('');
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [customPrompt, setCustomPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeJobId, setActiveJobId] = useState(null);
  const [jobDetails, setJobDetails] = useState(null);

  // Auto-save API Key
  const handleApiKeyChange = (val) => {
    setApiKey(val);
    localStorage.setItem('gemini_api_key', val);
  };

  // Poll for active job details
  useEffect(() => {
    if (!activeJobId) return;

    const fetchJobStatus = async () => {
      try {
        const res = await fetch(`https://content-automation-pipeline.onrender.com/api/packager/job/${activeJobId}`);
        if (res.ok) {
          const data = await res.json();
          setJobDetails(data);
          if (data.status === 'completed' || data.status === 'error') {
            setActiveJobId(null);
            setLoading(false);
          }
        }
      } catch (err) {
        console.error("Error fetching packager job status:", err);
      }
    };

    fetchJobStatus(); // first fetch immediately
    const interval = setInterval(fetchJobStatus, 2000);
    return () => clearInterval(interval);
  }, [activeJobId]);

  const startPackaging = async () => {
    if (!folderPath) {
      alert("Please specify a folder path containing videos!");
      return;
    }

    setLoading(true);
    setJobDetails(null);
    try {
      const res = await fetch('https://content-automation-pipeline.onrender.com/api/packager/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folder_path: folderPath,
          api_key: apiKey || null,
          custom_prompt: customPrompt || null
        })
      });

      if (res.ok) {
        const data = await res.json();
        setActiveJobId(data.job_id);
      } else {
        const errData = await res.json();
        alert(errData.detail || "Failed to start packaging job");
        setLoading(false);
      }
    } catch (err) {
      alert("Failed to connect to backend server");
      setLoading(false);
    }
  };

  return (
    <div className="container">
      {/* ── Header ───────────────────────────────────── */}
      <header className="page-header">
        <div className="header-icon" style={{ background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)' }}>
          <FolderOpen size={28} style={{ color: 'white' }} />
        </div>
        <div>
          <h1 className="page-title">Metadata Packager & Organizer</h1>
          <p className="page-subtitle">Group videos into subfolders and generate AI titles, descriptions, and metadata files automatically</p>
        </div>
      </header>

      {/* ── Main Content Grid ────────────────────────── */}
      <div className="editor-grid">

        {/* Left Side: Setup Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 className="setting-title" style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Settings size={18} /> Packager Configuration
            </h3>

            <div className="input-group" style={{ marginTop: '1rem' }}>
              <label>Target Folder Path</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. /Users/masi/Downloads/raw_videos"
                value={folderPath}
                onChange={e => setFolderPath(e.target.value)}
              />
              <span className="hint-text">The packager will scan this directory for raw video files.</span>
            </div>

            <div className="input-group" style={{ marginTop: '1.25rem' }}>
              <label>Gemini API Key (Optional)</label>
              <input
                type="password"
                className="input-field"
                placeholder="Enter Gemini API Key..."
                value={apiKey}
                onChange={e => handleApiKeyChange(e.target.value)}
              />
              <span className="hint-text">Required to analyze keyframes and generate smart video metadata. If blank, falls back to basic metadata.</span>
            </div>

            <div className="input-group" style={{ marginTop: '1.25rem' }}>
              <label>Custom Instructions / Theme (Optional)</label>
              <textarea
                className="input-field"
                rows={3}
                placeholder="e.g. Focus on coding tutorials, keep the title professional..."
                value={customPrompt}
                onChange={e => setCustomPrompt(e.target.value)}
                style={{ resize: 'vertical', padding: '8px 12px', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          <button
            type="button"
            className="btn-primary"
            disabled={loading || !folderPath}
            onClick={startPackaging}
            style={{ height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)' }}
          >
            {loading ? (
              <>
                <Loader size={20} className="spin" /> Packaging Videos...
              </>
            ) : (
              <>
                <Sparkles size={20} /> Generate & Package Folder
              </>
            )}
          </button>
        </div>

        {/* Right Side: Job Status Monitor */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem', flex: 1, minHeight: '380px' }}>
            <h3 className="setting-title" style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
              <FileText size={18} /> Active Packaging Task
            </h3>

            {!jobDetails ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '260px', color: 'var(--text-secondary)' }}>
                <FolderMinus size={40} style={{ opacity: 0.15, marginBottom: '1rem' }} />
                <span>No active packager job running</span>
                <span style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Enter a path and click package to start organizing your videos.</span>
              </div>
            ) : (
              <div className="job-card glass-panel" style={{ padding: '1.5rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', maxWidth: '75%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <FolderOpen size={14} style={{ color: 'var(--accent-primary)' }} />
                    {jobDetails.folder_path}
                  </div>
                  <div className={`status-badge status-${jobDetails.status}`} style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: '999px', textTransform: 'capitalize' }}>
                    {jobDetails.status}
                  </div>
                </div>

                {jobDetails.status === 'processing' && (
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '99px', overflow: 'hidden', marginBottom: '1rem' }}>
                    <div style={{
                      height: '100%',
                      background: 'linear-gradient(90deg, #8b5cf6 0%, #d946ef 100%)',
                      width: jobDetails.total_files > 0 ? `${(jobDetails.processed_files / jobDetails.total_files) * 100}%` : '0%',
                      transition: 'width 0.4s ease'
                    }} />
                  </div>
                )}

                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', lineHeight: '1.4' }}>
                  {jobDetails.status === 'processing' && <Loader size={12} className="spin" style={{ color: 'var(--accent-primary)' }} />}
                  {jobDetails.progress}
                </div>

                {jobDetails.total_files > 0 && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--accent-primary)', marginTop: '8px', fontWeight: '500' }}>
                    Processed: {jobDetails.processed_files} / {jobDetails.total_files} video files
                  </div>
                )}

                {jobDetails.error && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--error)', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(239,68,68,0.05)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.1)' }}>
                    <AlertCircle size={14} /> {jobDetails.error}
                  </div>
                )}

                {jobDetails.status === 'completed' && (
                  <div style={{ marginTop: '1.25rem', background: 'rgba(34, 197, 94, 0.05)', border: '1px solid rgba(34, 197, 94, 0.1)', padding: '12px 16px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#22c55e', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle size={14} /> Finished Successfully!
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '6px 0 0 0', lineHeight: '1.4' }}>
                      All video clips have been moved into individual folders named after their video, with a companion <code>metadata.txt</code> containing the title, description, and hashtags.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
