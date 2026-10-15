import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

export default function TeacherDashboard() {
    const navigate = useNavigate();

    const [teacher, setTeacher] = useState(null);
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('sms_token');

        if (!token) {
            navigate('/login');
            return;
        }

        loadTeacherDashboard();
    }, [navigate]);

    const loadTeacherDashboard = async () => {
        try {
            setLoading(true);
            setError('');

            const response = await api.get('/auth/teacher/me');

            setTeacher(response.data.teacher);
            setAssignments(response.data.assignments || []);

        } catch (err) {
            console.error('Teacher dashboard error:', err);

            if (err.response?.status === 401) {
                localStorage.removeItem('sms_token');
                navigate('/login');
                return;
            }

            if (err.response?.status === 403) {
                navigate('/dashboard');
                return;
            }

            setError(
                err.response?.data?.message ||
                'Failed to load teacher dashboard.'
            );

        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('sms_token');
        navigate('/login');
    };

    const cardStyle = {
        flex: 1,
        padding: '20px',
        border: '1px solid #ddd',
        borderRadius: '10px',
        textDecoration: 'none',
        color: '#333',
        background: '#f9f9f9',
        boxShadow: '0 2px 5px rgba(0,0,0,0.08)'
    };

    if (loading) {
        return (
            <div style={{
                padding: '40px',
                textAlign: 'center',
                fontFamily: 'sans-serif'
            }}>
                <h3>Loading Teacher Portal...</h3>
            </div>
        );
    }

    return (
        <div style={{
            padding: '20px',
            fontFamily: 'sans-serif',
            maxWidth: '1000px',
            margin: '0 auto'
        }}>

            {/* HEADER */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '2px solid #eee',
                paddingBottom: '15px'
            }}>
                <div>
                    <h2 style={{ margin: 0 }}>
                        👨‍🏫 Teacher Portal
                    </h2>

                    {teacher && (
                        <p style={{
                            margin: '5px 0 0',
                            color: '#666'
                        }}>
                            Welcome, {teacher.full_name}
                        </p>
                    )}
                </div>

                <button
                    onClick={handleLogout}
                    style={{
                        padding: '9px 16px',
                        background: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer'
                    }}
                >
                    Logout
                </button>
            </div>

            {/* ERROR */}
            {error && (
                <div style={{
                    marginTop: '20px',
                    padding: '12px',
                    background: '#fdedec',
                    color: '#c0392b',
                    borderRadius: '6px'
                }}>
                    {error}
                </div>
            )}

            {/* TEACHER PROFILE */}
            {teacher && (
                <div style={{
                    marginTop: '25px',
                    padding: '20px',
                    background: '#f8f9fa',
                    border: '1px solid #ddd',
                    borderRadius: '10px'
                }}>
                    <h3 style={{ marginTop: 0 }}>
                        👤 My Profile
                    </h3>

                    <p>
                        <strong>Name:</strong> {teacher.full_name}
                    </p>

                    <p>
                        <strong>Email:</strong> {teacher.email}
                    </p>

                    <p>
                        <strong>School ID:</strong> {teacher.school_id}
                    </p>
                </div>
            )}

            {/* ASSIGNMENTS */}
            <div style={{ marginTop: '30px' }}>
                <h3>📚 My Assignments</h3>

                {assignments.length === 0 ? (
                    <div style={{
                        padding: '20px',
                        background: '#fff8e1',
                        border: '1px solid #f1c40f',
                        borderRadius: '8px'
                    }}>
                        You currently have no classes or subjects assigned.
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                        gap: '15px'
                    }}>
                        {assignments.map((assignment) => (
                            <div
                                key={assignment.id}
                                style={{
                                    padding: '18px',
                                    border: '1px solid #ddd',
                                    borderRadius: '8px',
                                    background: 'white'
                                }}
                            >
                                <h4 style={{ margin: '0 0 10px' }}>
                                    {assignment.subject_name}
                                </h4>

                                <p style={{ margin: 0 }}>
                                    <strong>Class:</strong>{' '}
                                    {assignment.class_name}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ACTIONS */}
            <div style={{
                display: 'flex',
                gap: '20px',
                marginTop: '30px',
                flexWrap: 'wrap'
            }}>

                <Link
                    to="/teacher/marks"
                    style={cardStyle}
                >
                    <h3>📝 Enter Marks</h3>

                    <p>
                        Enter and update marks for your assigned
                        classes and subjects.
                    </p>
                </Link>

                <Link
                    to="/teacher/attendance"
                    style={cardStyle}
                >
                    <h3>📅 Take Attendance</h3>

                    <p>
                        Mark daily attendance for students in
                        your assigned classes.
                    </p>
                </Link>

            </div>

        </div>
    );
}