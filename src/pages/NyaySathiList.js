import { useEffect, useState } from 'react';
import './NyaySathiList.css';
import { useNavigate } from 'react-router-dom';

export function NyaySathiList() {
    const [nyaySathis, setNyaySathis] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchNyaySathis = async () => {
            const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
            const adminEmail = process.env.REACT_APP_ADMIN_EMAIL;
            const adminPassword = process.env.REACT_APP_ADMIN_PASSWORD;

            if (!adminEmail || !adminPassword) {
                console.error('Admin credentials are missing in the .env file.');
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`${BACKEND_URL}/api/auth/admin/nyaysathi/all`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: adminEmail, password: adminPassword })
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log("Fetched NyaySathis:", data);
                    setNyaySathis(data);
                    localStorage.setItem('nyaySathis', JSON.stringify(data));
                } else {
                    console.error('Failed to fetch NyaySathi list. Status:', response.status);
                }
            } catch (error) {
                console.error('Error fetching NyaySathi list:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchNyaySathis();
    }, []);

    if (loading) return <div>Loading NyaySathis...</div>;

    return (
        <div className="nyaysathi-list">
            <h1>NyaySathi Directory</h1>
            <div className="nyaysathi-grid">
                {nyaySathis.map((nyaySathi, index) => {
                    const id = nyaySathi.nyaysathi_id || nyaySathi._id;
                    return (
                        <div className="nyaysathi-card" key={id || `nyaySathi-${index}`}>
                            {nyaySathi.profile_picture ? (
                                <img
                                    src={nyaySathi.profile_picture}
                                    alt={nyaySathi.name}
                                    className="nyaysathi-image"
                                />
                            ) : (
                                <div className="nyaysathi-avatar">
                                    {nyaySathi.name?.charAt(0).toUpperCase() || '?'}
                                </div>
                            )}
                            <h3>{nyaySathi.name}</h3>
                            <p>
                                <strong>Type:</strong> {nyaySathi.type}
                            </p>
                            <p>
                                <strong>Consultation Fee:</strong> ₹{nyaySathi.consultation_fee}
                            </p>
                            <p>
                                <strong>Ratings:</strong> {nyaySathi.ratings?.average_rating || 0} ({nyaySathi.ratings?.total_reviews || 0} reviews)
                            </p>
                            <button
                                className="details-button"
                                onClick={() => navigate(`/nyaysathi/public/${id}`)}
                            >
                                View Details
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
