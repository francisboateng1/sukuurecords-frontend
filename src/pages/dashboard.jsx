import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import {
    Bar,
    Pie
} from 'react-chartjs-2';

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);


const SERVER_URL = (
    import.meta.env.VITE_API_URL || 'http://localhost:5000'
).replace(/\/+$/, '');






export default function Dashboard() {
    const navigate = useNavigate();

    const [stats, setStats] = useState(null);

  const [branding, setBranding] = useState({
    school_name: 'School Management System',
    motto: '',
    logo_url: '',
    assigned_teacher_count: 0,
    current_term: '',
    academic_year: '',
    term_status: 'active'
});

    const [brandingLoading, setBrandingLoading] = useState(true);

    // =====================================================
    // CHECK AUTHENTICATION
    // =====================================================

    useEffect(() => {
        const token = localStorage.getItem('sms_token');

        if (!token) {
            navigate('/');
        }
    }, [navigate]);


    // =====================================================
    // FETCH DASHBOARD STATISTICS
    // =====================================================

    useEffect(() => {
        const loadStats = async () => {
            try {
                const response = await api.get(
                    '/students/stats/summary'
                );

                setStats(response.data);

            } catch (error) {
                console.error(
                    'Stats fetch error:',
                    error
                );
            }
        };

        loadStats();
    }, []);


    // =====================================================
    // FETCH SCHOOL BRANDING
    // =====================================================

    useEffect(() => {
        const loadBranding = async () => {
            try {
                const response = await api.get(
                    '/settings/branding'
                );

               setBranding({
    school_name:
        response.data.school_name ||
        'School Management System',

    motto:
        response.data.motto || '',

    logo_url:
        response.data.logo_url || '',

    assigned_teacher_count:
        Number(
            response.data.assigned_teacher_count || 0
        ),

    current_term:
        response.data.current_term || '',

    academic_year:
        response.data.academic_year || '',

    term_status:
        response.data.term_status || 'active'
});
            } catch (error) {

                console.error(
                    'Branding fetch error:',
                    error
                );

            } finally {
                setBrandingLoading(false);
            }
        };

        loadBranding();
    }, []);


    // =====================================================
    // LOGOUT
    // =====================================================

    const handleLogout = () => {
        localStorage.removeItem('sms_token');
        navigate('/');
    };


    // =====================================================
    // LOGO URL
    // =====================================================

    const getLogoUrl = () => {
        if (!branding.logo_url) {
            return '/logo-placeholder.png';
        }

        if (branding.logo_url.startsWith('http')) {
            return branding.logo_url;
        }

       return `${SERVER_URL}${branding.logo_url}`;
    };


    // =====================================================
    // LOADING
    // =====================================================

    if (!stats) {
        return (
            <div style={styles.loadingPage}>
                <div style={styles.loadingCard}>
                    <div style={styles.loadingSpinner}></div>

                    <h3 style={{ marginBottom: '6px' }}>
                        Loading Dashboard
                    </h3>

                    <p style={{ margin: 0, color: '#64748b' }}>
                        Preparing your school overview...
                    </p>
                </div>
            </div>
        );
    }


    // =====================================================
    // CHART DATA
    // =====================================================

    const classData = {
        labels:
            stats.classDistribution?.map(
                c => c.current_class
            ) || [],

        datasets: [
            {
                label: 'Students',

                data:
                    stats.classDistribution?.map(
                        c => c.count
                    ) || [],

                backgroundColor: '#2563eb',

                borderRadius: 6,

                barThickness: 28
            }
        ]
    };


    const genderData = {
        labels:
            stats.genderDistribution?.map(
                g => g.gender || 'Unknown'
            ) || [],

        datasets: [
            {
                data:
                    stats.genderDistribution?.map(
                        g => g.count
                    ) || [],

                backgroundColor: [
                    '#2563eb',
                    '#ec4899',
                    '#f59e0b'
                ],

                borderWidth: 0
            }
        ]
    };


    const chartOptions = {
        responsive: true,

        maintainAspectRatio: false,

        plugins: {
            legend: {
                position: 'bottom'
            }
        }
    };


    // =====================================================
    // DASHBOARD
    // =====================================================

    return (
        <div style={styles.page}>

            {/* =================================================
                SIDEBAR
            ================================================= */}

            <aside style={styles.sidebar}>

                <div>

                    {/* Brand */}
                    <div style={styles.sidebarBrand}>

                        <div style={styles.sidebarLogo}>
                            {branding.logo_url ? (
                                <img
                                    src={getLogoUrl()}
                                    alt="School logo"
                                    style={styles.sidebarLogoImage}
                                    onError={(e) => {
                                        e.currentTarget.style.display =
                                            'none';
                                    }}
                                />
                            ) : (
                                'SMS'
                            )}
                        </div>

                        <div style={{ minWidth: 0 }}>
                            <div style={styles.sidebarBrandName}>
                                {branding.school_name}
                            </div>

                            <div style={styles.sidebarBrandSub}>
                                School Management System
                            </div>
                        </div>

                    </div>


                    {/* Main Navigation */}
                    <div style={styles.navSection}>

                        <div style={styles.navLabel}>
                            MAIN
                        </div>

                        <Link
                            to="/dashboard"
                            style={{
                                ...styles.navItem,
                                ...styles.activeNavItem
                            }}
                        >
                            <span>▣</span>
                            Dashboard
                        </Link>

                        <Link
                            to="/students"
                            style={styles.navItem}
                        >
                            <span>◉</span>
                            Students
                        </Link>

                        <Link
                            to="/assessments"
                            style={styles.navItem}
                        >
                            <span>▤</span>
                            Assessments
                        </Link>

                        <Link
                            to="/attendance"
                            style={styles.navItem}
                        >
                            <span>✓</span>
                            Attendance
                        </Link>

                        <Link
                            to="/reports"
                            style={styles.navItem}
                        >
                            <span>▥</span>
                            Reports
                        </Link>

                    </div>


                    {/* Academic */}
                    <div style={styles.navSection}>

                        <div style={styles.navLabel}>
                            ACADEMIC
                        </div>

                        <Link
                            to="/leaderboard"
                            style={styles.navItem}
                        >
                            <span>★</span>
                            Leaderboard
                        </Link>

                        <Link
                            to="/bulkmarks"
                            style={styles.navItem}
                        >
                            <span>▦</span>
                            Bulk Marks
                        </Link>

                        <Link
                            to="/dashboard/classes"
                            style={styles.navItem}
                        >
                            <span>▤</span>
                            Classes
                        </Link>

                        <Link
                           to="/promotion"
                          style={styles.navItem}>
                        <span>⇧</span>
                             Promotion
                        </Link>






                        <Link
                            to="/dashboard/subjects"
                            style={styles.navItem}
                        >
                            <span>◇</span>
                            Subjects
                        </Link>

                    </div>


                    {/* Administration */}
                    <div style={styles.navSection}>

                        <div style={styles.navLabel}>
                            ADMINISTRATION
                        </div>

                        <Link
                            to="/dashboard/teacher-management"
                            style={styles.navItem}
                        >
                            <span>♙</span>
                            Teacher Management
                        </Link>

                        <Link
                            to="/settings"
                            style={styles.navItem}
                        >
                            <span>⚙</span>
                            Settings
                        </Link>

                    </div>

                </div>


                {/* Logout */}
                <button
                    onClick={handleLogout}
                    style={styles.logoutButton}
                >
                    <span>↪</span>
                    Logout
                </button>

            </aside>


            {/* =================================================
                MAIN AREA
            ================================================= */}

            <main style={styles.main}>

                {/* Top Header */}

                <header style={styles.topHeader}>

                    <div>

                        <p style={styles.breadcrumb}>
                            Dashboard
                        </p>

                        <h1 style={styles.pageTitle}>
                            School Overview
                        </h1>

                        <p style={styles.pageSubtitle}>
                            Welcome back. Here's what's happening
                            in your school.
                        </p>

                    </div>


                    <div style={styles.schoolIdentity}>

                        {brandingLoading ? (
                            <span style={styles.identityLoading}>
                                Loading...
                            </span>
                        ) : (
                            <>
                                <div style={styles.identityText}>
                                    <strong>
                                        {branding.school_name}
                                    </strong>

                                    {branding.motto && (
                                        <span>
                                            {branding.motto}
                                        </span>
                                    )}
                                </div>

                                <img
                                    src={getLogoUrl()}
                                    alt="School Logo"
                                    style={styles.headerLogo}
                                    onError={(e) => {
                                        e.currentTarget.src =
                                            '/logo-placeholder.png';
                                    }}
                                />
                            </>
                        )}

                    </div>

                </header>


                {/* =================================================
                    QUICK ACTIONS
                ================================================= */}

                <section style={styles.quickActions}>

                    <div>
                        <h2 style={styles.sectionTitle}>
                            Quick Actions
                        </h2>

                        <p style={styles.sectionSubtitle}>
                            Frequently used school management tools.
                        </p>
                    </div>

                    <div style={styles.actionGrid}>

                        <Link
                            to="/students"
                            style={styles.actionCard}
                        >
                            <div style={styles.actionIcon}>
                                +
                            </div>

                            <div>
                                <strong>Add / Manage Students</strong>
                                <span>
                                    View and manage student records
                                </span>
                            </div>
                        </Link>


                        <Link
                            to="/assessments"
                            style={styles.actionCard}
                        >
                            <div style={styles.actionIcon}>
                                %
                            </div>

                            <div>
                                <strong>Assessments</strong>
                                <span>
                                    Enter and manage student marks
                                </span>
                            </div>
                        </Link>


                        <Link
                            to="/attendance"
                            style={styles.actionCard}
                        >
                            <div style={styles.actionIcon}>
                                ✓
                            </div>

                            <div>
                                <strong>Attendance</strong>
                                <span>
                                    Record and review attendance
                                </span>
                            </div>
                        </Link>


                        <Link
                            to="/reports"
                            style={styles.actionCard}
                        >
                            <div style={styles.actionIcon}>
                                ↓
                            </div>

                            <div>
                                <strong>Generate Reports</strong>
                                <span>
                                    Generate student reports
                                </span>
                            </div>
                        </Link>

                    </div>

                </section>


                {/* =================================================
                    SUMMARY CARDS
                ================================================= */}

                <section>

                    <div style={styles.statsGrid}>

                        <div style={styles.statCard}>

                            <div style={styles.statIcon}>
                                👨‍🎓
                            </div>

                            <div>
                                <span style={styles.statLabel}>
                                    Total Students
                                </span>

                                <strong style={styles.statValue}>
                                    {stats.totalStudents || 0}
                                </strong>

                                <span style={styles.statDescription}>
                                    Currently enrolled
                                </span>
                            </div>

                        </div>


                        <div style={styles.statCard}>

                            <div style={styles.statIcon}>
                                👨‍🏫
                            </div>

                            <div>
                                <span style={styles.statLabel}>
                                    Active Teachers
                                </span>

                                <strong style={styles.statValue}>
                                {branding.assigned_teacher_count}
                            </strong>

                                <span style={styles.statDescription}>
                                    Teaching staff
                                </span>
                            </div>

                        </div>


                        <div style={styles.statCard}>

                            <div
                                style={{
                                    ...styles.statIcon,
                                    background: '#dcfce7',
                                    color: '#15803d'
                                }}
                            >
                                ✓
                            </div>

                            <div>
                                <span style={styles.statLabel}>
                                    Term Status
                                </span>

                               <strong style={styles.statValue}>
    {branding.term_status === 'active' ? 'Active' : 'Closed'}
</strong>

               <span style={styles.statDescription}>
    {branding.current_term || 'No term set'}
    {' • '}
    {branding.academic_year || 'No academic year set'}
           </span>
                            </div>

                        </div>

                    </div>

                </section>


                {/* =================================================
                    ANALYTICS
                ================================================= */}

                <section style={styles.analyticsSection}>

                    <div>
                        <h2 style={styles.sectionTitle}>
                            School Analytics
                        </h2>

                        <p style={styles.sectionSubtitle}>
                            A quick view of your current student data.
                        </p>
                    </div>


                    <div style={styles.chartGrid}>

                        {/* Class Distribution */}

                        <div style={styles.chartCard}>

                            <div style={styles.chartHeader}>
                                <div>
                                    <h3 style={styles.chartTitle}>
                                        Enrollment by Class
                                    </h3>

                                    <p style={styles.chartSubtitle}>
                                        Number of students in each class
                                    </p>
                                </div>
                            </div>

                            <div style={styles.chartContainer}>
                                <Bar
                                    data={classData}
                                    options={chartOptions}
                                />
                            </div>

                        </div>


                        {/* Gender Distribution */}

                        <div style={styles.chartCard}>

                            <div style={styles.chartHeader}>
                                <div>
                                    <h3 style={styles.chartTitle}>
                                        Gender Distribution
                                    </h3>

                                    <p style={styles.chartSubtitle}>
                                        Student population breakdown
                                    </p>
                                </div>
                            </div>

                            <div style={styles.pieContainer}>
                                <Pie
                                    data={genderData}
                                    options={chartOptions}
                                />
                            </div>

                        </div>

                    </div>

                </section>


                {/* =================================================
                    FOOTER
                ================================================= */}

                <footer style={styles.footer}>

                    <span>
                        {branding.school_name}
                    </span>

                    <span>
                        School Management System
                    </span>

                </footer>

            </main>

        </div>
    );
}


// =============================================================
// STYLES
// =============================================================

const styles = {

    page: {
        minHeight: '100vh',
        display: 'flex',
        background: '#f8fafc',
        color: '#0f172a'
    },

    // =========================================================
    // SIDEBAR
    // =========================================================

    sidebar: {
        width: '255px',
        minHeight: '100vh',
        background: '#0f172a',
        color: '#fff',
        padding: '22px 16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxSizing: 'border-box',
        position: 'sticky',
        top: 0,
        alignSelf: 'flex-start'
    },

    sidebarBrand: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '5px 8px 25px',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
    },

    sidebarLogo: {
        width: '42px',
        height: '42px',
        borderRadius: '10px',
        background: '#2563eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        flexShrink: 0,
        fontWeight: '800'
    },

    sidebarLogoImage: {
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        background: '#fff'
    },

    sidebarBrandName: {
        fontWeight: '700',
        fontSize: '14px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: '160px'
    },

    sidebarBrandSub: {
        fontSize: '11px',
        color: '#94a3b8',
        marginTop: '3px'
    },

    navSection: {
        marginTop: '25px'
    },

    navLabel: {
        fontSize: '10px',
        fontWeight: '700',
        color: '#64748b',
        letterSpacing: '1px',
        padding: '0 10px 8px'
    },

    navItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '11px',
        padding: '10px 11px',
        marginBottom: '3px',
        borderRadius: '8px',
        color: '#cbd5e1',
        textDecoration: 'none',
        fontSize: '14px',
        transition: '0.2s'
    },

    activeNavItem: {
        background: '#1d4ed8',
        color: '#fff',
        fontWeight: '600'
    },

    logoutButton: {
        width: '100%',
        border: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(255,255,255,0.05)',
        color: '#fca5a5',
        padding: '11px',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '14px',
        textAlign: 'left'
    },


    // =========================================================
    // MAIN
    // =========================================================

    main: {
        flex: 1,
        minWidth: 0,
        padding: '30px 38px',
        boxSizing: 'border-box'
    },

    topHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '25px',
        marginBottom: '30px',
        flexWrap: 'wrap'
    },

    breadcrumb: {
        margin: 0,
        color: '#2563eb',
        fontSize: '13px',
        fontWeight: '600'
    },

    pageTitle: {
        margin: '5px 0',
        fontSize: '30px',
        fontWeight: '750',
        letterSpacing: '-0.5px'
    },

    pageSubtitle: {
        margin: 0,
        color: '#64748b',
        fontSize: '14px'
    },

    schoolIdentity: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: '#fff',
        padding: '10px 13px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 6px rgba(15,23,42,0.04)'
    },

    identityText: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '3px',
        fontSize: '13px'
    },

    identityLoading: {
        color: '#64748b',
        fontSize: '13px'
    },

    headerLogo: {
        width: '46px',
        height: '46px',
        objectFit: 'contain',
        borderRadius: '8px'
    },


    // =========================================================
    // QUICK ACTIONS
    // =========================================================

    quickActions: {
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: '14px',
        padding: '22px',
        marginBottom: '25px'
    },

    sectionTitle: {
        margin: 0,
        fontSize: '19px',
        fontWeight: '700'
    },

    sectionSubtitle: {
        margin: '5px 0 0',
        color: '#64748b',
        fontSize: '13px'
    },

    actionGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        gap: '12px',
        marginTop: '18px'
    },

    actionCard: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '14px',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        textDecoration: 'none',
        color: '#0f172a',
        background: '#f8fafc'
    },

    actionIcon: {
        width: '36px',
        height: '36px',
        borderRadius: '9px',
        background: '#dbeafe',
        color: '#1d4ed8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '800',
        flexShrink: 0
    },


    // =========================================================
    // STAT CARDS
    // =========================================================

    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: '18px',
        marginBottom: '30px'
    },

    statCard: {
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: '14px',
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '15px'
    },

    statIcon: {
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        background: '#dbeafe',
        color: '#1d4ed8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '21px',
        flexShrink: 0
    },

    statLabel: {
        display: 'block',
        color: '#64748b',
        fontSize: '12px',
        marginBottom: '3px'
    },

    statValue: {
        display: 'block',
        fontSize: '28px',
        lineHeight: '1.1',
        marginBottom: '4px'
    },

    statDescription: {
        display: 'block',
        color: '#94a3b8',
        fontSize: '11px'
    },


    // =========================================================
    // ANALYTICS
    // =========================================================

    analyticsSection: {
        marginBottom: '30px'
    },

    chartGrid: {
        display: 'grid',
        gridTemplateColumns: '1.5fr 1fr',
        gap: '20px',
        marginTop: '18px'
    },

    chartCard: {
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: '14px',
        padding: '22px',
        minWidth: 0
    },

    chartHeader: {
        marginBottom: '15px'
    },

    chartTitle: {
        margin: 0,
        fontSize: '16px',
        fontWeight: '700'
    },

    chartSubtitle: {
        margin: '4px 0 0',
        color: '#94a3b8',
        fontSize: '12px'
    },

    chartContainer: {
        height: '300px'
    },

    pieContainer: {
        height: '300px',
        maxWidth: '330px',
        margin: '0 auto'
    },


    // =========================================================
    // FOOTER
    // =========================================================

    footer: {
        borderTop: '1px solid #e2e8f0',
        paddingTop: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        color: '#94a3b8',
        fontSize: '12px'
    },


    // =========================================================
    // LOADING
    // =========================================================

    loadingPage: {
        minHeight: '100vh',
        background: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },

    loadingCard: {
        background: '#fff',
        padding: '35px',
        borderRadius: '14px',
        border: '1px solid #e2e8f0',
        textAlign: 'center'
    },

    loadingSpinner: {
        width: '30px',
        height: '30px',
        border: '3px solid #dbeafe',
        borderTop: '3px solid #2563eb',
        borderRadius: '50%',
        margin: '0 auto 15px'
    }
};