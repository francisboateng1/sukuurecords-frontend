import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function TeacherMarks() {
    const navigate = useNavigate();

    const [assignments, setAssignments] = useState([]);
    const [selectedAssignment, setSelectedAssignment] = useState(null);

    const [students, setStudents] = useState([]);
    const [marks, setMarks] = useState({});

    // ==================================================
    // SCHOOL-CONTROLLED ACADEMIC SETTINGS
    // ==================================================

    const [term, setTerm] = useState('');
    const [academicYear, setAcademicYear] = useState('');

    const [loadingSettings, setLoadingSettings] = useState(true);
    const [loadingAssignments, setLoadingAssignments] = useState(true);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [saving, setSaving] = useState(false);

    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    // ==================================================
    // LOAD SCHOOL SETTINGS
    // ==================================================

    useEffect(() => {
        const loadSettings = async () => {
            try {
                setLoadingSettings(true);
                setError('');

                const response = await api.get('/settings');

                const settings = response.data || {};

                const loadedAcademicYear =
                    settings.academic_year || '';

                const loadedTerm =
                    settings.current_term || '';

                if (!loadedAcademicYear) {
                    setError(
                        'Academic year has not been configured by the administrator.'
                    );
                }

                if (!loadedTerm) {
                    setError(
                        'Current term has not been configured by the administrator.'
                    );
                }

                setAcademicYear(loadedAcademicYear);
                setTerm(loadedTerm);

            } catch (err) {
                console.error(
                    'Error loading school settings:',
                    err
                );

                setError(
                    err.response?.data?.message ||
                    'Failed to load school academic settings.'
                );

            } finally {
                setLoadingSettings(false);
            }
        };

        loadSettings();
    }, []);

    // ==================================================
    // LOAD TEACHER PROFILE + ASSIGNMENTS
    // ==================================================

    useEffect(() => {
        const loadAssignments = async () => {
            try {
                setLoadingAssignments(true);
                setError('');

                const response = await api.get(
                    '/assessments/teacher/profile'
                );

                const loadedAssignments =
                    response.data?.assignments || [];

                setAssignments(loadedAssignments);

            } catch (err) {
                console.error(
                    'Error loading teacher assignments:',
                    err
                );

                setError(
                    err.response?.data?.message ||
                    'Failed to load your assigned classes and subjects.'
                );

            } finally {
                setLoadingAssignments(false);
            }
        };

        loadAssignments();
    }, []);

    // ==================================================
    // LOAD STUDENTS + EXISTING MARKS
    // ==================================================

    useEffect(() => {

        // Do not load marks until school settings
        // have been loaded.
        if (
            loadingSettings ||
            !term ||
            !academicYear ||
            !selectedAssignment
        ) {
            if (!selectedAssignment) {
                setStudents([]);
                setMarks({});
            }

            return;
        }

        const loadStudentsAndMarks = async () => {
            try {
                setLoadingStudents(true);
                setError('');
                setMessage('');
                setStudents([]);
                setMarks({});

                const classId =
                    selectedAssignment.class_id;

                const subjectId =
                    selectedAssignment.subject_id;

                // ------------------------------------------
                // LOAD STUDENTS
                // ------------------------------------------

                const studentsResponse = await api.get(
                    `/assessments/teacher/students/${classId}`
                );

                const loadedStudents =
                    Array.isArray(studentsResponse.data)
                        ? studentsResponse.data
                        : studentsResponse.data?.students || [];

                setStudents(loadedStudents);

                // ------------------------------------------
                // LOAD EXISTING MARKS
                // ------------------------------------------

                const marksResponse = await api.get(
                    `/assessments/teacher/marks/${classId}/${subjectId}`,
                    {
                        params: {
                            term,
                            academic_year: academicYear
                        }
                    }
                );

                const existingMarks =
                    marksResponse.data?.marks || [];

                const marksMap = {};

                existingMarks.forEach((item) => {
                    marksMap[item.student_id] = {
                        class_score:
                            item.class_score ?? '',

                        exam_score:
                            item.exam_score ?? '',

                        total_score:
                            item.total_score ?? ''
                    };
                });

                setMarks(marksMap);

            } catch (err) {
                console.error(
                    'Error loading students and marks:',
                    err
                );

                setStudents([]);
                setMarks({});

                setError(
                    err.response?.data?.message ||
                    'Failed to load students and marks.'
                );

            } finally {
                setLoadingStudents(false);
            }
        };

        loadStudentsAndMarks();

    }, [
        selectedAssignment,
        term,
        academicYear,
        loadingSettings
    ]);

    // ==================================================
    // HANDLE ASSIGNMENT CHANGE
    // ==================================================

    const handleAssignmentChange = (event) => {

        const assignmentId = event.target.value;

        const assignment = assignments.find(
            (item) =>
                String(item.assignment_id) ===
                String(assignmentId)
        );

        setSelectedAssignment(
            assignment || null
        );

        setError('');
        setMessage('');
    };

    // ==================================================
    // HANDLE SCORE CHANGE
    // ==================================================

    const handleScoreChange = (
        studentId,
        field,
        value
    ) => {

        // Allow empty input
        if (value === '') {

            setMarks((previous) => {

                const current =
                    previous[studentId] || {};

                const classScore =
                    field === 'class_score'
                        ? 0
                        : Number(
                            current.class_score || 0
                        );

                const examScore =
                    field === 'exam_score'
                        ? 0
                        : Number(
                            current.exam_score || 0
                        );

                return {
                    ...previous,

                    [studentId]: {
                        ...current,

                        [field]: '',

                        total_score:
                            classScore + examScore
                    }
                };
            });

            return;
        }

        const numericValue = Number(value);

        if (Number.isNaN(numericValue)) {
            return;
        }

        // ----------------------------------------------
        // CLASS SCORE
        // ----------------------------------------------

        if (
            field === 'class_score' &&
            (
                numericValue < 0 ||
                numericValue > 30
            )
        ) {
            return;
        }

        // ----------------------------------------------
        // EXAM SCORE
        // ----------------------------------------------

        if (
            field === 'exam_score' &&
            (
                numericValue < 0 ||
                numericValue > 70
            )
        ) {
            return;
        }

        setMarks((previous) => {

            const current =
                previous[studentId] || {};

            const classScore =
                field === 'class_score'
                    ? numericValue
                    : Number(
                        current.class_score || 0
                    );

            const examScore =
                field === 'exam_score'
                    ? numericValue
                    : Number(
                        current.exam_score || 0
                    );

            return {
                ...previous,

                [studentId]: {
                    ...current,

                    [field]: numericValue,

                    total_score:
                        classScore + examScore
                }
            };
        });
    };

    // ==================================================
    // SAVE ALL MARKS
    // ==================================================

    const saveAllMarks = async () => {

        if (!selectedAssignment) {
            setError(
                'Please select a class and subject first.'
            );
            return;
        }

        if (!term || !academicYear) {
            setError(
                'Academic year and current term have not been configured by the administrator.'
            );
            return;
        }

        if (students.length === 0) {
            setError(
                'There are no students to save marks for.'
            );
            return;
        }

        setSaving(true);
        setError('');
        setMessage('');

        try {

            const marksToSave = [];

            // ------------------------------------------
            // VALIDATE ALL STUDENTS FIRST
            // ------------------------------------------

            for (const student of students) {

                const studentMarks =
                    marks[student.id];

                // Skip students where no marks were entered
                if (
                    !studentMarks ||
                    (
                        studentMarks.class_score === '' &&
                        studentMarks.exam_score === ''
                    )
                ) {
                    continue;
                }

                const classScore =
                    Number(
                        studentMarks.class_score
                    );

                const examScore =
                    Number(
                        studentMarks.exam_score
                    );

                if (
                    Number.isNaN(classScore) ||
                    classScore < 0 ||
                    classScore > 30
                ) {
                    setError(
                        `Class score for ${student.full_name} must be between 0 and 30.`
                    );

                    setSaving(false);
                    return;
                }

                if (
                    Number.isNaN(examScore) ||
                    examScore < 0 ||
                    examScore > 70
                ) {
                    setError(
                        `Exam score for ${student.full_name} must be between 0 and 70.`
                    );

                    setSaving(false);
                    return;
                }

                marksToSave.push({
                    student_id: student.id,
                    class_score: classScore,
                    exam_score: examScore
                });
            }

            // ------------------------------------------
            // NOTHING TO SAVE
            // ------------------------------------------

            if (marksToSave.length === 0) {
                setError(
                    'No completed marks were entered.'
                );

                setSaving(false);
                return;
            }

            // ------------------------------------------
            // ONE BULK REQUEST
            // ------------------------------------------

            const response = await api.post(
                '/assessments/teacher/bulk-marks',
                {
                    class_id:
                        selectedAssignment.class_id,

                    subject_id:
                        selectedAssignment.subject_id,

                    marks: marksToSave,

                    // These come from school settings
                    // and cannot be changed by teacher.
                    term,

                    academic_year:
                        academicYear
                }
            );

            setMessage(
                response.data?.message ||
                `Marks saved successfully for ${marksToSave.length} student(s).`
            );

            // ------------------------------------------
            // RELOAD MARKS FROM DATABASE
            // ------------------------------------------

            const marksResponse = await api.get(
                `/assessments/teacher/marks/${selectedAssignment.class_id}/${selectedAssignment.subject_id}`,
                {
                    params: {
                        term,
                        academic_year: academicYear
                    }
                }
            );

            const savedMarks =
                marksResponse.data?.marks || [];

            const updatedMarksMap = {};

            savedMarks.forEach((item) => {

                updatedMarksMap[item.student_id] = {
                    class_score:
                        item.class_score ?? '',

                    exam_score:
                        item.exam_score ?? '',

                    total_score:
                        item.total_score ?? ''
                };
            });

            setMarks(updatedMarksMap);

        } catch (err) {

            console.error(
                'Error saving all marks:',
                err
            );

            setError(
                err.response?.data?.message ||
                'Failed to save marks.'
            );

        } finally {
            setSaving(false);
        }
    };

    // ==================================================
    // STYLES
    // ==================================================

    const inputStyle = {
        width: '90px',
        padding: '8px',
        border: '1px solid #ccc',
        borderRadius: '5px',
        textAlign: 'center',
        fontSize: '14px'
    };

    const selectStyle = {
        padding: '10px',
        border: '1px solid #ccc',
        borderRadius: '6px',
        minWidth: '220px',
        fontSize: '15px'
    };

    // ==================================================
    // UI
    // ==================================================

    return (
        <div
            style={{
                padding: '20px',
                maxWidth: '1100px',
                margin: '0 auto',
                fontFamily: 'sans-serif'
            }}
        >

            {/* ------------------------------------------ */}
            {/* BACK */}
            {/* ------------------------------------------ */}

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

            <h2>📝 Enter Marks</h2>

            <p>
                Enter class and examination scores for your
                assigned students.
            </p>

            {/* ------------------------------------------ */}
            {/* FILTERS */}
            {/* ------------------------------------------ */}

            <div
                style={{
                    background: '#f9f9f9',
                    padding: '20px',
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                    marginTop: '20px'
                }}
            >

                <div
                    style={{
                        display: 'flex',
                        gap: '15px',
                        flexWrap: 'wrap',
                        alignItems: 'center'
                    }}
                >

                    {/* CLASS + SUBJECT */}

                    <div>

                        <label
                            style={{
                                display: 'block',
                                marginBottom: '6px',
                                fontWeight: 'bold'
                            }}
                        >
                            Class & Subject
                        </label>

                        <select
                            value={
                                selectedAssignment
                                    ? selectedAssignment.assignment_id
                                    : ''
                            }
                            onChange={
                                handleAssignmentChange
                            }
                            style={selectStyle}
                        >

                            <option value="">
                                Select assignment
                            </option>

                            {assignments.map(
                                (assignment) => (
                                    <option
                                        key={
                                            assignment.assignment_id
                                        }
                                        value={
                                            assignment.assignment_id
                                        }
                                    >
                                        {
                                            assignment.class_name
                                        }
                                        {' — '}
                                        {
                                            assignment.subject_name
                                        }
                                    </option>
                                )
                            )}

                        </select>

                    </div>

                    {/* TERM */}

                    <div>

                        <label
                            style={{
                                display: 'block',
                                marginBottom: '6px',
                                fontWeight: 'bold'
                            }}
                        >
                            Current Term
                        </label>

                        <input
                            type="text"
                            value={
                                loadingSettings
                                    ? 'Loading...'
                                    : term
                            }
                            readOnly
                            style={{
                                ...selectStyle,
                                minWidth: '150px',
                                background: '#f1f1f1',
                                cursor: 'not-allowed'
                            }}
                        />

                    </div>

                    {/* ACADEMIC YEAR */}

                    <div>

                        <label
                            style={{
                                display: 'block',
                                marginBottom: '6px',
                                fontWeight: 'bold'
                            }}
                        >
                            Academic Year
                        </label>

                        <input
                            type="text"
                            value={
                                loadingSettings
                                    ? 'Loading...'
                                    : academicYear
                            }
                            readOnly
                            style={{
                                ...selectStyle,
                                minWidth: '150px',
                                background: '#f1f1f1',
                                cursor: 'not-allowed'
                            }}
                        />

                    </div>

                </div>

                {/* SETTINGS INFO */}

                {!loadingSettings &&
                    term &&
                    academicYear && (
                        <small
                            style={{
                                display: 'block',
                                marginTop: '15px',
                                color: '#666'
                            }}
                        >
                            Academic year and current term are
                            controlled by the school administrator.
                        </small>
                    )}

            </div>

            {/* ------------------------------------------ */}
            {/* MESSAGES */}
            {/* ------------------------------------------ */}

            {message && (
                <div
                    style={{
                        marginTop: '15px',
                        padding: '12px',
                        background: '#e8f5e9',
                        color: '#2e7d32',
                        borderRadius: '6px'
                    }}
                >
                    {message}
                </div>
            )}

            {error && (
                <div
                    style={{
                        marginTop: '15px',
                        padding: '12px',
                        background: '#ffebee',
                        color: '#c62828',
                        borderRadius: '6px'
                    }}
                >
                    {error}
                </div>
            )}

            {/* ------------------------------------------ */}
            {/* LOADING ASSIGNMENTS */}
            {/* ------------------------------------------ */}

            {loadingAssignments && (
                <p style={{ marginTop: '20px' }}>
                    Loading your assignments...
                </p>
            )}

            {/* ------------------------------------------ */}
            {/* NO ASSIGNMENTS */}
            {/* ------------------------------------------ */}

            {!loadingAssignments &&
                assignments.length === 0 && (
                    <div
                        style={{
                            marginTop: '20px',
                            padding: '20px',
                            background: '#fff8e1',
                            border: '1px solid #ffe082',
                            borderRadius: '8px'
                        }}
                    >
                        <strong>
                            No assignments found.
                        </strong>

                        <p>
                            Please contact the administrator
                            to assign you a class and subject.
                        </p>
                    </div>
                )}

            {/* ------------------------------------------ */}
            {/* LOADING STUDENTS */}
            {/* ------------------------------------------ */}

            {loadingStudents && (
                <p style={{ marginTop: '20px' }}>
                    Loading students...
                </p>
            )}

            {/* ------------------------------------------ */}
            {/* NO STUDENTS */}
            {/* ------------------------------------------ */}

            {!loadingStudents &&
                selectedAssignment &&
                students.length === 0 && (
                    <div
                        style={{
                            marginTop: '20px',
                            padding: '20px',
                            background: '#fff8e1',
                            borderRadius: '8px'
                        }}
                    >
                        No students were found in this class.
                    </div>
                )}

            {/* ------------------------------------------ */}
            {/* STUDENTS TABLE */}
            {/* ------------------------------------------ */}

            {!loadingStudents &&
                selectedAssignment &&
                students.length > 0 && (

                    <div
                        style={{
                            marginTop: '25px'
                        }}
                    >

                        {/* HEADER */}

                        <div
                            style={{
                                display: 'flex',
                                justifyContent:
                                    'space-between',
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
                                        selectedAssignment.class_name
                                    }
                                </h3>

                                <p
                                    style={{
                                        margin: '5px 0'
                                    }}
                                >
                                    Subject:{' '}

                                    <strong>
                                        {
                                            selectedAssignment.subject_name
                                        }
                                    </strong>
                                </p>

                            </div>

                            {/* SAVE ALL */}

                            <button
                                onClick={saveAllMarks}
                                disabled={
                                    saving ||
                                    loadingSettings ||
                                    !term ||
                                    !academicYear
                                }
                                style={{
                                    padding:
                                        '10px 18px',
                                    background:
                                        '#1976d2',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius:
                                        '6px',
                                    cursor:
                                        (
                                            saving ||
                                            loadingSettings ||
                                            !term ||
                                            !academicYear
                                        )
                                            ? 'not-allowed'
                                            : 'pointer',
                                    opacity:
                                        (
                                            saving ||
                                            loadingSettings ||
                                            !term ||
                                            !academicYear
                                        )
                                            ? 0.7
                                            : 1
                                }}
                            >
                                {saving
                                    ? 'Saving...'
                                    : '💾 Save All Marks'}
                            </button>

                        </div>

                        {/* TABLE */}

                        <div
                            style={{
                                overflowX: 'auto',
                                border:
                                    '1px solid #ddd',
                                borderRadius: '8px'
                            }}
                        >

                            <table
                                style={{
                                    width: '100%',
                                    borderCollapse:
                                        'collapse',
                                    minWidth:
                                        '650px'
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
                                            style={
                                                headerStyle
                                            }
                                        >
                                            #
                                        </th>

                                        <th
                                            style={
                                                headerStyle
                                            }
                                        >
                                            Student
                                        </th>

                                        <th
                                            style={
                                                headerStyle
                                            }
                                        >
                                            Class Score
                                            <br />
                                            <small>
                                                / 30
                                            </small>
                                        </th>

                                        <th
                                            style={
                                                headerStyle
                                            }
                                        >
                                            Exam Score
                                            <br />
                                            <small>
                                                / 70
                                            </small>
                                        </th>

                                        <th
                                            style={
                                                headerStyle
                                            }
                                        >
                                            Total
                                            <br />
                                            <small>
                                                / 100
                                            </small>
                                        </th>

                                    </tr>

                                </thead>

                                <tbody>

                                    {students.map(
                                        (
                                            student,
                                            index
                                        ) => {

                                            const studentMarks =
                                                marks[
                                                    student.id
                                                ] || {};

                                            return (
                                                <tr
                                                    key={
                                                        student.id
                                                    }
                                                >

                                                    <td
                                                        style={
                                                            cellStyle
                                                        }
                                                    >
                                                        {
                                                            index +
                                                            1
                                                        }
                                                    </td>

                                                    <td
                                                        style={
                                                            cellStyle
                                                        }
                                                    >
                                                        <strong>
                                                            {
                                                                student.full_name
                                                            }
                                                        </strong>
                                                    </td>

                                                    {/* CLASS SCORE */}

                                                    <td
                                                        style={
                                                            cellStyle
                                                        }
                                                    >
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="30"
                                                            step="0.01"
                                                            value={
                                                                studentMarks.class_score ??
                                                                ''
                                                            }
                                                            onChange={(
                                                                e
                                                            ) =>
                                                                handleScoreChange(
                                                                    student.id,
                                                                    'class_score',
                                                                    e
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                            style={
                                                                inputStyle
                                                            }
                                                        />
                                                    </td>

                                                    {/* EXAM SCORE */}

                                                    <td
                                                        style={
                                                            cellStyle
                                                        }
                                                    >
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="70"
                                                            step="0.01"
                                                            value={
                                                                studentMarks.exam_score ??
                                                                ''
                                                            }
                                                            onChange={(
                                                                e
                                                            ) =>
                                                                handleScoreChange(
                                                                    student.id,
                                                                    'exam_score',
                                                                    e
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                            style={
                                                                inputStyle
                                                            }
                                                        />
                                                    </td>

                                                    {/* TOTAL */}

                                                    <td
                                                        style={{
                                                            ...cellStyle,
                                                            fontWeight:
                                                                'bold'
                                                        }}
                                                    >
                                                        {
                                                            studentMarks.total_score ??
                                                            0
                                                        }
                                                    </td>

                                                </tr>
                                            );
                                        }
                                    )}

                                </tbody>

                            </table>

                        </div>

                        <p
                            style={{
                                marginTop: '12px',
                                color: '#666',
                                fontSize: '14px'
                            }}
                        >
                            Class score is out of 30 and exam
                            score is out of 70. Total score is
                            calculated automatically.
                        </p>

                    </div>
                )}

        </div>
    );
}

// ==================================================
// TABLE STYLES
// ==================================================

const headerStyle = {
    padding: '12px',
    borderBottom: '1px solid #ddd',
    textAlign: 'left'
};

const cellStyle = {
    padding: '12px',
    borderBottom: '1px solid #eee'
};