import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';
import type { User, Notification } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

const PortalLayout = ({ children, user }: { children: React.ReactNode, user: User }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isSupportOpen, setIsSupportOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const loadNotifs = async () => {
            if (!user) return;
            try {
                const data = await api.getNotifications(user.id);
                setNotifications(data);
            } catch (e) {
                console.error("Failed to load notifications", e);
            }
        };

        loadNotifs();

        // --- REAL-TIME SUBSCRIPTION ---
        const channel = supabase
            .channel('schema-db-changes')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'Notification',
                    filter: `user_id=eq.${user.id}`
                },
                (payload) => {
                    setNotifications(prev => [payload.new as Notification, ...prev].slice(0, 20));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = '/portal/login';
    };

    const markAllAsRead = async () => {
        for (const n of notifications) {
            if (!n.is_read) await api.markNotificationAsRead(n.id);
        }
        const data = await api.getNotifications(user.id);
        setNotifications(data);
    };

    // --- CLICK OUTSIDE TO CLOSE ---
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('.dropdown-trigger')) {
                setIsProfileOpen(false);
                setIsNotificationsOpen(false);
            }
        };
        window.addEventListener('mousedown', handleClickOutside);
        return () => window.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const subNavItems = [
        {
            name: 'Overview',
            path: '/dashboard/overview',
            roles: ['admin', 'employee'],
            group: 'main',
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
        },
        {
            name: 'New Request',
            path: '/dashboard/new-request',
            roles: ['client', 'admin'],
            group: 'main',
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"></path></svg>
        },
        {
            name: 'All Requests',
            path: '/dashboard/requests',
            roles: ['admin', 'employee'],
            group: 'main',
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 17L12 22L22 17M2 12L12 17L22 12M12 2L2 7L12 12L22 7L12 2Z"></path></svg>
        },
        {
            name: 'My Mandates',
            path: '/dashboard/requests',
            roles: ['client'],
            group: 'main',
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 17L12 22L22 17M2 12L12 17L22 12M12 2L2 7L12 12L22 7L12 2Z"></path></svg>
        },
        {
            name: 'Timesheets',
            path: '/dashboard/timesheets',
            roles: ['admin', 'employee'],
            group: 'main',
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
        },
        {
            name: 'Expenses',
            path: '/dashboard/expenses',
            roles: ['admin', 'employee'],
            group: 'main',
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
        },
        {
            name: 'Accounts & Clients',
            path: '/dashboard/crm',
            roles: ['admin', 'employee'],
            group: 'main',
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
        },
        {
            name: 'All History',
            path: '/dashboard/service-hub',
            roles: ['admin'],
            group: 'system',
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
        },
        {
            name: 'User Governance',
            path: '/dashboard/users',
            roles: ['admin'],
            group: 'system',
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path></svg>
        }
    ].filter(item => item.roles.includes(user.role));

    const primaryNavItems = subNavItems.filter(item => item.group === 'main');
    const systemNavItems = subNavItems.filter(item => item.group === 'system');

    const renderNavItem = (item: typeof subNavItems[number]) => (
        <NavLink
            key={item.path + item.name}
            to={item.path}
            onClick={() => setIsMenuOpen(false)}
            end={item.path === '/dashboard/overview'}
            className={({ isActive }) =>
                `portal-tab-item ${isActive ? 'active' : ''}`
            }
        >
            {item.icon}
            <span>{item.name}</span>
        </NavLink>
    );

    useEffect(() => {
        if (isSupportOpen) {
            document.body.classList.add('portal-modal-active');
        } else {
            document.body.classList.remove('portal-modal-active');
        }
        return () => document.body.classList.remove('portal-modal-active');
    }, [isSupportOpen]);

    return (
        <div className="portal-aura-container">
            <div className="portal-aurora-bg" aria-hidden="true">
                <div className="aurora-blob aurora-blob-1"></div>
                <div className="aurora-blob aurora-blob-2"></div>
            </div>

            <header className="portal-header-top">
                <div className="portal-header-inner-wrap" style={{ maxWidth: 1600 }}>
                    <div className="nav__logo">
                        <span className="logo-name">Adveris</span>
                        <span className="logo-tagline">Advisors LLP</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>

                        {/* NOTIFICATIONS */}
                        <div style={{ position: 'relative' }} className="dropdown-trigger">
                            <button
                                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                                style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', position: 'relative', padding: 8 }}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                                </svg>
                                {unreadCount > 0 && (
                                    <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, background: 'var(--saffron)', borderRadius: '50%', border: '2px solid var(--navy)' }} />
                                )}
                            </button>

                            <AnimatePresence>
                                {isNotificationsOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        style={{
                                            position: 'absolute', top: '100%', right: 0, width: 360, background: 'rgba(13, 27, 62, 0.95)',
                                            backdropFilter: 'blur(60px)', WebkitBackdropFilter: 'blur(60px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16,
                                            marginTop: 12, zIndex: 2000, boxShadow: '0 20px 50px rgba(0,0,0,0.5)', overflow: 'hidden'
                                        }}
                                    >
                                        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white', margin: 0 }}>Notifications</h3>
                                            <button onClick={markAllAsRead} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer' }}>Mark All As Read</button>
                                        </div>
                                        <div style={{ maxHeight: 400, overflowY: 'auto', padding: '12px 0' }} className="custom-scrollbar">
                                            {notifications.length > 0 ? (
                                                notifications.map(n => (
                                                    <div key={n.id} style={{ padding: '16px 24px', display: 'flex', gap: 16, background: n.is_read ? 'transparent' : 'rgba(255,153,51,0.03)', transition: 'background 0.3s' }}>
                                                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={n.is_read ? "rgba(255,255,255,0.3)" : "var(--gold)"} strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <p style={{ fontSize: '0.85rem', color: n.is_read ? 'rgba(255,255,255,0.6)' : 'white', margin: '0 0 4px', fontWeight: n.is_read ? 400 : 600 }}>{n.title}</p>
                                                            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', margin: '0 0 8px' }}>{n.message}</p>
                                                            <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)', fontWeight: 700 }}>{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                        {!n.is_read && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--saffron)', marginTop: 8 }} />}
                                                    </div>
                                                ))
                                            ) : (
                                                <div style={{ padding: '60px 40px', textAlign: 'center', opacity: 0.2 }}>
                                                    <p style={{ fontSize: '0.85rem' }}>No New Notifications.</p>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* USER PROFILE DROPDOWN */}
                        <div style={{ position: 'relative' }} className="dropdown-trigger">
                            <div
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '4px 8px', borderRadius: 100, transition: 'background 0.3s' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--navy)', fontWeight: 800, fontSize: '0.7rem' }}>
                                    {user.full_name?.charAt(0).toUpperCase()}
                                </div>
                                <div className="desktop-User-info" style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'white', display: 'flex', alignItems: 'center', gap: 4 }}>
                                        {user.full_name.split(' ')[0]}
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ transform: isProfileOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}><path d="M6 9l6 6 6-6" /></svg>
                                    </span>
                                </div>
                            </div>

                            <AnimatePresence>
                                {isProfileOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        style={{
                                            position: 'absolute', top: '100%', right: 0, width: 240, background: 'rgba(13, 27, 62, 0.95)',
                                            backdropFilter: 'blur(60px)', WebkitBackdropFilter: 'blur(60px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16,
                                            marginTop: 12, zIndex: 2000, boxShadow: '0 20px 50px rgba(0,0,0,0.5)', overflow: 'hidden'
                                        }}
                                    >
                                        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white', margin: '0 0 4px' }}>{user.full_name}</p>
                                            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>{user.email}</p>
                                        </div>
                                        <div style={{ padding: 8 }}>
                                            <button
                                                onClick={() => { setIsProfileOpen(false); navigate('/dashboard/profile'); }}
                                                style={{ width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, background: 'none', border: 'none', borderRadius: 8, color: 'rgba(255,255,255,0.7)', cursor: 'pointer', transition: 'all 0.2s' }}
                                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'white'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /></svg>
                                                <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Edit Profile</span>
                                            </button>
                                            <button
                                                onClick={() => { setIsProfileOpen(false); setIsSupportOpen(true); }}
                                                style={{ width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, background: 'none', border: 'none', borderRadius: 8, color: 'rgba(255,255,255,0.7)', cursor: 'pointer', transition: 'all 0.2s' }}
                                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'white'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
                                                <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Support</span>
                                            </button>
                                            <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '8px 0' }} />
                                            <button
                                                onClick={handleLogout}
                                                style={{ width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, background: 'none', border: 'none', borderRadius: 8, color: '#f87171', cursor: 'pointer', transition: 'all 0.2s' }}
                                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                                                <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Sign Out</span>
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="portal-mobile-menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                        </div>
                    </div>
                </div>
            </header>

            {/* SUPPORT MODAL (Full-Screen Immersive Style) */}
            <AnimatePresence>
                {isSupportOpen && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="portal-modal-overlay"
                        onClick={() => setIsSupportOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="portal-modal-card"
                            onClick={e => e.stopPropagation()}
                            style={{ maxWidth: 600, padding: '60px 80px', textAlign: 'center' }}
                        >
                            <div style={{
                                width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,153,51,0.1)',
                                color: 'var(--saffron)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 40px'
                            }}>
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                            </div>

                            <h2 className="serif-title" style={{ fontSize: '3rem', marginBottom: 16 }}>Adveris Advisors Support</h2>
                            <p style={{ color: 'rgba(255,255,255,0.4)', lineHeight: 1.8, fontSize: '1rem', marginBottom: 48, maxWidth: 400, margin: '0 auto 48px' }}>
                                Our Institutional Support Team Is Available For Strategic Assistance And Technical Guidance.
                            </p>

                            <div style={{ display: 'grid', gap: 24, textAlign: 'left' }}>
                                <div style={{ padding: '24px 32px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16 }}>
                                    <p style={{ fontSize: '0.7rem', letterSpacing: '0.05em', fontWeight: 600, opacity: 0.3, textTransform: 'uppercase', marginBottom: 10 }}>General Inquiries</p>
                                    <p style={{ fontSize: '1.2rem', color: 'white', fontWeight: 500, margin: 0 }}>admin@adverisadvisors.in</p>
                                </div>
                                <div style={{ padding: '24px 32px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16 }}>
                                    <p style={{ fontSize: '0.7rem', letterSpacing: '0.05em', fontWeight: 600, opacity: 0.3, textTransform: 'uppercase', marginBottom: 10 }}>Institutional Hotline</p>
                                    <p style={{ fontSize: '1.2rem', color: 'white', fontWeight: 500, margin: 0 }}>+91 97393 82704</p>
                                </div>
                            </div>

                            <button
                                onClick={() => setIsSupportOpen(false)}
                                className="btn-portal-primary"
                                style={{ width: '100%', marginTop: 56, padding: '20px 0', fontSize: '0.9rem' }}
                            >
                                Close Support
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="portal-shell">
                <aside className={`portal-nav-row ${isMenuOpen ? 'open' : ''}`}>
                    <div className="portal-nav-shell">
                        <div className="portal-nav-section">
                            <p className="portal-nav-section-label">Workspace</p>
                            <div className="portal-tab-group">
                                {primaryNavItems.map(renderNavItem)}
                            </div>
                        </div>

                        {systemNavItems.length > 0 && (
                            <div className="portal-nav-section">
                                <p className="portal-nav-section-label">System Overview</p>
                                <div className="portal-tab-group">
                                    {systemNavItems.map(renderNavItem)}
                                </div>
                            </div>
                        )}
                    </div>
                </aside>

                <main className="portal-main-stage">
                    <div className="portal-content-frame">
                        {children}
                    </div>
                </main>
            </div>

            <footer style={{ marginTop: 'auto', paddingBottom: 40, borderTop: '1px solid rgba(255,255,255,0.03)', position: 'relative', zIndex: 10 }}>
                <div style={{ width: '100%', maxWidth: 1600, margin: '0 auto', padding: '40px 40px 0' }}>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 24 }}>
                        <div>
                            <div className="nav__logo" style={{ marginBottom: 16 }}>
                                <span className="logo-name" style={{ fontSize: '3rem' }}>Adveris</span>
                                <span className="logo-tagline" style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.45em', marginTop: '-4px' }}>Advisors LLP</span>
                            </div>
                            <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.2)', fontWeight: 200, letterSpacing: '0.02em' }}>
                                Professional Advisory For The Indian Market. Strategic Compliance, Regulatory Governance, And Corporate Excellence.
                            </p>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.1)', fontWeight: 500, marginBottom: 8 }}>
                                © 2026 Adveris Advisors Portal
                            </div>
                            <div style={{ display: 'flex', gap: 24, justifyContent: 'flex-end', opacity: 0.15 }}>
                                <span style={{ fontSize: '0.65rem', color: 'var(--gold)', fontWeight: 600 }}>Bengaluru Headquarters</span>
                            </div>
                        </div>
                    </div>

                </div>
            </footer>
        </div>
    );
};

export default PortalLayout;
