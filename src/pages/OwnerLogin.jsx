import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ownerApi from '../services/ownerApi';
import './owner.css';

export default function OwnerLogin() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        email: '',
        password: '',
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    function handleChange(event) {
        setForm({
            ...form,
            [event.target.name]: event.target.value,
        });
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await ownerApi.post(
                '/auth/owner/login',
                {
                    email: form.email.trim(),
                    password: form.password,
                }
            );

            localStorage.setItem(
                'owner_token',
                response.data.token
            );

            localStorage.setItem(
                'owner_profile',
                JSON.stringify(response.data.owner)
            );

            navigate('/owner/dashboard', { replace: true });
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Unable to sign in. Check your connection and try again.'
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="owner-login-page">
            <section className="owner-login-visual">
                <div className="owner-brand">
                    <div className="owner-brand-mark">S</div>
                    <span>Sukuu <strong>Records</strong></span>
                </div>

                <div className="owner-visual-content">
                    <span className="owner-eyebrow">
                        PLATFORM ADMINISTRATION
                    </span>

                    <h1>
                        One platform.
                        <br />
                        Every school.
                    </h1>

                    <p>
                        Manage school onboarding and registration
                        invitations from one secure workspace.
                    </p>

                    <div className="owner-visual-note">
                        <span className="owner-status-dot" />
                        System administration portal
                    </div>
                </div>

                <div className="owner-visual-footer">
                    SUKUU RECORDS · SYSTEM MANAGEMENT
                </div>
            </section>

            <section className="owner-login-panel">
                <div className="owner-login-card">
                    <div className="owner-mobile-brand">
                        <div className="owner-brand-mark">S</div>
                        <span>Sukuu <strong>Records</strong></span>
                    </div>

                    <span className="owner-eyebrow">
                        SYSTEM OWNER
                    </span>

                    <h2>Welcome back</h2>

                    <p className="owner-login-description">
                        Sign in to manage your platform.
                    </p>

                    {error && (
                        <div className="owner-error" role="alert">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <label htmlFor="owner-email">
                            Email address
                        </label>

                        <input
                            id="owner-email"
                            name="email"
                            type="email"
                            autoComplete="username"
                            placeholder="owner@example.com"
                            value={form.email}
                            onChange={handleChange}
                            required
                        />

                        <label htmlFor="owner-password">
                            Password
                        </label>

                        <div className="owner-password-wrap">
                            <input
                                id="owner-password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="current-password"
                                placeholder="Enter your password"
                                value={form.password}
                                onChange={handleChange}
                                required
                            />

                            <button
                                type="button"
                                className="owner-show-password"
                                onClick={() =>
                                    setShowPassword(!showPassword)
                                }
                            >
                                {showPassword ? 'Hide' : 'Show'}
                            </button>
                        </div>

                        <button
                            type="submit"
                            className="owner-primary-button"
                            disabled={loading}
                        >
                            {loading ? 'Signing in...' : 'Sign in securely'}
                            {!loading && <span aria-hidden="true"> →</span>}
                        </button>
                    </form>

                    <div className="owner-security-note">
                        <span aria-hidden="true">🔒</span>
                        Restricted access for authorised system owners.
                    </div>

                    <Link to="/" className="owner-back-link">
                        ← Back to school login
                    </Link>
                </div>
            </section>
        </main>
    );
}