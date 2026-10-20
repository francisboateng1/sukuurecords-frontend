import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import ownerApi from '../services/ownerApi';
import './owner.css';

function formatDate(value) {
    if (!value) return '—';

    const date = new Date(
        value instanceof Date ? value : `${value}`.replace(' ', 'T') + 'Z'
    );

    if (Number.isNaN(date.getTime())) return String(value);

    return date.toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
}

function getStatus(invitation) {
    if (invitation.used_at) return 'used';

    if (new Date(`${invitation.expires_at}`.replace(' ', 'T') + 'Z') <= new Date()) {
        return 'expired';
    }

    return invitation.status || 'unused';
}

export default function OwnerDashboard() {
    const navigate = useNavigate();
    const token = localStorage.getItem('owner_token');

    const [owner, setOwner] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('owner_profile') || '{}');
        } catch {
            return {};
        }
    });

    const [invitations, setInvitations] = useState([]);
    const [schoolName, setSchoolName] = useState('');
    const [hours, setHours] = useState('168');
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [newInvitation, setNewInvitation] = useState(null);
    const [filter, setFilter] = useState('all');

    function logout() {
        localStorage.removeItem('owner_token');
        localStorage.removeItem('owner_profile');
        navigate('/owner/login', { replace: true });
    }

    async function loadInvitations() {
        setError('');

        try {
            const response = await ownerApi.get('/auth/owner/invitations');
            setInvitations(response.data.invitations || []);
        } catch (err) {
            if (err.response?.status === 401 || err.response?.status === 403) {
                logout();
                return;
            }

            setError(
                err.response?.data?.message ||
                'Could not load invitation history.'
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (token) loadInvitations();
    }, [token]);

    if (!token) {
        return <Navigate to="/owner/login" replace />;
    }

    async function createInvitation(event) {
        event.preventDefault();
        setError('');
        setNotice('');
        setNewInvitation(null);
        setCreating(true);

        try {
            const response = await ownerApi.post(
                '/auth/owner/invitations',
                {
                    intended_school_name: schoolName.trim(),
                    expires_in_hours: Number(hours),
                }
            );

            setNewInvitation(response.data.invitation);
            setNotice('Invitation created successfully.');
            setSchoolName('');
            await loadInvitations();
        } catch (err) {
            if (err.response?.status === 401 || err.response?.status === 403) {
                logout();
                return;
            }

            setError(
                err.response?.data?.message ||
                'Could not create the invitation.'
            );
        } finally {
            setCreating(false);
        }
    }

    async function copyCode() {
        if (!newInvitation?.code) return;

        try {
            await navigator.clipboard.writeText(newInvitation.code);
            setNotice('Invitation code copied.');
        } catch {
            setNotice('Copy failed. Select and copy the code manually.');
        }
    }

    const counts = invitations.reduce(
        (result, invitation) => {
            result[getStatus(invitation)]++;
            return result;
        },
        { used: 0, unused: 0, expired: 0 }
    );

    const filteredInvitations = invitations.filter((invitation) => {
        return filter === 'all' || getStatus(invitation) === filter;
    });

    return (
        <main className="owner-dashboard">
            <aside className="owner-sidebar">
                <div className="owner-brand owner-sidebar-brand">
                    <div className="owner-brand-mark">S</div>
                    <span>Sukuu <strong>Records</strong></span>
                </div>

                <div className="owner-nav-heading">WORKSPACE</div>

                <div className="owner-nav-item owner-nav-active">
                    <span aria-hidden="true">▦</span>
                    Overview
                </div>

                <div className="owner-nav-item">
                    <span aria-hidden="true">✉</span>
                    School invitations
                </div>

                <div className="owner-sidebar-bottom">
                    <div className="owner-profile">
                        <div className="owner-avatar">
                            {(owner.full_name || 'O').charAt(0).toUpperCase()}
                        </div>

                        <div className="owner-profile-details">
                            <strong>{owner.full_name || 'System Owner'}</strong>
                            <span>System Owner</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="owner-logout-button"
                        onClick={logout}
                    >
                        ↪ Sign out
                    </button>
                </div>
            </aside>

            <section className="owner-main">
                <header className="owner-topbar">
                    <div>
                        <div className="owner-breadcrumb">
                            Workspace / Overview
                        </div>
                        <h1>System overview</h1>
                    </div>

                    <div className="owner-secure-label">
                        <span className="owner-status-dot" />
                        Secure session
                    </div>
                </header>

                <div className="owner-content">
                    <section className="owner-welcome">
                        <div>
                            <span className="owner-eyebrow">
                                ADMINISTRATION CENTER
                            </span>

                            <h2>
                                Welcome, {(owner.full_name || 'Owner').split(' ')[0]}.
                            </h2>

                            <p>
                                Manage school registration and monitor invitations
                                across Sukuu Records.
                            </p>
                        </div>

                        <div className="owner-welcome-icon" aria-hidden="true">
                            ✦
                        </div>
                    </section>

                    {error && (
                        <div className="owner-error" role="alert">
                            {error}
                        </div>
                    )}

                    {notice && (
                        <div className="owner-success" role="status">
                            {notice}
                        </div>
                    )}

                    <section className="owner-stat-grid">
                        <article className="owner-stat-card">
                            <span className="owner-stat-label">
                                Total invitations
                            </span>
                            <strong>{invitations.length}</strong>
                            <span className="owner-stat-foot">
                                Latest 200 records
                            </span>
                        </article>

                        <article className="owner-stat-card">
                            <span className="owner-stat-label">
                                Unused invitations
                            </span>
                            <strong>{counts.unused}</strong>
                            <span className="owner-stat-foot">
                                Awaiting registration
                            </span>
                        </article>

                        <article className="owner-stat-card">
                            <span className="owner-stat-label">
                                Used invitations
                            </span>
                            <strong>{counts.used}</strong>
                            <span className="owner-stat-foot">
                                Registration completed
                            </span>
                        </article>

                        <article className="owner-stat-card">
                            <span className="owner-stat-label">
                                Expired invitations
                            </span>
                            <strong>{counts.expired}</strong>
                            <span className="owner-stat-foot">
                                Past their expiry date
                            </span>
                        </article>
                    </section>

                    <section className="owner-panel">
                        <div className="owner-panel-heading">
                            <div>
                                <h2>Generate school invitation</h2>
                                <p>
                                    Create a secure, one-time code for a school.
                                </p>
                            </div>

                            <span className="owner-panel-icon" aria-hidden="true">
                                +
                            </span>
                        </div>

                        <form
                            className="owner-invitation-form"
                            onSubmit={createInvitation}
                        >
                            <div className="owner-field">
                                <label htmlFor="school-name">
                                    School name
                                </label>
                                <input
                                    id="school-name"
                                    value={schoolName}
                                    onChange={(event) =>
                                        setSchoolName(event.target.value)
                                    }
                                    maxLength={255}
                                    placeholder="Enter the school's registered name"
                                    required
                                />
                            </div>

                            <div className="owner-field">
                                <label htmlFor="invitation-expiry">
                                    Invitation expires
                                </label>
                                <select
                                    id="invitation-expiry"
                                    value={hours}
                                    onChange={(event) => setHours(event.target.value)}
                                >
                                    <option value="24">24 hours</option>
                                    <option value="72">3 days</option>
                                    <option value="168">7 days</option>
                                    <option value="336">14 days</option>
                                    <option value="720">30 days</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                className="owner-primary-button owner-create-button"
                                disabled={creating}
                            >
                                {creating ? 'Generating...' : '+ Generate invitation'}
                            </button>
                        </form>

                        {newInvitation && (
                            <div className="owner-new-invitation">
                                <div>
                                    <strong>Invitation code created</strong>
                                    <p>
                                        Send this code only to the intended school.
                                        It cannot be retrieved after you leave this page.
                                    </p>
                                </div>

                                <code>{newInvitation.code}</code>

                                <div className="owner-code-details">
                                    <span>
                                        School: {newInvitation.intended_school_name}
                                    </span>
                                    <span>
                                        Expires: {formatDate(newInvitation.expires_at_utc)}
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    className="owner-secondary-button"
                                    onClick={copyCode}
                                >
                                    Copy invitation code
                                </button>
                            </div>
                        )}
                    </section>

                    <section className="owner-panel">
                        <div className="owner-panel-heading owner-history-heading">
                            <div>
                                <h2>Invitation history</h2>
                                <p>
                                    Review registration codes and their current status.
                                </p>
                            </div>

                            <button
                                type="button"
                                className="owner-secondary-button"
                                onClick={() => {
                                    setLoading(true);
                                    loadInvitations();
                                }}
                            >
                                ↻ Refresh
                            </button>
                        </div>

                        <div className="owner-filter-row">
                            <label htmlFor="invitation-filter">Show</label>
                            <select
                                id="invitation-filter"
                                value={filter}
                                onChange={(event) => setFilter(event.target.value)}
                            >
                                <option value="all">All invitations</option>
                                <option value="unused">Unused</option>
                                <option value="used">Used</option>
                                <option value="expired">Expired</option>
                            </select>
                        </div>

                        {loading ? (
                            <div className="owner-empty-state">
                                Loading invitation history...
                            </div>
                        ) : filteredInvitations.length === 0 ? (
                            <div className="owner-empty-state">
                                No invitations found for this filter.
                            </div>
                        ) : (
                            <div className="owner-table-wrap">
                                <table className="owner-table">
                                    <thead>
                                        <tr>
                                            <th>School</th>
                                            <th>Created</th>
                                            <th>Expires</th>
                                            <th>Used at</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {filteredInvitations.map((invitation) => {
                                            const status = getStatus(invitation);

                                            return (
                                                <tr key={invitation.id}>
                                                    <td>
                                                        <strong>
                                                            {invitation.intended_school_name}
                                                        </strong>
                                                    </td>
                                                    <td>{formatDate(invitation.created_at)}</td>
                                                    <td>{formatDate(invitation.expires_at)}</td>
                                                    <td>{formatDate(invitation.used_at)}</td>
                                                    <td>
                                                        <span
                                                            className={`owner-badge owner-badge-${status}`}
                                                        >
                                                            {status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>

                    <footer className="owner-footer">
                        Sukuu Records · System Owner Workspace
                    </footer>
                </div>
            </section>
        </main>
    );
}