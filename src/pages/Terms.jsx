import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function Terms() {
    const [document, setDocument] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;

        async function loadTerms() {
            try {
                const response = await api.get('/auth/agreements');
                const terms = response.data?.documents?.terms;

                if (
                    !terms ||
                    typeof terms.version !== 'string' ||
                    typeof terms.text !== 'string' ||
                    typeof terms.hash !== 'string'
                ) {
                    throw new Error('Invalid Terms document response.');
                }

                if (!cancelled) {
                    setDocument(terms);
                }
            } catch {
                if (!cancelled) {
                    setError(
                        'Unable to load the current Terms and Conditions. Please try again later.'
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadTerms();

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <main className="registration-page">
            <article className="registration-card legal-document">
                <header className="registration-header">
                    <div className="registration-logo" aria-hidden="true">
                        S
                    </div>

                    <p className="registration-eyebrow">
                        SUKUU RECORDS BY XISCO CS
                    </p>

                    <h1>Terms and Conditions</h1>

                    {document && (
                        <p>
                            Document version: <strong>{document.version}</strong>
                        </p>
                    )}
                </header>

                {loading && <p>Loading the current Terms and Conditions...</p>}

                {error && (
                    <div className="registration-error" role="alert">
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
                            margin: 0
                        }}
                    >
                        {document.text}
                    </pre>
                )}

                <footer className="legal-document-footer">
                    <Link to="/register">Return to registration</Link>
                    {' · '}
                    <Link to="/service-agreement">
                        Read the School Service Agreement
                    </Link>
                </footer>
            </article>
        </main>
    );
}