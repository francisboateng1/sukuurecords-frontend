import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function BulkMarks() {
    const navigate = useNavigate();

    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [students, setStudents] = useState([]);

    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedSubjectId, setSelectedSubjectId] = useState('');

    const [marksData, setMarksData] = useState({});

    const [term, setTerm] = useState('');
    const [academicYear, setAcademicYear] = useState('');

    const [loadingOptions, setLoadingOptions] = useState(true);
    const [loadingMarks, setLoadingMarks] = useState(false);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // ==========================================
    // LOAD CLASSES AND SUBJECTS
    // ==========================================

    useEffect(() => {
        let cancelled = false;

        async function loadOptions() {
            setLoadingOptions(true);
            setError('');

            try {
                const [classesResponse, subjectsResponse] =
                    await Promise.all([
                        api.get('/assessments/admin/classes'),
                        api.get('/assessments/admin/subjects')
                    ]);

                if (cancelled) return;

                const loadedClasses = classesResponse.data;
                const loadedSubjects = subjectsResponse.data;

                setClasses(loadedClasses);
                setSubjects(loadedSubjects);

                if (loadedClasses.length > 0) {
                    setSelectedClassId(String(loadedClasses[0].id));
                }

                if (loadedSubjects.length > 0) {
                    setSelectedSubjectId(String(loadedSubjects[0].id));
                }

            } catch (err) {
                if (cancelled) return;

                setError(
                    err.response?.data?.message ||
                    'Could not load classes and subjects. Check your administrator login and backend.'
                );

            } finally {
                if (!cancelled) {
                    setLoadingOptions(false);
                }
            }
        }

        loadOptions();

        return () => {
            cancelled = true;
        };
    }, []);

    // ==========================================
    // LOAD STUDENTS AND EXISTING MARKS
    // ==========================================

    const loadMarks = useCallback(async () => {
        if (!selectedClassId || !selectedSubjectId) {
            setStudents([]);
            setMarksData({});
            setTerm('');
            setAcademicYear('');
            return;
        }

        setLoadingMarks(true);
        setError('');

        try {
            const response = await api.get(
                '/assessments/admin/bulk-marks',
                {
                    params: {
                        class_id: selectedClassId,
                        subject_id: selectedSubjectId
                    }
                }
            );

            const data = response.data;

            const loadedStudents = data.students || [];
            const initialMarks = {};

            for (const student of loadedStudents) {
                initialMarks[student.student_id] = {
                    class_score:
                        student.class_score === null ||
                        student.class_score === undefined
                            ? ''
                            : String(student.class_score),

                    exam_score:
                        student.exam_score === null ||
                        student.exam_score === undefined
                            ? ''
                            : String(student.exam_score),

                    assessment_id: student.assessment_id ?? null,

                    teacher_id: student.teacher_id ?? null
                };
            }

            setStudents(loadedStudents);
            setMarksData(initialMarks);
            setTerm(data.term || '');
            setAcademicYear(data.academic_year || '');

        } catch (err) {
            setStudents([]);
            setMarksData({});

            setError(
                err.response?.data?.message ||
                'Could not load students and marks.'
            );

        } finally {
            setLoadingMarks(false);
        }
    }, [selectedClassId, selectedSubjectId]);

    useEffect(() => {
        loadMarks();
    }, [loadMarks]);

    // ==========================================
    // UPDATE A SCORE
    // ==========================================

    const handleInputChange = (studentId, field, value) => {
        setMarksData(previous => ({
            ...previous,
            [studentId]: {
                ...previous[studentId],
                [field]: value
            }
        }));

        setSuccess('');
        setError('');
    };

    // ==========================================
    // CALCULATE TOTAL
    // ==========================================

    const calculateTotal = studentId => {
        const mark = marksData[studentId];

        if (
            !mark ||
            mark.class_score === '' ||
            mark.exam_score === ''
        ) {
            return '—';
        }

        const classScore = Number(mark.class_score);
        const examScore = Number(mark.exam_score);

        if (
            !Number.isFinite(classScore) ||
            !Number.isFinite(examScore)
        ) {
            return '—';
        }

        return (classScore + examScore).toFixed(2);
    };

    // ==========================================
    // SAVE ALL ENTERED OR CORRECTED MARKS
    // ==========================================

    const saveAll = async () => {
        setError('');
        setSuccess('');

        if (!selectedClassId || !selectedSubjectId) {
            setError('Please select a class and subject.');
            return;
        }

        // Submit only rows where at least one score has been entered.
        const rowsToSave = students.filter(student => {
            const mark = marksData[student.student_id];

            if (!mark) return false;

            return (
                mark.class_score !== '' ||
                mark.exam_score !== ''
            );
        });

        if (rowsToSave.length === 0) {
            setError('Enter or correct at least one student’s marks before saving.');
            return;
        }

        // Validate every row before sending the batch.
        for (const student of rowsToSave) {
            const mark = marksData[student.student_id];

            if (
                mark.class_score === '' ||
                mark.exam_score === ''
            ) {
                setError(
                    `Complete both scores for ${student.full_name} before saving.`
                );
                return;
            }

            const classScore = Number(mark.class_score);
            const examScore = Number(mark.exam_score);

            if (
                !Number.isFinite(classScore) ||
                classScore < 0 ||
                classScore > 30
            ) {
                setError(
                    `Class score for ${student.full_name} must be between 0 and 30.`
                );
                return;
            }

            if (
                !Number.isFinite(examScore) ||
                examScore < 0 ||
                examScore > 70
            ) {
                setError(
                    `Examination score for ${student.full_name} must be between 0 and 70.`
                );
                return;
            }
        }

        const payload = {
            class_id: Number(selectedClassId),
            subject_id: Number(selectedSubjectId),

            marks: rowsToSave.map(student => {
                const mark = marksData[student.student_id];

                return {
                    student_id: student.student_id,
                    class_score: Number(mark.class_score),
                    exam_score: Number(mark.exam_score)
                };
            })
        };

        setSaving(true);

        try {
            const response = await api.post(
                '/assessments/admin/bulk-marks',
                payload
            );

            const result = response.data;

setSuccess(
    `${result.message || 'Marks saved successfully.'} Created: ${
        result.created_count ?? 0
    }; Updated: ${result.updated_count ?? 0}.`
);

// Reload marks from the database.
await loadMarks();





        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Failed to save marks. Please check your connection and try again.'
            );

        } finally {
            setSaving(false);
        }
    };

    // ==========================================
    // PAGE
    // ==========================================

    return (
        <div style={styles.page}>
            <div style={styles.topBar}>
                <button
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    style={styles.backButton}
                >
                    ← Back to Dashboard
                </button>
            </div>

            <div style={styles.heading}>
                <div>
                    <h1 style={styles.title}>Bulk Marks Entry</h1>

                    <p style={styles.subtitle}>
                        Enter missing marks or correct existing assessment records.
                    </p>
                </div>
            </div>

            {error && (
                <div role="alert" style={styles.error}>
                    {error}
                </div>
            )}

            {success && (
                <div role="status" style={styles.success}>
                    {success}
                </div>
            )}

            <section style={styles.panel}>
                <div style={styles.filters}>
                    <div style={styles.field}>
                        <label htmlFor="bulk-class" style={styles.label}>
                            Class
                        </label>

                        <select
                            id="bulk-class"
                            value={selectedClassId}
                            onChange={event =>
                                setSelectedClassId(event.target.value)
                            }
                            style={styles.select}
                            disabled={loadingOptions || saving}
                        >
                            <option value="">Select a class</option>

                            {classes.map(item => (
                                <option key={item.id} value={item.id}>
                                    {item.class_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={styles.field}>
                        <label htmlFor="bulk-subject" style={styles.label}>
                            Subject
                        </label>

                        <select
                            id="bulk-subject"
                            value={selectedSubjectId}
                            onChange={event =>
                                setSelectedSubjectId(event.target.value)
                            }
                            style={styles.select}
                            disabled={loadingOptions || saving}
                        >
                            <option value="">Select a subject</option>

                            {subjects.map(item => (
                                <option key={item.id} value={item.id}>
                                    {item.subject_name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {term && academicYear && (
                    <div style={styles.sessionInfo}>
                        <span>
                            <strong>Term:</strong> {term}
                        </span>

                        <span>
                            <strong>Academic year:</strong> {academicYear}
                        </span>
                    </div>
                )}
            </section>

            <section style={styles.tablePanel}>
                <div style={styles.tableHeading}>
                    <div>
                        <h2 style={styles.tableTitle}>
                            Student Assessment Records
                        </h2>

                        <p style={styles.tableSubtitle}>
                            Class score: 30 marks · Examination: 70 marks
                        </p>
                    </div>

                    <span style={styles.studentCount}>
                        {students.length} student(s)
                    </span>
                </div>

                {loadingOptions || loadingMarks ? (
                    <div style={styles.emptyState}>
                        Loading students and marks...
                    </div>
                ) : classes.length === 0 || subjects.length === 0 ? (
                    <div style={styles.emptyState}>
                        {classes.length === 0
                            ? 'No classes were found for this school.'
                            : 'No subjects were found for this school.'}
                    </div>
                ) : students.length === 0 ? (
                    <div style={styles.emptyState}>
                        No students were found in the selected class.
                    </div>
                ) : (
                    <div style={styles.tableWrapper}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>Student Name</th>
                                    <th style={styles.th}>Class Score (30)</th>
                                    <th style={styles.th}>Exam Score (70)</th>
                                    <th style={styles.th}>Total (100)</th>
                                    <th style={styles.th}>Record Status</th>
                                </tr>
                            </thead>

                            <tbody>
                                {students.map(student => {
                                    const mark =
                                        marksData[student.student_id] || {};

                                    const hasExistingRecord =
                                        Boolean(mark.assessment_id);

                                    return (
                                        <tr key={student.student_id}>
                                            <td style={styles.td}>
                                                <strong>
                                                    {student.full_name}
                                                </strong>
                                            </td>

                                            <td style={styles.td}>
                                                <input
                                                    aria-label={`Class score for ${student.full_name}`}
                                                    type="number"
                                                    min="0"
                                                    max="30"
                                                    step="0.01"
                                                    value={mark.class_score ?? ''}
                                                    onChange={event =>
                                                        handleInputChange(
                                                            student.student_id,
                                                            'class_score',
                                                            event.target.value
                                                        )
                                                    }
                                                    style={styles.numberInput}
                                                    disabled={saving}
                                                />
                                            </td>

                                            <td style={styles.td}>
                                                <input
                                                    aria-label={`Exam score for ${student.full_name}`}
                                                    type="number"
                                                    min="0"
                                                    max="70"
                                                    step="0.01"
                                                    value={mark.exam_score ?? ''}
                                                    onChange={event =>
                                                        handleInputChange(
                                                            student.student_id,
                                                            'exam_score',
                                                            event.target.value
                                                        )
                                                    }
                                                    style={styles.numberInput}
                                                    disabled={saving}
                                                />
                                            </td>

                                            <td style={styles.total}>
                                                {calculateTotal(
                                                    student.student_id
                                                )}
                                            </td>

                                            <td style={styles.td}>
                                                <span
                                                    style={
                                                        hasExistingRecord
                                                            ? styles.existingBadge
                                                            : styles.missingBadge
                                                    }
                                                >
                                                    {hasExistingRecord
                                                        ? 'Existing marks'
                                                        : 'Missing marks'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                <div style={styles.footer}>
                    <p style={styles.footerNote}>
                        Only students with entered scores will be submitted.
                        Both scores are required for each submitted student.
                    </p>

                    <button
                        type="button"
                        onClick={saveAll}
                        disabled={
                            saving ||
                            loadingOptions ||
                            loadingMarks ||
                            students.length === 0
                        }
                        style={{
                            ...styles.saveButton,
                            opacity: saving ? 0.7 : 1,
                            cursor: saving ? 'wait' : 'pointer'
                        }}
                    >
                        {saving ? 'Saving marks...' : 'Save All Marks'}
                    </button>
                </div>
            </section>
        </div>
    );
}

// ==========================================
// STYLES
// ==========================================

const styles = {
    page: {
        padding: 'clamp(16px, 3vw, 32px)',
        minHeight: '100%',
        background: '#f8fafc',
        color: '#0f172a'
    },

    topBar: {
        marginBottom: '24px'
    },

    backButton: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 16px',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        background: '#fff',
        color: '#334155',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '600'
    },

    heading: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '24px'
    },

    title: {
        margin: '0 0 8px',
        fontSize: 'clamp(24px, 3vw, 32px)',
        fontWeight: '750',
        letterSpacing: '-0.7px'
    },

    subtitle: {
        margin: 0,
        color: '#64748b',
        lineHeight: 1.6
    },

    error: {
        marginBottom: '18px',
        padding: '14px 16px',
        border: '1px solid #fecaca',
        borderRadius: '10px',
        background: '#fef2f2',
        color: '#b91c1c'
    },

    success: {
        marginBottom: '18px',
        padding: '14px 16px',
        border: '1px solid #bbf7d0',
        borderRadius: '10px',
        background: '#f0fdf4',
        color: '#166534'
    },

    panel: {
        marginBottom: '24px',
        padding: '22px',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        background: '#fff',
        boxShadow: '0 4px 18px rgba(15, 23, 42, 0.04)'
    },

    filters: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
        gap: '18px'
    },

    field: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
    },

    label: {
        color: '#334155',
        fontSize: '14px',
        fontWeight: '650'
    },

    select: {
        width: '100%',
        minHeight: '44px',
        padding: '10px 12px',
        border: '1px solid #cbd5e1',
        borderRadius: '9px',
        background: '#fff',
        color: '#0f172a',
        fontSize: '14px'
    },

    sessionInfo: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px 24px',
        marginTop: '20px',
        paddingTop: '16px',
        borderTop: '1px solid #e2e8f0',
        color: '#475569',
        fontSize: '14px'
    },

    tablePanel: {
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        background: '#fff',
        boxShadow: '0 4px 18px rgba(15, 23, 42, 0.04)'
    },

    tableHeading: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '22px'
    },

    tableTitle: {
        margin: '0 0 6px',
        fontSize: '18px',
        fontWeight: '700'
    },

    tableSubtitle: {
        margin: 0,
        color: '#64748b',
        fontSize: '13px'
    },

    studentCount: {
        padding: '7px 11px',
        borderRadius: '20px',
        background: '#eff6ff',
        color: '#1d4ed8',
        fontSize: '13px',
        fontWeight: '650'
    },

    tableWrapper: {
        width: '100%',
        overflowX: 'auto'
    },

    table: {
        width: '100%',
        borderCollapse: 'collapse',
        minWidth: '850px'
    },

    th: {
        padding: '14px 16px',
        textAlign: 'left',
        whiteSpace: 'nowrap',
        background: '#f8fafc',
        color: '#475569',
        borderTop: '1px solid #e2e8f0',
        borderBottom: '1px solid #e2e8f0',
        fontSize: '12px',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '0.4px'
    },

    td: {
        padding: '14px 16px',
        borderBottom: '1px solid #f1f5f9',
        verticalAlign: 'middle',
        fontSize: '14px'
    },

    numberInput: {
        width: '100%',
        minWidth: '95px',
        maxWidth: '130px',
        padding: '10px',
        border: '1px solid #cbd5e1',
        borderRadius: '8px',
        fontSize: '14px',
        boxSizing: 'border-box'
    },

    total: {
        padding: '14px 16px',
        borderBottom: '1px solid #f1f5f9',
        fontWeight: '750',
        color: '#0f172a',
        whiteSpace: 'nowrap'
    },

    existingBadge: {
        display: 'inline-block',
        padding: '6px 9px',
        borderRadius: '20px',
        background: '#dcfce7',
        color: '#166534',
        fontSize: '12px',
        fontWeight: '650',
        whiteSpace: 'nowrap'
    },

    missingBadge: {
        display: 'inline-block',
        padding: '6px 9px',
        borderRadius: '20px',
        background: '#fef3c7',
        color: '#92400e',
        fontSize: '12px',
        fontWeight: '650',
        whiteSpace: 'nowrap'
    },

    emptyState: {
        padding: '48px 20px',
        textAlign: 'center',
        color: '#64748b',
        lineHeight: 1.6
    },

    footer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '18px',
        padding: '20px 22px'
    },

    footerNote: {
        flex: '1 1 280px',
        margin: 0,
        color: '#64748b',
        fontSize: '13px',
        lineHeight: 1.6
    },

    saveButton: {
        padding: '12px 22px',
        border: 'none',
        borderRadius: '10px',
        background: '#15803d',
        color: '#fff',
        fontSize: '14px',
        fontWeight: '700'
    }
};