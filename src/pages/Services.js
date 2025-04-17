import { FaBalanceScale, FaFileContract, FaUserShield, FaHandsHelping } from 'react-icons/fa';
import './Services.css';

export function Services() {
    const services = [
        {
            icon: <FaBalanceScale />,
            title: "Legal Consultation",
            description: "Expert guidance from experienced lawyers for all your legal matters.",
            price: "₹999",
            features: [
                "30-minute consultation",
                "Case evaluation",
                "Legal strategy planning",
                "Document review"
            ]
        },
        {
            icon: <FaFileContract />,
            title: "Document Review",
            description: "Professional review and analysis of legal documents and contracts.",
            price: "₹1499",
            features: [
                "Detailed analysis",
                "Risk assessment",
                "Compliance check",
                "Modification suggestions"
            ]
        },
        {
            icon: <FaUserShield />,
            title: "Legal Representation",
            description: "Full legal representation for your case by qualified attorneys.",
            price: "Custom",
            features: [
                "Court representation",
                "Case management",
                "Documentation support",
                "Regular updates"
            ]
        },
        {
            icon: <FaHandsHelping />,
            title: "Mediation Services",
            description: "Professional mediation to resolve disputes outside court.",
            price: "₹2999",
            features: [
                "Neutral mediator",
                "Structured process",
                "Agreement drafting",
                "Follow-up support"
            ]
        }
    ];

    return (
        <div className="services-page">
            <div className="services-hero">
                <h1>Our <span className="highlight">Services</span></h1>
                <p>Comprehensive legal solutions tailored to your needs</p>
            </div>

            <div className="services-grid">
                {services.map((service, index) => (
                    <div className="service-card" key={index}>
                        <div className="service-icon">{service.icon}</div>
                        <h2>{service.title}</h2>
                        <p className="service-description">{service.description}</p>
                        <div className="service-price">
                            <span className="price">{service.price}</span>
                            {service.price !== "Custom" && <span className="period">/session</span>}
                        </div>
                        <ul className="service-features">
                            {service.features.map((feature, i) => (
                                <li key={i}>{feature}</li>
                            ))}
                        </ul>
                        <button className="service-button">Get Started</button>
                    </div>
                ))}
            </div>
        </div>
    );
}
