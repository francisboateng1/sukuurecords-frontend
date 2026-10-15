import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function TeacherAttendance() {

    const navigate = useNavigate();

    // =====================================================
    // STATE
    // =====================================================

    const [assignments, setAssignments] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    

    const [students, setStudents] = useState([]);
    const [attendance, setAttendance] = useState({});

    const [selectedDate, setSelectedDate] = useState(() => {
        const today = new Date();

        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    });

    const [term, setTerm] = useState('');
    const [academicYear, setAcademicYear] = useState('');

    const [loadingAssignments, setLoadingAssignments] = useState(true);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [saving, setSaving] = useState(false);

    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    // =====================================================
    // LOAD TEACHER PROFILE + ASSIGNMENTS
    // =====================================================

    useEffect(() => {
        loadTeacherProfile();
    }, []);

  const loadTeacherProfile = async () => {
    try {
        setLoadingAssignments(true);
        setError('');

        // =================================================
        // LOAD TEACHER PROFILE + ASSIGNMENTS
        // =================================================

        const response = await api.get(
            '/assessments/teacher/profile'
        );

        console.log(
            'TEACHER PROFILE RESPONSE:',
            response.data
        );

        const teacherAssignments =
            response.data?.assignments || [];

            alert(
    JSON.stringify(
        response.data,
        null,
        2
    )
);

        console.log(
            'TEACHER ASSIGNMENTS:',
            teacherAssignments
        );

        setAssignments(teacherAssignments);

        // =================================================
        // SELECT FIRST ASSIGNED CLASS
        // =================================================

        const uniqueClassMap = new Map();

        teacherAssignments.forEach(assignment => {

            if (
                assignment.class_id !== undefined &&
                assignment.class_id !== null
            ) {
                const classId =
                    String(assignment.class_id);

                if (!uniqueClassMap.has(classId)) {
                    uniqueClassMap.set(
                        classId,
                        assignment
                    );
                }
            }
        });

        const uniqueClasses =
            Array.from(uniqueClassMap.values());

        console.log(
            'UNIQUE TEACHER CLASSES:',
            uniqueClasses
        );

        if (uniqueClasses.length > 0) {
            setSelectedClass(
                String(uniqueClasses[0].class_id)
            );
        }

    } catch (err) {

        console.error(
            'Error loading teacher profile:',
            err
        );

        setError(
            err.response?.data?.message ||
            'Failed to load teacher assignments.'
        );

    } finally {
        setLoadingAssignments(false);
    }

    // =====================================================
    // LOAD SCHOOL SETTINGS SEPARATELY
    // =====================================================

    try {

        const settingsResponse = await api.get(
            '/settings'
        );

        console.log(
            'SCHOOL SETTINGS:',
            settingsResponse.data
        );

        const settings =
            settingsResponse.data || {};

        setTerm(
            settings.current_term || ''
        );

        setAcademicYear(
            settings.academic_year || ''
        );

    } catch (err) {

        console.error(
            'Error loading school settings:',
            err
        );

        // Do NOT clear teacher assignments
        // if settings fail.
    }
};








    // =====================================================
    // UNIQUE CLASSES
    // =====================================================

 const uniqueClasses = useMemo(() => {

    const seen = new Set();
    const result = [];

    assignments.forEach(assignment => {

        if (
            assignment.class_id === undefined ||
            assignment.class_id === null
        ) {
            return;
        }

        const classId =
            String(assignment.class_id);

        if (!seen.has(classId)) {

            seen.add(classId);

            result.push({
                ...assignment,
                class_id: classId
            });
        }
    });

    return result;

}, [assignments]);

    // =====================================================
    // LOAD STUDENTS + ATTENDANCE
    // =====================================================

    useEffect(() => {

        if (
            !selectedClass ||
            !selectedDate
        ) {
            return;
        }

        loadAttendance();

    }, [
        selectedClass,
        selectedDate
    ]);

    const loadAttendance = async () => {

        try {

            setLoadingStudents(true);
            setError('');
            setMessage('');

            const response = await api.get(
                `/assessments/teacher/attendance/${selectedClass}`,
                {
                    params: {
                        date: selectedDate
                    }
                }
            );

            const loadedStudents =
                response.data?.students || [];

            setStudents(loadedStudents);

            // ------------------------------------------------
            // Build attendance state
            // ------------------------------------------------

            const attendanceState = {};

            loadedStudents.forEach(student => {

                attendanceState[student.id] = {
                    status:
                        student.attendance_status ||
                        'Present',

                    remarks:
                        student.attendance_remarks ||
                        ''
                };
            });

            setAttendance(attendanceState);

            // ------------------------------------------------
            // Use backend's authoritative settings
            // ------------------------------------------------

            if (response.data?.term) {
                setTerm(response.data.term);
            }

            if (response.data?.academic_year) {
                setAcademicYear(
                    response.data.academic_year
                );
            }

        } catch (err) {

            console.error(
                'Error loading attendance:',
                err
            );

            setStudents([]);
            setAttendance({});

            setError(
                err.response?.data?.message ||
                'Failed to load attendance.'
            );

        } finally {

            setLoadingStudents(false);
        }
    };

    // =====================================================
    // CHANGE ATTENDANCE STATUS
    // =====================================================

    const handleStatusChange = (
        studentId,
        status
    ) => {

        setAttendance(prev => ({
            ...prev,

            [studentId]: {
                ...(prev[studentId] || {}),
                status
            }
        }));

        setMessage('');
        setError('');
    };

    // =====================================================
    // CHANGE REMARK
    // =====================================================

    const handleRemarkChange = (
        studentId,
        remarks
    ) => {

        setAttendance(prev => ({
            ...prev,

            [studentId]: {
                ...(prev[studentId] || {}),
                remarks
            }
        }));

        setMessage('');
        setError('');
    };

    // =====================================================
    // MARK EVERYONE PRESENT
    // =====================================================

    const markAllPresent = () => {

        const updated = {};

        students.forEach(student => {

            updated[student.id] = {
                ...(attendance[student.id] || {}),
                status: 'Present'
            };
        });

        setAttendance(updated);

        setMessage('');
        setError('');
    };

    // =====================================================
    // SAVE ATTENDANCE
    // =====================================================

    const handleSaveAttendance = async () => {

        if (!selectedClass) {

            setError(
                'Please select a class.'
            );

            return;
        }

        if (!selectedDate) {

            setError(
                'Please select a date.'
            );

            return;
        }

        if (students.length === 0) {

            setError(
                'There are no students to save attendance for.'
            );

            return;
        }

        try {

            setSaving(true);
            setError('');
            setMessage('');

            const attendancePayload =
                students.map(student => ({

                    student_id: student.id,

                    status:
                        attendance[student.id]?.status ||
                        'Present',

                    remarks:
                        attendance[student.id]?.remarks ||
                        null

                }));

            const response = await api.post(
                '/assessments/teacher/bulk-attendance',
                {
                    class_id: Number(selectedClass),
                    date: selectedDate,
                    attendance: attendancePayload
                }
            );

            setMessage(
                response.data?.message ||
                'Attendance saved successfully.'
            );

            // ------------------------------------------------
            // Reload from database
            // ------------------------------------------------

            await loadAttendance();

        } catch (err) {

            console.error(
                'Error saving attendance:',
                err
            );

            setError(
                err.response?.data?.message ||
                'Failed to save attendance.'
            );

        } finally {

            setSaving(false);
        }
    };

    // =====================================================
    // SELECTED CLASS NAME
    // =====================================================

    const selectedClassObject =
        uniqueClasses.find(
            item =>
                String(item.class_id) ===
                String(selectedClass)
        );

    // =====================================================
    // UI
    // =====================================================

    return (
        <div
            style={{
                padding: '20px',
                maxWidth: '1100px',
                margin: '0 auto',
                fontFamily: 'sans-serif'
            }}
        >

            {/* BACK */}

            <button
                onClick={() => navigate(-1)}
                style={{
                    marginBottom: '20px',
                    padding: '8px 12px',
                    cursor: 'pointer'
                }}
            >
                ← Back to Dashboard
            </button>

            {/* HEADER */}

            <h2>
                📅 Take Attendance
            </h2>

            <p>
                Record daily attendance for students in
                your assigned classes.
            </p>

            {/* ERROR */}

            {error && (
                <div
                    style={{
                        background: '#ffe5e5',
                        color: '#b00020',
                        padding: '12px',
                        borderRadius: '6px',
                        marginBottom: '15px'
                    }}
                >
                    {error}
                </div>
            )}

            {/* SUCCESS */}

            {message && (
                <div
                    style={{
                        background: '#e7f7e7',
                        color: '#176b2c',
                        padding: '12px',
                        borderRadius: '6px',
                        marginBottom: '15px'
                    }}
                >
                    {message}
                </div>
            )}

            {/* LOADING */}

            {loadingAssignments ? (

                <p>
                    Loading your classes...
                </p>

            ) : uniqueClasses.length === 0 ? (

                <div
                    style={{
                        background: '#fff7e6',
                        border: '1px solid #f0c36d',
                        padding: '15px',
                        borderRadius: '8px'
                    }}
                >
                    You are not currently assigned to
                    any classes.
                </div>

            ) : (

                <>
                    {/* CONTROLS */}

                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns:
                                'repeat(auto-fit, minmax(220px, 1fr))',
                            gap: '15px',
                            background: '#f9f9f9',
                            padding: '20px',
                            borderRadius: '8px',
                            border: '1px solid #ddd',
                            marginBottom: '20px'
                        }}
                    >

                        {/* CLASS */}

                        <div>

                            <label
                                style={{
                                    display: 'block',
                                    fontWeight: '600',
                                    marginBottom: '6px'
                                }}
                            >
                                Class
                            </label>

                            <select
                                value={selectedClass}
                                onChange={e =>
                                    setSelectedClass(
                                        e.target.value
                                    )
                                }
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    borderRadius: '5px',
                                    border: '1px solid #ccc'
                                }}
                            >

                                {uniqueClasses.map(
                                    assignment => (
                                        <option
                                            key={
                                                assignment.class_id
                                            }
                                            value={
                                                assignment.class_id
                                            }
                                        >
                                            {
                                                assignment.class_name
                                            }
                                        </option>
                                    )
                                )}

                            </select>

                        </div>

                        {/* DATE */}

                        <div>

                            <label
                                style={{
                                    display: 'block',
                                    fontWeight: '600',
                                    marginBottom: '6px'
                                }}
                            >
                                Attendance Date
                            </label>

                            <input
                                type="date"
                                value={selectedDate}
                                onChange={e =>
                                    setSelectedDate(
                                        e.target.value
                                    )
                                }
                                style={{
                                    width: '100%',
                                    padding: '9px',
                                    borderRadius: '5px',
                                    border: '1px solid #ccc'
                                }}
                            />

                        </div>

                        {/* TERM */}

                        <div>

                            <label
                                style={{
                                    display: 'block',
                                    fontWeight: '600',
                                    marginBottom: '6px'
                                }}
                            >
                                Term
                            </label>

                            <input
                                value={term}
                                readOnly
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    borderRadius: '5px',
                                    border: '1px solid #ddd',
                                    background: '#eee'
                                }}
                            />

                        </div>

                        {/* ACADEMIC YEAR */}

                        <div>

                            <label
                                style={{
                                    display: 'block',
                                    fontWeight: '600',
                                    marginBottom: '6px'
                                }}
                            >
                                Academic Year
                            </label>

                            <input
                                value={academicYear}
                                readOnly
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    borderRadius: '5px',
                                    border: '1px solid #ddd',
                                    background: '#eee'
                                }}
                            />

                        </div>

                    </div>

                    {/* CLASS HEADER */}

                    {selectedClassObject && (
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '15px',
                                flexWrap: 'wrap',
                                gap: '10px'
                            }}
                        >

                            <div>
                                <h3
                                    style={{
                                        margin: 0
                                    }}
                                >
                                    {
                                        selectedClassObject.class_name
                                    }
                                </h3>

                                <small>
                                    {selectedDate}
                                </small>
                            </div>

                            <button
                                type="button"
                                onClick={markAllPresent}
                                disabled={
                                    loadingStudents ||
                                    students.length === 0
                                }
                                style={{
                                    padding: '9px 14px',
                                    cursor: 'pointer'
                                }}
                            >
                                Mark All Present
                            </button>

                        </div>
                    )}

                    {/* STUDENTS */}

                    {loadingStudents ? (

                        <p>
                            Loading students...
                        </p>

                    ) : students.length === 0 ? (

                        <div
                            style={{
                                background: '#f9f9f9',
                                padding: '20px',
                                borderRadius: '8px',
                                border: '1px solid #ddd'
                            }}
                        >
                            No students found in this
                            class.
                        </div>

                    ) : (

                        <div
                            style={{
                                overflowX: 'auto',
                                border: '1px solid #ddd',
                                borderRadius: '8px'
                            }}
                        >

                            <table
                                style={{
                                    width: '100%',
                                    borderCollapse:
                                        'collapse'
                                }}
                            >

                                <thead>

                                    <tr
                                        style={{
                                            background:
                                                '#f5f5f5'
                                        }}
                                    >

                                        <th
                                            style={{
                                                padding: '12px',
                                                textAlign:
                                                    'left',
                                                borderBottom:
                                                    '1px solid #ddd'
                                            }}
                                        >
                                            #
                                        </th>

                                        <th
                                            style={{
                                                padding: '12px',
                                                textAlign:
                                                    'left',
                                                borderBottom:
                                                    '1px solid #ddd'
                                            }}
                                        >
                                            Student
                                        </th>

                                        <th
                                            style={{
                                                padding: '12px',
                                                textAlign:
                                                    'left',
                                                borderBottom:
                                                    '1px solid #ddd'
                                            }}
                                        >
                                            Status
                                        </th>

                                        <th
                                            style={{
                                                padding: '12px',
                                                textAlign:
                                                    'left',
                                                borderBottom:
                                                    '1px solid #ddd'
                                            }}
                                        >
                                            Remarks
                                        </th>

                                    </tr>

                                </thead>

                                <tbody>

                                    {students.map(
                                        (student, index) => (

                                            <tr
                                                key={
                                                    student.id
                                                }
                                            >

                                                <td
                                                    style={{
                                                        padding:
                                                            '12px',
                                                        borderBottom:
                                                            '1px solid #eee'
                                                    }}
                                                >
                                                    {index + 1}
                                                </td>

                                                <td
                                                    style={{
                                                        padding:
                                                            '12px',
                                                        borderBottom:
                                                            '1px solid #eee',
                                                        fontWeight:
                                                            '500'
                                                    }}
                                                >
                                                    {
                                                        student.full_name
                                                    }
                                                </td>

                                                <td
                                                    style={{
                                                        padding:
                                                            '12px',
                                                        borderBottom:
                                                            '1px solid #eee'
                                                    }}
                                                >

                                                    <select
                                                        value={
                                                            attendance[
                                                                student.id
                                                            ]?.status ||
                                                            'Present'
                                                        }
                                                        onChange={e =>
                                                            handleStatusChange(
                                                                student.id,
                                                                e.target.value
                                                            )
                                                        }
                                                        style={{
                                                            padding:
                                                                '8px',
                                                            borderRadius:
                                                                '5px',
                                                            border:
                                                                '1px solid #ccc'
                                                        }}
                                                    >

                                                        <option value="Present">
                                                            Present
                                                        </option>

                                                        <option value="Absent">
                                                            Absent
                                                        </option>

                                                        <option value="Late">
                                                            Late
                                                        </option>

                                                    </select>

                                                </td>

                                                <td
                                                    style={{
                                                        padding:
                                                            '12px',
                                                        borderBottom:
                                                            '1px solid #eee'
                                                    }}
                                                >

                                                    <input
                                                        type="text"
                                                        value={
                                                            attendance[
                                                                student.id
                                                            ]?.remarks ||
                                                            ''
                                                        }
                                                        onChange={e =>
                                                            handleRemarkChange(
                                                                student.id,
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder="Optional"
                                                        maxLength={255}
                                                        style={{
                                                            width:
                                                                '100%',
                                                            minWidth:
                                                                '180px',
                                                            padding:
                                                                '8px',
                                                            borderRadius:
                                                                '5px',
                                                            border:
                                                                '1px solid #ccc',
                                                            boxSizing:
                                                                'border-box'
                                                        }}
                                                    />

                                                </td>

                                            </tr>

                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>

                    )}

                    {/* SAVE */}

                    {students.length > 0 && (

                        <div
                            style={{
                                display: 'flex',
                                justifyContent:
                                    'flex-end',
                                marginTop: '20px'
                            }}
                        >

                            <button
                                type="button"
                                onClick={
                                    handleSaveAttendance
                                }
                                disabled={
                                    saving ||
                                    loadingStudents
                                }
                                style={{
                                    padding:
                                        '11px 20px',
                                    cursor:
                                        saving
                                            ? 'not-allowed'
                                            : 'pointer',
                                    fontWeight: '600'
                                }}
                            >
                                {saving
                                    ? 'Saving Attendance...'
                                    : 'Save Attendance'}
                            </button>

                        </div>

                    )}

                </>
            )}

        </div>
    );
}