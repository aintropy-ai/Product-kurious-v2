import { useState, useRef, useEffect } from 'react';

// ─── Mock data ────────────────────────────────────────────────────────────────
export interface Member {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Contributor' | 'Viewer';
  isOwner?: boolean;
}

export interface ProjectChat {
  id: string;
  title: string;
  group: string;
  pinned?: boolean;
}

export interface Project {
  id: string;
  name: string;
  memberCount: number;
  chatCount: number;
  lastActive: string;
  members: Member[];
  chats: ProjectChat[];
}

export interface MockConversation {
  id: string;
  title: string;
  time: string;
  projectId: string | null;
  pinned?: boolean;
  mode: 'quick' | 'deeper';
}

const ROLES: Member['role'][] = ['Viewer', 'Contributor', 'Admin'];
const ROLE_DESCRIPTIONS = {
  Admin: 'Full access — add/remove members, delete chats',
  Contributor: 'Can search and create chats',
  Viewer: 'Can view chats only',
};

const INITIAL_PROJECTS: Project[] = [
  {
    id: 'p1',
    name: 'NJ Schools Analysis',
    memberCount: 3,
    chatCount: 12,
    lastActive: '2h ago',
    members: [
      { id: 'm1', name: 'Kunal Sawarkar',  email: 'kunal@aintropy.ai',  role: 'Admin',       isOwner: true },
      { id: 'm2', name: 'Nirmit Desai',  email: 'nirmit@aintropy.ai', role: 'Contributor' },
      { id: 'm3', name: 'Sarah Johnson', email: 'sarah@aintropy.ai',  role: 'Viewer' },
    ],
    chats: [
      { id: 'pc1', title: 'Migrant student enrollment trends',   group: 'Today' },
      { id: 'pc2', title: 'District budget vs performance',      group: 'Yesterday' },
      { id: 'pc3', title: 'Special education funding gap',       group: 'Last 7 Days' },
    ],
  },
  {
    id: 'p2',
    name: 'Bergen County',
    memberCount: 5,
    chatCount: 8,
    lastActive: '1d ago',
    members: [
      { id: 'm1', name: 'Kunal Sawarkar',  email: 'kunal@aintropy.ai',  role: 'Admin',       isOwner: true },
      { id: 'm4', name: 'Alex Chen',     email: 'alex@aintropy.ai',   role: 'Admin' },
      { id: 'm5', name: 'Maria Lopez',   email: 'maria@aintropy.ai',  role: 'Contributor' },
      { id: 'm6', name: 'James Park',    email: 'james@aintropy.ai',  role: 'Contributor' },
      { id: 'm7', name: 'Emily Ross',    email: 'emily@aintropy.ai',  role: 'Viewer' },
    ],
    chats: [
      { id: 'pc4', title: 'Terminal leave benefits analysis',    group: 'Yesterday' },
      { id: 'pc5', title: 'County workforce demographics',       group: 'Last 7 Days' },
    ],
  },
  {
    id: 'p3',
    name: 'Transit Data',
    memberCount: 2,
    chatCount: 4,
    lastActive: '3d ago',
    members: [
      { id: 'm1', name: 'Kunal Sawarkar',  email: 'kunal@aintropy.ai',  role: 'Admin',       isOwner: true },
      { id: 'm8', name: 'David Kim',     email: 'david@aintropy.ai',  role: 'Contributor' },
    ],
    chats: [
      { id: 'pc6', title: 'NJ Transit ridership Q4 2024',        group: 'Last 7 Days' },
    ],
  },
];

const INITIAL_CONVERSATIONS: MockConversation[] = [
  { id: 'c1', title: 'Environmental violations by county 2022', time: '2h ago',     projectId: 'p1', pinned: true,  mode: 'quick'  },
  { id: 'c2', title: 'Gateway Tunnel funding & status',         time: '4h ago',     projectId: 'p2', pinned: true,  mode: 'deeper' },
  { id: 'c3', title: 'NJ Transit board safety discussion',      time: 'Yesterday',  projectId: 'p3', pinned: false, mode: 'quick'  },
  { id: 'c4', title: 'NJ DOT road maintenance budget 2023',     time: 'Yesterday',  projectId: null, pinned: false, mode: 'quick'  },
  { id: 'c5', title: 'Bridge inspection reports — Q3 2023',     time: '2 days ago', projectId: null, pinned: false, mode: 'quick'  },
  { id: 'c6', title: 'Air quality violations Meadowlands area', time: '3 days ago', projectId: 'p1', pinned: false, mode: 'deeper' },
  { id: 'c7', title: 'Fare increase ridership impact analysis', time: 'Last week',  projectId: 'p3', pinned: false, mode: 'quick'  },
  { id: 'c8', title: 'DEP remediation orders by district',      time: 'Last week',  projectId: null, pinned: false, mode: 'quick'  },
  { id: 'c9', title: 'NJDOT capital project pipeline 2024',     time: '2 weeks ago',projectId: 'p2', pinned: false, mode: 'deeper' },
];

// ─── Role switcher (demo only) ────────────────────────────────────────────────
function RoleSwitcher({ role, onChange }: { role: Member['role']; onChange: (r: Member['role']) => void }) {
  const colors: Record<Member['role'], string> = {
    Admin:       'border-k-cyan text-k-cyan bg-k-cyan/10',
    Contributor: 'border-purple-400 text-purple-400 bg-purple-400/10',
    Viewer:      'border-k-border text-k-muted bg-k-bg',
  };
  return (
    <div className="px-3 pb-3">
      <p className="text-[10px] text-k-muted uppercase tracking-wider mb-1.5 font-semibold">Demo: viewing as</p>
      <div className="flex gap-1.5">
        {(ROLES as Member['role'][]).map(r => (
          <button key={r} onClick={() => onChange(r)}
            className={`flex-1 text-[10px] py-1 rounded-lg border font-medium transition-all ${
              role === r ? colors[r] : 'border-k-border text-k-muted hover:text-k-text'
            }`}>
            {r}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Role badge ───────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: Member['role'] }) {
  const colors = {
    Admin:       'text-k-cyan border-k-cyan/30 bg-k-cyan/10',
    Contributor: 'text-purple-400 border-purple-400/30 bg-purple-400/10',
    Viewer:      'text-k-muted border-k-border bg-k-bg',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${colors[role]}`}>{role}</span>
  );
}

// ─── Confirm modal ────────────────────────────────────────────────────────────
function ConfirmModal({ title, message, confirmLabel, onConfirm, onCancel }: {
  title: string; message: string; confirmLabel: string;
  onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70">
      <div className="bg-k-card border border-k-border rounded-2xl w-full max-w-sm mx-4 p-6 shadow-2xl animate-fade-in">
        <h3 className="font-semibold text-k-text mb-2">{title}</h3>
        <p className="text-sm text-k-muted mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded-xl border border-k-border text-sm text-k-muted hover:text-k-text transition-colors">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-400 hover:bg-red-500/20 transition-colors">{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Members panel ────────────────────────────────────────────────────────────
export function MembersPanel({ project, demoRole, onClose }: { project: Project; demoRole: Member['role']; onClose: () => void }) {
  const [members, setMembers] = useState<Member[]>(project.members);
  const [addEmail, setAddEmail] = useState('');
  const [addRole, setAddRole] = useState<Member['role']>('Contributor');
  const [addError, setAddError] = useState('');
  const isAdmin = demoRole === 'Admin';

  const handleAdd = () => {
    if (!addEmail.trim()) { setAddError('Please enter an email address.'); return; }
    if (!addEmail.includes('@')) { setAddError('Please enter a valid email.'); return; }
    if (members.find(m => m.email === addEmail.trim())) { setAddError('This person is already a member.'); return; }
    setMembers(prev => [...prev, { id: `m_${Date.now()}`, name: addEmail.split('@')[0], email: addEmail.trim(), role: addRole }]);
    setAddEmail('');
    setAddError('');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-k-card border border-k-border rounded-2xl w-full max-w-lg mx-4 shadow-2xl animate-fade-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-k-border">
          <div>
            <h3 className="font-semibold text-k-text">Members</h3>
            <p className="text-xs text-k-muted mt-0.5">{project.name} · {members.length} member{members.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={onClose} className="text-k-muted hover:text-k-text transition-colors p-1 rounded-lg hover:bg-k-border/30">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>

        {/* Members list */}
        <div className="px-6 py-4 max-h-64 overflow-y-auto space-y-3">
          {members.map(member => (
            <div key={member.id} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-k-cyan/30 to-purple-400/30 border border-k-border flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-semibold text-k-cyan">{member.name.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-k-text font-medium truncate">
                  {member.name}
                  {member.isOwner && <span className="text-xs text-k-muted font-normal ml-1">(Owner)</span>}
                </p>
                <p className="text-xs text-k-muted truncate">{member.email}</p>
              </div>
              {isAdmin && !member.isOwner ? (
                <select
                  value={member.role}
                  onChange={e => setMembers(prev => prev.map(m => m.id === member.id ? { ...m, role: e.target.value as Member['role'] } : m))}
                  className="text-xs bg-k-bg border border-k-border rounded-lg px-2 py-1 text-k-muted focus:outline-none focus:border-k-cyan transition-colors"
                >
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              ) : (
                <RoleBadge role={member.role} />
              )}
              {isAdmin && !member.isOwner && (
                <button onClick={() => setMembers(prev => prev.filter(m => m.id !== member.id))}
                  className="text-k-muted hover:text-red-400 transition-colors p-1 flex-shrink-0" title="Remove">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M10.5 3.5l-7 7M3.5 3.5l7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Role descriptions */}
        <div className="px-6 py-3 bg-k-bg/50 border-t border-k-border space-y-1">
          {ROLES.map(r => (
            <p key={r} className="text-xs text-k-muted">
              <span className="font-medium text-k-text">{r}:</span> {ROLE_DESCRIPTIONS[r]}
            </p>
          ))}
        </div>

        {/* Add member */}
        {isAdmin && (
          <div className="px-6 py-4 border-t border-k-border">
            <p className="text-xs font-medium text-k-muted uppercase tracking-wider mb-3">Add Member</p>
            <div className="flex gap-2">
              <input
                type="email"
                value={addEmail}
                onChange={e => { setAddEmail(e.target.value); setAddError(''); }}
                placeholder="colleague@company.com"
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                className="flex-1 bg-k-bg border border-k-border rounded-xl px-3 py-2 text-sm text-k-text placeholder-k-muted/50 focus:outline-none focus:border-k-cyan transition-colors"
              />
              <select
                value={addRole}
                onChange={e => setAddRole(e.target.value as Member['role'])}
                className="bg-k-bg border border-k-border rounded-xl px-3 py-2 text-sm text-k-muted focus:outline-none focus:border-k-cyan transition-colors"
              >
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <button onClick={handleAdd} className="px-4 py-2 bg-white text-k-bg text-sm font-semibold rounded-xl hover:bg-gray-100 transition-colors flex-shrink-0">Add</button>
            </div>
            {addError && <p className="text-xs text-k-error mt-2">{addError}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Three-dot menu ───────────────────────────────────────────────────────────
function ThreeDotMenu({ onRename, onMembers, onDelete, demoRole }: {
  onRename: () => void; onMembers: () => void; onDelete: () => void; demoRole: Member['role'];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isAdmin = demoRole === 'Admin';

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
        className="p-1 rounded text-k-muted hover:text-k-text hover:bg-k-border transition-colors opacity-0 group-hover:opacity-100"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="3" r="1" fill="currentColor"/>
          <circle cx="7" cy="7" r="1" fill="currentColor"/>
          <circle cx="7" cy="11" r="1" fill="currentColor"/>
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-7 w-44 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in-fast backdrop-blur-xl" style={{ background: "rgba(20,20,22,0.88)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {isAdmin && (
            <button onClick={e => { e.stopPropagation(); setOpen(false); onRename(); }}
              className="w-full text-left px-3 py-2 text-sm text-k-muted hover:text-k-text hover:bg-k-bg transition-colors">
              Rename
            </button>
          )}
          <button onClick={e => { e.stopPropagation(); setOpen(false); onMembers(); }}
            className="w-full text-left px-3 py-2 text-sm text-k-muted hover:text-k-text hover:bg-k-bg transition-colors">
            {isAdmin ? 'Manage Members' : 'View Members'}
          </button>
          {isAdmin && (
            <button onClick={e => { e.stopPropagation(); setOpen(false); onDelete(); }}
              className="w-full text-left px-3 py-2 text-sm text-k-error hover:bg-k-error/10 transition-colors">
              Delete Project
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Project chat three-dot menu (Option A) ───────────────────────────────────
function ProjectChatMenu({ pinned, isAdmin, onPin, onRename, onDelete }: {
  pinned: boolean; isAdmin: boolean; onPin: () => void; onRename: () => void; onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  return (
    <div className="relative flex-shrink-0" ref={ref}>
      <button onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-k-muted hover:text-k-text hover:bg-k-border/40">
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="3" r="1" fill="currentColor"/>
          <circle cx="7" cy="7" r="1" fill="currentColor"/>
          <circle cx="7" cy="11" r="1" fill="currentColor"/>
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-7 w-40 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in-fast backdrop-blur-xl" style={{ background: "rgba(20,20,22,0.88)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <button onClick={e => { e.stopPropagation(); onPin(); setOpen(false); }}
            className="w-full text-left px-3 py-2 text-xs text-k-muted hover:text-k-text hover:bg-k-border/20 transition-colors flex items-center gap-2">
            <span>📌</span>{pinned ? 'Unpin' : 'Pin to top'}
          </button>
          {isAdmin && (
            <button onClick={e => { e.stopPropagation(); onRename(); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-xs text-k-muted hover:text-k-text hover:bg-k-border/20 transition-colors flex items-center gap-2">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
                <path d="M11.013 2.513a1.75 1.75 0 0 1 2.475 2.474L6.226 12.25a2.751 2.751 0 0 1-.892.58l-2.185.91a.75.75 0 0 1-.977-.977l.91-2.184a2.75 2.75 0 0 1 .579-.892l7.352-7.174Z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Rename
            </button>
          )}
          <div className="border-t border-k-border" />
          <button onClick={e => { e.stopPropagation(); onDelete(); setOpen(false); }}
            className="w-full text-left px-3 py-2 text-xs text-k-error hover:bg-k-error/10 transition-colors flex items-center gap-2">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
              <path d="M6.5 1.75a.25.25 0 0 1 .25-.25h2.5a.25.25 0 0 1 .25.25V3h-3V1.75Zm4.5 1.25h-.5V1.75A1.75 1.75 0 0 0 9.25 0h-2.5A1.75 1.75 0 0 0 5 1.75V3H2.75a.75.75 0 0 0 0 1.5h.56l.663 7.47A1.75 1.75 0 0 0 5.72 13.5h4.56a1.75 1.75 0 0 0 1.745-1.53L12.69 4.5h.56a.75.75 0 0 0 0-1.5Z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Profile Settings panel ───────────────────────────────────────────────────
function Toggle({ label, desc, value, onChange }: { label: string; desc: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-k-border/50 last:border-0">
      <div>
        <p className="text-sm text-k-text">{label}</p>
        <p className="text-xs text-k-muted mt-0.5">{desc}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`w-9 h-5 rounded-full border flex-shrink-0 flex items-center px-0.5 transition-colors duration-200 ${value ? 'bg-k-cyan border-k-cyan' : 'bg-k-bg border-k-border'}`}
      >
        <div className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${value ? 'translate-x-4' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}

function ProfileSettingsPanel({ onClose }: { onClose: () => void }) {
  const [fullName, setFullName]         = useState('Kunal Sawarkar');
  const [jobTitle, setJobTitle]         = useState('Head of Product');
  const [emailDigest, setEmailDigest]   = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(false);
  const [saved, setSaved]               = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg mx-4 flex flex-col shadow-2xl rounded-2xl max-h-[85vh]" style={{ background: 'var(--k-nav)', border: '1px solid var(--k-border)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-k-border flex-shrink-0">
          <h2 className="text-sm font-semibold text-k-text">Profile Settings</h2>
          <button onClick={onClose} className="text-k-muted hover:text-k-text transition-colors duration-150 text-lg leading-none">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* ── Profile ───────────────────────────────────────────── */}
          <div className="px-5 py-5 border-b border-k-border">
            <p className="text-[11px] uppercase tracking-wider text-k-muted/70 font-medium mb-4">Profile</p>

            {/* Avatar */}
            <div className="flex items-center gap-4 mb-5">
              <div
                className="relative group cursor-pointer flex-shrink-0"
                onClick={() => fileRef.current?.click()}
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-k-cyan to-purple-500 flex items-center justify-center text-xl font-bold text-k-bg select-none">K</div>
                <div className="absolute inset-0 rounded-full bg-black/55 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-white">
                    <path fillRule="evenodd" d="M1 8a2 2 0 0 1 2-2h.93a2 2 0 0 0 1.664-.89l.812-1.22A2 2 0 0 1 8.07 3h3.86a2 2 0 0 1 1.664.89l.812 1.22A2 2 0 0 0 16.07 6H17a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8Zm13.5 3a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM10 14a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd"/>
                  </svg>
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" />
              </div>
              <div>
                <p className="text-sm font-medium text-k-text">Profile photo</p>
                <p className="text-xs text-k-muted mt-0.5">Click to upload · JPG or PNG · Max 2MB</p>
              </div>
            </div>

            {/* Full name */}
            <div className="mb-3">
              <label className="text-xs text-k-muted block mb-1.5">Full name</label>
              <input
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full bg-k-card border border-k-border rounded-lg px-3 py-2 text-sm text-k-text focus:outline-none focus:border-k-cyan/50 transition-colors duration-150 placeholder:text-k-muted/50"
              />
            </div>

            {/* Job title */}
            <div className="mb-5">
              <label className="text-xs text-k-muted block mb-1.5">Job title</label>
              <input
                value={jobTitle}
                onChange={e => setJobTitle(e.target.value)}
                placeholder="e.g. Data Scientist, Policy Analyst"
                className="w-full bg-k-card border border-k-border rounded-lg px-3 py-2 text-sm text-k-text focus:outline-none focus:border-k-cyan/50 transition-colors duration-150 placeholder:text-k-muted/50"
              />
            </div>

            <button
              onClick={handleSave}
              className={`text-sm font-medium px-4 py-2 rounded-lg transition-all duration-150 ${saved ? 'bg-k-cyan/15 text-k-cyan border border-k-cyan/30' : 'bg-k-card border border-k-border text-k-text hover:border-k-cyan/40 hover:text-k-cyan'}`}
            >
              {saved ? '✓ Saved' : 'Save changes'}
            </button>
          </div>

          {/* ── Notifications ─────────────────────────────────────── */}
          <div className="px-5 py-5 border-b border-k-border">
            <p className="text-[11px] uppercase tracking-wider text-k-muted/70 font-medium mb-1">Notifications</p>
            <Toggle
              label="Email digest"
              desc="Daily summary of your queries and answers"
              value={emailDigest}
              onChange={setEmailDigest}
            />
            <Toggle
              label="Weekly summary"
              desc="Weekly insights from your knowledge base"
              value={weeklySummary}
              onChange={setWeeklySummary}
            />
          </div>

          {/* ── Security ──────────────────────────────────────────── */}
          <div className="px-5 py-5 border-b border-k-border">
            <p className="text-[11px] uppercase tracking-wider text-k-muted/70 font-medium mb-4">Security</p>
            <button className="flex items-center gap-2 text-sm text-k-text border border-k-border rounded-lg px-4 py-2.5 hover:border-k-cyan/40 hover:text-k-cyan transition-all duration-150">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                <rect x="2" y="7" width="12" height="8" rx="1.5" strokeLinecap="round"/>
                <path d="M5 7V4.5a3 3 0 0 1 6 0V7" strokeLinecap="round"/>
              </svg>
              Change password
            </button>
          </div>

          {/* ── Danger zone ───────────────────────────────────────── */}
          <div className="px-5 py-5">
            <p className="text-[11px] uppercase tracking-wider text-red-400/70 font-medium mb-4">Danger zone</p>
            {!deleteConfirm ? (
              <button
                onClick={() => setDeleteConfirm(true)}
                className="flex items-center gap-2 text-sm text-red-400 border border-red-400/25 rounded-lg px-4 py-2.5 hover:bg-red-400/8 hover:border-red-400/50 transition-all duration-150"
              >
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                  <path d="M2 4h12M5 4V2.5A1.5 1.5 0 0 1 6.5 1h3A1.5 1.5 0 0 1 11 2.5V4M6 7v5M10 7v5M3 4l1 9.5A1 1 0 0 0 5 14.5h6a1 1 0 0 0 1-1L13 4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Delete account
              </button>
            ) : (
              <div className="rounded-xl p-4 border border-red-400/25 bg-red-400/5">
                <p className="text-sm text-red-400 font-medium mb-1">Are you sure?</p>
                <p className="text-xs text-k-muted mb-4">This will permanently delete your account, all chats, and data. This cannot be undone.</p>
                <div className="flex gap-2">
                  <button className="text-sm text-red-400 border border-red-400/40 rounded-lg px-3 py-1.5 hover:bg-red-400/15 transition-all duration-150">
                    Yes, delete everything
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(false)}
                    className="text-sm text-k-muted border border-k-border rounded-lg px-3 py-1.5 hover:text-k-text transition-all duration-150"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── User profile section ─────────────────────────────────────────────────────
function UserProfile({ theme, onToggleTheme }: { theme: 'dark' | 'light'; onToggleTheme: () => void }) {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const MENU = [
    { icon: '👤', label: 'Profile settings', action: () => { setOpen(false); setProfileOpen(true); } },
    { icon: '⚙️', label: 'Workspace settings', action: () => setOpen(false) },
    { icon: '🔑', label: 'API keys',            action: () => setOpen(false) },
    { icon: '💳', label: 'Billing & plan',       action: () => setOpen(false) },
  ];

  return (
    <div className="relative">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-k-border/30 transition-colors">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-k-cyan to-purple-500 flex items-center justify-center text-sm font-bold text-k-bg flex-shrink-0">K</div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-medium text-k-text truncate">Kunal Sawarkar</p>
          <p className="text-xs text-k-muted truncate">Enterprise · Admin</p>
        </div>
        <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 text-k-muted flex-shrink-0">
          <path d="M8 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM1.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM14.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"/>
        </svg>
      </button>
      {open && (
        <div className="absolute bottom-full left-0 mb-1 w-56 rounded-xl shadow-2xl py-1 z-50 animate-fade-in-fast backdrop-blur-xl" style={{ background: "rgba(20,20,22,0.88)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="px-4 py-3 border-b border-k-border">
            <p className="text-sm font-semibold text-k-text">Kunal Sawarkar</p>
            <p className="text-xs text-k-muted">kunal@aintropy.ai</p>
            <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-k-cyan/10 text-k-cyan border border-k-cyan/20">Enterprise Plan</span>
          </div>
          {MENU.map(item => (
            <button key={item.label} onClick={item.action}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-k-muted hover:text-k-text hover:bg-k-border/20 transition-colors">
              <span>{item.icon}</span>{item.label}
            </button>
          ))}
          <div className="border-t border-k-border mt-1 pt-1">
            <button
              onClick={() => { onToggleTheme(); setOpen(false); }}
              className="w-full flex items-center justify-between px-4 py-2 text-sm text-k-muted hover:text-k-text hover:bg-k-border/20 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
                {theme === 'dark' ? 'Light mode' : 'Dark mode'}
              </div>
              <div className={`w-8 h-4 rounded-full border transition-colors flex items-center px-0.5 ${theme === 'light' ? 'bg-k-cyan border-k-cyan' : 'bg-k-bg border-k-border'}`}>
                <div className={`w-3 h-3 rounded-full bg-white transition-transform ${theme === 'light' ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
            </button>
          </div>
          <div className="border-t border-k-border pt-1">
            <button onClick={() => setOpen(false)}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-400 hover:bg-red-400/10 transition-colors">
              <span>→</span> Sign out
            </button>
          </div>
        </div>
      )}

      {profileOpen && <ProfileSettingsPanel onClose={() => setProfileOpen(false)} />}
    </div>
  );
}

// ─── Conversation row (chats tab) — Option A: everything in ⋯ menu ────────────
function ConvRow({ conv, active, onSelect, pinned = false, isRenaming, onStartRename, onSaveRename, onCancelRename, onPin, onDelete }: {
  conv: MockConversation; active: boolean; onSelect: () => void; pinned?: boolean;
  isRenaming?: boolean; onStartRename?: () => void; onSaveRename?: (v: string) => void; onCancelRename?: () => void;
  onPin?: () => void; onDelete?: () => void;
}) {
  const [editVal, setEditVal] = useState(conv.title);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (isRenaming) setEditVal(conv.title); }, [isRenaming, conv.title]);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div
      onClick={!isRenaming ? onSelect : undefined}
      className={`group w-full flex items-center gap-2 px-3 py-1.5 mx-2 rounded-lg text-left transition-colors cursor-pointer ${
        active ? 'bg-k-cyan/10 text-k-text border border-k-cyan/20' : 'text-k-muted hover:text-k-text hover:bg-k-border/20'
      }`}
      style={{ width: 'calc(100% - 16px)' }}
    >
      <span className="flex-shrink-0 text-xs">{pinned ? '📌' : conv.mode === 'deeper' ? '🔍' : '💬'}</span>
      <div className="flex-1 min-w-0">
        {isRenaming ? (
          <input
            autoFocus
            value={editVal}
            onChange={e => setEditVal(e.target.value)}
            onBlur={() => onSaveRename?.(editVal)}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); onSaveRename?.(editVal); }
              if (e.key === 'Escape') onCancelRename?.();
              e.stopPropagation();
            }}
            onClick={e => e.stopPropagation()}
            className="w-full bg-k-card border border-k-cyan rounded px-2 py-0.5 text-xs text-k-text focus:outline-none"
          />
        ) : (
          <>
            <p className="text-xs font-medium truncate leading-snug">{conv.title}</p>
            <p className="text-[10px] text-k-muted/70 mt-0.5">{conv.time}</p>
          </>
        )}
      </div>
      {!isRenaming && (
        <div className="relative flex-shrink-0" ref={menuRef}>
          <button
            onClick={e => { e.stopPropagation(); setMenuOpen(v => !v); }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-k-muted hover:text-k-text hover:bg-k-border/40"
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="3" r="1" fill="currentColor"/>
              <circle cx="7" cy="7" r="1" fill="currentColor"/>
              <circle cx="7" cy="11" r="1" fill="currentColor"/>
            </svg>
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-7 w-40 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in-fast backdrop-blur-xl" style={{ background: "rgba(20,20,22,0.88)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <button onClick={e => { e.stopPropagation(); onPin?.(); setMenuOpen(false); }}
                className="w-full text-left px-3 py-2 text-xs text-k-muted hover:text-k-text hover:bg-k-border/20 transition-colors flex items-center gap-2">
                <span>{pinned ? '📌' : '📌'}</span>
                {pinned ? 'Unpin' : 'Pin to top'}
              </button>
              <button onClick={e => { e.stopPropagation(); onStartRename?.(); setMenuOpen(false); }}
                className="w-full text-left px-3 py-2 text-xs text-k-muted hover:text-k-text hover:bg-k-border/20 transition-colors flex items-center gap-2">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
                  <path d="M11.013 2.513a1.75 1.75 0 0 1 2.475 2.474L6.226 12.25a2.751 2.751 0 0 1-.892.58l-2.185.91a.75.75 0 0 1-.977-.977l.91-2.184a2.75 2.75 0 0 1 .579-.892l7.352-7.174Z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Rename
              </button>
              <div className="border-t border-k-border" />
              <button onClick={e => { e.stopPropagation(); onDelete?.(); setMenuOpen(false); }}
                className="w-full text-left px-3 py-2 text-xs text-k-error hover:bg-k-error/10 transition-colors flex items-center gap-2">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
                  <path d="M6.5 1.75a.25.25 0 0 1 .25-.25h2.5a.25.25 0 0 1 .25.25V3h-3V1.75Zm4.5 1.25h-.5V1.75A1.75 1.75 0 0 0 9.25 0h-2.5A1.75 1.75 0 0 0 5 1.75V3H2.75a.75.75 0 0 0 0 1.5h.56l.663 7.47A1.75 1.75 0 0 0 5.72 13.5h4.56a1.75 1.75 0 0 0 1.745-1.53L12.69 4.5h.56a.75.75 0 0 0 0-1.5Z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Delete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main sidebar ─────────────────────────────────────────────────────────────
interface ProjectSidebarProps {
  activeConvId: string | null;
  onNewChat: () => void;
  onSelectConversation: (id: string, title: string) => void;
  onActiveProjectChange?: (project: Project | null, role: Member['role']) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export function ProjectSidebar({ activeConvId, onNewChat, onSelectConversation, onActiveProjectChange, theme, onToggleTheme }: ProjectSidebarProps) {
  const [tab, setTab] = useState<'chats' | 'projects'>('chats');
  const [demoRole, setDemoRole] = useState<Member['role']>('Admin');
  const [searchQuery, setSearchQuery] = useState('');
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [conversations, setConversations] = useState<MockConversation[]>(INITIAL_CONVERSATIONS);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [membersProject, setMembersProject] = useState<Project | null>(null);
  const [confirmDeleteProject, setConfirmDeleteProject] = useState<Project | null>(null);
  const [confirmDeleteChat, setConfirmDeleteChat] = useState<{ project: Project; chat: ProjectChat } | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [projectSearch, setProjectSearch] = useState('');
  const [renamingChatId, setRenamingChatId] = useState<string | null>(null);
  const [renamingProjectChatKey, setRenamingProjectChatKey] = useState<string | null>(null);

  useEffect(() => {
    const p = activeProjectId ? projects.find(p => p.id === activeProjectId) ?? null : null;
    onActiveProjectChange?.(p, demoRole);
  }, [activeProjectId, demoRole, projects]);

  const pinnedConvs = conversations.filter(c => c.pinned);
  const recentConvs = conversations.filter(c => !c.pinned);
  const filteredConvs = searchQuery ? conversations.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase())) : null;
  const filteredProjects = projectSearch.trim() ? projects.filter(p => p.name.toLowerCase().includes(projectSearch.toLowerCase())) : projects;

  const handleDeleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    if (activeProjectId === id) setActiveProjectId(null);
    setConfirmDeleteProject(null);
  };

  const handlePinChat = (projectId: string, chatId: string) => {
    setProjects(prev => prev.map(p => p.id === projectId
      ? { ...p, chats: p.chats.map(c => c.id === chatId ? { ...c, pinned: !c.pinned } : c) }
      : p
    ));
  };

  const handleDeleteChat = (projectId: string, chatId: string) => {
    setProjects(prev => prev.map(p => p.id === projectId
      ? { ...p, chats: p.chats.filter(c => c.id !== chatId), chatCount: p.chatCount - 1 }
      : p
    ));
    setConfirmDeleteChat(null);
  };

  const handleRenameSubmit = (id: string) => {
    if (renameValue.trim()) setProjects(prev => prev.map(p => p.id === id ? { ...p, name: renameValue.trim() } : p));
    setRenamingId(null);
  };

  const handlePinConversation = (id: string) => {
    setConversations(prev => prev.map(c => c.id === id ? { ...c, pinned: !c.pinned } : c));
  };

  const handleDeleteConversation = (id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
  };

  const handleRenameChatSave = (id: string, value: string) => {
    if (value.trim()) setConversations(prev => prev.map(c => c.id === id ? { ...c, title: value.trim() } : c));
    setRenamingChatId(null);
  };

  const handleRenameProjectChatSave = (projectId: string, chatId: string, value: string) => {
    if (value.trim()) setProjects(prev => prev.map(p => p.id === projectId
      ? { ...p, chats: p.chats.map(c => c.id === chatId ? { ...c, title: value.trim() } : c) }
      : p
    ));
    setRenamingProjectChatKey(null);
  };

  return (
    <>
      <div className="h-full flex flex-col bg-k-nav border-r border-k-border w-64 flex-shrink-0">

        {/* Top: Tab switcher + collapse */}
        <div className="px-3 pt-3 pb-2 border-b border-k-border space-y-2">
          {/* Tab switcher */}
          <div className="flex rounded-lg bg-k-card border border-k-border p-0.5 gap-0.5">
            {(['chats', 'projects'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all duration-200 flex items-center justify-center gap-1 ${
                  tab === t
                    ? 'bg-k-nav text-k-text shadow-sm border border-k-border'
                    : 'text-k-muted hover:text-k-text'
                }`}>
                {t === 'chats' ? '💬 Chats' : '📁 Projects'}
              </button>
            ))}
          </div>

          {/* New chat / New project row */}
          <button
            onClick={() => tab === 'chats' ? onNewChat() : undefined}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-k-muted hover:text-k-cyan hover:bg-k-cyan/5 transition-all duration-150 group"
          >
            <svg viewBox="0 0 10 10" fill="currentColor" className="w-2.5 h-2.5 flex-shrink-0 group-hover:text-k-cyan">
              <path d="M4.25 1.75a.75.75 0 0 1 1.5 0V4.25h2.5a.75.75 0 0 1 0 1.5H5.75v2.5a.75.75 0 0 1-1.5 0V5.75h-2.5a.75.75 0 0 1 0-1.5h2.5V1.75Z"/>
            </svg>
            <span className="text-xs">{tab === 'chats' ? 'New chat' : 'New project'}</span>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">

          {/* ── CHATS TAB ──────────────────────────────────────────────── */}
          {tab === 'chats' && (
            <>
              <div className="px-3 py-2 border-b border-k-border">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-k-card border border-k-border focus-within:border-k-cyan transition-colors">
                  <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 text-k-muted flex-shrink-0">
                    <path d="M10.68 11.74a6 6 0 0 1-7.922-8.982 6 6 0 0 1 8.982 7.922l3.04 3.04a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215ZM11.5 7a4.499 4.499 0 1 0-8.997 0A4.499 4.499 0 0 0 11.5 7Z"/>
                  </svg>
                  <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search chats..."
                    className="flex-1 bg-transparent text-xs text-k-text placeholder-k-muted/60 focus:outline-none" />
                </div>
              </div>

              <div className="py-2">
                {filteredConvs !== null ? (
                  <div>
                    <p className="text-[11px] text-k-muted/60 uppercase tracking-[0.08em] px-5 mb-1.5">Results ({filteredConvs.length})</p>
                    {filteredConvs.length === 0
                      ? <p className="text-xs text-k-muted px-5">No chats found</p>
                      : filteredConvs.map(c => (
                          <ConvRow key={c.id} conv={c} active={activeConvId === c.id} onSelect={() => onSelectConversation(c.id, c.title)}
                            isRenaming={renamingChatId === c.id}
                            onStartRename={() => setRenamingChatId(c.id)}
                            onSaveRename={v => handleRenameChatSave(c.id, v)}
                            onCancelRename={() => setRenamingChatId(null)}
                            onPin={() => handlePinConversation(c.id)}
                            onDelete={() => handleDeleteConversation(c.id)} />
                        ))
                    }
                  </div>
                ) : (
                  <>
                    {pinnedConvs.length > 0 && (
                      <div className="mb-1">
                        <p className="text-[11px] text-k-muted/60 uppercase tracking-[0.08em] px-5 mb-1.5 font-semibold">Pinned</p>
                        {pinnedConvs.map(c => (
                          <ConvRow key={c.id} conv={c} active={activeConvId === c.id} onSelect={() => onSelectConversation(c.id, c.title)} pinned
                            isRenaming={renamingChatId === c.id}
                            onStartRename={() => setRenamingChatId(c.id)}
                            onSaveRename={v => handleRenameChatSave(c.id, v)}
                            onCancelRename={() => setRenamingChatId(null)}
                            onPin={() => handlePinConversation(c.id)}
                            onDelete={() => handleDeleteConversation(c.id)} />
                        ))}
                      </div>
                    )}
                    <div>
                      <p className="text-[11px] text-k-muted/60 uppercase tracking-[0.08em] px-5 mb-1.5 font-semibold">Recent</p>
                      {recentConvs.map(c => (
                        <ConvRow key={c.id} conv={c} active={activeConvId === c.id} onSelect={() => onSelectConversation(c.id, c.title)}
                          isRenaming={renamingChatId === c.id}
                          onStartRename={() => setRenamingChatId(c.id)}
                          onSaveRename={v => handleRenameChatSave(c.id, v)}
                          onCancelRename={() => setRenamingChatId(null)}
                          onPin={() => handlePinConversation(c.id)}
                          onDelete={() => handleDeleteConversation(c.id)} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          {/* ── PROJECTS TAB ───────────────────────────────────────────── */}
          {tab === 'projects' && (
            <div className="pt-3 space-y-3">
              <RoleSwitcher role={demoRole} onChange={setDemoRole} />
              <div className="px-4 space-y-3">
              {/* New Project + Search */}
              {demoRole === 'Admin' && <button className="flex items-center gap-1.5 text-sm text-k-muted hover:text-k-cyan transition-colors">
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                New Project
              </button>}
              <div className="h-px bg-k-border" />
              <input type="text" value={projectSearch} onChange={e => setProjectSearch(e.target.value)}
                placeholder="Search projects..."
                className="w-full bg-k-card border border-k-border rounded-lg px-3 py-2 text-xs text-k-text placeholder-k-muted/60 focus:outline-none focus:border-k-cyan transition-colors" />
              <div className="h-px bg-k-border" />

              {/* Projects list */}
              <p className="text-[11px] text-k-muted/60 uppercase tracking-[0.08em] mb-1 font-semibold">Your Projects</p>
              {filteredProjects.length === 0 && <p className="text-xs text-k-muted">No projects found.</p>}

              {filteredProjects.map(project => (
                <div key={project.id}>
                  <div
                    onClick={() => setActiveProjectId(p => p === project.id ? null : project.id)}
                    className={`group flex items-center gap-2 py-2.5 cursor-pointer transition-colors rounded-lg px-1 ${
                      activeProjectId === project.id ? 'bg-k-card text-k-text' : 'text-k-muted hover:bg-k-card/50 hover:text-k-text'
                    }`}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
                      <rect x="1" y="3" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                      <path d="M1 6h12" stroke="currentColor" strokeWidth="1.2"/>
                      <path d="M4 1l2 2h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>

                    {renamingId === project.id ? (
                      <input autoFocus value={renameValue}
                        onChange={e => setRenameValue(e.target.value)}
                        onBlur={() => handleRenameSubmit(project.id)}
                        onKeyDown={e => { if (e.key === 'Enter') handleRenameSubmit(project.id); if (e.key === 'Escape') setRenamingId(null); }}
                        onClick={e => e.stopPropagation()}
                        className="flex-1 bg-k-card border border-k-cyan rounded px-2 py-0.5 text-sm text-k-text focus:outline-none" />
                    ) : (
                      <span className="flex-1 text-sm truncate">{project.name}</span>
                    )}

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <ThreeDotMenu
                        demoRole={demoRole}
                        onRename={() => { setRenamingId(project.id); setRenameValue(project.name); }}
                        onMembers={() => setMembersProject(project)}
                        onDelete={() => setConfirmDeleteProject(project)}
                      />
                    </div>
                  </div>

                  {/* Project chats */}
                  {activeProjectId === project.id && (
                    <div className="ml-4 border-l border-k-border/50 pl-3 pb-2 space-y-0.5">
                      {[...project.chats].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)).map(chat => {
                        const chatKey = `${project.id}-${chat.id}`;
                        const isRenamingThis = renamingProjectChatKey === chatKey;
                        return (
                          <div key={chat.id} className="group flex items-center gap-1.5 py-1.5 cursor-pointer text-k-muted hover:text-k-text transition-colors rounded-lg px-1">
                            <span className="flex-shrink-0 text-xs">{chat.pinned ? '📌' : '💬'}</span>
                            {isRenamingThis ? (
                              <input
                                autoFocus
                                defaultValue={chat.title}
                                onBlur={e => handleRenameProjectChatSave(project.id, chat.id, e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleRenameProjectChatSave(project.id, chat.id, (e.target as HTMLInputElement).value);
                                  if (e.key === 'Escape') setRenamingProjectChatKey(null);
                                  e.stopPropagation();
                                }}
                                onClick={e => e.stopPropagation()}
                                className="flex-1 bg-k-card border border-k-cyan rounded px-2 py-0.5 text-xs text-k-text focus:outline-none"
                              />
                            ) : (
                              <span className="flex-1 text-xs truncate">{chat.title}</span>
                            )}
                            {!isRenamingThis && (
                              <ProjectChatMenu
                                pinned={!!chat.pinned}
                                isAdmin={demoRole === 'Admin'}
                                onPin={() => handlePinChat(project.id, chat.id)}
                                onRename={() => setRenamingProjectChatKey(chatKey)}
                                onDelete={() => setConfirmDeleteChat({ project, chat })}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom nav */}
        <div className="border-t border-k-border py-2 px-3 space-y-1">
          <UserProfile theme={theme} onToggleTheme={onToggleTheme} />
        </div>
      </div>

      {/* Modals */}
      {membersProject && <MembersPanel project={membersProject} demoRole={demoRole} onClose={() => setMembersProject(null)} />}

      {confirmDeleteProject && (
        <ConfirmModal
          title="Delete project?"
          message={`"${confirmDeleteProject.name}" and all ${confirmDeleteProject.chatCount} chats will be permanently deleted. Members will be notified.`}
          confirmLabel="Delete Project"
          onConfirm={() => handleDeleteProject(confirmDeleteProject.id)}
          onCancel={() => setConfirmDeleteProject(null)}
        />
      )}

      {confirmDeleteChat && (
        <ConfirmModal
          title="Delete chat?"
          message={`"${confirmDeleteChat.chat.title}" will be permanently deleted.`}
          confirmLabel="Delete"
          onConfirm={() => handleDeleteChat(confirmDeleteChat.project.id, confirmDeleteChat.chat.id)}
          onCancel={() => setConfirmDeleteChat(null)}
        />
      )}
    </>
  );
}
