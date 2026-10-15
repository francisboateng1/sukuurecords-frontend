import { useState,useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Settings() {

    const navigate = useNavigate();

   const [config, setConfig] = useState({
    school_name: '',
    motto: '',
    address: '',
    phone: '',
    email: '',
    current_term: 'Term 1',
    academic_year: '',
    term_status: 'active',
    logo_url: ''
});
    const [uploading, setUploading] = useState(false);

    // ==========================================
    // LOAD SCHOOL SETTINGS
    // ==========================================

    useEffect(() => {

        const loadSettings = async () => {

            try {

                const res = await api.get('/settings');

                console.log('School settings:', res.data);

                setConfig({
                    school_name: res.data.school_name || '',
                    motto: res.data.motto || '',
                    address: res.data.address || '',
                    phone: res.data.phone || '',
                    email: res.data.email || '',
                    current_term: res.data.current_term || 'Term 1',
                    academic_year: res.data.academic_year || '',
                    term_status: res.data.term_status || 'active',
                    logo_url: res.data.logo_url || ''
                });

            } catch (err) {

                console.error(
                    'Failed to load settings:',
                    err.response?.data || err
                );

            }

        };

        loadSettings();

    }, []);


    // ==========================================
    // SAVE SCHOOL DETAILS
    // ==========================================

    const handleSave = async () => {

        if (!config.academic_year.trim()) {

            alert('Please enter the academic year.');

            return;
        }

        try {

            await api.post('/settings/update', config);

           alert(
    `School settings updated successfully!\n\n` +
    `${config.current_term} • ${config.academic_year}\n` +
    `Status: ${config.term_status === 'active' ? 'Active' : 'Closed'}`
);

        } catch (err) {

            console.error(
                'Settings update error:',
                err.response?.data || err
            );

            alert(
                err.response?.data?.message ||
                'Update failed.'
            );

        }

    };


    // ==========================================
    // UPLOAD LOGO
    // ==========================================

    const handleUpload = async (e) => {

        const file = e.target.files[0];

        if (!file) return;

        // Basic frontend validation
        if (!file.type.startsWith('image/')) {

            alert('Please select an image file.');

            return;
        }

        if (file.size > 5 * 1024 * 1024) {

            alert('Logo must be smaller than 5MB.');

            return;
        }

        const formData = new FormData();

        formData.append('logo', file);

        setUploading(true);

        try {

            const res = await api.post(
                '/settings/upload-logo',
                formData
            );

            console.log(
                'Logo upload response:',
                res.data
            );

            // ==================================
            // UPDATE LOGO IMMEDIATELY
            // ==================================

            setConfig(prev => ({
                ...prev,
                logo_url: res.data.logoUrl
            }));

            alert('Logo uploaded successfully! 🏫');

        } catch (err) {

            console.error(
                'Logo upload failed:',
                err.response?.data || err
            );

            alert(
                err.response?.data?.message ||
                'Logo upload failed.'
            );

        } finally {

            setUploading(false);

            // Reset file input so the same
            // image can be selected again later
            e.target.value = '';

        }

    };


    // ==========================================
    // LOGO URL
    // ==========================================

    const getLogoUrl = () => {

        if (!config.logo_url) {
            return '';
        }

        // If backend returns /uploads/...
        if (config.logo_url.startsWith('/')) {

            return `http://localhost:5000${config.logo_url}`;

        }

        return config.logo_url;

    };


    // ==========================================
    // UI
    // ==========================================

    return (

        <div
            style={{
                padding: '30px',
                maxWidth: '600px'
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






            <h2>⚙️ School Settings</h2>


            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '15px',
                    background: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 5px #ddd'
                }}
            >

                {/* SCHOOL NAME */}

                <label>
                    School Name
                </label>

                <input
                    type="text"
                    value={config.school_name}
                    onChange={(e) =>
                        setConfig({
                            ...config,
                            school_name: e.target.value
                        })
                    }
                    style={inputStyle}
                />


                {/* LOGO */}

                <label>
                    School Logo
                </label>


                {/* CURRENT LOGO */}

                {config.logo_url && (

                    <div
                        style={{
                            padding: '15px',
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            textAlign: 'center',
                            background: '#fafafa'
                        }}
                    >

                        <p
                            style={{
                                marginTop: 0,
                                fontWeight: 'bold'
                            }}
                        >
                            Current School Logo
                        </p>

                        <img
                            src={getLogoUrl()}
                            alt="School Logo"
                            style={{
                                width: '120px',
                                height: '120px',
                                objectFit: 'contain',
                                border: '1px solid #ddd',
                                borderRadius: '6px',
                                background: 'white'
                            }}
                            onError={(e) => {

                                console.error(
                                    'Logo failed to load:',
                                    getLogoUrl()
                                );

                                e.currentTarget.style.display =
                                    'none';

                            }}
                        />

                    </div>

                )}


                <input
                    type="file"
                    accept="image/*"
                    onChange={handleUpload}
                    disabled={uploading}
                    style={inputStyle}
                />


                {uploading && (

                    <small style={{ color: '#2980b9' }}>
                        Uploading logo...
                    </small>

                )}


                {/* MOTTO */}

                <label>
                    Motto
                </label>

                <input
                    type="text"
                    value={config.motto}
                    onChange={(e) =>
                        setConfig({
                            ...config,
                            motto: e.target.value
                        })
                    }
                    style={inputStyle}
                />


                {/* ACADEMIC YEAR */}

                <label>
                    Academic Year
                </label>

                <input
                    type="text"
                    placeholder="e.g. 2026/2027"
                    value={config.academic_year}
                    onChange={(e) =>
                        setConfig({
                            ...config,
                            academic_year: e.target.value
                        })
                    }
                    style={inputStyle}
                />

                <small
                    style={{
                        color: '#666',
                        marginTop: '-8px'
                    }}
                >
                    This academic year will be used automatically
                    for teacher marks and school reports.
                </small>


                {/* CURRENT TERM */}

                <label>
                    Current Term
                </label>

                <select
                    value={config.current_term}
                    onChange={(e) =>
                        setConfig({
                            ...config,
                            current_term: e.target.value
                        })
                    }
                    style={inputStyle}
                >

                    <option value="Term 1">
                        Term 1
                    </option>

                    <option value="Term 2">
                        Term 2
                    </option>

                    <option value="Term 3">
                        Term 3
                    </option>

                </select>



                {/* TERM STATUS */}

<label>
    Term Status
</label>

<select
    value={config.term_status}
    onChange={(e) =>
        setConfig({
            ...config,
            term_status: e.target.value
        })
    }
    style={inputStyle}
>
    <option value="active">
        Active
    </option>

    <option value="closed">
        Closed
    </option>
</select>

<small
    style={{
        color: '#666',
        marginTop: '-8px'
    }}
>
    Controls whether the current academic period is active or closed.
</small>




                {/* PHONE */}

                <label>
                    Phone Number
                </label>

                <input
                    type="text"
                    value={config.phone}
                    onChange={(e) =>
                        setConfig({
                            ...config,
                            phone: e.target.value
                        })
                    }
                    style={inputStyle}
                />


                {/* ADDRESS */}

                <label>
                    Address
                </label>

                <input
                    type="text"
                    value={config.address}
                    onChange={(e) =>
                        setConfig({
                            ...config,
                            address: e.target.value
                        })
                    }
                    style={inputStyle}
                />


                {/* EMAIL */}

                <label>
                    Email
                </label>

                <input
                    type="email"
                    value={config.email}
                    onChange={(e) =>
                        setConfig({
                            ...config,
                            email: e.target.value
                        })
                    }
                    style={inputStyle}
                />


                {/* SAVE */}

                <button
                    onClick={handleSave}
                    style={{
                        marginTop: '10px',
                        padding: '12px',
                        background: '#2980b9',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer'
                    }}
                >
                    Save Changes
                </button>

            </div>

        </div>

    );
}


const inputStyle = {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px'
};