import { useState,useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Leaderboard() {

    const navigate = useNavigate();
    const [rankings, setRankings] = useState([]);
    const [classes, setClasses] = useState([]); // State for your real classes
    const [selectedClass, setSelectedClass] = useState('');

    useEffect(() => {
        // Fetch the real classes from your database
        const fetchClasses = async () => {
            const res = await api.get('/students/classes');
            setClasses(res.data);
            if (res.data.length > 0) setSelectedClass(res.data[0]);
        };
        fetchClasses();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            const fetchRankings = async () => {
                const res = await api.get(`/assessments/leaderboard/${selectedClass}`);
                setRankings(res.data);
            };
            fetchRankings();
        }
    }, [selectedClass]);

    return (
        <div style={{ padding: '20px' }}>



            

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




            <h2>🏆 Leaderboard</h2>
            
            <label>Select Class: </label>
            <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                {classes.map((cls, idx) => (
                    <option key={idx} value={cls}>{cls}</option>
                ))}
            </select>

              <table border="1" width="100%" style={{ borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: '#2c3e50', color: 'white' }}>
                    <tr>
                        <th style={{ padding: '10px' }}>Position</th>
                        <th>Student Name</th>
                        <th>Grand Total</th>
                    </tr>
                </thead>
                <tbody>
                    {rankings.map((r, index) => (
                        <tr key={index} style={{ background: r.position <= 3 ? '#fff9c4' : 'transparent' }}>
                            <td style={{ padding: '10px', fontWeight: 'bold' }}>
                                {r.position === 1 ? '🥇 1st' : r.position === 2 ? '🥈 2nd' : r.position === 3 ? '🥉 3rd' : `${r.position}th`}
                            </td>
                            <td>{r.full_name}</td>
                            <td>{parseFloat(r.grand_total).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}