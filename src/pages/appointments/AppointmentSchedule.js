import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './AppointmentSchedule.css';

export function AppointmentSchedule({ nyaysathiId }) {
    const [step, setStep] = useState(1);
    const [appointment, setAppointment] = useState({
        date: '',
        time: '',
        duration: '30',
        mode: 'online',
        notes: '',
        case_type: '',
        case_description: '',
        consultation_type: 'initial'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [confirmation, setConfirmation] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const { nyaysathi_id } = useParams();
    const navigate = useNavigate();
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

    useEffect(() => {
        if (!nyaysathi_id || nyaysathi_id === 'undefined') {
            setError('Invalid NyaySathi selected. Please go back and try again.');
            navigate('/nyaysathi');
        }
    }, [nyaysathi_id, navigate]);

    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem('token');
            const userType = localStorage.getItem('userType');

            if (!token) {
                setError('Please login to schedule an appointment');
                navigate('/auth');
                return;
            }

            // NyaySathis cannot book appointments
            if (userType === 'nyaysathi' || userType === 'NGO') {
                setError('As a NyaySathi/NGO, you cannot book appointments. Please switch to a user account.');
                navigate('/');
                return;
            }

            setIsAuthenticated(true);
        };

        checkAuth();
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setConfirmation('');

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Missing authentication token. Please login again.');
                navigate('/auth');
                return;
            }

            const appointment_date = `${appointment.date}T${appointment.time}`;

            // Match the backend API expectations exactly
            const appointmentData = {
                nyaysathi_id: nyaysathi_id, // Use nyaysathi_id from useParams
                appointment_date: appointment_date,
                duration: parseInt(appointment.duration, 10),
                mode: appointment.mode,
                notes: appointment.notes || '',
                consultation_type: appointment.consultation_type || 'initial',
                case_type: appointment.case_type || '',
                case_description: appointment.case_description || '',
                payment_status: 'pending',
                status: 'Scheduled'
            };

            // Use the exact endpoint from the backend code
            const res = await fetch(`${BACKEND_URL}/api/appointments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(appointmentData)
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Appointment creation failed');
            }

            // eslint-disable-next-line no-unused-vars
            const responseData = await res.json();

            setConfirmation('✅ Your appointment has been scheduled successfully. Please wait for NyaySathi to accept the request.');

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const renderStep1 = () => (
        <div className="step-content">
            <h3 className="step-title">Case Details</h3>
            <div className="form-grid">
                <div className="form-group">
                    <label className="form-label">Type of Consultation:</label>
                    <select
                        className="form-input"
                        value={appointment.consultation_type}
                        onChange={(e) =>
                            setAppointment({ ...appointment, consultation_type: e.target.value })
                        }
                        required
                    >
                        <option value="initial">Initial Consultation</option>
                        <option value="followup">Follow-up Consultation</option>
                        <option value="document_review">Document Review</option>
                        <option value="legal_advice">Legal Advice</option>
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Case Type:</label>
                    <select
                        className="form-input"
                        value={appointment.case_type}
                        onChange={(e) =>
                            setAppointment({ ...appointment, case_type: e.target.value })
                        }
                        required
                    >
                        <option value="">Select Case Type</option>
                        <option value="civil">Civil</option>
                        <option value="criminal">Criminal</option>
                        <option value="family">Family Law</option>
                        <option value="property">Property Dispute</option>
                        <option value="consumer">Consumer Complaint</option>
                        <option value="employment">Employment Issue</option>
                        <option value="other">Other</option>
                    </select>
                </div>
            </div>
            <div className="form-group">
                <label className="form-label">Case Description:</label>
                <textarea
                    className="form-textarea"
                    value={appointment.case_description}
                    onChange={(e) =>
                        setAppointment({ ...appointment, case_description: e.target.value })
                    }
                    placeholder="Please describe your case in detail..."
                    required
                />
            </div>
            <div className="button-group">
                <div></div>
                <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setStep(2)}
                    disabled={!appointment.case_type || !appointment.case_description}
                >
                    Next: Schedule Time →
                </button>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="step-content">
            <h3 className="step-title">Schedule Appointment</h3>
            <div className="form-grid">
                <div className="form-group">
                    <label className="form-label">Date:</label>
                    <input
                        type="date"
                        className="form-input"
                        min={new Date().toISOString().split('T')[0]}
                        value={appointment.date}
                        onChange={(e) => setAppointment({ ...appointment, date: e.target.value })}
                        required
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">Time:</label>
                    <input
                        type="time"
                        className="form-input"
                        value={appointment.time}
                        onChange={(e) => setAppointment({ ...appointment, time: e.target.value })}
                        required
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">Duration:</label>
                    <select
                        className="form-input"
                        value={appointment.duration}
                        onChange={(e) => setAppointment({ ...appointment, duration: e.target.value })}
                    >
                        <option value="30">30 minutes</option>
                        <option value="60">1 hour</option>
                        <option value="90">1.5 hours</option>
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Mode:</label>
                    <select
                        className="form-input"
                        value={appointment.mode}
                        onChange={(e) => setAppointment({ ...appointment, mode: e.target.value })}
                    >
                        <option value="online">Online</option>
                        <option value="in-person">In-Person</option>
                    </select>
                </div>
            </div>
            <div className="form-group">
                <label className="form-label">Notes (Optional):</label>
                <textarea
                    className="form-textarea"
                    value={appointment.notes}
                    onChange={(e) => setAppointment({ ...appointment, notes: e.target.value })}
                    placeholder="Any additional notes or special requirements..."
                />
            </div>
            <div className="button-group">
                <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>
                    ← Back
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? (
                        <>
                            <span className="spinner"></span>
                            Scheduling...
                        </>
                    ) : (
                        'Schedule Appointment'
                    )}
                </button>
            </div>
        </div>
    );

    if (!isAuthenticated) {
        return (
            <div className="loading-container">
                <div className="spinner large"></div>
                <p>Checking authentication...</p>
            </div>
        );
    }

    return (
        <div className="appointment-schedule">
            <div className="container">
                <h2 className="main-title">Schedule Consultation</h2>

                {error && (
                    <div className="alert alert-error">
                        <span className="alert-icon">⚠️</span>
                        {error}
                    </div>
                )}

                {confirmation ? (
                    <div className="confirmation-card">
                        <div className="success-icon">✅</div>
                        <h3>Appointment Scheduled!</h3>
                        <p>{confirmation}</p>
                        <button
                            onClick={() => navigate('/profile')}
                            className="btn btn-primary"
                        >
                            View My Appointments
                        </button>
                    </div>
                ) : (
                    <div className="appointment-form">
                        <form onSubmit={handleSubmit}>
                            {step === 1 ? renderStep1() : renderStep2()}
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}