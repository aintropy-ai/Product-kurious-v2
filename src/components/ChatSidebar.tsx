import React, { useMemo, useState } from 'react';
import { ConversationSummary } from '../types';

interface ChatSidebarProps {
  conversations: ConversationSummary[];
  activeConversationId: string | null;
  loading: boolean;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onToggleSidebar: () => void;
}

function getGroup(updatedAt: string): 'Today' | 'Yesterday' | 'Last 7 Days' | 'Older' {
  const now = new Date();
  const date = new Date(updatedAt);
  const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays < 1 && now.getDate() === date.getDate()) return 'Today';
  if (diffDays < 2 && now.getDate() - date.getDate() === 1) return 'Yesterday';
  if (diffDays < 7) return 'Last 7 Days';
  return 'Older';
}

const GROUP_ORDER = ['Today', 'Yesterday', 'Last 7 Days', 'Older'] as const;

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  conversations,
  activeConversationId,
  loading,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
  onToggleSidebar,
}) => {
  const [search, setSearch] = useState('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const recent = conversations.slice(0, 10);
    if (!search.trim()) return recent;
    return recent.filter(c =>
      (c.title || 'Untitled').toLowerCase().includes(search.toLowerCase())
    );
  }, [conversations, search]);

  const grouped = useMemo(() => {
    const groups: Record<string, ConversationSummary[]> = {
      'Today': [], 'Yesterday': [], 'Last 7 Days': [], 'Older': [],
    };
    for (const conv of filtered) {
      groups[getGroup(conv.updated_at)].push(conv);
    }
    return groups;
  }, [filtered]);

  return (
    <div className="flex-shrink-0 border-r border-k-border flex flex-col bg-k-nav relative" style={{ width: '16rem' }}>
      {/* Close button at right boundary */}
      <button
        onClick={onToggleSidebar}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-5 h-12 bg-k-nav border-r border-k-border flex items-center justify-center text-k-muted hover:text-k-text transition-colors z-10 text-lg font-light"
        title="Close sidebar"
      >
        &lt;
      </button>

      {/* Header */}
      <div className="px-4 py-4 border-b border-k-border flex items-center justify-between flex-shrink-0">
        <span className="text-sm font-semibold text-k-text">My Chats</span>
        <button
          onClick={onNewChat}
          className="flex items-center gap-1 px-2.5 py-1 text-xs bg-k-cyan text-k-bg hover:bg-cyan-300 transition-colors rounded-full font-medium"
          title="New Chat"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
            <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
          </svg>
          New Chat
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-k-border flex-shrink-0">
        <div className="relative">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
            className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-k-muted pointer-events-none">
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search chats..."
            className="search-input w-full pl-8 pr-3 py-1.5 text-xs bg-k-card border border-k-border text-k-text placeholder-k-muted/60 focus:border-k-cyan rounded-full transition-colors"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-1">
        {loading && (
          <div className="px-4 py-3 text-xs text-k-muted">Loading...</div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="px-4 py-3 text-xs text-k-muted">
            {search ? 'No matching chats' : 'No chats yet'}
          </div>
        )}

        {GROUP_ORDER.map(group => {
          const items = grouped[group];
          if (!items || items.length === 0) return null;
          return (
            <div key={group}>
              <div className="px-3 pt-3 pb-1 text-xs font-medium text-k-muted uppercase tracking-wide">
                {group}
              </div>
              {items.map(conv => (
                <div
                  key={conv.id}
                  className={`group relative flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors ${
                    conv.id === activeConversationId
                      ? 'bg-k-card text-k-text'
                      : 'text-k-muted hover:bg-k-card/60 hover:text-k-text'
                  }`}
                  onClick={() => onSelectConversation(conv.id)}
                  onMouseEnter={() => setHoveredId(conv.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                    className="w-4 h-4 flex-shrink-0 opacity-50">
                    <path fillRule="evenodd" d="M2 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.586l-2.707 2.707a1 1 0 0 1-1.414 0L6.586 15H4a2 2 0 0 1-2-2V5Z" clipRule="evenodd" />
                  </svg>
                  <span className="flex-1 text-sm truncate leading-snug">
                    {conv.title || 'Untitled'}
                  </span>
                  {hoveredId === conv.id && (
                    <button
                      onClick={e => { e.stopPropagation(); onDeleteConversation(conv.id); }}
                      className="flex-shrink-0 text-k-muted hover:text-k-error transition-colors"
                      title="Delete"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};
