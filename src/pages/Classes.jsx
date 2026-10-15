import { useEffect,useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

export default function Classes() {

    const navigate = useNavigate();
    const [classes, setClasses] = useState([]);
    const [className, setClassName] = useState('');
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

    const loadClasses = async () => {
        try {
            setLoading(true);
            setError('');

            const schoolId = getSchoolId();

            const response = await api.get(`/auth/classes/${schoolId}`);

            setClasses(response.data);
        } catch (err) {
            console.error('Error loading classes:', err);

            setError(
                err.response?.data?.message ||
                err.message ||
                'Failed to load classes.'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadClasses();
    }, []);

    const handleAddClass = async (e) => {
        e.preventDefault();

        if (!className.trim()) {
            setError('Please enter a class name.');
            return;
        }

        try {
            setError('');
            setMessage('');

            const schoolId = getSchoolId();

            const response = await api.post('/auth/classes', {
                school_id: schoolId,
                class_name: className.trim()
            });

            setMessage(response.data.message);
            setClassName('');

            loadClasses();

        } catch (err) {
            console.error('Error adding class:', err);

            setError(
                err.response?.data?.message ||
                'Failed to add class.'
            );
        }
    };

    const handleDeleteClass = async (id) => {
        const confirmed = window.confirm(
            'Are you sure you want to delete this class?'
        );

        if (!confirmed) return;

        try {
            setError('');
            setMessage('');

            const response = await api.delete(`/auth/classes/${id}`);

            setMessage(response.data.message);

            loadClasses();

        } catch (err) {
            console.error('Error deleting class:', err);

            setError(
                err.response?.data?.message ||
                'Failed to delete class.'
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
                <h1>🏫 School Classes</h1>

                <p style={{ color: '#666' }}>
                    Manage the classes available in your school.
                </p>

                {/* Add Class */}
                <div
                    style={{
                        background: 'white',
                        padding: '25px',
                        borderRadius: '10px',
                        boxShadow: '0 2px 5px #ddd',
                        marginTop: '25px'
                    }}
                >
                    <h2>Add Class</h2>

                    <form
                        onSubmit={handleAddClass}
                        style={{
                            display: 'flex',
                            gap: '10px',
                            marginTop: '15px'
                        }}
                    >
                        <input
                            type="text"
                            placeholder="e.g. JHS 1"
                            value={className}
                            onChange={(e) => setClassName(e.target.value)}
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
                            Add Class
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

                {/* Existing Classes */}
                <div
                    style={{
                        background: 'white',
                        padding: '25px',
                        borderRadius: '10px',
                        boxShadow: '0 2px 5px #ddd',
                        marginTop: '25px'
                    }}
                >
                    <h2>Existing Classes</h2>

                    {loading ? (
                        <p>Loading classes...</p>
                    ) : classes.length === 0 ? (
                        <p style={{ color: '#666' }}>
                            No classes have been added yet.
                        </p>
                    ) : (
                        <div style={{ marginTop: '15px' }}>
                            {classes.map((schoolClass) => (
                                <div
                                    key={schoolClass.id}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '15px',
                                        borderBottom: '1px solid #eee'
                                    }}
                                >
                                    <strong>
                                        {schoolClass.class_name}
                                    </strong>

                                    <button
                                        onClick={() =>
                                            handleDeleteClass(schoolClass.id)
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