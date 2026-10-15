import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

import './Login.css';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        if (!email.trim() || !password) {
            setError('Please enter your email and password.');
            return;
        }

        if (isLoading) return;

        setIsLoading(true);

        try {
            const response = await api.post('/auth/login', {
                email: email.trim(),
                password,
            });

            const token = response.data.token;

            if (!token) {
                throw new Error(
                    'The server did not return an authentication token.'
                );
            }

            const decodedToken = jwtDecode(token);

            if (
                decodedToken.exp &&
                decodedToken.exp * 1000 <= Date.now()
            ) {
                throw new Error(
                    'Your session has expired. Please sign in again.'
                );
            }

            // Only permit the roles supported by this application.
            if (decodedToken.role === 'teacher') {
                localStorage.setItem('sms_token', token);

                navigate('/teacher-dashboard', {
                    replace: true,
                });
            } else if (decodedToken.role === 'admin') {
                localStorage.setItem('sms_token', token);

                navigate('/dashboard', {
                    replace: true,
                });
            } else {
                throw new Error(
                    'Your account does not have an authorized role.'
                );
            }
        } catch (err) {
            console.error('Login error:', err);

            setError(
                err.response?.data?.message ||
                err.message ||
                'Login failed. Please check your credentials and try again.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="sms-login-page">

            {/* Full-screen school video */}
            <div
                className="sms-video-background"
                aria-hidden="true"
            >
                <video
                    className="sms-background-video"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    poster="/school-background-poster.jpg"
                >
                    <source
                        src="/school-background.mp4"
                        type="video/mp4"
                    />
                </video>
            </div>

            {/* Dark overlay keeps the form readable */}
            <div
                className="sms-video-overlay"
                aria-hidden="true"
            />

            {/* Decorative background details */}
            <div
                className="sms-background-grid"
                aria-hidden="true"
            />

            <div
                className="sms-background-orb sms-orb-one"
                aria-hidden="true"
            />

            <div
                className="sms-background-orb sms-orb-two"
                aria-hidden="true"
            />

            {/* Main login card */}
            <section className="sms-login-card">

                {/* Original logo structure, modernized */}
               {/* Modern rotating school logo */}
<div className="sms-logo-area">

    <div className="sms-logo-ring">

        <img
            src="/logo-placeholder.png"
            alt="School logo"
            className="sms-spinning-logo"
            onError={(e) => {
                console.error(
                    'School logo failed to load:',
                    e.currentTarget.src
                );

                e.currentTarget.style.visibility = 'hidden';
            }}
        />

    </div>

    <span className="sms-brand-badge">
        SCHOOL MANAGEMENT SYSTEM
    </span>

</div>

                {/* Heading */}
                <div className="sms-login-heading">
                    <h1>
                        Welcome back<span>.</span>
                    </h1>

                    <p>
                        Sign in to access your school dashboard.
                    </p>
                </div>

                {/* Error message */}
                {error && (
                    <div
                        className="sms-login-error"
                        role="alert"
                        aria-live="polite"
                    >
                        <span
                            className="sms-error-symbol"
                            aria-hidden="true"
                        >
                            !
                        </span>

                        <span className="sms-error-message">
                            {error}
                        </span>

                        <button
                            type="button"
                            onClick={() => setError('')}
                            aria-label="Dismiss error"
                        >
                            &times;
                        </button>
                    </div>
                )}

                {/* Login form */}
                <form
                    className="sms-login-form"
                    onSubmit={handleLogin}
                >

                    {/* Email */}
                    <div className="sms-input-group">
                        <label htmlFor="login-email">
                            Email address
                        </label>

                        <div className="sms-input-box">

                            <svg
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                                className="sms-input-icon"
                            >
                                <rect
                                    x="3"
                                    y="5"
                                    width="18"
                                    height="14"
                                    rx="3"
                                />
                                <path d="m4 7 8 6 8-6" />
                            </svg>

                            <input
                                id="login-email"
                                name="email"
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="username"
                                autoCapitalize="none"
                                spellCheck="false"
                                required
                                disabled={isLoading}
                            />

                        </div>
                    </div>

                    {/* Password */}
                    <div className="sms-input-group">
                        <label htmlFor="login-password">
                            Password
                        </label>

                        <div className="sms-input-box">

                            <svg
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                                className="sms-input-icon"
                            >
                                <rect
                                    x="4"
                                    y="10"
                                    width="16"
                                    height="11"
                                    rx="2"
                                />
                                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                            </svg>

                            <input
                                id="login-password"
                                name="password"
                                type={
                                    showPassword ? 'text' : 'password'
                                }
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                                required
                                disabled={isLoading}
                            />

                            <button
                                type="button"
                                className="sms-password-toggle"
                                onClick={() =>
                                    setShowPassword((previous) => !previous)
                                }
                                aria-label={
                                    showPassword
                                        ? 'Hide password'
                                        : 'Show password'
                                }
                                aria-pressed={showPassword}
                                disabled={isLoading}
                            >
                                {showPassword ? (
                                    <svg
                                        viewBox="0 0 24 24"
                                        aria-hidden="true"
                                    >
                                        <path d="M3 3l18 18" />
                                        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                                        <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5 0 8.5 4.5 9.5 7a13 13 0 0 1-3 4" />
                                        <path d="M6.2 6.2C4 7.7 2.8 9.8 2.5 12c1 2.5 4.5 7 9.5 7 1.2 0 2.3-.2 3.3-.7" />
                                    </svg>
                                ) : (
                                    <svg
                                        viewBox="0 0 24 24"
                                        aria-hidden="true"
                                    >
                                        <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                )}
                            </button>

                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        className="sms-login-button"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <span
                                    className="sms-button-spinner"
                                    aria-hidden="true"
                                />
                                Signing in...
                            </>
                        ) : (
                            <>
                                Sign in to your account

                                <svg
                                    viewBox="0 0 24 24"
                                    aria-hidden="true"
                                >
                                    <path d="M5 12h14M13 6l6 6-6 6" />
                                </svg>
                            </>
                        )}
                    </button>

                </form>

                {/* Registration */}
                <div className="sms-login-footer">
                    <p>
                        New administrator?{' '}
                        <Link to="/register">
                            Create an account
                        </Link>
                    </p>

                    <span>
                        Secure access for authorized school users.
                    </span>
                </div>

            </section>

            <footer className="sms-page-footer">
                &copy; {new Date().getFullYear()} School Management System
            </footer>

        </main>
    );
}