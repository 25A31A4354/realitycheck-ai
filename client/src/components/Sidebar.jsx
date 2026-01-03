import React, { useMemo } from 'react';
import { Plus, Search, ShieldCheck, Clock, MoreHorizontal, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

const Sidebar = ({ sessions, currentSessionId, onSelectSession, onNewSession, onDeleteSession }) => {

    // Group sessions by date buckets
    const groupedSessions = useMemo(() => {
        const groups = { today: [], last7Days: [], older: [] };
        const now = new Date();
        const oneDay = 24 * 60 * 60 * 1000;

        sessions.forEach(session => {
            const date = new Date(parseInt(session.id));
            const diffDays = (now - date) / oneDay;

            if (diffDays < 1 && now.getDate() === date.getDate()) {
                groups.today.push(session);
            } else if (diffDays <= 7) {
                groups.last7Days.push(session);
            } else {
                groups.older.push(session);
            }
        });
        return groups;
    }, [sessions]);

    const SessionItem = ({ session, isActive }) => {
        const [isHovered, setIsHovered] = React.useState(false);

        return (
            <motion.div
                layout
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => onSelectSession(session.id)}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    fontSize: '13px',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    backgroundColor: isActive ? 'var(--bg-surface-3)' : (isHovered ? 'var(--bg-surface-2)' : 'transparent'),
                    fontWeight: isActive ? 500 : 400,
                    display: 'flex', alignItems: 'center', gap: '10px',
                    marginBottom: '2px',
                    position: 'relative'
                }}
            >
                <span style={{
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1
                }}>
                    {session.title || "Untitled Analysis"}
                </span>

                {isHovered && (
                    <div
                        onClick={(e) => onDeleteSession(e, session.id)}
                        style={{
                            padding: '4px',
                            borderRadius: '4px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--text-tertiary)',
                            cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'} // Red on hover
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-tertiary)'}
                    >
                        <Trash2 size={14} />
                    </div>
                )}
            </motion.div>
        );
    };

    return (
        <aside className="sidebar-shell">
            {/* Brand Header */}
            <div style={{ padding: '0 8px 24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                    width: '32px', height: '32px',
                    background: 'linear-gradient(135deg, #18181b 0%, #27272a 100%)',
                    borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: 'var(--shadow-sm)'
                }}>
                    <ShieldCheck size={18} color="white" />
                </div>
                <span style={{ fontWeight: 600, fontSize: '15px' }}>RealityCheck</span>
            </div>

            {/* Main Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '32px' }}>
                <button
                    onClick={onNewSession}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '10px 12px',
                        background: 'var(--bg-surface-1)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        boxShadow: 'var(--shadow-xs)',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-default)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                >
                    <Plus size={16} color="var(--text-secondary)" />
                    New Analysis
                </button>

                <div style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '8px 12px',
                    background: 'transparent',
                    border: '1px solid transparent', // Invisible border to match height
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-tertiary)',
                    fontSize: '14px',
                    cursor: 'pointer'
                }}>
                    <Search size={16} />
                    <span>Search...</span>
                </div>
            </div>

            {/* History List */}
            <div style={{ flex: 1, overflowY: 'auto' }}>

                {/* Today */}
                {groupedSessions.today.length > 0 && (
                    <div style={{ marginBottom: '24px' }}>
                        <div className="text-overline" style={{ paddingLeft: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            Today
                        </div>
                        <div>
                            {groupedSessions.today.map(s => <SessionItem key={s.id} session={s} isActive={s.id === currentSessionId} />)}
                        </div>
                    </div>
                )}

                {/* Last 7 Days */}
                {groupedSessions.last7Days.length > 0 && (
                    <div style={{ marginBottom: '24px' }}>
                        <div className="text-overline" style={{ paddingLeft: '12px' }}>Previous 7 Days</div>
                        <div>
                            {groupedSessions.last7Days.map(s => <SessionItem key={s.id} session={s} isActive={s.id === currentSessionId} />)}
                        </div>
                    </div>
                )}

                {/* Older */}
                {groupedSessions.older.length > 0 && (
                    <div style={{ marginBottom: '24px' }}>
                        <div className="text-overline" style={{ paddingLeft: '12px' }}>Older</div>
                        <div>
                            {groupedSessions.older.map(s => <SessionItem key={s.id} session={s} isActive={s.id === currentSessionId} />)}
                        </div>
                    </div>
                )}

                {sessions.length === 0 && (
                    <div style={{ padding: '0 12px', fontSize: '13px', color: 'var(--text-tertiary)' }}>
                        No analysis history found. Start a new check naturally.
                    </div>
                )}

            </div>


        </aside>
    );
};

export default Sidebar;
