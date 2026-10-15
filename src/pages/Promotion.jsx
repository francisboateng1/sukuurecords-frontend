import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Promotion() {


    const navigate = useNavigate();

    const [academicYear, setAcademicYear] =
        useState('');

    const [classes, setClasses] =
        useState([]);

    const [selectedClassId, setSelectedClassId] =
        useState('');

    const [selectedClassName, setSelectedClassName] =
        useState('');

    const [students, setStudents] =
        useState([]);

    const [targetClasses, setTargetClasses] =
        useState([]);

    const [effectiveDate, setEffectiveDate] =
        useState(
            new Date().toISOString().split('T')[0]
        );

    const [loading, setLoading] =
        useState(false);

    const [saving, setSaving] =
        useState(false);


    // =====================================================
    // LOAD OVERVIEW
    // =====================================================

    const loadOverview = async () => {

        try {

            setLoading(true);

            const res =
                await api.get(
                    '/promotion/overview'
                );

            setAcademicYear(
                res.data.academic_year
            );

            setClasses(
                res.data.classes || []
            );

        } catch (error) {

            console.error(
                'Promotion overview error:',
                error
            );

            alert(
                error.response?.data?.message ||
                'Failed to load promotion data.'
            );

        } finally {

            setLoading(false);
        }
    };


    useEffect(() => {

        loadOverview();

    }, []);


    // =====================================================
    // TARGET CLASSES
    // =====================================================

    useEffect(() => {

        if (!selectedClassId) {

            setTargetClasses([]);
            return;
        }

        setTargetClasses(
            classes.filter(
                item =>
                    Number(item.id) !==
                    Number(selectedClassId)
            )
        );

    }, [
        selectedClassId,
        classes
    ]);


    // =====================================================
    // LOAD STUDENTS
    // =====================================================

    const loadStudents = async classId => {

        if (!classId) {

            setStudents([]);
            return;
        }

        try {

            setLoading(true);

            const selected =
                classes.find(
                    item =>
                        Number(item.id) ===
                        Number(classId)
                );

            setSelectedClassName(
                selected?.class_name || ''
            );

            const res =
                await api.get(
                    `/promotion/students/${classId}`
                );

            const loadedStudents =
                (res.data.students || [])
                    .map(student => ({
                        ...student,
                        status: 'Promoted',
                        target_class_id: ''
                    }));

            setStudents(
                loadedStudents
            );

        } catch (error) {

            console.error(
                'Student loading error:',
                error
            );

            alert(
                error.response?.data?.message ||
                'Failed to load students.'
            );

            setStudents([]);

        } finally {

            setLoading(false);
        }
    };


    // =====================================================
    // CHANGE DECISION
    // =====================================================

    const updateStudent = (
        studentId,
        field,
        value
    ) => {

        setStudents(previous =>
            previous.map(student => {

                if (
                    Number(student.id) !==
                    Number(studentId)
                ) {
                    return student;
                }

                return {
                    ...student,
                    [field]: value
                };
            })
        );
    };


    // =====================================================
    // PROMOTE ALL
    // =====================================================

    const promoteAll = targetClassId => {

        if (!targetClassId) {

            alert(
                'Select a target class first.'
            );

            return;
        }

        setStudents(previous =>
            previous.map(student => ({
                ...student,
                status: 'Promoted',
                target_class_id:
                    targetClassId
            }))
        );
    };


    // =====================================================
    // REPEAT ALL
    // =====================================================

    const repeatAll = () => {

        setStudents(previous =>
            previous.map(student => ({
                ...student,
                status: 'Repeated',
                target_class_id: ''
            }))
        );
    };


    // =====================================================
    // VALIDATION
    // =====================================================

    const invalidStudents = useMemo(
        () =>
            students.filter(
                student =>
                    student.status === 'Promoted' &&
                    !student.target_class_id
            ),
        [students]
    );


    // =====================================================
    // SAVE PROMOTION
    // =====================================================

    const executePromotion = async () => {

        if (!students.length) {

            alert(
                'There are no students to process.'
            );

            return;
        }


        if (invalidStudents.length > 0) {

            alert(
                `${invalidStudents.length} promoted student(s) do not have a target class.`
            );

            return;
        }


        const confirmed =
            window.confirm(
                `You are about to process ${students.length} students for ${academicYear}.\n\nThis will update their current classes.\n\nContinue?`
            );


        if (!confirmed) {
            return;
        }


        try {

            setSaving(true);


            const promotions =
                students.map(student => ({
                    student_id:
                        student.id,

                    status:
                        student.status,

                    target_class_id:
                        student.target_class_id ||
                        null
                }));


            const res =
                await api.post(
                    '/promotion/execute',
                    {
                        academic_year:
                            academicYear,

                        effective_date:
                            effectiveDate,

                        promotions
                    }
                );


            alert(
                res.data.message
            );


            await loadStudents(
                selectedClassId
            );

            await loadOverview();


        } catch (error) {

            console.error(
                'Promotion save error:',
                error
            );

            alert(
                error.response?.data?.message ||
                'Promotion failed.'
            );

        } finally {

            setSaving(false);
        }
    };


    return (

        <div
            style={{
                padding: '24px',
                maxWidth: '1200px',
                margin: '0 auto'
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



            <h1>
                Academic Promotion
            </h1>


            <p>
                Process student promotion
                for the {academicYear}
                academic year.
            </p>


            {/* ========================================= */}
            {/* SETTINGS */}
            {/* ========================================= */}

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns:
                        '1fr 1fr',
                    gap: '16px',
                    marginBottom: '24px'
                }}
            >

                <div>

                    <label>
                        Academic Year
                    </label>

                    <input
                        value={
                            academicYear
                        }
                        disabled
                        style={{
                            width: '100%',
                            padding: '10px'
                        }}
                    />

                </div>


                <div>

                    <label>
                        Effective Date
                    </label>

                    <input
                        type="date"
                        value={
                            effectiveDate
                        }
                        onChange={e =>
                            setEffectiveDate(
                                e.target.value
                            )
                        }
                        style={{
                            width: '100%',
                            padding: '10px'
                        }}
                    />

                </div>

            </div>


            {/* ========================================= */}
            {/* CLASS */}
            {/* ========================================= */}

            <div
                style={{
                    marginBottom: '24px'
                }}
            >

                <label>
                    Current Class
                </label>

                <select
                    value={
                        selectedClassId
                    }
                    onChange={e => {

                        setSelectedClassId(
                            e.target.value
                        );

                        loadStudents(
                            e.target.value
                        );

                    }}
                    style={{
                        display: 'block',
                        width: '100%',
                        padding: '12px',
                        marginTop: '6px'
                    }}
                >

                    <option value="">
                        Select class
                    </option>

                    {classes.map(item => (

                        <option
                            key={item.id}
                            value={item.id}
                        >
                            {item.class_name}
                            {' '}
                            ({item.student_count}
                            {' '}students)
                        </option>

                    ))}

                </select>

            </div>


            {/* ========================================= */}
            {/* BULK ACTIONS */}
            {/* ========================================= */}

            {students.length > 0 && (

                <div
                    style={{
                        display: 'flex',
                        gap: '10px',
                        marginBottom: '20px'
                    }}
                >

                    <select
                        id="bulkTargetClass"
                        style={{
                            padding: '10px'
                        }}
                    >

                        <option value="">
                            Select promotion target
                        </option>

                        {targetClasses.map(item => (

                            <option
                                key={item.id}
                                value={item.id}
                            >
                                {item.class_name}
                            </option>

                        ))}

                    </select>


                    <button
                        onClick={() => {

                            const value =
                                document
                                    .getElementById(
                                        'bulkTargetClass'
                                    )
                                    .value;

                            promoteAll(value);
                        }}
                    >
                        Promote All
                    </button>


                    <button
                        onClick={
                            repeatAll
                        }
                    >
                        Repeat All
                    </button>

                </div>

            )}


            {/* ========================================= */}
            {/* STUDENTS */}
            {/* ========================================= */}

            {loading && (
                <p>
                    Loading...
                </p>
            )}


            {students.length > 0 && (

                <div
                    style={{
                        overflowX: 'auto'
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

                            <tr>

                                <th>
                                    #
                                </th>

                                <th>
                                    Student
                                </th>

                                <th>
                                    Current Class
                                </th>

                                <th>
                                    Decision
                                </th>

                                <th>
                                    Target Class
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            {students.map(
                                (
                                    student,
                                    index
                                ) => (

                                    <tr
                                        key={
                                            student.id
                                        }
                                    >

                                        <td>
                                            {index + 1}
                                        </td>

                                        <td>
                                            {
                                                student.full_name
                                            }
                                        </td>

                                        <td>
                                            {
                                                student.current_class
                                            }
                                        </td>

                                        <td>

                                            <select
                                                value={
                                                    student.status
                                                }
                                                onChange={e =>
                                                    updateStudent(
                                                        student.id,
                                                        'status',
                                                        e.target.value
                                                    )
                                                }
                                            >

                                                <option value="Promoted">
                                                    Promote
                                                </option>

                                                <option value="Repeated">
                                                    Repeat
                                                </option>

                                            </select>

                                        </td>


                                        <td>

                                            {student.status ===
                                            'Promoted' ? (

                                                <select
                                                    value={
                                                        student.target_class_id
                                                    }
                                                    onChange={e =>
                                                        updateStudent(
                                                            student.id,
                                                            'target_class_id',
                                                            e.target.value
                                                        )
                                                    }
                                                >

                                                    <option value="">
                                                        Select class
                                                    </option>

                                                    {targetClasses.map(
                                                        item => (

                                                            <option
                                                                key={
                                                                    item.id
                                                                }
                                                                value={
                                                                    item.id
                                                                }
                                                            >
                                                                {
                                                                    item.class_name
                                                                }
                                                            </option>

                                                        )
                                                    )}

                                                </select>

                                            ) : (

                                                <span>
                                                    Remains in current class
                                                </span>

                                            )}

                                        </td>

                                    </tr>

                                )
                            )}

                        </tbody>

                    </table>

                </div>

            )}


            {/* ========================================= */}
            {/* SUMMARY */}
            {/* ========================================= */}

            {students.length > 0 && (

                <div
                    style={{
                        marginTop: '24px',
                        padding: '16px',
                        border:
                            '1px solid #ddd'
                    }}
                >

                    <strong>
                        Promotion Summary
                    </strong>

                    <p>
                        Total students:
                        {' '}
                        {students.length}
                    </p>

                    <p>
                        Promoting:
                        {' '}
                        {
                            students.filter(
                                s =>
                                    s.status ===
                                    'Promoted'
                            ).length
                        }
                    </p>

                    <p>
                        Repeating:
                        {' '}
                        {
                            students.filter(
                                s =>
                                    s.status ===
                                    'Repeated'
                            ).length
                        }
                    </p>

                </div>

            )}


            {/* ========================================= */}
            {/* SAVE */}
            {/* ========================================= */}

            {students.length > 0 && (

                <button
                    onClick={
                        executePromotion
                    }
                    disabled={saving}
                    style={{
                        marginTop: '20px',
                        padding:
                            '12px 24px'
                    }}
                >

                    {saving
                        ? 'Processing...'
                        : 'Confirm Promotion'}

                </button>

            )}

        </div>
    );
}