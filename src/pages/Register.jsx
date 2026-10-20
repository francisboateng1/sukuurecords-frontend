import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Registration.css';

export default function Register() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        school_name: '',
        admin_name: '',
        email: '',
        password: '',
        confirmPassword: '',
        invitation_code: '',
        signature_name: ''
    });
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [serviceAgreementAccepted, setServiceAgreementAccepted] = useState(false);
    const [authorityConfirmed, setAuthorityConfirmed] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [agreementDocuments, setAgreementDocuments] = useState(null);
const [agreementsLoading, setAgreementsLoading] = useState(true);
const [agreementsError, setAgreementsError] = useState('');

useEffect(() => {
    let cancelled = false;

    const loadAgreements = async () => {
        setAgreementsLoading(true);
        setAgreementsError('');

        try {
            const response = await api.get('/auth/agreements');
            const documents = response.data?.documents;

            const terms = documents?.terms;
            const service = documents?.service_agreement;

            if (
                !terms ||
                !service ||
                typeof terms.version !== 'string' ||
                typeof terms.text !== 'string' ||
                typeof terms.hash !== 'string' ||
                typeof service.version !== 'string' ||
                typeof service.text !== 'string' ||
                typeof service.hash !== 'string' ||
                !/^[a-f0-9]{64}$/.test(terms.hash) ||
                !/^[a-f0-9]{64}$/.test(service.hash)
            ) {
                throw new Error('The agreement documents could not be verified.');
            }

            if (!cancelled) {
                setAgreementDocuments(documents);
            }
        } catch (err) {
            if (!cancelled) {
                setAgreementDocuments(null);
                setAgreementsError(
                    'We could not load the current agreement documents. Please refresh the page and try again.'
                );
            }
        } finally {
            if (!cancelled) {
                setAgreementsLoading(false);
            }
        }
    };

    loadAgreements();

    return () => {
        cancelled = true;
    };
}, []);






    
    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((previous) => ({
            ...previous,
            [name]: name === 'invitation_code'
                ? value.trim()
                : value,
        }));

        setError('');
    };

   const handleRegister = async (e) => {
    e.preventDefault();

    if (loading) return;

    if (agreementsLoading || !agreementDocuments) {
    setError(
        agreementsError ||
        'The current agreements are unavailable. Please reload the page.'
    );
    return;
}


    if (formData.password.length < 8) {
        alert('Password must be at least 8 characters long.');
        return;
    }

    if (formData.password !== formData.confirmPassword) {
        alert('Passwords do not match.');
        return;
    }

    if (!termsAccepted || !serviceAgreementAccepted) {
        alert('Please review and accept both documents.');
        return;
    }

    if (!authorityConfirmed) {
        alert('Please confirm that you are authorised to represent the school.');
        return;
    }

    if (!formData.signature_name.trim()) {
        alert('Please enter your full legal name as your electronic signature.');
        return;
    }

    setLoading(true);

    try {
        const {
            confirmPassword,
            ...registrationData
        } = formData;

       await api.post('/auth/register', {
    ...registrationData,

    signature_name: formData.signature_name.trim(),

    terms_accepted: true,
    service_agreement_accepted: true,
    authority_confirmed: true,

    terms_version: agreementDocuments.terms.version,
    terms_hash: agreementDocuments.terms.hash,

    service_agreement_version:
        agreementDocuments.service_agreement.version,

    service_agreement_hash:
        agreementDocuments.service_agreement.hash
});
        alert('Registration successful! You can now log in.');

        navigate('/', {
            state: {
                registrationSuccess: true
            }
        });
    } catch (err) {
        alert(
            err.response?.data?.message ||
            'Registration failed. Please try again.'
        );
    } finally {
        setLoading(false);
    }
};

    return (
        <main className="registration-page">
            <section className="registration-card">
                <header className="registration-header">
                    <div className="registration-logo" aria-hidden="true">
                        S
                    </div>

                    <p className="registration-eyebrow">
                        SCHOOL MANAGEMENT PLATFORM
                    </p>

                    <h1>Create your school account</h1>

                    <p className="registration-subtitle">
                        Set up your administrator account to get started
                        with Sukuu Records.
                    </p>
                </header>

                {error && (
                    <div className="registration-error" role="alert">
                        {error}
                    </div>
                )}

                <form onSubmit={handleRegister}>
                    <div className="registration-section-heading">
                        <span>01</span>
                        <h2>School information</h2>
                    </div>

                    <div className="registration-field">
                        <label htmlFor="school_name">
                            Official school name
                        </label>

                        <input
                            id="school_name"
                            name="school_name"
                            type="text"
                            placeholder="Enter your school's registered name"
                            value={formData.school_name}
                            onChange={handleChange}
                            autoComplete="organization"
                            maxLength={255}
                            required
                        />
                    </div>

                    <div className="registration-field">
                        <label htmlFor="invitation_code">
                            School invitation code
                        </label>

                        <input
                            id="invitation_code"
                            name="invitation_code"
                            type="text"
                            placeholder="Enter the code provided to your school"
                            value={formData.invitation_code}
                            onChange={handleChange}
                            autoComplete="off"
                            maxLength={128}
                            required
                        />

                        <small>
                            Obtain this code from the Sukuu Records system
                            owner. It is required to register a school.
                        </small>
                    </div>

                    <div className="registration-section-heading">
                        <span>02</span>
                        <h2>Administrator details</h2>
                    </div>

                    <div className="registration-field">
                        <label htmlFor="admin_name">
                            Full name
                        </label>

                        <input
                            id="admin_name"
                            name="admin_name"
                            type="text"
                            placeholder="Enter your full name"
                            value={formData.admin_name}
                            onChange={handleChange}
                            autoComplete="name"
                            maxLength={150}
                            required
                        />
                    </div>

                    <div className="registration-field">
                        <label htmlFor="email">
                            Email address
                        </label>

                        <input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="you@school.com"
                            value={formData.email}
                            onChange={handleChange}
                            autoComplete="email"
                            maxLength={255}
                            required
                        />
                    </div>

                    <div className="registration-field">
                        <label htmlFor="password">
                            Create password
                        </label>

                        <div className="registration-password-wrapper">
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="At least 8 characters"
                                value={formData.password}
                                onChange={handleChange}
                                autoComplete="new-password"
                                minLength={8}
                                required
                            />

                            <button
                                className="registration-password-toggle"
                                type="button"
                                onClick={() =>
                                    setShowPassword((previous) => !previous)
                                }
                                aria-label={
                                    showPassword
                                        ? 'Hide password'
                                        : 'Show password'
                                }
                            >
                                {showPassword ? 'Hide' : 'Show'}
                            </button>
                        </div>
                    </div>

                    <div className="registration-field">
                        <label htmlFor="confirmPassword">
                            Confirm password
                        </label>

                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter your password again"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            autoComplete="new-password"
                            required
                        />
                    </div>

                   <div className="registration-legal">
    <div className="registration-field">
        <label htmlFor="signature_name">
            Electronic signature — full legal name
        </label>

        <input
            id="signature_name"
            name="signature_name"
            type="text"
            value={formData.signature_name}
            onChange={handleChange}
            placeholder="Enter your full legal name"
            autoComplete="name"
            maxLength={255}
            required
        />

        <small>
            Your typed name will be recorded as your electronic signature.
        </small>
    </div>

    <div className="acceptance-group">
        <label className="registration-checkbox">
            <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                required
            />

            <span>
                I have read and accept the{' '}
                <Link
                    to="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Terms and Conditions
                </Link>.

                {' '}<small>
    Version: {agreementDocuments?.terms.version || 'Unavailable'}
</small>

            </span>
        </label>



        <label className="registration-checkbox">
            <input
                type="checkbox"
                checked={serviceAgreementAccepted}
                onChange={(e) =>
                    setServiceAgreementAccepted(e.target.checked)
                }
                required
            />

            <span>
                I have read and accept the{' '}
                <Link
                    to="/service-agreement"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    School Service Agreement
                </Link>.

                {' '}<small>
    Version: {
        agreementDocuments?.service_agreement.version || 'Unavailable'
    }
</small>

            </span>
        </label>

        <label className="registration-checkbox">
            <input
                type="checkbox"
                checked={authorityConfirmed}
                onChange={(e) =>
                    setAuthorityConfirmed(e.target.checked)
                }
                required
            />

            <span>
                I confirm that I am authorised to represent this school
                and accept these terms on its behalf.
            </span>
        </label>
    </div>

</div>

{agreementsError && (
    <div className="registration-error" role="alert">
        {agreementsError}
    </div>
)}

                  <button
    type="submit"
    disabled={
        loading ||
        agreementsLoading ||
        !agreementDocuments
    }
>
    {loading
        ? 'Registering...'
        : agreementsLoading
            ? 'Loading agreements...'
            : !agreementDocuments
                ? 'Agreements unavailable'
                : 'Create School Account'}
</button>

                </form>

                <footer className="registration-footer">
                    <p>
                        Already registered?{' '}
                        <Link to="/">Sign in</Link>
                    </p>

                    <span>Powered by Sukuu Records</span>
                </footer>
            </section>
        </main>
    );
}