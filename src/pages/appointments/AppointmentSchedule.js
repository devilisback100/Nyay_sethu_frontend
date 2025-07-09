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
        <div className="case-details">
            <h3>Case Details</h3>
            <div className="form-group">
                <label>Type of Consultation:</label>
                <select
                    value={appointment.consultation_type}
                    onChange={(e) =>
                        setAppointment({ ...appointment, consultation_type: e.target.value })
                    }
                >
                    <option value="initial">Initial Consultation</option>
                    <option value="followup">Follow-up Consultation</option>
                    <option value="document_review">Document Review</option>
                    <option value="legal_advice">Legal Advice</option>
                </select>
            </div>
            <div className="form-group">
                <label>Case Type:</label>
                <select
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
            <div className="form-group">
                <label>Case Description:</label>
                <textarea
                    value={appointment.case_description}
                    onChange={(e) =>
                        setAppointment({ ...appointment, case_description: e.target.value })
                    }
                    required
                />
            </div>
            <div className="button-group">
                <div></div>
                <button
                    type="button"
                    className="next-button"
                    onClick={() => setStep(2)}
                    disabled={!appointment.case_type || !appointment.case_description}
                >
                    Next: Schedule Time
                </button>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="scheduling-details">
            <h3>Schedule Appointment</h3>
            <div className="form-group">
                <label>Date:</label>
                <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={appointment.date}
                    onChange={(e) => setAppointment({ ...appointment, date: e.target.value })}
                    required
                />
            </div>
            <div className="form-group">
                <label>Time:</label>
                <input
                    type="time"
                    value={appointment.time}
                    onChange={(e) => setAppointment({ ...appointment, time: e.target.value })}
                    required
                />
            </div>
            <div className="form-group">
                <label>Duration:</label>
                <select
                    value={appointment.duration}
                    onChange={(e) => setAppointment({ ...appointment, duration: e.target.value })}
                >
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="90">1.5 hours</option>
                </select>
            </div>
            <div className="form-group">
                <label>Mode:</label>
                <select
                    value={appointment.mode}
                    onChange={(e) => setAppointment({ ...appointment, mode: e.target.value })}
                >
                    <option value="online">Online</option>
                    <option value="in-person">In-Person</option>
                </select>
            </div>
            <div className="form-group">
                <label>Notes (Optional):</label>
                <textarea
                    value={appointment.notes}
                    onChange={(e) => setAppointment({ ...appointment, notes: e.target.value })}
                />
            </div>
            <div className="button-group">
                <button type="button" className="back-button" onClick={() => setStep(1)}>
                    Back
                </button>
                <button type="submit" className="submit-button" disabled={loading}>
                    {loading ? 'Scheduling...' : 'Schedule'}
                </button>
            </div>
        </div>
    );

    if (!isAuthenticated) return <div className="loading">Checking authentication...</div>;

    return (
        <div className="appointment-schedule">
            <h2>Schedule Consultation</h2>
            {error && <div className="error-message">{error}</div>}

            {confirmation ? (
                <div className="confirmation-message">
                    <p>{confirmation}</p>
                    <button onClick={() => navigate('/profile')} className="view-appointments-btn">
                        View My Appointments
                    </button>
                </div>
            ) : (
                <>
                    <div className="progress-indicator">
                        <div className={`step ${step >= 1 ? 'active' : ''}`}>Case Details</div>
                        <div className={`step ${step >= 2 ? 'active' : ''}`}>Schedule Time</div>
                    </div>
                    <form onSubmit={handleSubmit} className="appointment-form">
                        {step === 1 ? renderStep1() : renderStep2()}
                    </form>
                </>
            )}
        </div>
    );
}
