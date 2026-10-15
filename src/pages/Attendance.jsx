import { useState,useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Attendance() {



    // UI State

    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('mark');

    // Data State
    const [students, setStudents] = useState([]);
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [attendanceData, setAttendanceData] = useState({});
    const [history, setHistory] = useState([]);

    // Filter State
    const [selectedDate, setSelectedDate] = useState(
        new Date().toISOString().split('T')[0]
    );

    // Academic State
    const [selectedTerm, setSelectedTerm] = useState('Term 1');
    const [academicYear, setAcademicYear] = useState('2026/2027');

    // Load classes once
    useEffect(() => {
        api.get('/students/classes')
            .then(res => {
                setClasses(res.data);

                if (res.data.length > 0) {
                    setSelectedClass(res.data[0]);
                }
            })
            .catch(err => {
                console.error('Error loading classes:', err);
            });
    }, []);

    // Load students when class changes
    useEffect(() => {
        if (selectedClass && activeTab === 'mark') {
            api.get(`/students?current_class=${selectedClass}`)
                .then(res => {
                    setStudents(res.data);

                    // Everyone starts as Present
                    const initialStatus = {};

                    res.data.forEach(student => {
                        initialStatus[student.id] = true;
                    });

                    setAttendanceData(initialStatus);
                })
                .catch(err => {
                    console.error('Error loading students:', err);
                    setStudents([]);
                });
        }
    }, [selectedClass, activeTab]);

    // Toggle attendance
    const toggleAttendance = (id) => {
        setAttendanceData(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    // Submit attendance
    const submitAttendance = async () => {
        if (!selectedClass) {
            alert('Please select a class.');
            return;
        }

        if (!selectedTerm || !academicYear) {
            alert('Please select the term and academic year.');
            return;
        }

        const records = students.map(student => ({
            student_id: student.id,
            status: attendanceData[student.id]
                ? 'Present'
                : 'Absent'
        }));

        try {
            await api.post('/attendance/record', {
                attendanceRecords: records,
                term: selectedTerm,
                academic_year: academicYear,
                date: selectedDate
            });

            alert(
                `Attendance saved successfully! ✅\n\n${selectedTerm} - ${academicYear}`
            );
        } catch (err) {
            console.error('Attendance save error:', err);

            alert(
                err.response?.data?.message ||
                'Error saving attendance.'
            );
        }
    };

    // Fetch attendance history
    const fetchHistory = async () => {
        if (!selectedClass) {
            alert('Please select a class.');
            return;
        }

        try {
            const res = await api.get(
                `/attendance/history?current_class=${encodeURIComponent(
                    selectedClass
                )}&date=${selectedDate}`
            );

            setHistory(res.data);
        } catch (err) {
            console.error('History error:', err);
            setHistory([]);
        }
    };

    // Styles
    const tabStyle = (tab) => ({
        padding: '10px 20px',
        cursor: 'pointer',
        borderBottom:
            activeTab === tab ? '3px solid #3498db' : 'none',
        fontWeight:
            activeTab === tab ? 'bold' : 'normal',
        color:
            activeTab === tab ? '#3498db' : '#7f8c8d'
    });

    return (
        <div style={{ padding: '30px', maxWidth: '900px' }}>

       

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








            <h2>📅 Attendance Management</h2>

            {/* Tab Navigation */}
            <div
                style={{
                    display: 'flex',
                    gap: '20px',
                    marginBottom: '20px',
                    borderBottom: '1px solid #ddd'
                }}
            >
                <div
                    style={tabStyle('mark')}
                    onClick={() => setActiveTab('mark')}
                >
                    Mark Attendance
                </div>

                <div
                    style={tabStyle('history')}
                    onClick={() => setActiveTab('history')}
                >
                    View History
                </div>
            </div>

            {/* Academic Filters */}
            <div
                style={{
                    marginBottom: '20px',
                    padding: '15px',
                    background: '#f8f9fa',
                    border: '1px solid #ddd',
                    borderRadius: '6px'
                }}
            >
                <h4 style={{ marginTop: 0 }}>
                    Academic Information
                </h4>

                <div
                    style={{
                        display: 'flex',
                        gap: '15px',
                        flexWrap: 'wrap'
                    }}
                >
                    {/* Academic Year */}
                    <div>
                        <label
                            style={{
                                display: 'block',
                                marginBottom: '5px',
                                fontWeight: 'bold'
                            }}
                        >
                            Academic Year
                        </label>

                        <input
                            type="text"
                            value={academicYear}
                            onChange={(e) =>
                                setAcademicYear(e.target.value)
                            }
                            placeholder="2026/2027"
                            style={{
                                padding: '8px',
                                width: '130px'
                            }}
                        />
                    </div>

                    {/* Term */}
                    <div>
                        <label
                            style={{
                                display: 'block',
                                marginBottom: '5px',
                                fontWeight: 'bold'
                            }}
                        >
                            Term
                        </label>

                        <select
                            value={selectedTerm}
                            onChange={(e) =>
                                setSelectedTerm(e.target.value)
                            }
                            style={{ padding: '8px' }}
                        >
                            <option value="Term 1">Term 1</option>
                            <option value="Term 2">Term 2</option>
                            <option value="Term 3">Term 3</option>
                        </select>
                    </div>

                    {/* Class */}
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
                            value={selectedClass}
                            onChange={(e) =>
                                setSelectedClass(e.target.value)
                            }
                            style={{ padding: '8px' }}
                        >
                            {classes.map(c => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Date */}
                    <div>
                        <label
                            style={{
                                display: 'block',
                                marginBottom: '5px',
                                fontWeight: 'bold'
                            }}
                        >
                            Date
                        </label>

                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) =>
                                setSelectedDate(e.target.value)
                            }
                            style={{ padding: '8px' }}
                        />
                    </div>

                    {activeTab === 'history' && (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'end'
                            }}
                        >
                            <button
                                onClick={fetchHistory}
                                style={{
                                    padding: '9px 15px',
                                    backgroundColor: '#2c3e50',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                Search History
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Attendance Table */}
            <table
                width="100%"
                style={{
                    borderCollapse: 'collapse',
                    backgroundColor: 'white',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                }}
            >
                <thead>
                    <tr
                        style={{
                            background: '#ecf0f1',
                            textAlign: 'left'
                        }}
                    >
                        <th style={{ padding: '12px' }}>
                            Student Name
                        </th>

                        <th
                            style={{
                                padding: '12px',
                                textAlign: 'center'
                            }}
                        >
                            Status
                        </th>
                    </tr>
                </thead>

                <tbody>
                    {activeTab === 'mark' ? (
                        students.map(student => (
                            <tr
                                key={student.id}
                                style={{
                                    borderBottom:
                                        '1px solid #eee'
                                }}
                            >
                                <td style={{ padding: '12px' }}>
                                    {student.full_name}
                                </td>

                                <td
                                    style={{
                                        textAlign: 'center'
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={
                                            attendanceData[
                                                student.id
                                            ] || false
                                        }
                                        onChange={() =>
                                            toggleAttendance(
                                                student.id
                                            )
                                        }
                                        style={{
                                            transform:
                                                'scale(1.3)'
                                        }}
                                    />

                                    <span
                                        style={{
                                            marginLeft: '10px',
                                            fontWeight: 'bold',
                                            color: attendanceData[
                                                student.id
                                            ]
                                                ? '#27ae60'
                                                : '#e74c3c'
                                        }}
                                    >
                                        {attendanceData[
                                            student.id
                                        ]
                                            ? 'Present'
                                            : 'Absent'}
                                    </span>
                                </td>
                            </tr>
                        ))
                    ) : history.length > 0 ? (
                        history.map((record, index) => (
                            <tr
                                key={index}
                                style={{
                                    borderBottom:
                                        '1px solid #eee'
                                }}
                            >
                                <td style={{ padding: '12px' }}>
                                    {record.full_name}
                                </td>

                                <td
                                    style={{
                                        textAlign: 'center',
                                        padding: '12px',
                                        color:
                                            record.status ===
                                            'Present'
                                                ? '#27ae60'
                                                : record.status ===
                                                  'Late'
                                                ? '#f39c12'
                                                : '#e74c3c',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    {record.status}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td
                                colSpan="2"
                                style={{
                                    textAlign: 'center',
                                    padding: '20px'
                                }}
                            >
                                No history found for this date.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Submit */}
            {activeTab === 'mark' &&
                students.length > 0 && (
                    <button
                        onClick={submitAttendance}
                        style={{
                            marginTop: '20px',
                            padding: '12px 30px',
                            backgroundColor: '#27ae60',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        Submit Daily Roll Call
                    </button>
                )}
        </div>
    );
}