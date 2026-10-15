import { useEffect,useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

export default function Subjects() {
    const navigate = useNavigate();
    const [subjects, setSubjects] = useState([]);
    const [subjectName, setSubjectName] = useState('');
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const getSchoolId = () => {
        const token = localStorage.getItem('sms_token');

        if (!token) {
            throw new Error('You are not logged in.');
        }

        const decoded = jwtDecode(token);

        if (!decoded.school_id) {
            throw new Error('School information is missing from your account.');
        }

        return decoded.school_id;
    };

    const loadSubjects = async () => {
        try {
            setLoading(true);
            setError('');

            const schoolId = getSchoolId();

            const response = await api.get(`/auth/subjects/${schoolId}`);

            setSubjects(response.data);
        } catch (err) {
            console.error('Error loading subjects:', err);

            setError(
                err.response?.data?.message ||
                err.message ||
                'Failed to load subjects.'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSubjects();
    }, []);

    const handleAddSubject = async (e) => {
        e.preventDefault();

        if (!subjectName.trim()) {
            setError('Please enter a subject name.');
            return;
        }

        try {
            setError('');
            setMessage('');

            const schoolId = getSchoolId();

            const response = await api.post('/auth/subjects', {
                school_id: schoolId,
                subject_name: subjectName.trim()
            });

            setMessage(response.data.message);
            setSubjectName('');

            loadSubjects();

        } catch (err) {
            console.error('Error adding subject:', err);

            setError(
                err.response?.data?.message ||
                'Failed to add subject.'
            );
        }
    };

    const handleDeleteSubject = async (id) => {
        const confirmed = window.confirm(
            'Are you sure you want to delete this subject?'
        );

        if (!confirmed) return;

        try {
            setError('');
            setMessage('');

            const response = await api.delete(`/auth/subjects/${id}`);

            setMessage(response.data.message);

            loadSubjects();

        } catch (err) {
            console.error('Error deleting subject:', err);

            setError(
                err.response?.data?.message ||
                'Failed to delete subject.'
            );
        }
    };

    return (
        <div
            style={{
                minHeight: '100vh',
                background: '#f4f7f9',
                padding: '40px'
            }}
        >





           

        <div
    style={{
        marginBottom: '20px'
    }}
>
    <button
        type="button"
        onClick={() => navigate('/dashboard')}
        style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            background: '#fff',
            color: '#334155',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600'
        }}
    >
        ← Back to Dashboard
    </button>
</div>







            <div
                style={{
                    maxWidth: '900px',
                    margin: '0 auto'
                }}
            >
                <h1>📚 School Subjects</h1>

                <p style={{ color: '#666' }}>
                    Manage the subjects available in your school.
                </p>

                {/* Add Subject */}
                <div
                    style={{
                        background: 'white',
                        padding: '25px',
                        borderRadius: '10px',
                        boxShadow: '0 2px 5px #ddd',
                        marginTop: '25px'
                    }}
                >
                    <h2>Add Subject</h2>

                    <form
                        onSubmit={handleAddSubject}
                        style={{
                            display: 'flex',
                            gap: '10px',
                            marginTop: '15px'
                        }}
                    >
                        <input
                            type="text"
                            placeholder="e.g. Mathematics"
                            value={subjectName}
                            onChange={(e) => setSubjectName(e.target.value)}
                            style={{
                                flex: 1,
                                padding: '12px',
                                border: '1px solid #ccc',
                                borderRadius: '6px'
                            }}
                        />

                        <button
                            type="submit"
                            style={{
                                padding: '12px 20px',
                                background: '#1a3a5f',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer'
                            }}
                        >
                            Add Subject
                        </button>
                    </form>

                    {message && (
                        <p style={{ color: 'green', marginTop: '15px' }}>
                            {message}
                        </p>
                    )}

                    {error && (
                        <p style={{ color: 'red', marginTop: '15px' }}>
                            {error}
                        </p>
                    )}
                </div>

                {/* Existing Subjects */}
                <div
                    style={{
                        background: 'white',
                        padding: '25px',
                        borderRadius: '10px',
                        boxShadow: '0 2px 5px #ddd',
                        marginTop: '25px'
                    }}
                >
                    <h2>Existing Subjects</h2>

                    {loading ? (
                        <p>Loading subjects...</p>
                    ) : subjects.length === 0 ? (
                        <p style={{ color: '#666' }}>
                            No subjects have been added yet.
                        </p>
                    ) : (
                        <div style={{ marginTop: '15px' }}>
                            {subjects.map((subject) => (
                                <div
                                    key={subject.id}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '15px',
                                        borderBottom: '1px solid #eee'
                                    }}
                                >
                                    <strong>
                                        {subject.subject_name}
                                    </strong>

                                    <button
                                        onClick={() =>
                                            handleDeleteSubject(subject.id)
                                        }
                                        style={{
                                            padding: '8px 12px',
                                            background: '#e74c3c',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '5px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}