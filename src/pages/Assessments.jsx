import { useState,useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Assessments() {




    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [subject, setSubject] = useState('');
    const [selectedStudent, setSelectedStudent] = useState('');
    const [scores, setScores] = useState({ class_score: '', exam_score: '' });
    const [message, setMessage] = useState('');

    // For now, we use school_id 1. 
    const schoolId = 1; 

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const res = await api.get(`/students/${schoolId}`);
                setStudents(res.data);
            } catch (err) {
                console.error("Failed to fetch students");
            }
        };
        fetchStudents();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/assessments/record', {
                student_id: selectedStudent,
                teacher_id: 1, 
                subject,
                class_score: scores.class_score,
                exam_score: scores.exam_score,
                term: 'Term 1',
                academic_year: '2025/2026'
            });
            setMessage('✅ Marks recorded successfully!');
            // Reset scores but keep the subject for the next student
            setScores({ class_score: '', exam_score: '' });
        } catch (err) {
            setMessage('❌ Error saving marks.');
        }
    };

    return (
        <div style={{ padding: '40px', maxWidth: '500px', fontFamily: 'sans-serif' }}>



            

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



            <h2>Input Assessment Marks</h2>
            {message && <p style={{ fontWeight: 'bold' }}>{message}</p>}
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <label>Select Student:</label>
                <select 
                    value={selectedStudent} 
                    onChange={(e) => setSelectedStudent(e.target.value)}
                    required
                    style={{ padding: '10px' }}
                >
                    <option value="">-- Choose Student --</option>
                    {students.map(s => (
                        <option key={s.id} value={s.id}>{s.full_name} ({s.current_class})</option>
                    ))}
                </select>

                <label>Subject:</label>
                <input 
                    type="text" 
                    placeholder="e.g. Mathematics" 
                    value={subject} 
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    style={{ padding: '10px' }}
                />

                <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ flex: 1 }}>
                        <label>Class Score (30%):</label>
                        <input 
                            type="number" 
                            step="0.01"
                            value={scores.class_score} 
                            onChange={(e) => setScores({...scores, class_score: e.target.value})}
                            required
                            style={{ padding: '10px', width: '100%' }}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label>Exam Score (70%):</label>
                        <input 
                            type="number" 
                            step="0.01"
                            value={scores.exam_score} 
                            onChange={(e) => setScores({...scores, exam_score: e.target.value})}
                            required
                            style={{ padding: '10px', width: '100%' }}
                        />
                    </div>
                </div>

                <button type="submit" style={{ padding: '12px', background: '#2c3e50', color: 'white', border: 'none', cursor: 'pointer' }}>
                    Save Marks
                </button>
            </form>
        </div>
    );
}