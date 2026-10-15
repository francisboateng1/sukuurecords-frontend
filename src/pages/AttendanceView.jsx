import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function AttendanceView() {

    const navigate = useNavigate();
    const [history, setHistory] = useState([]);
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        api.get('/students/classes').then(res => {
            setClasses(res.data);
            if(res.data.length > 0) setSelectedClass(res.data[0]);
        });
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await api.get(`/attendance/history?current_class=${selectedClass}&date=${selectedDate}`);
            setHistory(res.data);
        } catch (err) {
            alert("No records found for this date.");
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




            <h2>📂 Attendance History</h2>

            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                    {classes.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                
                <input 
                    type="date" 
                    value={selectedDate} 
                    onChange={(e) => setSelectedDate(e.target.value)} 
                />
                
                <button onClick={fetchHistory} style={{ backgroundColor: '#2c3e50', color: 'white', padding: '5px 15px' }}>
                    View Records
                </button>
            </div>

            <table width="100%" border="1" style={{ borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ background: '#f4f4f4' }}>
                        <th>Student Name</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {history.length > 0 ? (
                        history.map((record, index) => (
                            <tr key={index}>
                                <td style={{ padding: '10px' }}>{record.full_name}</td>
                                <td style={{ 
                                    padding: '10px', 
                                    color: record.status === 'Present' ? 'green' : 'red',
                                    fontWeight: 'bold' 
                                }}>
                                    {record.status}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr><td colSpan="2" style={{ textAlign: 'center', padding: '20px' }}>No records to show. Select a date and click View.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}