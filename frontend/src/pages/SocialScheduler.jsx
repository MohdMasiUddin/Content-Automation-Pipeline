import { useState, useEffect } from 'react';
import {
  Calendar, Clock, FolderOpen, Play, CheckCircle, AlertCircle,
  Loader, Settings, Send, Share2, X, Info, ExternalLink
} from 'lucide-react';

// Custom inline SVG components to support systems running older versions of lucide-react (< v0.300)
const InstagramIcon = ({ size = 20, ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const FacebookIcon = ({ size = 20, ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
  </svg>
);

const YoutubeIcon = ({ size = 20, ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"></path>
    <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"></polygon>
  </svg>
);

export default function SocialScheduler() {
  const [videoPath, setVideoPath] = useState('');
  const [caption, setCaption] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState(['instagram']);
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [scheduleMode, setScheduleMode] = useState('single');
  const [parentFolder, setParentFolder] = useState('');
  const [staggerInterval, setStaggerInterval] = useState(60);

  // Credentials setup
  const [useSimulated, setUseSimulated] = useState(true);
  const [metaAccessToken, setMetaAccessToken] = useState(localStorage.getItem('meta_access_token') || '');
  const [igBusinessId, setIgBusinessId] = useState(localStorage.getItem('instagram_business_id') || '');
  const [fbPageId, setFbPageId] = useState(localStorage.getItem('facebook_page_id') || '');
  const [publicVideoUrl, setPublicVideoUrl] = useState(localStorage.getItem('public_video_url') || '');
  const [youtubeAccessToken, setYoutubeAccessToken] = useState(localStorage.getItem('youtube_access_token') || '');

  // YouTube OAuth statuses
  const [ytStatus, setYtStatus] = useState({ authenticated: false, client_id: '' });
  const [ytLoading, setYtLoading] = useState(false);
  const [showOauthModal, setShowOauthModal] = useState(false);

  // Meta Discovery states
  const [discovering, setDiscovering] = useState(false);
  const [discoveredAccounts, setDiscoveredAccounts] = useState([]);
  const [hasBackendToken, setHasBackendToken] = useState(false);

  // Auto-save credentials helper
  const saveMetaCredentials = async (token, igId, fbId, videoUrl) => {
    try {
      await fetch('https://content-automation-pipeline.onrender.com/api/scheduler/meta/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meta_access_token: token,
          instagram_business_id: igId,
          facebook_page_id: fbId,
          public_video_url: videoUrl
        })
      });
    } catch (err) {
      console.error("Error saving Meta credentials to backend:", err);
    }
  };

  const saveCredential = (key, val, setter) => {
    setter(val);
    localStorage.setItem(key, val);

    // Propagate changes to backend .env immediately
    const updated = {
      meta_access_token: key === 'meta_access_token' ? val : metaAccessToken,
      instagram_business_id: key === 'instagram_business_id' ? val : igBusinessId,
      facebook_page_id: key === 'facebook_page_id' ? val : fbPageId,
      public_video_url: key === 'public_video_url' ? val : publicVideoUrl,
    };
    saveMetaCredentials(
      updated.meta_access_token,
      updated.instagram_business_id,
      updated.facebook_page_id,
      updated.public_video_url
    );
  };

  const fetchMetaStatus = async () => {
    try {
      const res = await fetch('https://content-automation-pipeline.onrender.com/api/scheduler/meta/status');
      if (res.ok) {
        const data = await res.json();
        setHasBackendToken(data.has_token);

        // Pre-fill masked token in UI if UI token is empty
        if (data.has_token && !metaAccessToken) {
          setMetaAccessToken(data.token);
        }

        if (data.instagram_business_id) {
          setIgBusinessId(data.instagram_business_id);
          localStorage.setItem('instagram_business_id', data.instagram_business_id);
        }
        if (data.facebook_page_id) {
          setFbPageId(data.facebook_page_id);
          localStorage.setItem('facebook_page_id', data.facebook_page_id);
        }
        if (data.public_video_url) {
          setPublicVideoUrl(data.public_video_url);
          localStorage.setItem('public_video_url', data.public_video_url);
        }
      }
    } catch (err) {
      console.error("Error fetching Meta status:", err);
    }
  };

  const handleDiscoverMeta = async () => {
    const isMasked = metaAccessToken.includes('...');
    const tokenToSend = isMasked ? '' : metaAccessToken;

    if (!tokenToSend && !hasBackendToken) {
      alert("Please enter a Meta Access Token first!");
      return;
    }
    setDiscovering(true);
    setDiscoveredAccounts([]);
    try {
      const res = await fetch('https://content-automation-pipeline.onrender.com/api/scheduler/meta/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meta_access_token: tokenToSend })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.accounts && data.accounts.length > 0) {
          setDiscoveredAccounts(data.accounts);
        } else {
          alert("No Facebook Pages or Instagram accounts discovered. Check that your token has 'pages_show_list', 'pages_read_engagement' and 'instagram_basic' permissions.");
        }
      } else {
        const err = await res.json();
        alert(`Discovery failed: ${err.detail || 'Unknown error'}`);
      }
    } catch (err) {
      alert("Error contacting backend for account discovery.");
    } finally {
      setDiscovering(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchYtStatus();
    fetchMetaStatus();

    // Check URL parameters for YouTube OAuth success redirect
    const params = new URLSearchParams(window.location.search);
    if (params.get('youtube_auth') === 'success') {
      alert("YouTube Channel successfully connected and verified!");
      // Clean query params
      const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
      window.history.replaceState({ path: newUrl }, '', newUrl);
    }

    const interval = setInterval(fetchJobs, 2500);
    return () => clearInterval(interval);
  }, []);

  const fetchYtStatus = async () => {
    try {
      const res = await fetch('https://content-automation-pipeline.onrender.com/api/scheduler/youtube/status');
      if (res.ok) {
        const data = await res.json();
        setYtStatus(data);
      }
    } catch (err) {
      console.error("Error fetching YouTube OAuth status:", err);
    }
  };

  const handleConnectYoutube = async () => {
    setYtLoading(true);
    try {
      const res = await fetch('https://content-automation-pipeline.onrender.com/api/scheduler/youtube/auth-url');
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        }
      } else {
        const errData = await res.json();
        if (errData.detail && errData.detail.includes("config.json")) {
          setShowOauthModal(true);
        } else {
          alert(errData.detail || "Failed to initiate Google OAuth flow");
        }
      }
    } catch (err) {
      alert("Error contacting backend scheduler service for OAuth URL");
    } finally {
      setYtLoading(false);
    }
  };

  const handleDisconnectYoutube = async () => {
    if (!window.confirm("Are you sure you want to unlink your YouTube Channel?")) return;
    try {
      const res = await fetch('https://content-automation-pipeline.onrender.com/api/scheduler/youtube/disconnect', {
        method: 'POST'
      });
      if (res.ok) {
        fetchYtStatus();
        alert("YouTube integration disconnected successfully.");
      }
    } catch (err) {
      alert("Error disconnecting YouTube");
    }
  };

  const fetchJobs = async () => {
    try {
      const res = await fetch('https://content-automation-pipeline.onrender.com/api/scheduler/queue');
      if (res.ok) {
        const data = await res.json();
        setJobs(data.reverse()); // latest first
      }
    } catch (err) {
      console.error("Error fetching scheduler queue:", err);
    }
  };

  const togglePlatform = (plat) => {
    setSelectedPlatforms(prev =>
      prev.includes(plat) ? prev.filter(p => p !== plat) : [...prev, plat]
    );
  };

  const handleSchedule = async () => {
    if (!videoPath) {
      alert("Please specify the absolute video file path!");
      return;
    }
    if (selectedPlatforms.length === 0) {
      alert("Please select at least one social media channel!");
      return;
    }
    if (!scheduledTime) {
      alert("Please select a valid scheduled posting date & time!");
      return;
    }

    setLoading(true);
    try {
      const formattedTime = new Date(scheduledTime).toISOString();
      const res = await fetch('https://content-automation-pipeline.onrender.com/api/scheduler/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_path: videoPath,
          caption: caption,
          scheduled_time: formattedTime,
          platforms: selectedPlatforms,
          credentials: {
            use_simulated: useSimulated,
            meta_access_token: metaAccessToken,
            instagram_business_id: igBusinessId,
            facebook_page_id: fbPageId,
            public_video_url: publicVideoUrl,
            youtube_access_token: youtubeAccessToken
          }
        })
      });

      if (res.ok) {
        setVideoPath('');
        setCaption('');
        setScheduledTime('');
        fetchJobs();
      } else {
        const errData = await res.json();
        alert(errData.detail || "Failed to schedule video post");
      }
    } catch (err) {
      alert("Error connecting to backend scheduler service");
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleBatch = async () => {
    if (!parentFolder) {
      alert("Please specify the parent folder path!");
      return;
    }
    if (selectedPlatforms.length === 0) {
      alert("Please select at least one social media channel!");
      return;
    }
    if (!scheduledTime) {
      alert("Please select a starting date & time!");
      return;
    }

    setLoading(true);
    try {
      const formattedTime = new Date(scheduledTime).toISOString();
      const res = await fetch('https://content-automation-pipeline.onrender.com/api/scheduler/schedule-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parent_folder: parentFolder,
          start_time: formattedTime,
          interval_minutes: Number(staggerInterval) || 60,
          platforms: selectedPlatforms,
          credentials: {
            use_simulated: useSimulated,
            meta_access_token: metaAccessToken,
            instagram_business_id: igBusinessId,
            facebook_page_id: fbPageId,
            public_video_url: publicVideoUrl,
            youtube_access_token: youtubeAccessToken
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        alert(`Successfully batch scheduled ${data.scheduled_count} videos!`);
        setParentFolder('');
        setScheduledTime('');
        fetchJobs();
      } else {
        const errData = await res.json();
        alert(errData.detail || "Failed to schedule batch videos");
      }
    } catch (err) {
      alert("Error connecting to backend scheduler service");
    } finally {
      setLoading(false);
    }
  };

  const cancelPost = async (jobId) => {
    try {
      const res = await fetch(`https://content-automation-pipeline.onrender.com/api/scheduler/cancel/${jobId}`, {
        method: 'POST'
      });
      if (res.ok) fetchJobs();
    } catch (err) {
      alert("Error cancelling post");
    }
  };

  const postNow = async (jobId) => {
    try {
      const res = await fetch(`https://content-automation-pipeline.onrender.com/api/scheduler/post-now/${jobId}`, {
        method: 'POST'
      });
      if (res.ok) fetchJobs();
    } catch (err) {
      alert("Error triggering posting");
    }
  };

  const getPlatformIcon = (platform) => {
    switch (platform) {
      case 'instagram':
        return <InstagramIcon size={14} style={{ color: '#E1306C' }} />;
      case 'facebook':
        return <FacebookIcon size={14} style={{ color: '#1877F2' }} />;
      case 'youtube':
        return <YoutubeIcon size={14} style={{ color: '#FF0000' }} />;
      default:
        return null;
    }
  };

  return (
    <div className="container">
      {/* ── Header ───────────────────────────────────── */}
      <header className="page-header">
        <div className="header-icon" style={{ background: 'var(--accent-gradient)' }}>
          <Calendar size={28} style={{ color: '#white' }} />
        </div>
        <div>
          <h1 className="page-title">Social Scheduler</h1>
          <p className="page-subtitle">Schedule, queue, and automatically publish video reels to Instagram, Facebook, and YouTube</p>
        </div>
      </header>

      {/* ── Main Content Grid ────────────────────────── */}
      <div className="editor-grid">

        {/* Left Side: Schedule Creator Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Post Details Card */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 className="setting-title" style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
              <Share2 size={18} /> Schedule Video Post
            </h3>

            {/* Mode Selector Tab */}
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '8px', marginBottom: '1.25rem', border: '1px solid rgba(255,255,255,0.05)' }}>
              <button
                type="button"
                onClick={() => setScheduleMode('single')}
                style={{
                  flex: 1, padding: '6px 12px', border: 'none', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                  background: scheduleMode === 'single' ? 'var(--accent-gradient)' : 'transparent',
                  color: scheduleMode === 'single' ? '#fff' : 'var(--text-secondary)',
                  transition: 'all 0.2s'
                }}
              >
                Single Video
              </button>
              <button
                type="button"
                onClick={() => setScheduleMode('batch')}
                style={{
                  flex: 1, padding: '6px 12px', border: 'none', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                  background: scheduleMode === 'batch' ? 'var(--accent-gradient)' : 'transparent',
                  color: scheduleMode === 'batch' ? '#fff' : 'var(--text-secondary)',
                  transition: 'all 0.2s'
                }}
              >
                Batch Directory
              </button>
            </div>

            {scheduleMode === 'single' ? (
              <>
                {/* Video File Path */}
                <div className="input-group">
                  <label>Reel Video File Path (Absolute)</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. /Users/masi/Documents/newreels/DJ_zlrmSdKN.mp4"
                    value={videoPath}
                    onChange={e => setVideoPath(e.target.value)}
                  />
                  <span className="hint-text">Specify the absolute path of your watermarked/subtitled reel.</span>
                </div>

                {/* Caption/Description */}
                <div className="input-group" style={{ marginTop: '1rem' }}>
                  <label>Caption / Video Description</label>
                  <textarea
                    className="input-field"
                    rows={3}
                    placeholder="Add caption, hashtags, and social description..."
                    value={caption}
                    onChange={e => setCaption(e.target.value)}
                    style={{ resize: 'vertical', minHeight: '80px', fontSize: '0.88rem' }}
                  />
                </div>
              </>
            ) : (
              <>
                {/* Parent Folder Path */}
                <div className="input-group">
                  <label>Parent Folder Path (Absolute)</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. /Users/masi/Downloads/packaged_videos"
                    value={parentFolder}
                    onChange={e => setParentFolder(e.target.value)}
                  />
                  <span className="hint-text">Directory containing subfolders. Each subfolder must contain a video file and a <code>metadata.txt</code> file.</span>
                </div>

                {/* Stagger Interval */}
                <div className="input-group" style={{ marginTop: '1rem' }}>
                  <label>Stagger Interval (Minutes)</label>
                  <input
                    type="number"
                    className="input-field"
                    min={1}
                    value={staggerInterval}
                    onChange={e => setStaggerInterval(parseInt(e.target.value) || 60)}
                  />
                  <span className="hint-text">Delay between scheduled posts (e.g. 60 min, or 1440 min for 1 day).</span>
                </div>
              </>
            )}

            {/* Platform Selection */}
            <div className="input-group" style={{ marginTop: '1.25rem' }}>
              <label style={{ marginBottom: '0.5rem', display: 'block' }}>Publishing Platforms</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => togglePlatform('instagram')}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid',
                    background: selectedPlatforms.includes('instagram') ? 'rgba(225, 48, 108, 0.12)' : 'var(--surface-dark)',
                    borderColor: selectedPlatforms.includes('instagram') ? '#E1306C' : 'rgba(255,255,255,0.06)',
                    color: selectedPlatforms.includes('instagram') ? '#fff' : 'var(--text-secondary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer',
                    fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s ease'
                  }}
                >
                  <InstagramIcon size={16} style={{ color: '#E1306C' }} /> Instagram
                </button>

                <button
                  type="button"
                  onClick={() => togglePlatform('facebook')}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid',
                    background: selectedPlatforms.includes('facebook') ? 'rgba(24, 119, 242, 0.12)' : 'var(--surface-dark)',
                    borderColor: selectedPlatforms.includes('facebook') ? '#1877F2' : 'rgba(255,255,255,0.06)',
                    color: selectedPlatforms.includes('facebook') ? '#fff' : 'var(--text-secondary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer',
                    fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s ease'
                  }}
                >
                  <FacebookIcon size={16} style={{ color: '#1877F2' }} /> Facebook
                </button>

                <button
                  type="button"
                  onClick={() => togglePlatform('youtube')}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid',
                    background: selectedPlatforms.includes('youtube') ? 'rgba(255, 0, 0, 0.12)' : 'var(--surface-dark)',
                    borderColor: selectedPlatforms.includes('youtube') ? '#FF0000' : 'rgba(255,255,255,0.06)',
                    color: selectedPlatforms.includes('youtube') ? '#fff' : 'var(--text-secondary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer',
                    fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s ease'
                  }}
                >
                  <YoutubeIcon size={16} style={{ color: '#FF0000' }} /> YouTube
                </button>
              </div>
            </div>

            {/* Posting Timepicker */}
            <div className="input-group" style={{ marginTop: '1.25rem' }}>
              <label>Scheduled Posting Date & Time</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="datetime-local"
                  className="input-field"
                  value={scheduledTime}
                  onChange={e => setScheduledTime(e.target.value)}
                  style={{ paddingLeft: '36px', color: '#fff', cursor: 'pointer' }}
                />
                <Clock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              </div>
            </div>
          </div>

          {/* Social API Authentication Settings */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 className="setting-title" style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <Settings size={18} /> API Integration & Credentials
              </h3>

              {/* Simulated Mode Toggle */}
              <button
                type="button"
                onClick={() => setUseSimulated(!useSimulated)}
                style={{
                  padding: '4px 10px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, border: 'none', cursor: 'pointer',
                  background: useSimulated ? 'rgba(139, 92, 246, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                  color: useSimulated ? 'var(--accent-primary)' : 'var(--success)',
                  border: useSimulated ? '1px solid rgba(139,92,246,0.3)' : '1px solid rgba(34,197,94,0.3)'
                }}
              >
                {useSimulated ? "⚡ Simulated Mode Active" : "📡 Real API Mode Active"}
              </button>
            </div>

            {useSimulated ? (
              <div style={{ background: 'rgba(139, 92, 246, 0.05)', border: '1px dashed rgba(139,92,246,0.15)', borderRadius: '8px', padding: '0.85rem', display: 'flex', gap: '8px' }}>
                <Info size={16} style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: '2px' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  Simulated posting mode is currently active. The scheduler loop will monitor and complete the job timeline with realistic publishing step executions without requiring developer setup! Toggle to **Real API Mode** to connect direct endpoints.
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                {/* Meta API Credentials */}
                {(selectedPlatforms.includes('instagram') || selectedPlatforms.includes('facebook')) && (
                  <div style={{ borderLeft: '3px solid var(--accent-primary)', paddingLeft: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>Meta Graph API Integration (Instagram/Facebook)</div>

                    <div className="input-group">
                      <label style={{ fontSize: '0.72rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span>Meta Access Token</span>
                        <button
                          type="button"
                          disabled={discovering || !metaAccessToken}
                          onClick={handleDiscoverMeta}
                          style={{
                            background: 'var(--accent-gradient)', border: 'none', borderRadius: '4px',
                            color: '#fff', fontSize: '0.65rem', fontWeight: 600, padding: '2px 8px',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                            opacity: metaAccessToken ? 1 : 0.6
                          }}
                        >
                          {discovering && <Loader size={10} className="spin" />} Autodetect Accounts
                        </button>
                      </label>
                      <input
                        type="password"
                        className="input-field"
                        placeholder="Meta Graph API Access Token..."
                        value={metaAccessToken}
                        onChange={e => saveCredential('meta_access_token', e.target.value, setMetaAccessToken)}
                        style={{ height: '32px', fontSize: '0.8rem' }}
                      />
                    </div>

                    {discoveredAccounts.length > 0 && (
                      <div style={{ background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.15)', borderRadius: '8px', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-primary)' }}>Click to Use Discovered Account:</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {discoveredAccounts.map((acc, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                if (acc.facebook_page_id) {
                                  saveCredential('facebook_page_id', acc.facebook_page_id, setFbPageId);
                                }
                                if (acc.instagram_business_id) {
                                  saveCredential('instagram_business_id', acc.instagram_business_id, setIgBusinessId);
                                }
                              }}
                              style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%',
                                padding: '6px 8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                                borderRadius: '6px', color: '#fff', fontSize: '0.7rem', cursor: 'pointer', textAlign: 'left',
                                transition: 'background-color 0.2s'
                              }}
                              onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'}
                              onMouseOut={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'}
                            >
                              <span style={{ fontWeight: 600 }}>{acc.page_name}</span>
                              <span style={{ color: 'var(--text-secondary)', fontSize: '0.65rem' }}>
                                IG: {acc.instagram_business_id || 'None'} | FB: {acc.facebook_page_id || 'None'}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '10px' }}>
                      {selectedPlatforms.includes('instagram') && (
                        <div className="input-group" style={{ flex: 1 }}>
                          <label style={{ fontSize: '0.72rem' }}>IG Business ID</label>
                          <input
                            type="text"
                            className="input-field"
                            placeholder="Instagram Account ID..."
                            value={igBusinessId}
                            onChange={e => saveCredential('instagram_business_id', e.target.value, setIgBusinessId)}
                            style={{ height: '32px', fontSize: '0.8rem' }}
                          />
                        </div>
                      )}

                      {selectedPlatforms.includes('facebook') && (
                        <div className="input-group" style={{ flex: 1 }}>
                          <label style={{ fontSize: '0.72rem' }}>FB Page ID</label>
                          <input
                            type="text"
                            className="input-field"
                            placeholder="Facebook Page ID..."
                            value={fbPageId}
                            onChange={e => saveCredential('facebook_page_id', e.target.value, setFbPageId)}
                            style={{ height: '32px', fontSize: '0.8rem' }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="input-group">
                      <label style={{ fontSize: '0.72rem' }}>Public Reachable Video URL</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="https://example.com/reels/video.mp4"
                        value={publicVideoUrl}
                        onChange={e => saveCredential('public_video_url', e.target.value, setPublicVideoUrl)}
                        style={{ height: '32px', fontSize: '0.8rem' }}
                      />
                      <span className="hint-text" style={{ fontSize: '0.65rem' }}>Meta requires a public URL so their server can ingest and process the video file.</span>
                    </div>
                  </div>
                )}

                {/* YouTube API Credentials */}
                {selectedPlatforms.includes('youtube') && (
                  <div style={{ borderLeft: '3px solid #FF0000', paddingLeft: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.25rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>YouTube Data API Integration</div>

                    {ytStatus.authenticated ? (
                      <div style={{ background: 'rgba(34, 197, 94, 0.05)', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: '8px', padding: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ color: '#22c55e', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle size={14} /> Linked to YouTube
                          </div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            Client ID: {ytStatus.client_id}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleDisconnectYoutube}
                          style={{
                            padding: '4px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, border: 'none', cursor: 'pointer',
                            background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', border: '1px solid rgba(239, 68, 68, 0.2)',
                            transition: 'all 0.2s'
                          }}
                          onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)' }}
                          onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)' }}
                        >
                          Disconnect
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                          To publish real videos to YouTube, you must link your YouTube Channel via Google OAuth.
                        </div>
                        <button
                          type="button"
                          onClick={handleConnectYoutube}
                          disabled={ytLoading}
                          style={{
                            padding: '8px 12px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600, border: 'none', cursor: 'pointer',
                            background: 'linear-gradient(135deg, #FF0000 0%, #B30000 100%)', color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%',
                            boxShadow: '0 4px 12px rgba(255, 0, 0, 0.15)', transition: 'all 0.2s'
                          }}
                          onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(255, 0, 0, 0.25)' }}
                          onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 0, 0, 0.15)' }}
                        >
                          {ytLoading ? <Loader size={14} className="spin" /> : <Share2 size={14} />} Link YouTube Channel
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="button"
            className="btn-primary"
            disabled={loading || (scheduleMode === 'single' ? !videoPath : !parentFolder) || selectedPlatforms.length === 0 || !scheduledTime}
            onClick={scheduleMode === 'single' ? handleSchedule : handleScheduleBatch}
            style={{ height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {loading ? (
              <>
                <Loader size={20} className="spin" /> {scheduleMode === 'single' ? 'Setting Schedule...' : 'Scheduling Batch...'}
              </>
            ) : (
              <>
                <Send size={20} /> {scheduleMode === 'single' ? 'Add Post to Social Queue' : 'Batch Schedule All Folders'}
              </>
            )}
          </button>
        </div>

        {/* Right Side: Jobs / Queues Tracker */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          <div className="glass-panel" style={{ padding: '1.5rem', flex: 1, minHeight: '400px' }}>
            <h3 className="setting-title" style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
              <Calendar size={18} /> Social Publishing Calendar Queue
            </h3>

            {jobs.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', color: 'var(--text-secondary)' }}>
                <Calendar size={40} style={{ opacity: 0.15, marginBottom: '1rem' }} />
                <span>No active or previous scheduled posts found</span>
                <span style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Schedule posts on the left to monitor their execution timelines.</span>
              </div>
            ) : (
              <div className="jobs-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '550px', overflowY: 'auto' }}>
                {jobs.map(job => (
                  <div key={job.id} className="job-card glass-panel" style={{ padding: '1.25rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="job-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', alignItems: 'flex-start' }}>
                      <div>
                        <div className="job-handle" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <FolderOpen size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                          {job.video_name}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                          <Clock size={10} />
                          Sched: {new Date(job.scheduled_time).toLocaleString()}
                        </div>
                      </div>

                      <div className={`status-badge status-${job.status}`} style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '999px', textTransform: 'capitalize' }}>
                        {job.status}
                      </div>
                    </div>

                    {job.caption && (
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.5rem 0', background: 'rgba(255,255,255,0.02)', padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.04)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        "{job.caption}"
                      </p>
                    )}

                    {/* Target Channels */}
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', margin: '0.5rem 0' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Target Channels:</span>
                      {job.platforms.map(plat => (
                        <div key={plat} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--surface-dark)', padding: '2px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.04)', fontSize: '0.7rem' }}>
                          {getPlatformIcon(plat)}
                          <span style={{ textTransform: 'capitalize' }}>{plat}</span>
                        </div>
                      ))}
                    </div>

                    <div className="progress-text" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {job.status === 'posting' && <Loader size={12} className="spin" style={{ color: 'var(--accent-primary)' }} />}
                      {job.progress}
                    </div>

                    {job.details && Object.keys(job.details).length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '0.5rem', background: 'rgba(139, 92, 246, 0.05)', padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(139, 92, 246, 0.15)' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Published Links:</span>
                        {Object.entries(job.details).map(([plat, detail]) => (
                          <div key={plat} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                            <span style={{ textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{plat}:</span>
                            {detail.url ? (
                              <a href={detail.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
                                View post <ExternalLink size={10} />
                              </a>
                            ) : (
                              <span style={{ color: 'var(--text-secondary)' }}>No link</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {job.error && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--error)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <AlertCircle size={12} /> {job.error}
                      </div>
                    )}

                    {/* Immediate Post Trigger & Cancel Actions */}
                    {job.status === 'scheduled' && (
                      <div style={{ display: 'flex', gap: '10px', marginTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.75rem' }}>
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={() => postNow(job.id)}
                          style={{
                            padding: '6px 12px', fontSize: '0.75rem', height: 'auto', flex: 1,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                          }}
                        >
                          <Send size={12} /> Publish Live Now
                        </button>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => cancelPost(job.id)}
                          style={{
                            padding: '6px 12px', fontSize: '0.75rem', height: 'auto', flex: 1,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                            border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--error)'
                          }}
                        >
                          <X size={12} /> Cancel Scheduled Post
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Google Client Secrets Configuration Guide Modal ────────────────────────── */}
      {showOauthModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '550px', width: '100%', padding: '2rem',
            position: 'relative', border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
          }}>
            <button
              onClick={() => setShowOauthModal(false)}
              style={{
                position: 'absolute', top: '1rem', right: '1rem',
                background: 'transparent', border: 'none', color: 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>

            <h3 style={{ color: '#FF0000', display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0, marginBottom: '1.25rem', fontSize: '1.25rem', fontWeight: 700 }}>
              <Settings size={22} /> YouTube Credentials Required
            </h3>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '1.25rem' }}>
              The backend could not find your Google Cloud OAuth Client credentials. Please download the Client Secret JSON file from your Google Developer Console and save it to the backend directory.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: '1.45' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <span style={{ background: '#FF0000', color: '#fff', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold', flexShrink: 0 }}>1</span>
                <span>Go to the <strong><a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}>Google Cloud Console</a></strong> and create or select a project.</span>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <span style={{ background: '#FF0000', color: '#fff', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold', flexShrink: 0 }}>2</span>
                <span>Enable the <strong>YouTube Data API v3</strong> in the API Library.</span>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <span style={{ background: '#FF0000', color: '#fff', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold', flexShrink: 0 }}>3</span>
                <span>Configure the OAuth consent screen with the <code>.../auth/youtube.upload</code> scope. Add your Google account under "Test Users".</span>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <span style={{ background: '#FF0000', color: '#fff', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold', flexShrink: 0 }}>4</span>
                <span>Go to <strong>Credentials</strong> &rarr; <strong>Create Credentials</strong> &rarr; <strong>OAuth client ID</strong>. Select <em>Web application</em>.</span>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <span style={{ background: '#FF0000', color: '#fff', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold', flexShrink: 0 }}>5</span>
                <span>Add <code>https://content-automation-pipeline.onrender.com/api/scheduler/youtube/callback</code> to the <strong>Authorized redirect URIs</strong>.</span>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <span style={{ background: '#FF0000', color: '#fff', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold', flexShrink: 0 }}>6</span>
                <span>Download the credentials JSON, rename it to <code>config.json</code>, and place it inside the <code>backend/</code> folder.</span>
              </div>
            </div>

            <button
              onClick={() => setShowOauthModal(false)}
              className="btn-primary"
              style={{ width: '100%', height: '40px', marginTop: '1.5rem', background: '#FF0000', cursor: 'pointer' }}
            >
              I Understand
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
