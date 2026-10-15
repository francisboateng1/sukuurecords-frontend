import React, { useEffect,useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { jwtDecode } from 'jwt-decode';

export default function TeacherManagement() {


    const navigate = useNavigate();

    // ==============================
    // CREATE TEACHER FORM
    // ==============================
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: ''
    });

    // ==============================
    // TEACHERS
    // ==============================
    const [teachers, setTeachers] = useState([]);

    // ==============================
    // SCHOOL CLASSES
    // ==============================
    const [classes, setClasses] = useState([]);

    // ==============================
    // SCHOOL SUBJECTS
    // ==============================
    const [subjects, setSubjects] = useState([]);

    // ==============================
    // ASSIGNMENT FORM
    // ==============================
    const [assignmentData, setAssignmentData] = useState({
        teacher_id: '',
        class_id: '',
        subject_id: ''
    });

    // ==============================
    // ASSIGNMENTS
    // ==============================
    const [assignments, setAssignments] = useState([]);

    // ==============================
    // MESSAGES
    // ==============================
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const [loading, setLoading] = useState(false);


    // =====================================================
    // GET ADMIN SCHOOL ID
    // =====================================================
    const getSchoolId = () => {

        const token = localStorage.getItem('sms_token');

        if (!token) {
            throw new Error('Not logged in');
        }

        const decoded = jwtDecode(token);

        if (!decoded.school_id) {
            throw new Error('School ID not found in login token');
        }

        return decoded.school_id;
    };


    // =====================================================
    // LOAD TEACHERS
    // =====================================================
    const loadTeachers = async () => {

        try {

            const schoolId = getSchoolId();

            const response = await api.get(
                `/auth/teachers/${schoolId}`
            );

            setTeachers(response.data);

        } catch (err) {

            console.error('Error loading teachers:', err);

            setError(
                err.response?.data?.error ||
                err.response?.data?.message ||
                'Failed to load teachers.'
            );
        }
    };


    // =====================================================
    // LOAD SCHOOL CLASSES
    // =====================================================
    const loadClasses = async () => {

        try {

            const schoolId = getSchoolId();

            const response = await api.get(
                `/auth/classes/${schoolId}`
            );

            setClasses(response.data);

        } catch (err) {

            console.error('Error loading classes:', err);

            setError(
                err.response?.data?.message ||
                err.response?.data?.error ||
                'Failed to load school classes.'
            );
        }
    };


    // =====================================================
    // LOAD SCHOOL SUBJECTS
    // =====================================================
    const loadSubjects = async () => {

        try {

            const schoolId = getSchoolId();

            const response = await api.get(
                `/auth/subjects/${schoolId}`
            );

            setSubjects(response.data);

        } catch (err) {

            console.error('Error loading subjects:', err);

            setError(
                err.response?.data?.message ||
                err.response?.data?.error ||
                'Failed to load school subjects.'
            );
        }
    };


    // =====================================================
    // LOAD ASSIGNMENTS
    // =====================================================
    const loadAssignments = async () => {

        try {

            const schoolId = getSchoolId();

            const response = await api.get(
                `/auth/all-teacher-assignments/${schoolId}`
            );

            setAssignments(response.data);

        } catch (err) {

            console.error(
                'Error loading assignments:',
                err
            );

            setError(
                err.response?.data?.error ||
                err.response?.data?.message ||
                'Failed to load teacher assignments.'
            );
        }
    };


    // =====================================================
    // LOAD DATA WHEN PAGE OPENS
    // =====================================================
    useEffect(() => {

        loadTeachers();
        loadAssignments();
        loadClasses();
        loadSubjects();

    }, []);


    // =====================================================
    // CREATE TEACHER
    // =====================================================
    const handleSubmit = async (e) => {

        e.preventDefault();

        setMessage('');
        setError('');
        setLoading(true);

        try {

            const schoolId = getSchoolId();

            await api.post('/auth/add-teacher', {

                ...formData,

                school_id: schoolId

            });

            setMessage(
                '✅ Teacher account created successfully!'
            );

            setFormData({
                full_name: '',
                email: '',
                password: ''
            });

            // Refresh teacher list
            await loadTeachers();

        } catch (err) {

            console.error(err);

            setError(
                err.response?.data?.error ||
                err.response?.data?.message ||
                err.message ||
                'Failed to add teacher.'
            );

        } finally {

            setLoading(false);
        }
    };


    // =====================================================
    // ASSIGN TEACHER
    // =====================================================
    const handleAssignTeacher = async (e) => {

        e.preventDefault();

        setMessage('');
        setError('');

        if (!assignmentData.teacher_id) {

            setError('Please select a teacher.');

            return;
        }

        if (!assignmentData.class_id) {

            setError('Please select a class.');

            return;
        }

        if (!assignmentData.subject_id) {

            setError('Please select a subject.');

            return;
        }

        setLoading(true);

        try {

            await api.post(
                '/auth/assign-teacher',
                assignmentData
            );

            setMessage(
                '✅ Teacher assigned successfully!'
            );

            // Clear assignment form
            setAssignmentData({
                teacher_id: '',
                class_id: '',
                subject_id: ''
            });

            // Refresh assignments
            await loadAssignments();

        } catch (err) {

            console.error(err);

            setError(
                err.response?.data?.error ||
                err.response?.data?.message ||
                'Failed to assign teacher.'
            );

        } finally {

            setLoading(false);
        }
    };


    // =====================================================
    // REMOVE ASSIGNMENT
    // =====================================================
    const handleRemoveAssignment = async (assignmentId) => {

        const confirmRemove = window.confirm(
            'Are you sure you want to remove this teacher assignment?'
        );

        if (!confirmRemove) {
            return;
        }

        setMessage('');
        setError('');

        try {

            await api.delete(
                `/auth/teacher-assignment/${assignmentId}`
            );

            setMessage(
                '✅ Teacher assignment removed.'
            );

            await loadAssignments();

        } catch (err) {

            console.error(err);

            setError(
                err.response?.data?.error ||
                err.response?.data?.message ||
                'Failed to remove assignment.'
            );
        }
    };


    // =====================================================
    // STYLES
    // =====================================================
    const inputStyle = {
        width: '100%',
        padding: '10px',
        borderRadius: '5px',
        border: '1px solid #ccc',
        boxSizing: 'border-box',
        fontSize: '15px'
    };

    const sectionStyle = {
        background: '#f9f9f9',
        padding: '25px',
        borderRadius: '8px',
        border: '1px solid #ddd',
        marginBottom: '25px'
    };

    const buttonStyle = {
        padding: '12px',
        background: '#2980b9',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: 'bold'
    };


    // =====================================================
    // UI
    // =====================================================
    return (

        <div
            style={{
                padding: '20px',
                maxWidth: '900px',
                margin: '0 auto',
                fontFamily: 'sans-serif'
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










            <h2>⚙️ Manage Teachers</h2>

            <p>
                Create teacher accounts and assign teachers
                to their classes and subjects.
            </p>


            {/* ==========================================
                MESSAGES
            ========================================== */}

            {message && (

                <div
                    style={{
                        color: 'green',
                        background: '#e8f8f5',
                        padding: '10px',
                        borderRadius: '5px',
                        marginBottom: '15px'
                    }}
                >
                    {message}
                </div>

            )}


            {error && (

                <div
                    style={{
                        color: 'red',
                        background: '#fdedec',
                        padding: '10px',
                        borderRadius: '5px',
                        marginBottom: '15px'
                    }}
                >
                    {error}
                </div>

            )}


            {/* ==========================================
                CREATE TEACHER
            ========================================== */}

            <div style={sectionStyle}>

                <h3>👨‍🏫 Create New Teacher Account</h3>

                <p>
                    Create a login account for a teacher
                    in your school.
                </p>


                <form
                    onSubmit={handleSubmit}
                    style={{
                        display: 'grid',
                        gap: '15px'
                    }}
                >

                    {/* FULL NAME */}

                    <div>

                        <label
                            style={{
                                display: 'block',
                                marginBottom: '5px',
                                fontWeight: 'bold'
                            }}
                        >
                            Full Name
                        </label>

                        <input
                            type="text"
                            value={formData.full_name}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    full_name: e.target.value
                                })
                            }
                            required
                            style={inputStyle}
                            placeholder="e.g. Francis Boateng"
                        />

                    </div>


                    {/* EMAIL */}

                    <div>

                        <label
                            style={{
                                display: 'block',
                                marginBottom: '5px',
                                fontWeight: 'bold'
                            }}
                        >
                            Email Address
                        </label>

                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    email: e.target.value
                                })
                            }
                            required
                            style={inputStyle}
                            placeholder="teacher@school.com"
                        />

                    </div>


                    {/* PASSWORD */}

                    <div>

                        <label
                            style={{
                                display: 'block',
                                marginBottom: '5px',
                                fontWeight: 'bold'
                            }}
                        >
                            Temporary Password
                        </label>

                        <input
                            type="text"
                            value={formData.password}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    password: e.target.value
                                })
                            }
                            required
                            style={inputStyle}
                            placeholder="e.g. password123"
                        />

                    </div>


                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            ...buttonStyle,
                            opacity: loading ? 0.6 : 1
                        }}
                    >
                        {loading
                            ? 'Creating...'
                            : 'Create Teacher Account'}
                    </button>

                </form>

            </div>


            {/* ==========================================
                TEACHER ASSIGNMENT
            ========================================== */}

            <div style={sectionStyle}>

                <h3>📚 Assign Teacher</h3>

                <p>
                    Assign a teacher to a class and subject.
                </p>


                <form
                    onSubmit={handleAssignTeacher}
                    style={{
                        display: 'grid',
                        gap: '15px'
                    }}
                >

                    {/* TEACHER */}

                    <div>

                        <label
                            style={{
                                display: 'block',
                                marginBottom: '5px',
                                fontWeight: 'bold'
                            }}
                        >
                            Teacher
                        </label>

                        <select
                            value={assignmentData.teacher_id}
                            onChange={(e) =>
                                setAssignmentData({
                                    ...assignmentData,
                                    teacher_id: e.target.value
                                })
                            }
                            required
                            style={inputStyle}
                        >

                            <option value="">
                                Select Teacher
                            </option>

                            {teachers.map((teacher) => (

                                <option
                                    key={teacher.id}
                                    value={teacher.id}
                                >
                                    {teacher.full_name}
                                </option>

                            ))}

                        </select>

                    </div>


                    {/* CLASS */}

                    <div>

                        <label
                            style={{
                                display: 'block',
                                marginBottom: '5px',
                                fontWeight: 'bold'
                            }}
                        >
                            Class
                        </label>

                        <select
                            value={assignmentData.class_id}
                            onChange={(e) =>
                                setAssignmentData({
                                    ...assignmentData,
                                    class_id: e.target.value
                                })
                            }
                            required
                            style={inputStyle}
                        >

                            <option value="">
                                Select Class
                            </option>

                            {classes.map((classItem) => (

                                <option
                                    key={classItem.id}
                                    value={classItem.id}
                                >
                                    {classItem.class_name}
                                </option>

                            ))}

                        </select>

                        {classes.length === 0 && (

                            <small
                                style={{
                                    display: 'block',
                                    marginTop: '6px',
                                    color: '#777'
                                }}
                            >
                                No classes available yet. Add a class
                                in School Classes first.
                            </small>

                        )}

                    </div>


                    {/* SUBJECT */}

                    <div>

                        <label
                            style={{
                                display: 'block',
                                marginBottom: '5px',
                                fontWeight: 'bold'
                            }}
                        >
                            Subject
                        </label>

                        <select
                            value={assignmentData.subject_id}
                            onChange={(e) =>
                                setAssignmentData({
                                    ...assignmentData,
                                    subject_id: e.target.value
                                })
                            }
                            required
                            style={inputStyle}
                        >

                            <option value="">
                                Select Subject
                            </option>

                            {subjects.map((subject) => (

                                <option
                                    key={subject.id}
                                    value={subject.id}
                                >
                                    {subject.subject_name}
                                </option>

                            ))}

                        </select>

                        {subjects.length === 0 && (

                            <small
                                style={{
                                    display: 'block',
                                    marginTop: '6px',
                                    color: '#777'
                                }}
                            >
                                No subjects available yet. Add a subject
                                in School Subjects first.
                            </small>

                        )}

                    </div>


                    <button
                        type="submit"
                        disabled={
                            loading ||
                            teachers.length === 0 ||
                            classes.length === 0 ||
                            subjects.length === 0
                        }
                        style={{
                            ...buttonStyle,
                            opacity:
                                loading ||
                                teachers.length === 0 ||
                                classes.length === 0 ||
                                subjects.length === 0
                                    ? 0.6
                                    : 1
                        }}
                    >
                        {loading
                            ? 'Assigning...'
                            : 'Assign Teacher'}
                    </button>

                </form>

            </div>


            {/* ==========================================
                CURRENT TEACHERS
            ========================================== */}

            <div style={sectionStyle}>

                <h3>👥 Teachers</h3>

                {teachers.length === 0 ? (

                    <p>
                        No teachers have been created yet.
                    </p>

                ) : (

                    <div
                        style={{
                            display: 'grid',
                            gap: '10px'
                        }}
                    >

                        {teachers.map((teacher) => (

                            <div
                                key={teacher.id}
                                style={{
                                    padding: '15px',
                                    background: 'white',
                                    border: '1px solid #ddd',
                                    borderRadius: '6px'
                                }}
                            >

                                <strong>
                                    {teacher.full_name}
                                </strong>

                                <br />

                                <span>
                                    {teacher.email}
                                </span>

                            </div>

                        ))}

                    </div>

                )}

            </div>


            {/* ==========================================
                CURRENT ASSIGNMENTS
            ========================================== */}

            <div style={sectionStyle}>

                <h3>📋 Current Teacher Assignments</h3>

                {assignments.length === 0 ? (

                    <p>
                        No teacher assignments yet.
                    </p>

                ) : (

                    <div
                        style={{
                            display: 'grid',
                            gap: '10px'
                        }}
                    >

                        {assignments.map((assignment) => (

                            <div
                                key={assignment.id}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    gap: '15px',
                                    padding: '15px',
                                    background: 'white',
                                    border: '1px solid #ddd',
                                    borderRadius: '6px'
                                }}
                            >

                                <div>

                                    <strong>
                                        {assignment.teacher_name}
                                    </strong>

                                    <div>
                                        Class: {assignment.class_name}
                                    </div>

                                    <div>
                                        Subject: {assignment.subject_name}
                                    </div>

                                </div>


                                <button
                                    onClick={() =>
                                        handleRemoveAssignment(
                                            assignment.id
                                        )
                                    }
                                    style={{
                                        padding: '8px 12px',
                                        background: '#e74c3c',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Remove
                                </button>

                            </div>

                        ))}

                    </div>

                )}

            </div>

        </div>
    );
}