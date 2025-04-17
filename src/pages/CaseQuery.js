import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaFileUpload } from 'react-icons/fa';
import './CaseQuery.css';

export function CaseQuery() {
    const [caseData, setCaseData] = useState({
        case_type: '',
        case_description: '',
        documents: []
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData();
        const email = localStorage.getItem('email');
        const password = localStorage.getItem('password');
        const userId = localStorage.getItem('userId');

        formData.append('email', email);
        formData.append('password', password);
        formData.append('user_id', userId);
        formData.append('case_type', caseData.case_type);
        formData.append('case_description', caseData.case_description);

        // Append each document to formData
        caseData.documents.forEach((doc, index) => {
            formData.append(`document_${index}`, doc);
        });

        try {
            const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
            const response = await fetch(`${BACKEND_URL}/cases`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                navigate(`/cases/${data.case_id}`);
            } else {
                throw new Error('Failed to submit case query');
            }
        } catch (error) {
            setError('Failed to submit case query. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setCaseData(prev => ({
            ...prev,
            documents: [...prev.documents, ...files]
        }));
    };

    const removeDocument = (index) => {
        setCaseData(prev => ({
            ...prev,
            documents: prev.documents.filter((_, i) => i !== index)
        }));
    };

    return (
        <div className="case-query">
            <h2>Submit Case Query</h2>
            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit} className="case-form">
                <div className="form-group">
                    <label>Case Type:</label>
                    <select
                        value={caseData.case_type}
                        onChange={(e) => setCaseData({ ...caseData, case_type: e.target.value })}
                        required
                    >
                        <option value="">Select Case Type</option>
                        <option value="civil">Civil Case</option>
                        <option value="criminal">Criminal Case</option>
                        <option value="family">Family Law</option>
                        <option value="property">Property Dispute</option>
                        <option value="consumer">Consumer Complaint</option>
                        <option value="employment">Employment Issue</option>
                        <option value="other">Other</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Case Description:</label>
                    <textarea
                        value={caseData.case_description}
                        onChange={(e) => setCaseData({ ...caseData, case_description: e.target.value })}
                        placeholder="Describe your case in detail..."
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Supporting Documents:</label>
                    <div className="document-upload">
                        <input
                            type="file"
                            multiple
                            onChange={handleFileChange}
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            id="document-input"
                            hidden
                        />
                        <label htmlFor="document-input" className="upload-button">
                            <FaFileUpload /> Upload Documents
                        </label>
                    </div>

                    {caseData.documents.length > 0 && (
                        <div className="document-list">
                            {caseData.documents.map((doc, index) => (
                                <div key={index} className="document-item">
                                    <span>{doc.name}</span>
                                    <button
                                        type="button"
                                        onClick={() => removeDocument(index)}
                                        className="remove-document"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? 'Submitting...' : 'Submit Case Query'}
                </button>
            </form>
        </div>
    );
}
