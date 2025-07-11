import { useState, useEffect } from 'react';
import { FaArrowLeft, FaGavel, FaUserTie, FaUniversity, FaHandshake, FaBuilding } from 'react-icons/fa';
import { TermsAndConditions } from '../../components/TermsAndConditions'; // Import the modal component

export function NyaySathiSignup({ onBack }) {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        type: '',
        // Basic Info
        name: '',
        email: '',
        password: '',
        phone: '', // keep in state, but not shown in UI
        state: '',
        district: '',
        // Professional Info
        barCouncilNumber: '',
        licenseNumber: '',
        specialization: '',
        yearsOfExperience: '',
        currentRole: '',
        institution: '',
        organization: '',
        ngoRegistration: '',
        areasOfOperation: [],
        // Verification Documents
        idProof: null,
        licenseProof: null,
        experienceCertificate: null,
        barCouncilCertificate: null,
        otherCertifications: []
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isTermsOpen, setIsTermsOpen] = useState(false); // State to control the modal
    const [termsAccepted, setTermsAccepted] = useState(false); // State for checkbox
    const [otpRequested, setOtpRequested] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState('');
    const [otpVerified, setOtpVerified] = useState(false);
    const [otpError, setOtpError] = useState('');
    const [passwordWarning, setPasswordWarning] = useState('');
    const [otpRequestCooldown, setOtpRequestCooldown] = useState(0);
    const [otpVerifyCooldown, setOtpVerifyCooldown] = useState(0);

    // State for storing states and cities
    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);
    const [isLoadingStates, setIsLoadingStates] = useState(false);
    const [isLoadingCities, setIsLoadingCities] = useState(false);

    const nyaySathiCategories = [
        {
            id: 'lawyer',
            title: 'Licensed Lawyers & Advocates',
            icon: <FaGavel />,
            requirements: ['Valid Bar Council Registration', 'Practice License', 'Min. 3 years experience']
        },
        {
            id: 'judge',
            title: 'Retired Judges & Senior Legal Advisors',
            icon: <FaUserTie />,
            requirements: ['Proof of Service', 'Retirement Documents', 'Service Records']
        },
        {
            id: 'professor',
            title: 'Law Professors & Legal Researchers',
            icon: <FaUniversity />,
            requirements: ['Academic Credentials', 'Research Publications', 'Teaching Experience']
        },
        {
            id: 'volunteer',
            title: 'Certified Legal Aid Volunteers',
            icon: <FaHandshake />,
            requirements: ['Legal Aid Certification', 'Bar Association Membership', 'Volunteer Experience']
        },
        {
            id: 'ngo',
            title: 'NGO Legal Services',
            icon: <FaBuilding />,
            requirements: ['NGO Registration', 'Legal Aid Experience', 'Min. 2 years operation']
        }
    ];

    // Fetch states from API on component mount
    useEffect(() => {
        const fetchStates = async () => {
            setIsLoadingStates(true);
            try {
                const response = await fetch(
                    "https://api.countrystatecity.in/v1/countries/IN/states",
                    {
                        headers: {
                            "X-CSCAPI-KEY": process.env.REACT_APP_PLACES_API_KEY
                        }
                    }
                );

                if (!response.ok) {
                    throw new Error("Failed to fetch states");
                }

                const data = await response.json();
                setStates(data);
            } catch (error) {
                setError("Failed to load states. Please try again.");
            } finally {
                setIsLoadingStates(false);
            }
        };

        fetchStates();
    }, []);

    // Fetch cities when state is selected
    useEffect(() => {
        if (!formData.state) {
            setCities([]);
            return;
        }

        const fetchCities = async () => {
            setIsLoadingCities(true);
            try {
                const response = await fetch(
                    `https://api.countrystatecity.in/v1/countries/IN/states/${formData.state}/cities`,
                    {
                        headers: {
                            "X-CSCAPI-KEY": process.env.REACT_APP_PLACES_API_KEY
                        }
                    }
                );

                if (!response.ok) {
                    throw new Error("Failed to fetch cities");
                }

                const data = await response.json();
                setCities(data);
                setFormData(prevData => ({ ...prevData, district: '' })); // Reset district when state changes
            } catch (error) {
                setError("Failed to load cities. Please try again.");
            } finally {
                setIsLoadingCities(false);
            }
        };

        fetchCities();
    }, [formData.state]);

    const nextStep = () => setStep(step + 1);
    const prevStep = () => setStep(step - 1);
    const triggerAuthStateChange = () => {
        const event = new CustomEvent('authStateChanged');
        window.dispatchEvent(event);
    };
    const renderCategorySelection = () => (
        <div className="category-selection">
            <h3>Select Your Category</h3>
            <div className="categories-grid">
                {nyaySathiCategories.map(category => (
                    <div
                        key={category.id}
                        className={`category-card ${formData.type === category.id ? 'selected' : ''}`}
                        onClick={() => setFormData({ ...formData, type: category.id })}
                    >
                        <div className="category-icon">{category.icon}</div>
                        <h4>{category.title}</h4>
                        <div className="requirements-list">
                            {category.requirements.map((req, index) => (
                                <span key={index} className="requirement-tag">{req}</span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderProfessionalForm = () => {
        switch (formData.type) {
            case 'lawyer':
                return (
                    <>
                        <div className="form-group">
                            <label>Bar Council Number</label>
                            <input
                                type="text"
                                placeholder="Enter Bar Council Registration Number"
                                value={formData.barCouncilNumber}
                                onChange={(e) => setFormData({ ...formData, barCouncilNumber: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Area of Practice</label>
                            <select
                                value={formData.specialization}
                                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                                required
                            >
                                <option value="">Select Area</option>
                                <option value="criminal">Criminal Law</option>
                                <option value="civil">Civil Law</option>
                                <option value="family">Family Law</option>
                                <option value="corporate">Corporate Law</option>
                            </select>
                        </div>
                    </>
                );

            case 'ngo':
                return (
                    <>
                        <div className="form-group">
                            <label>NGO Registration Number</label>
                            <input
                                type="text"
                                placeholder="Enter NGO Registration Number"
                                value={formData.ngoRegistration}
                                onChange={(e) => setFormData({ ...formData, ngoRegistration: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Areas of Operation</label>
                            <div className="checkbox-group">
                                {['Women Rights', 'Child Rights', 'Human Rights', 'Environmental Law'].map(area => (
                                    <label key={area} className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            value={area}
                                            onChange={(e) => {
                                                const areas = formData.areasOfOperation || [];
                                                if (e.target.checked) {
                                                    areas.push(area);
                                                } else {
                                                    areas.splice(areas.indexOf(area), 1);
                                                }
                                                setFormData({ ...formData, areasOfOperation: areas });
                                            }}
                                        />
                                        {area}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </>
                );

            case 'judge':
                return (
                    <>
                        <div className="form-group">
                            <label>Last Position Held</label>
                            <input
                                type="text"
                                placeholder="Enter your last judicial position"
                                value={formData.currentRole}
                                onChange={(e) => setFormData({ ...formData, currentRole: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Years of Service</label>
                            <input
                                type="number"
                                placeholder="Total years of service"
                                value={formData.yearsOfExperience}
                                onChange={(e) => setFormData({ ...formData, yearsOfExperience: e.target.value })}
                                required
                            />
                        </div>
                    </>
                );

            case 'professor':
                return (
                    <>
                        <div className="form-group">
                            <label>Institution Name</label>
                            <input
                                type="text"
                                placeholder="Enter your institution name"
                                value={formData.institution}
                                onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Specialization</label>
                            <input
                                type="text"
                                placeholder="Your area of expertise"
                                value={formData.specialization}
                                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                                required
                            />
                        </div>
                    </>
                );

            case 'volunteer':
                return (
                    <>
                        <div className="form-group">
                            <label>Organization</label>
                            <input
                                type="text"
                                placeholder="Enter organization name"
                                value={formData.organization}
                                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Certification Number</label>
                            <input
                                type="text"
                                placeholder="Legal Aid Certification Number"
                                value={formData.licenseNumber}
                                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                                required
                            />
                        </div>
                    </>
                );

            default:
                return null;
        }
    };

    const handleFileChange = (e, field) => {
        const file = e.target.files[0];
        if (!file) return;

        const validFileTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        if (!validFileTypes.includes(file.type)) {
            setError('Invalid file type. Only PDF, JPEG, and PNG are allowed.');
            return;
        }

        setFormData((prevData) => ({
            ...prevData,
            [field]: file,
        }));
    };

    const handleTermsClick = () => {
        setIsTermsOpen(true); // Open the modal
    };

    const handleTermsClose = () => {
        setIsTermsOpen(false); // Close the modal
    };

    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

    const requestOtp = async () => {
        setOtpError('');
        setError('');
        if (!formData.email) {
            setOtpError('Please enter your email first.');
            return;
        }
        setOtpRequestCooldown(60);
        let interval = setInterval(() => {
            setOtpRequestCooldown(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        try {
            const res = await fetch(`${BACKEND_URL}/api/auth/verify-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email }),
            });
            const data = await res.json();
            if (res.ok) {
                setOtpRequested(true);
                setOtpSent(true);
                setOtpError('');
            } else {
                setOtpError(data.error || 'Failed to send OTP.');
            }
        } catch (err) {
            setOtpError('Failed to send OTP.');
        }
    };

    const verifyOtp = async () => {
        setOtpError('');
        if (!otp) {
            setOtpError('Please enter the OTP.');
            return;
        }
        setOtpVerifyCooldown(60);
        let interval = setInterval(() => {
            setOtpVerifyCooldown(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        try {
            const res = await fetch(`${BACKEND_URL}/api/auth/verify-email/otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email, otp }),
            });
            const data = await res.json();
            if (res.ok) {
                setOtpVerified(true);
                setOtpError('');
            } else {
                setOtpError(data.error || 'Invalid OTP.');
            }
        } catch (err) {
            setOtpError('Failed to verify OTP.');
        }
    };

    const isStrongPassword = (password) => {
        return (
            password.length >= 8 &&
            /[A-Za-z]/.test(password) &&
            /[0-9]/.test(password)
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!otpVerified) {
            setError('Please verify your email with OTP before signing up.');
            return;
        }
        if (!isStrongPassword(formData.password)) {
            setPasswordWarning('Password must be at least 8 characters long and contain at least one letter and one number.');
            return;
        }
        setPasswordWarning('');
        if (!termsAccepted) {
            alert('You must accept the Terms and Conditions to proceed.');
            return;
        }

        try {
            const formDataToSend = new FormData();
            Object.keys(formData).forEach((key) => {
                if (key === 'phone') {
                    formDataToSend.append('phone', ''); // always send empty string for phone
                } else if (formData[key]) {
                    formDataToSend.append(key, formData[key]);
                }
            });

            const response = await fetch(`${BACKEND_URL}/api/nyaysathi`, {
                method: 'POST',
                body: formDataToSend,
            });

            if (response.ok) {
                const data = await response.json();

                // Now log the user in to get the token (similar to User signup)
                const loginRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: formData.email,
                        password: formData.password,
                    }),
                });

                if (loginRes.ok) {
                    const loginData = await loginRes.json();
                    // Store token and user info
                    localStorage.setItem('token', loginData.token);
                    localStorage.setItem('isLoggedIn', 'true');
                    localStorage.setItem('userType', 'nyaysathi');
                    localStorage.setItem('email', formData.email);
                    localStorage.setItem('password', formData.password);
                    triggerAuthStateChange(); // Trigger auth state change event
                    setSuccess('NyaySathi account created successfully! You can check the status of your verification in a few hours by logging into this website.');
                    setError('');
                    setTimeout(() => {
                        window.location.href = '/profile'; // Redirect to NyaySathi profile
                    }, 3000); // Wait for 3 seconds before redirecting
                } else {
                    // Account created but login failed
                    localStorage.setItem('isLoggedIn', 'true');
                    localStorage.setItem('userType', 'nyaysathi');
                    localStorage.setItem('email', formData.email);
                    setSuccess('NyaySathi account created successfully! Please sign in manually to access your profile.');
                    setError('');
                    setTimeout(() => {
                        window.location.href = '/signin'; // Redirect to sign in page
                    }, 3000);
                }
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to create account.');
                setSuccess('');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
            setSuccess('');
        }
    };

    const renderDocumentRequirements = () => {
        const commonDocs = (
            <div className="form-group">
                <label>ID Proof</label>
                <input
                    type="file"
                    accept=".pdf,.jpg,.png"
                    onChange={(e) => handleFileChange(e, 'idProof')}
                    required
                />
            </div>
        );

        switch (formData.type) {
            case 'lawyer':
                return (
                    <>
                        {commonDocs}
                        <div className="form-group">
                            <label>Bar Council Certificate</label>
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={(e) => handleFileChange(e, 'barCouncilCertificate')}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Practice Certificate</label>
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={(e) => handleFileChange(e, 'licenseProof')}
                                required
                            />
                        </div>
                    </>
                );
            case 'ngo':
                return (
                    <>
                        {commonDocs}
                        <div className="form-group">
                            <label>NGO Registration Certificate</label>
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={(e) => handleFileChange(e, 'ngoRegistration')}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Annual Reports (Last 2 Years)</label>
                            <input
                                type="file"
                                accept=".pdf"
                                multiple
                                onChange={(e) => handleFileChange(e, 'annualReports')}
                                required
                            />
                        </div>
                    </>
                );
            case 'judge':
                return (
                    <>
                        {commonDocs}
                        <div className="form-group">
                            <label>Retirement Documents</label>
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={(e) => handleFileChange(e, 'retirementDocuments')}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Service Records</label>
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={(e) => handleFileChange(e, 'serviceRecords')}
                                required
                            />
                        </div>
                    </>
                );
            case 'professor':
                return (
                    <>
                        {commonDocs}
                        <div className="form-group">
                            <label>Academic Credentials</label>
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={(e) => handleFileChange(e, 'academicCredentials')}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Research Publications</label>
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={(e) => handleFileChange(e, 'researchPublications')}
                                required
                            />
                        </div>
                    </>
                );
            case 'volunteer':
                return (
                    <>
                        {commonDocs}
                        <div className="form-group">
                            <label>Legal Aid Certification</label>
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={(e) => handleFileChange(e, 'legalAidCertification')}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Volunteer Experience Proof</label>
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={(e) => handleFileChange(e, 'volunteerExperienceProof')}
                                required
                            />
                        </div>
                    </>
                );
            default:
                return null;
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return renderCategorySelection();
            case 2:
                return (
                    <div className="form-step">
                        <h3>Professional Information</h3>
                        <div className="form-grid">
                            {/* Basic Info */}
                            <div className="form-group">
                                <label>Full Name</label>
                                <input
                                    type="text"
                                    placeholder="Enter your full name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    value={formData.email}
                                    onChange={(e) => {
                                        setFormData({ ...formData, email: e.target.value });
                                        setOtpRequested(false);
                                        setOtpVerified(false);
                                        setOtp('');
                                    }}
                                    required
                                />
                                {!otpRequested && (
                                    <button
                                        type="button"
                                        className="otp-button"
                                        onClick={requestOtp}
                                        disabled={otpRequestCooldown > 0}
                                    >
                                        {otpRequestCooldown > 0 ? `Sending... (${otpRequestCooldown}s)` : 'Send OTP'}
                                    </button>
                                )}
                                {otpRequested && !otpVerified && (
                                    <div className="otp-verification">
                                        <input
                                            type="text"
                                            placeholder="Enter OTP"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                            maxLength={6}
                                        />
                                        <button
                                            type="button"
                                            className="verify-otp-button"
                                            onClick={verifyOtp}
                                            disabled={otpVerifyCooldown > 0}
                                        >
                                            {otpVerifyCooldown > 0 ? `Verifying... (${otpVerifyCooldown}s)` : 'Verify OTP'}
                                        </button>
                                        {otpError && <span className="error-message">{otpError}</span>}
                                    </div>
                                )}
                                {otpVerified && <span className="success-message">Email verified!</span>}
                            </div>
                            {/* Phone field removed */}
                            <div className="form-group">
                                <label>Password</label>
                                <input
                                    type="password"
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={(e) => {
                                        setFormData({ ...formData, password: e.target.value });
                                        if (!isStrongPassword(e.target.value)) {
                                            setPasswordWarning('Password must be at least 8 characters long and contain at least one letter and one number.');
                                        } else {
                                            setPasswordWarning('');
                                        }
                                    }}
                                    required
                                />
                                {passwordWarning && (
                                    <div className="password-warning" style={{ color: "red", marginTop: "5px" }}>
                                        {passwordWarning}
                                    </div>
                                )}
                            </div>

                            {/* Professional Details - Conditional based on category */}
                            {renderProfessionalForm()}

                            {/* Dynamic State Selection */}
                            <div className="form-group">
                                <label>State</label>
                                <select
                                    value={formData.state}
                                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                    disabled={isLoadingStates}
                                    required
                                >
                                    <option value="">Select State</option>
                                    {states.map(state => (
                                        <option key={state.iso2} value={state.iso2}>
                                            {state.name}
                                        </option>
                                    ))}
                                </select>
                                {isLoadingStates && <div className="loading-indicator">Loading states...</div>}
                            </div>

                            {/* Dynamic City Selection */}
                            <div className="form-group">
                                <label>City</label>
                                <select
                                    value={formData.district}
                                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                                    disabled={isLoadingCities || !formData.state}
                                    required
                                >
                                    <option value="">Select City</option>
                                    {cities.map(city => (
                                        <option key={city.id} value={city.id}>
                                            {city.name}
                                        </option>
                                    ))}
                                </select>
                                {isLoadingCities && <div className="loading-indicator">Loading cities...</div>}
                            </div>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="form-step">
                        <h3>Document Verification</h3>
                        <div className="document-upload-grid">
                            {renderDocumentRequirements()}
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="signup-container">
            <button className="back-button" onClick={onBack}>
                <FaArrowLeft /> Back
            </button>
            <h2>Sign Up as NyaySathi</h2>
            <div className="progress-bar">
                {[1, 2, 3].map((i) => (
                    <div key={i} className={`progress-step ${step >= i ? 'active' : ''}`}>
                        {i}
                    </div>
                ))}
            </div>
            <form className="signup-form" onSubmit={handleSubmit}>
                {renderStep()}
                <div className="form-group terms">
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={termsAccepted}
                            onChange={(e) => setTermsAccepted(e.target.checked)}
                            required
                        />
                        <span>
                            I agree to the{' '}
                            <span className="terms-link" onClick={handleTermsClick} style={{ color: "blue", textDecorationLine: "underline" }}>
                                Terms of Service and Privacy Policy
                            </span>
                        </span>
                    </label>
                </div>
                {/* Show prompt if not verified */}
                {!otpVerified && (
                    <div className="verify-email-warning" style={{ color: "red", marginBottom: "10px" }}>
                        Please verify your email with OTP before submitting your application.
                    </div>
                )}
                {error && <p className="error-message">{error}</p>}
                {success && <p className="success-message">{success}</p>}
                <div className="form-actions">
                    {step > 1 && (
                        <button type="button" onClick={prevStep} className="prev-button">
                            Previous
                        </button>
                    )}
                    {step < 3 ? (
                        <button type="button" onClick={nextStep} className="next-button">
                            Next
                        </button>
                    ) : (
                        <button type="submit" className="submit-button" disabled={!otpVerified || !isStrongPassword(formData.password)}>
                            Submit Application
                        </button>
                    )}
                </div>
            </form>
            <TermsAndConditions
                isOpen={isTermsOpen}
                onClose={handleTermsClose}
            />
        </div>
    );
}