import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';

const Billing = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [subscription, setSubscription] = useState(null);
    const [payments, setPayments] = useState([]);

    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const token = localStorage.getItem('sms_token');

    useEffect(() => {
        if (!token) {
            navigate('/');
            return;
        }

        const reference = searchParams.get('reference');

        if (reference) {
            verifyPayment(reference);
        } else {
            loadBillingData();
        }
    }, []);

    // =========================================================
    // LOAD BILLING DATA
    // =========================================================

    const loadBillingData = async () => {
        try {
            setLoading(true);
            setError('');

            const [subscriptionResponse, historyResponse] = await Promise.all([
                api.get('/payments/subscription', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }),

                api.get('/payments/history', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                })
            ]);

            setSubscription(subscriptionResponse.data.subscription);
            setPayments(historyResponse.data.payments || []);

        } catch (err) {
            console.error('Billing load error:', err);

            if (err.response?.status === 401 || err.response?.status === 403) {
                localStorage.removeItem('sms_token');
                navigate('/');
                return;
            }

            setError(
                err.response?.data?.message ||
                'Unable to load billing information.'
            );
        } finally {
            setLoading(false);
        }
    };

    // =========================================================
    // VERIFY PAYSTACK PAYMENT
    // =========================================================

   const verifyPayment = async (reference) => {
    try {
        setVerifying(true);
        setLoading(true);
        setError('');
        setSuccessMessage('');

        const response = await api.get(
            `/payments/verify/${encodeURIComponent(reference)}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = response.data;

        if (data.success && data.paid) {
            setSuccessMessage(
                'Payment successful. Your subscription has been activated for 30 days.'
            );

            setSearchParams({});

            await loadBillingData();

            // Give the user a moment to see the success message,
            // then return to the dashboard.
            setTimeout(() => {
                navigate('/dashboard');
            }, 1500);

            return;
        }

        setError(
            data.message ||
            'Payment could not be verified.'
        );

        setSearchParams({});

    } catch (err) {
        console.error('Payment verification error:', err);

        if (err.response?.status === 401 || err.response?.status === 403) {
            localStorage.removeItem('sms_token');
            navigate('/');
            return;
        }

        setError(
            err.response?.data?.message ||
            'Unable to verify your payment.'
        );

        setSearchParams({});

    } finally {
        setVerifying(false);
        setLoading(false);
    }
};

    // =========================================================
    // INITIALIZE PAYMENT
    // =========================================================

    const handlePayment = async () => {
        try {
            setPaying(true);
            setError('');
            setSuccessMessage('');

            const response = await api.post(
                '/payments/initialize',
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = response.data;

            if (!data.success || !data.authorization_url) {
                throw new Error(
                    data.message || 'Unable to initialize payment.'
                );
            }

            /*
             * Redirect the administrator to Paystack checkout.
             */
            window.location.href = data.authorization_url;

        } catch (err) {
            console.error('Payment initialization error:', err);

            setError(
                err.response?.data?.message ||
                err.message ||
                'Unable to start payment.'
            );

            setPaying(false);
        }
    };

    // =========================================================
    // FORMATTERS
    // =========================================================

    const formatDate = (date) => {
        if (!date) return 'Not available';

        return new Date(date).toLocaleDateString('en-GH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatAmount = (amount, currency = 'GHS') => {
        const value = Number(amount || 0) / 100;

        return new Intl.NumberFormat('en-GH', {
            style: 'currency',
            currency
        }).format(value);
    };

    // =========================================================
    // LOADING SCREEN
    // =========================================================

    if (loading) {
        return (
            <div style={styles.page}>
                <div style={styles.loading}>
                    {verifying
                        ? 'Verifying your payment...'
                        : 'Loading billing information...'}
                </div>
            </div>
        );
    }

    // =========================================================
    // PAGE
    // =========================================================

    return (
        <div style={styles.page}>

            <div style={styles.container}>

                {/* Header */}
                <div style={styles.header}>
                    <div>
                        <h1 style={styles.title}>
                            Subscription & Billing
                        </h1>

                        <p style={styles.subtitle}>
                            Manage your school's SMS subscription.
                        </p>
                    </div>

                    <button
                        style={styles.backButton}
                        onClick={() => navigate('/dashboard')}
                    >
                        Back to Dashboard
                    </button>
                </div>

                {/* Success Message */}
                {successMessage && (
                    <div style={styles.successMessage}>
                        {successMessage}
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div style={styles.error}>
                        {error}
                    </div>
                )}

                {/* Subscription Card */}
                {subscription && (
                    <div style={styles.card}>

                        <div style={styles.cardHeader}>

                            <div>
                                <h2 style={styles.schoolName}>
                                    {subscription.school_name}
                                </h2>

                                <p style={styles.plan}>
                                    Monthly Subscription
                                </p>
                            </div>

                            <span
                                style={{
                                    ...styles.status,
                                    ...(subscription.status === 'active'
                                        ? styles.statusActive
                                        : subscription.status === 'trial'
                                            ? styles.statusTrial
                                            : styles.statusExpired)
                                }}
                            >
                                {subscription.status?.toUpperCase()}
                            </span>

                        </div>

                        <div style={styles.detailsGrid}>

                            <div style={styles.detail}>
                                <span style={styles.label}>
                                    Monthly price
                                </span>

                                <strong style={styles.value}>
                                    GH₵100
                                </strong>
                            </div>

                            <div style={styles.detail}>
                                <span style={styles.label}>
                                    Plan
                                </span>

                                <strong style={styles.value}>
                                    {subscription.plan || 'Monthly'}
                                </strong>
                            </div>

                            <div style={styles.detail}>
                                <span style={styles.label}>
                                    Subscription started
                                </span>

                                <strong style={styles.value}>
                                    {formatDate(subscription.start_date)}
                                </strong>
                            </div>

                            <div style={styles.detail}>
                                <span style={styles.label}>
                                    Subscription expires
                                </span>

                                <strong style={styles.value}>
                                    {formatDate(subscription.end_date)}
                                </strong>
                            </div>

                        </div>

                        <div style={styles.paymentSection}>

                            <div>
                                <h3 style={styles.paymentTitle}>
                                    {subscription.status === 'active'
                                        ? 'Renew your subscription'
                                        : 'Activate your subscription'}
                                </h3>

                                <p style={styles.paymentText}>
                                    Pay GH₵100 to get another month of access
                                    to the school management system.
                                </p>
                            </div>

                            <button
                                style={{
                                    ...styles.payButton,
                                    ...(paying
                                        ? styles.payButtonDisabled
                                        : {})
                                }}
                                onClick={handlePayment}
                                disabled={paying}
                            >
                                {paying
                                    ? 'Connecting to Paystack...'
                                    : 'Pay GH₵100'}
                            </button>

                        </div>

                    </div>
                )}

                {/* Payment History */}
                <div style={styles.card}>

                    <h2 style={styles.sectionTitle}>
                        Payment History
                    </h2>

                    {payments.length === 0 ? (

                        <div style={styles.empty}>
                            No payment history yet.
                        </div>

                    ) : (

                        <div style={styles.tableWrapper}>

                            <table style={styles.table}>

                                <thead>
                                    <tr>
                                        <th style={styles.th}>Date</th>
                                        <th style={styles.th}>Reference</th>
                                        <th style={styles.th}>Amount</th>
                                        <th style={styles.th}>Type</th>
                                        <th style={styles.th}>Status</th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {payments.map((payment) => (

                                        <tr key={payment.id}>

                                            <td style={styles.td}>
                                                {formatDate(payment.created_at)}
                                            </td>

                                            <td style={styles.td}>
                                                {payment.reference}
                                            </td>

                                            <td style={styles.td}>
                                                {formatAmount(
                                                    payment.amount,
                                                    payment.currency
                                                )}
                                            </td>

                                            <td style={styles.td}>
                                                {payment.payment_type}
                                            </td>

                                            <td style={styles.td}>
                                                <span
                                                    style={{
                                                        ...styles.paymentStatus,
                                                        ...(payment.status === 'success'
                                                            ? styles.success
                                                            : payment.status === 'pending'
                                                                ? styles.pending
                                                                : styles.failed)
                                                    }}
                                                >
                                                    {payment.status}
                                                </span>
                                            </td>

                                        </tr>

                                    ))}

                                </tbody>

                            </table>

                        </div>

                    )}

                </div>

            </div>

        </div>
    );
};

const styles = {

    page: {
        minHeight: '100vh',
        background: '#f5f7fb',
        padding: '30px 20px'
    },

    container: {
        maxWidth: '1100px',
        margin: '0 auto'
    },

    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '20px',
        marginBottom: '25px',
        flexWrap: 'wrap'
    },

    title: {
        margin: 0,
        fontSize: '30px',
        color: '#1f2937'
    },

    subtitle: {
        marginTop: '7px',
        color: '#6b7280'
    },

    backButton: {
        padding: '10px 16px',
        border: '1px solid #d1d5db',
        borderRadius: '8px',
        background: '#fff',
        cursor: 'pointer'
    },

    card: {
        background: '#fff',
        borderRadius: '14px',
        padding: '25px',
        marginBottom: '25px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
    },

    cardHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '20px',
        marginBottom: '25px'
    },

    schoolName: {
        margin: 0,
        color: '#111827'
    },

    plan: {
        margin: '6px 0 0',
        color: '#6b7280'
    },

    status: {
        padding: '7px 13px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '700'
    },

    statusActive: {
        background: '#dcfce7',
        color: '#166534'
    },

    statusTrial: {
        background: '#dbeafe',
        color: '#1d4ed8'
    },

    statusExpired: {
        background: '#fee2e2',
        color: '#991b1b'
    },

    detailsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '25px'
    },

    detail: {
        padding: '15px',
        background: '#f9fafb',
        borderRadius: '10px'
    },

    label: {
        display: 'block',
        fontSize: '13px',
        color: '#6b7280',
        marginBottom: '6px'
    },

    value: {
        color: '#111827'
    },

    paymentSection: {
        borderTop: '1px solid #e5e7eb',
        paddingTop: '22px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '20px',
        flexWrap: 'wrap'
    },

    paymentTitle: {
        margin: 0,
        color: '#111827'
    },

    paymentText: {
        margin: '7px 0 0',
        color: '#6b7280'
    },

    payButton: {
        padding: '13px 25px',
        border: 'none',
        borderRadius: '8px',
        background: '#0f766e',
        color: '#fff',
        fontSize: '15px',
        fontWeight: '700',
        cursor: 'pointer'
    },

    payButtonDisabled: {
        opacity: 0.6,
        cursor: 'not-allowed'
    },

    sectionTitle: {
        marginTop: 0,
        color: '#111827'
    },

    tableWrapper: {
        overflowX: 'auto'
    },

    table: {
        width: '100%',
        borderCollapse: 'collapse'
    },

    th: {
        textAlign: 'left',
        padding: '12px',
        borderBottom: '1px solid #e5e7eb',
        color: '#6b7280',
        fontSize: '13px'
    },

    td: {
        padding: '13px 12px',
        borderBottom: '1px solid #f3f4f6',
        color: '#374151',
        fontSize: '14px'
    },

    paymentStatus: {
        padding: '5px 9px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600'
    },

    success: {
        background: '#dcfce7',
        color: '#166534'
    },

    pending: {
        background: '#fef3c7',
        color: '#92400e'
    },

    failed: {
        background: '#fee2e2',
        color: '#991b1b'
    },

    successMessage: {
        background: '#dcfce7',
        color: '#166534',
        padding: '12px 15px',
        borderRadius: '8px',
        marginBottom: '20px'
    },

    error: {
        background: '#fee2e2',
        color: '#991b1b',
        padding: '12px 15px',
        borderRadius: '8px',
        marginBottom: '20px'
    },

    empty: {
        padding: '30px',
        textAlign: 'center',
        color: '#6b7280'
    },

    loading: {
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#6b7280'
    }
};

export default Billing;