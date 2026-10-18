import React, { useState,useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

const SERVER_URL = (
    import.meta.env.VITE_API_URL || 'http://localhost:5000'
).replace(/\/+$/, '');

const getImageUrl = (url) => {
    if (!url) return '';

    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }

    return `${SERVER_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

export default function Students() {




    const navigate = useNavigate();

    const [students, setStudents] = useState([]);
    const [classes, setClasses] = useState([]);

    const [selectedClass, setSelectedClass] = useState('');

    const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    surname: '',
    parent_email: '',
    parent_phone: '',
    current_class: '',
    gender: 'Other'
});

    const [passportPhoto, setPassportPhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState('');

    const [editingStudent, setEditingStudent] = useState(null);

    const [loading, setLoading] = useState(false);
    const [classesLoading, setClassesLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState('');

    // =====================================================
    // GET SCHOOL ID
    // =====================================================

    const getSchoolId = () => {

        const token = localStorage.getItem('sms_token');

        if (!token) {
            throw new Error('You are not logged in.');
        }

        const decodedToken = jwtDecode(token);

        if (!decodedToken.school_id) {
            throw new Error(
                'School information is missing from your account.'
            );
        }

        return decodedToken.school_id;
    };


    // =====================================================
    // FETCH STUDENTS
    // =====================================================

    const fetchStudents = async () => {

        try {

            setLoading(true);
            setError('');

            const res = await api.get('/students');

            setStudents(res.data);

        } catch (err) {

            console.error(
                'Error fetching students:',
                err
            );

            setError(
                err.response?.data?.message ||
                'Failed to load students.'
            );

        } finally {

            setLoading(false);
        }
    };


    // =====================================================
    // FETCH CLASSES
    // =====================================================

    const fetchClasses = async () => {

        try {

            setClassesLoading(true);

            const schoolId = getSchoolId();

            const res = await api.get(
                `/auth/classes/${schoolId}`
            );

            setClasses(res.data);

        } catch (err) {

            console.error(
                'Error fetching classes:',
                err
            );

            setError(
                err.response?.data?.message ||
                err.message ||
                'Failed to load school classes.'
            );

        } finally {

            setClassesLoading(false);
        }
    };


    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {

        fetchStudents();
        fetchClasses();

    }, []);


    // =====================================================
    // HANDLE TEXT INPUT
    // =====================================================

    const handleChange = (e) => {

        const {
            name,
            value
        } = e.target;

        setFormData(previous => ({
            ...previous,
            [name]: value
        }));
    };


    // =====================================================
    // HANDLE PHOTO
    // =====================================================

    const handlePhotoChange = (e) => {

        const file = e.target.files?.[0];

        if (!file) {
            return;
        }

        const allowedTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/webp'
        ];

        if (!allowedTypes.includes(file.type)) {

            setError(
                'Please select a JPG, PNG or WEBP image.'
            );

            return;
        }

        if (file.size > 5 * 1024 * 1024) {

            setError(
                'Passport photo must be smaller than 5MB.'
            );

            return;
        }

        setError('');
        setPassportPhoto(file);

        setPhotoPreview(
            URL.createObjectURL(file)
        );
    };


    // =====================================================
    // RESET FORM
    // =====================================================

    const resetForm = () => {

       setFormData({
    first_name: '',
    middle_name: '',
    surname: '',
    parent_email: '',
    parent_phone: '',
    current_class: '',
    gender: 'Other'
});
        setPassportPhoto(null);
        setPhotoPreview('');
        setEditingStudent(null);
    };


    // =====================================================
// ADD / EDIT STUDENT
// =====================================================

const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate names for new registrations.
    // For editing, allow older records whose separate
   // Validate names for new registrations and edits.
if (!formData.first_name.trim()) {
    setError('Please enter the student first name.');
    return;
}

if (!formData.surname.trim()) {
    setError('Please enter the student surname.');
    return;
} else {
    if (!formData.first_name.trim()) {
        setError('Please enter the student first name.');
        return;
    }

    if (!formData.surname.trim()) {
        setError('Please enter the student surname.');
        return;
    }
}

    if (!formData.current_class) {
        setError('Please select a class.');
        return;
    }

    try {
        setSaving(true);
        setError('');

        const data = new FormData();

        data.append('first_name', formData.first_name.trim());
        data.append('middle_name', formData.middle_name.trim());
        data.append('surname', formData.surname.trim());

        data.append('parent_email', formData.parent_email.trim());
        data.append('parent_phone', formData.parent_phone.trim());
        data.append('current_class', formData.current_class);
        data.append('gender', formData.gender);

        if (passportPhoto) {
            data.append('passport_photo', passportPhoto);
        }

        // ---------------------------------------------
        // EDIT EXISTING STUDENT
        // ---------------------------------------------

        if (editingStudent) {
            await api.put(
                `/students/${editingStudent.id}`,
                data
            );

            alert('Student updated successfully!');
        }

        // ---------------------------------------------
        // ADD NEW STUDENT
        // ---------------------------------------------

        else {
            const response = await api.post(
                '/students/add',
                data
            );

            const admissionNumber =
                response.data?.admission_number;

            if (admissionNumber) {
                alert(
                    `Student added successfully!\n\n` +
                    `Name: ${response.data.full_name}\n` +
                    `Admission Number: ${admissionNumber}`
                );
            } else {
                alert('Student added successfully!');
            }
        }

        resetForm();
        await fetchStudents();

    } catch (err) {
        console.error('Save student error:', err);

        setError(
            err.response?.data?.message ||
            'Error saving student.'
        );

    } finally {
        setSaving(false);
    }
};


    // =====================================================
// START EDITING
// =====================================================

const startEdit = (student) => {
    setEditingStudent(student);

    setFormData({
        // Use separate name fields when available.
        // Older records may only have full_name.
        first_name: student.first_name || '',
        middle_name: student.middle_name || '',
        surname: student.surname || '',

        parent_email: student.parent_email || '',
        parent_phone: student.parent_phone || '',
        current_class: student.current_class || '',
        gender: student.gender || 'Other'
    });

    setPassportPhoto(null);

    setPhotoPreview(
        student.passport_photo_url
            ? getImageUrl(student.passport_photo_url)
            : ''
    );

    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
};


    // =====================================================
    // SELECT CLASS
    // =====================================================

    const handleClassSelect = (className) => {

        setSelectedClass(className);

        setError('');
    };


    // =====================================================
    // FILTER STUDENTS
    // =====================================================

    const displayedStudents =
        selectedClass
            ? students.filter(
                student =>
                    student.current_class ===
                    selectedClass
            )
            : [];


    // =====================================================
    // CLASS STUDENT COUNT
    // =====================================================

    const getClassStudentCount = (className) => {

        return students.filter(
            student =>
                student.current_class ===
                className
        ).length;
    };


    return (
        <div
            style={{
                padding: '30px',
                background: '#f4f7f9',
                minHeight: '100vh',
                fontFamily: 'Arial, sans-serif'
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
                    maxWidth: '1200px',
                    margin: '0 auto'
                }}
            >

                {/* =================================================
                    HEADER
                ================================================= */}

                <div
                    style={{
                        marginBottom: '25px'
                    }}
                >

                    <h2
                        style={{
                            marginBottom: '6px'
                        }}
                    >
                        Student Management
                    </h2>

                    <p
                        style={{
                            color: '#666',
                            margin: 0
                        }}
                    >
                        Manage students, classes and
                        student information.
                    </p>

                </div>


                {/* =================================================
                    ERROR
                ================================================= */}

                {error && (

                    <div
                        style={{
                            background: '#ffebee',
                            color: '#c62828',
                            padding: '12px 15px',
                            borderRadius: '6px',
                            marginBottom: '20px'
                        }}
                    >
                        {error}
                    </div>

                )}


                {/* =================================================
                    ADD / EDIT FORM
                ================================================= */}

                <div
                    style={{
                        background: 'white',
                        padding: '25px',
                        borderRadius: '10px',
                        boxShadow:
                            '0 2px 8px rgba(0,0,0,0.08)',
                        marginBottom: '30px'
                    }}
                >

                    <div
                        style={{
                            display: 'flex',
                            justifyContent:
                                'space-between',
                            alignItems: 'center',
                            marginBottom: '20px'
                        }}
                    >

                        <h3
                            style={{
                                margin: 0
                            }}
                        >
                            {editingStudent
                                ? 'Edit Student'
                                : 'Add New Student'}
                        </h3>

                        {editingStudent && (

                            <button
                                type="button"
                                onClick={resetForm}
                                style={{
                                    border: '1px solid #ccc',
                                    background: 'white',
                                    padding: '8px 14px',
                                    borderRadius: '5px',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel Edit
                            </button>

                        )}

                    </div>


                    <form
                        onSubmit={handleSubmit}
                    >

                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns:
                                    'repeat(auto-fit, minmax(220px, 1fr))',
                                gap: '15px'
                            }}
                        >

                            {/* NAME */}

                           {/* FIRST NAME */}

<div>
    <label style={labelStyle}>
        First Name
    </label>

    <input
        name="first_name"
        placeholder="Enter first name"
        value={formData.first_name}
        onChange={handleChange}
        maxLength={100}
        autoComplete="given-name"
        required
        style={inputStyle}
    />
</div>

{/* MIDDLE NAME */}

<div>
    <label style={labelStyle}>
        Middle Name(s)
    </label>

    <input
        name="middle_name"
        placeholder="Enter middle name(s), if any"
        value={formData.middle_name}
        onChange={handleChange}
        maxLength={150}
        autoComplete="additional-name"
        style={inputStyle}
    />
</div>

{/* SURNAME */}

<div>
    <label style={labelStyle}>
        Surname
    </label>

    <input
        name="surname"
        placeholder="Enter surname"
        value={formData.surname}
        onChange={handleChange}
        maxLength={100}
        autoComplete="family-name"
        required
        style={inputStyle}
    />
</div>


                            {/* CLASS */}

                            <div>
                                <label style={labelStyle}>
                                    Class
                                </label>

                                <select
                                    name="current_class"
                                    value={
                                        formData.current_class
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required
                                    disabled={
                                        classesLoading
                                    }
                                    style={inputStyle}
                                >

                                    <option value="">
                                        {classesLoading
                                            ? 'Loading classes...'
                                            : 'Select Class'}
                                    </option>

                                    {classes.map(
                                        schoolClass => (

                                            <option
                                                key={
                                                    schoolClass.id
                                                }
                                                value={
                                                    schoolClass.class_name
                                                }
                                            >
                                                {
                                                    schoolClass.class_name
                                                }
                                            </option>

                                        )
                                    )}

                                </select>
                            </div>


                            {/* GENDER */}

                            <div>
                                <label style={labelStyle}>
                                    Gender
                                </label>

                                <select
                                    name="gender"
                                    value={
                                        formData.gender
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    style={inputStyle}
                                >

                                    <option value="Male">
                                        Male
                                    </option>

                                    <option value="Female">
                                        Female
                                    </option>

                                    <option value="Other">
                                        Other
                                    </option>

                                </select>
                            </div>


                            {/* PHONE */}

                            <div>
                                <label style={labelStyle}>
                                    Parent Phone
                                </label>

                                <input
                                    name="parent_phone"
                                    placeholder="Parent phone"
                                    value={
                                        formData.parent_phone
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    style={inputStyle}
                                />
                            </div>


                            {/* EMAIL */}

                            <div>
                                <label style={labelStyle}>
                                    Parent Email
                                </label>

                                <input
                                    name="parent_email"
                                    type="email"
                                    placeholder="Parent email"
                                    value={
                                        formData.parent_email
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    style={inputStyle}
                                />
                            </div>


                            {/* PHOTO */}

                            <div>

                                <label style={labelStyle}>
                                    Passport Photo
                                </label>

                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={
                                        handlePhotoChange
                                    }
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        boxSizing:
                                            'border-box'
                                    }}
                                />

                                <small
                                    style={{
                                        color: '#777'
                                    }}
                                >
                                    Optional. Maximum 5MB.
                                </small>

                            </div>

                        </div>


                        {/* PHOTO PREVIEW */}

                        {photoPreview && (

                            <div
                                style={{
                                    marginTop: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '15px'
                                }}
                            >

                                <img
                                    src={photoPreview}
                                    alt="Passport preview"
                                    style={{
                                        width: '80px',
                                        height: '95px',
                                        objectFit: 'cover',
                                        borderRadius: '6px',
                                        border:
                                            '1px solid #ccc'
                                    }}
                                />

                                <span
                                    style={{
                                        color: '#666',
                                        fontSize: '13px'
                                    }}
                                >
                                    {passportPhoto
                                        ? 'New photo selected'
                                        : 'Current passport photo'}
                                </span>

                            </div>

                        )}


                        {/* BUTTON */}

                        <button
                            type="submit"
                            disabled={
                                saving ||
                                classesLoading ||
                                classes.length === 0
                            }
                            style={{
                                marginTop: '20px',
                                background:
                                    saving ||
                                    classesLoading ||
                                    classes.length === 0
                                        ? '#aaa'
                                        : '#27ae60',
                                color: 'white',
                                border: 'none',
                                padding:
                                    '12px 22px',
                                borderRadius: '6px',
                                cursor:
                                    saving ||
                                    classesLoading ||
                                    classes.length === 0
                                        ? 'not-allowed'
                                        : 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            {saving
                                ? 'Saving...'
                                : editingStudent
                                    ? 'Update Student'
                                    : 'Add Student'}
                        </button>

                    </form>


                    {!classesLoading &&
                        classes.length === 0 && (

                            <p
                                style={{
                                    color: '#c62828',
                                    marginTop: '15px'
                                }}
                            >
                                No classes have been
                                created yet. Go to
                                <strong> Classes </strong>
                                and add a class before
                                adding students.
                            </p>

                        )}

                </div>


                {/* =================================================
                    CLASSES
                ================================================= */}

                <div
                    style={{
                        background: 'white',
                        padding: '25px',
                        borderRadius: '10px',
                        boxShadow:
                            '0 2px 8px rgba(0,0,0,0.08)',
                        marginBottom: '30px'
                    }}
                >

                    <div
                        style={{
                            display: 'flex',
                            justifyContent:
                                'space-between',
                            alignItems: 'center',
                            marginBottom: '20px'
                        }}
                    >

                        <div>

                            <h3
                                style={{
                                    margin: 0
                                }}
                            >
                                Classes
                            </h3>

                            <p
                                style={{
                                    color: '#777',
                                    margin:
                                        '5px 0 0'
                                }}
                            >
                                Select a class to view
                                its students.
                            </p>

                        </div>

                        <button
                            onClick={async () => {
                                await fetchStudents();
                                await fetchClasses();
                            }}
                            style={{
                                padding:
                                    '8px 14px',
                                border:
                                    '1px solid #ccc',
                                background:
                                    'white',
                                borderRadius:
                                    '5px',
                                cursor:
                                    'pointer'
                            }}
                        >
                            🔄 Refresh
                        </button>

                    </div>


                    {classesLoading ? (

                        <p>
                            Loading classes...
                        </p>

                    ) : classes.length === 0 ? (

                        <p
                            style={{
                                color: '#777'
                            }}
                        >
                            No classes found.
                        </p>

                    ) : (

                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns:
                                    'repeat(auto-fill, minmax(180px, 1fr))',
                                gap: '15px'
                            }}
                        >

                            {classes.map(
                                schoolClass => {

                                    const isSelected =
                                        selectedClass ===
                                        schoolClass.class_name;

                                    return (

                                        <button
                                            key={
                                                schoolClass.id
                                            }
                                            onClick={() =>
                                                handleClassSelect(
                                                    schoolClass.class_name
                                                )
                                            }
                                            style={{
                                                textAlign:
                                                    'left',
                                                padding:
                                                    '20px',
                                                border:
                                                    isSelected
                                                        ? '2px solid #2c3e50'
                                                        : '1px solid #ddd',
                                                borderRadius:
                                                    '10px',
                                                background:
                                                    isSelected
                                                        ? '#f1f4f6'
                                                        : 'white',
                                                cursor:
                                                    'pointer'
                                            }}
                                        >

                                            <div
                                                style={{
                                                    fontSize:
                                                        '17px',
                                                    fontWeight:
                                                        'bold',
                                                    marginBottom:
                                                        '8px'
                                                }}
                                            >
                                                {
                                                    schoolClass.class_name
                                                }
                                            </div>

                                            <div
                                                style={{
                                                    color:
                                                        '#777',
                                                    fontSize:
                                                        '13px'
                                                }}
                                            >
                                                {
                                                    getClassStudentCount(
                                                        schoolClass.class_name
                                                    )
                                                }{' '}
                                                student
                                                {getClassStudentCount(
                                                    schoolClass.class_name
                                                ) === 1
                                                    ? ''
                                                    : 's'}
                                            </div>

                                        </button>

                                    );
                                }
                            )}

                        </div>

                    )}

                </div>


                {/* =================================================
                    SELECTED CLASS STUDENTS
                ================================================= */}

                {selectedClass && (

                    <div
                        style={{
                            background: 'white',
                            padding: '25px',
                            borderRadius: '10px',
                            boxShadow:
                                '0 2px 8px rgba(0,0,0,0.08)'
                        }}
                    >

                        <div
                            style={{
                                display: 'flex',
                                justifyContent:
                                    'space-between',
                                alignItems: 'center',
                                marginBottom: '20px'
                            }}
                        >

                            <div>

                                <h3
                                    style={{
                                        margin: 0
                                    }}
                                >
                                    Students in{' '}
                                    {selectedClass}
                                </h3>

                                <p
                                    style={{
                                        color: '#777',
                                        margin:
                                            '5px 0 0'
                                    }}
                                >
                                    {
                                        displayedStudents.length
                                    }{' '}
                                    student
                                    {displayedStudents.length ===
                                    1
                                        ? ''
                                        : 's'}
                                </p>

                            </div>

                            <button
                                onClick={() =>
                                    setSelectedClass('')
                                }
                                style={{
                                    padding:
                                        '8px 14px',
                                    border:
                                        '1px solid #ccc',
                                    background:
                                        'white',
                                    borderRadius:
                                        '5px',
                                    cursor:
                                        'pointer'
                                }}
                            >
                                Close
                            </button>

                        </div>


                        {loading ? (

                            <p>
                                Loading students...
                            </p>

                        ) : displayedStudents.length ===
                          0 ? (

                            <div
                                style={{
                                    padding: '30px',
                                    textAlign:
                                        'center',
                                    color: '#777',
                                    border:
                                        '1px dashed #ccc',
                                    borderRadius:
                                        '8px'
                                }}
                            >
                                No students in this
                                class yet.
                            </div>

                        ) : (

                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns:
                                        'repeat(auto-fill, minmax(280px, 1fr))',
                                    gap: '15px'
                                }}
                            >

                                {displayedStudents.map(
                                    student => (

                                        <div
                                            key={
                                                student.id
                                            }
                                            style={{
                                                border:
                                                    '1px solid #e1e1e1',
                                                borderRadius:
                                                    '10px',
                                                padding:
                                                    '15px',
                                                display:
                                                    'flex',
                                                alignItems:
                                                    'center',
                                                gap: '14px'
                                            }}
                                        >

                                            {/* PHOTO */}

                                            {student.passport_photo_url ? (

                                                <img
                                                    src={getImageUrl(
                                                        student.passport_photo_url
                                                    )}
                                                    alt={
                                                        student.full_name
                                                    }
                                                    style={{
                                                        width:
                                                            '58px',
                                                        height:
                                                            '58px',
                                                        borderRadius:
                                                            '50%',
                                                        objectFit:
                                                            'cover',
                                                        border:
                                                            '2px solid #eee'
                                                    }}
                                                />

                                            ) : (

                                                <div
                                                    style={{
                                                        width:
                                                            '58px',
                                                        height:
                                                            '58px',
                                                        borderRadius:
                                                            '50%',
                                                        background:
                                                            '#e9ecef',
                                                        display:
                                                            'flex',
                                                        alignItems:
                                                            'center',
                                                        justifyContent:
                                                            'center',
                                                        fontWeight:
                                                            'bold',
                                                        color:
                                                            '#777',
                                                        fontSize:
                                                            '18px'
                                                    }}
                                                >
                                                    {
                                                        student.full_name
                                                            ?.charAt(
                                                                0
                                                            )
                                                            ?.toUpperCase()
                                                    }
                                                </div>

                                            )}


                                            {/* DETAILS */}

                                            <div
                                                style={{
                                                    flex: 1,
                                                    minWidth: 0
                                                }}
                                            >

                                                <div
                                                    style={{
                                                        fontWeight:
                                                            'bold',
                                                        fontSize:
                                                            '15px',
                                                        marginBottom:
                                                            '5px'
                                                    }}
                                                >
                                                    {
                                                        student.full_name
                                                    }
                                                </div>




                                                {/* ADMISSION NUMBER */}

<div
    style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '5px',
        fontSize: '12px',
        marginBottom: '6px'
    }}
>
    <span
        style={{
            color: '#777'
        }}
    >
        Admission No.:
    </span>

    {student.admission_number ? (
        <span
            title="Student admission number"
            style={{
                fontWeight: '600',
                color: '#2563eb',
                overflowWrap: 'anywhere',
                fontFamily: 'monospace'
            }}
        >
            {student.admission_number}
        </span>
    ) : (
        <span
            style={{
                color: '#999',
                fontStyle: 'italic'
            }}
        >
            Not assigned
        </span>
    )}
</div>







                                                <div
                                                    style={{
                                                        fontSize:
                                                            '12px',
                                                        color:
                                                            '#777',
                                                        marginBottom:
                                                            '3px'
                                                    }}
                                                >
                                                    {
                                                        student.gender ||
                                                        'Other'
                                                    }
                                                </div>

                                                <div
                                                    style={{
                                                        fontSize:
                                                            '12px',
                                                        color:
                                                            '#777'
                                                    }}
                                                >
                                                    {student.parent_phone ||
                                                        'No parent phone'}
                                                </div>

                                            </div>


                                            {/* EDIT */}

                                            <button
                                                onClick={() =>
                                                    startEdit(
                                                        student
                                                    )
                                                }
                                                style={{
                                                    border:
                                                        '1px solid #ccc',
                                                    background:
                                                        'white',
                                                    padding:
                                                        '7px 10px',
                                                    borderRadius:
                                                        '5px',
                                                    cursor:
                                                        'pointer'
                                                }}
                                            >
                                                ✏️ Edit
                                            </button>

                                        </div>

                                    )
                                )}

                            </div>

                        )}

                    </div>

                )}

            </div>

        </div>
    );
}


// =====================================================
// STYLES
// =====================================================

const labelStyle = {
    display: 'block',
    fontWeight: 'bold',
    marginBottom: '6px',
    fontSize: '13px',
    color: '#333'
};

const inputStyle = {
    padding: '11px',
    border: '1px solid #ccc',
    borderRadius: '6px',
    fontSize: '14px',
    boxSizing: 'border-box',
    width: '100%',
    background: 'white'
};