import React, { useState } from 'react';

const WAITLIST_URL = 'https://script.google.com/macros/s/AKfycbw7wr9buR8gMmQ4Pwfyuo0gw7xX_nwXQlFzYu6SRx6kW5S2RpuqXUhqVi-9nRpyXFiG/exec';

interface ChatHeaderProps {
  firstName?: string | null;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onNewChat?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ firstName, theme, onToggleTheme, onNewChat }) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistState, setWaitlistState] = useState<'idle' | 'submitting' | 'done'>('idle');

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail.trim()) return;
    setWaitlistState('submitting');
    try {
      await fetch(WAITLIST_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({ email: waitlistEmail.trim() }),
      });
    } catch {
      // no-cors swallows the response — treat as success
    }
    setWaitlistState('done');
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-k-nav border-b border-k-border flex items-center px-6 h-14 gap-4">
        <button
          onClick={onNewChat}
          className="flex items-center gap-2 flex-shrink-0 hover:opacity-80 transition-opacity"
          title="New chat"
        >
          <img src="/logo.png" alt="AIntropy" className="h-7 w-auto" />
          <span className="text-xs font-normal text-gray-500 px-1 leading-none">alpha</span>
        </button>

        <span className="flex-1 text-center text-sm text-k-muted hidden sm:block">
          New Jersey Open Data. 85M+ documents across 23 agencies.
        </span>

        <div className="flex items-center gap-3 ml-auto flex-shrink-0">
          <a
            href="mailto:help@aintropy.ai"
            className="text-xs font-medium px-4 py-1.5 rounded-full bg-k-cyan text-k-bg hover:bg-cyan-300 transition-colors flex-shrink-0"
          >
            Contact Us
          </a>

          <div className="relative">
            <button
              onClick={() => setProfileOpen(v => !v)}
              className="w-8 h-8 rounded-full bg-k-card border border-k-border flex items-center justify-center text-k-muted hover:text-k-text transition-colors text-sm font-medium"
            >
              {firstName ? firstName[0].toUpperCase() : '?'}
            </button>
            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-k-card border border-k-border rounded-xl shadow-xl py-1 animate-fade-in z-50">
                {firstName && (
                  <div className="px-4 py-2 border-b border-k-border">
                    <p className="text-sm font-medium text-k-text">{firstName}</p>
                  </div>
                )}
                <button
                  onClick={() => { onToggleTheme(); setProfileOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-k-muted hover:text-k-text hover:bg-k-border/20 transition-colors"
                >
                  {theme === 'dark' ? '☀️ Light mode' : '🌙 Dark mode'}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Waitlist modal */}
      {waitlistOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-fade-in"
          onClick={() => setWaitlistOpen(false)}
        >
          <div
            className="bg-k-card border border-k-border rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {waitlistState === 'done' ? (
              <div className="text-center py-4">
                <p className="text-2xl mb-3">🎉</p>
                <p className="text-lg font-semibold text-k-text mb-2">You're on the list!</p>
                <p className="text-sm text-k-muted mb-6">We'll be in touch when access opens up.</p>
                <button
                  onClick={() => setWaitlistOpen(false)}
                  className="px-6 py-2 rounded-full bg-k-cyan text-k-bg text-sm font-medium hover:bg-cyan-300 transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-semibold text-k-text">Join the Waitlist</h2>
                    <p className="text-sm text-k-muted mt-1">Get early access to Kurious.</p>
                  </div>
                  <button
                    onClick={() => setWaitlistOpen(false)}
                    className="text-k-muted hover:text-k-text transition-colors text-lg leading-none ml-4"
                  >
                    ✕
                  </button>
                </div>
                <form onSubmit={handleWaitlistSubmit}>
                  <input
                    type="email"
                    value={waitlistEmail}
                    onChange={e => setWaitlistEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full bg-k-bg border border-k-border rounded-xl px-4 py-3 text-sm text-k-text placeholder-k-muted/60 focus:outline-none focus:border-k-cyan transition-colors mb-4"
                  />
                  <button
                    type="submit"
                    disabled={waitlistState === 'submitting' || !waitlistEmail.trim()}
                    className="w-full py-3 rounded-xl bg-k-cyan text-k-bg text-sm font-medium hover:bg-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {waitlistState === 'submitting' ? 'Submitting…' : 'Request Access'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};
