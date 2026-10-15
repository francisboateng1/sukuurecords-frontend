import { useState,useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function BulkMarks() {

    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [subject, setSubject] = useState('Mathematics');
    const [marksData, setMarksData] = useState({}); // Stores scores by student ID

    // 1. Load classes on mount
    useEffect(() => {
        api.get('/students/classes').then(res => {
            setClasses(res.data);
            if(res.data.length > 0) setSelectedClass(res.data[0]);
        });
    }, []);

    // 2. Load students when class changes
    useEffect(() => {
        if (selectedClass) {
            // FIXED: Changed parameter name to current_class to match backend
            api.get(`/students?current_class=${selectedClass}`).then(res => setStudents(res.data));
        }
    }, [selectedClass]);

    const handleInputChange = (studentId, field, value) => {
        setMarksData(prev => ({
            ...prev,
            // FIXED: Added fallback initialization for the nested object
            [studentId]: { ...(prev[studentId] || { class_score: 0, exam_score: 0 }), [field]: value }
        }));
    };

    const saveAll = async () => {
        const payload = {
            subject,
            marks: students.map(s => ({
                student_id: s.id,
                class_score: marksData[s.id]?.class_score || 0,
                exam_score: marksData[s.id]?.exam_score || 0
            }))
        };

        try {
            await api.post('/assessments/bulk-record', payload);
            alert("All marks saved successfully! 🚀");
        } catch (err) {
            alert("Failed to save marks.");
        }
    };

    return (
        <div style={{ padding: '30px' }}>


            

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





            <h2>📝 Bulk Marks Entry</h2>
            
            <div style={{ marginBottom: '20px', display: 'flex', gap: '15px' }}>
                <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                    {classes.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" />
            </div>

            <table border="1" width="100%" style={{ borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ background: '#f4f4f4' }}>
                        <th style={{ padding: '10px' }}>Student Name</th>
                        <th>Class Score (30)</th>
                        <th>Exam Score (70)</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {students.map(s => (
                        <tr key={s.id}>
                            <td style={{ padding: '10px' }}>{s.full_name}</td>
                            <td>
                                {/* FIXED: Added value property to inputs */}
                                <input 
                                    type="number" 
                                    value={marksData[s.id]?.class_score || ''} 
                                    onChange={(e) => handleInputChange(s.id, 'class_score', e.target.value)} 
                                />
                            </td>
                            <td>
                                <input 
                                    type="number" 
                                    value={marksData[s.id]?.exam_score || ''} 
                                    onChange={(e) => handleInputChange(s.id, 'exam_score', e.target.value)} 
                                />
                            </td>
                            <td style={{ fontWeight: 'bold', textAlign: 'center' }}>
                                {(parseFloat(marksData[s.id]?.class_score || 0) + parseFloat(marksData[s.id]?.exam_score || 0)).toFixed(2)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            
            <button onClick={saveAll} style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#27ae60', color: 'white', border: 'none', cursor: 'pointer' }}>
                Save All Marks
            </button>
        </div>
    );
}