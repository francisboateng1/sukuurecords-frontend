import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function ServiceAgreement() {
    const [document, setDocument] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;

        async function loadAgreement() {
            try {
                const response = await api.get('/auth/agreements');

                const agreement =
                    response.data?.documents?.service_agreement;

                if (
                    !agreement ||
                    typeof agreement.version !== 'string' ||
                    typeof agreement.text !== 'string' ||
                    typeof agreement.hash !== 'string' ||
                    !/^[a-f0-9]{64}$/.test(agreement.hash)
                ) {
                    throw new Error(
                        'Invalid School Service Agreement response.'
                    );
                }

                if (!cancelled) {
                    setDocument(agreement);
                }
            } catch {
                if (!cancelled) {
                    setError(
                        'Unable to load the current School Service Agreement. Please refresh the page or try again later.'
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadAgreement();

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <main className="registration-page">
            <article className="registration-card legal-document">
                <header className="registration-header">
                    <div
                        className="registration-logo"
                        aria-hidden="true"
                    >
                        S
                    </div>

                    <p className="registration-eyebrow">
                        SUKUU RECORDS BY XISCO CS
                    </p>

                    <h1>School Service Agreement</h1>

                    <p className="registration-subtitle">
                        Proposed service terms between the school
                        and the Sukuu Records service provider.
                    </p>

                    {document && (
                        <p>
                            Document version:{' '}
                            <strong>{document.version}</strong>
                        </p>
                    )}
                </header>

                {loading && (
                    <p>
                        Loading the current School Service Agreement...
                    </p>
                )}

                {error && (
                    <div
                        className="registration-error"
                        role="alert"
                    >
                        {error}
                    </div>
                )}

                {document && !loading && !error && (
                    <pre
                        style={{
                            whiteSpace: 'pre-wrap',
                            overflowWrap: 'anywhere',
                            fontFamily: 'inherit',
                            lineHeight: 1.7,
                            margin: 0,
                        }}
                    >
                        {document.text}
                    </pre>
                )}

                <footer className="legal-document-footer">
                    <Link to="/register">
                        Return to registration
                    </Link>

                    {' · '}

                    <Link to="/terms">
                        Read the Terms and Conditions
                    </Link>
                </footer>
            </article>
        </main>
    );
}