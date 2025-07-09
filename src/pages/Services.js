import { FaBalanceScale, FaFileContract, FaUserShield, FaHandsHelping, FaGlobe, FaHeart } from 'react-icons/fa';
import './Services.css';

export function Services() {
    const services = [
        {
            icon: <FaBalanceScale />,
            title: "24/7 AI Legal Assistant",
            description: "Always available AI assistance for instant legal help",
            price: "Free Forever",
            features: [
                "24/7 AI chat available",
                "Instant responses",
                "25+ languages support",
                "Regional law knowledge",
                "Legal document help",
                "Emergency guidance"
            ],
            available: true,
            highlightText: "Always Available"
        },
        {
            icon: <FaHandsHelping />,
            title: "NyaySathi Connect",
            description: "Chat with legal experts after request approval",
            price: "Free Access",
            features: [
                "Expert consultation",
                "Request approval needed",
                "Personal guidance",
                "Professional advice",
                "Local legal support",
                "Case specific help"
            ],
            available: true,
            highlightText: "Request Access"
        },
        {
            icon: <FaHeart />,
            title: "Emotional Support & Guidance",
            description: "AI-powered emotional support and legal counseling",
            price: "Free Access",
            features: [
                "24/7 emotional support",
                "Stress management tips",
                "Crisis assistance",
                "Counseling resources",
                "Connect with support groups",
                "Mental health guidance"
            ],
            available: true,
            highlightText: "Support"
        },
        {
            icon: <FaGlobe />,
            title: "Local Legal Resources",
            description: "Find nearby legal help and support services",
            price: "Free Access",
            features: [
                "Locate nearest police stations",
                "Find NGO support centers",
                "Legal awareness camps info",
                "Women help centers",
                "Free legal aid clinics",
                "Emergency contacts"
            ],
            available: true,
            highlightText: "Local Help"
        },
        {
            icon: <FaFileContract />,
            title: "Premium Connect",
            description: "Priority access to legal professionals",
            price: "Premium",
            features: [
                "Priority appointments",
                "Higher approval rate",
                "Faster response time",
                "Premium support",
                "Extended consultations",
                "Document analysis"
            ],
            available: false,
            highlightText: "Premium"  // Changed from "Coming Soon"
        },
        {
            icon: <FaUserShield />,
            title: "Expert Access",
            description: "Direct line to legal experts",
            price: "Premium",
            features: [
                "Instant approvals",
                "24/7 expert access",
                "Dedicated support",
                "Priority handling",
                "Full documentation",
                "Case management"
            ],
            available: false,
            highlightText: "Premium"  // Changed from "Coming Soon"
        }
    ];

    return (
        <div className="services-page">
            <div className="services-hero">
                <h1>Your Legal Support <span className="highlight">Companion</span></h1>
                <p>Free legal assistance in your language, anytime, anywhere</p>
            </div>

            <div className="services-grid">
                {services.map((service, index) => (
                    <div
                        className={`service-card ${!service.available ? 'coming-soon' : ''} ${service.highlightText ? 'highlight-card' : ''}`}
                        key={index}
                    >
                        <div className="service-content">
                            <div className="service-header">
                                <div className="service-icon">{service.icon}</div>
                                {service.highlightText && (
                                    <div className="service-highlight">{service.highlightText}</div>
                                )}
                                <h2>{service.title}</h2>
                                <p className="service-description">{service.description}</p>
                            </div>

                            <div className="service-price">
                                <span className={`price ${service.price === 'Free' ? 'free' : 'premium'}`}>
                                    {service.price}
                                </span>
                            </div>

                            <ul className="service-features">
                                {service.features.map((feature, i) => (
                                    <li key={i}>{feature}</li>
                                ))}
                            </ul>

                            <div className="service-footer">
                                <button
                                    className={`service-button ${!service.available ? 'disabled' : ''}`}
                                    disabled={!service.available}
                                >
                                    {service.available ? 'Get Started' : 'Coming Soon'}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
