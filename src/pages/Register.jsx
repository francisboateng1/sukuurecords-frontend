import { useState } from 'react';
import api from '../services/api';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
    const [formData, setFormData] = useState({
        admin_name: '',
        email: '',
        password: '',
        school_name: '', // Add this
        school_id: 'UMAT-EXP-01' // Default for now
        
    });
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            await api.post('/auth/register', formData);
            alert("Registration Successful! Now log in.");
            navigate('/'); // Go back to Login page
        } catch (err) {
            alert(err.response?.data?.message || "Registration failed");
        }
    };

    return (
        <div style={containerStyle}>
            <div style={formCardStyle}>
                <h2>📝 Admin Registration</h2>
                <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <input 
    type="text" 
    placeholder="School Name (e.g. UMaT Primary)" 
    onChange={(e) => setFormData({...formData, school_name: e.target.value})} 
    required 
    style={inputStyle} 
/>
                    <input type="text" placeholder="Admin Full Name" onChange={(e) => setFormData({...formData, admin_name: e.target.value})} required style={inputStyle} />
                    <input type="email" placeholder="Email Address" onChange={(e) => setFormData({...formData, email: e.target.value})} required style={inputStyle} />
                    <input type="password" placeholder="Create Password" onChange={(e) => setFormData({...formData, password: e.target.value})} required style={inputStyle} />
                    <button type="submit" style={buttonStyle}>Create Admin Account</button>
                </form>
                <p style={{ marginTop: '15px' }}>Already have an account? <Link to="/">Login here</Link></p>
            </div>
        </div>
    );
}

// Quick Styles
const containerStyle = { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' };
const formCardStyle = { background: 'white', padding: '40px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '400px', textAlign: 'center' };
const inputStyle = { padding: '12px', border: '1px solid #ddd', borderRadius: '5px' };
const buttonStyle = { padding: '12px', background: '#1a3a5f', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' };