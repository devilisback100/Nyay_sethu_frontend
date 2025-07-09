import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { FaBalanceScale, FaFileAlt, FaHandshake, FaBook, FaArrowRight } from 'react-icons/fa';
import './Home.css';

export function Home() {
    const [isVisible, setIsVisible] = useState({
        hero: false,
        features: false,
        testimonials: false,
        cta: false
    });

    const [stats, setStats] = useState([]);

    const sectionRefs = {
        hero: useRef(null),
        features: useRef(null),
        testimonials: useRef(null),
        cta: useRef(null)
    };

    useEffect(() => {
        const observerOptions = {
            threshold: 0.2,
            rootMargin: '0px'
        };

        const observers = {};

        Object.entries(sectionRefs).forEach(([key, ref]) => {
            observers[key] = new IntersectionObserver(entries => {
                if (entries[0].isIntersecting) {
                    setIsVisible(prev => ({ ...prev, [key]: true }));
                    observers[key].unobserve(ref.current);
                }
            }, observerOptions);

            if (ref.current) {
                observers[key].observe(ref.current);
            }
        });

        return () => {
            Object.values(observers).forEach(observer => observer.disconnect());
        };
    }, []);

    useEffect(() => {
        const hardcodedStats = [
            { icon: "🌐", title: "Multi-Lingual", description: "Support in 40+ Languages" },
            { icon: "🎯", title: "Precise Help", description: "State-specific Legal Guidance" },
            { icon: "🤝", title: "Friendly AI", description: "Natural Conversation Style" },
            { icon: "📍", title: "Local Support", description: "Region-specific Resources" },
        ];
        setStats(hardcodedStats);
    }, []);

    const features = [
        {
            title: "AI Legal Assistant",
            description: "Get instant answers to your legal queries and understand your rights",
            icon: <FaBalanceScale className="feature-icon-svg" />,
            color: "var(--primary)",
            link: "/legal-help"
        },
        {
            title: "Document Analysis",
            description: "AI-powered legal document review with plain language explanations",
            icon: <FaFileAlt className="feature-icon-svg" />,
            color: "var(--secondary)",
            link: null // No redirect
        },
        {
            title: "Expert Connect",
            description: "Connect with verified lawyers for personalized legal consultation",
            icon: <FaHandshake className="feature-icon-svg" />,
            color: "var(--accent)",
            link: "/nyaysathi"
        },
        {
            title: "Legal Resources",
            description: "Access comprehensive legal guides tailored to your situation",
            icon: <FaBook className="feature-icon-svg" />,
            color: "var(--success)",
            link: "/resources"
        }
    ];

    const testimonials = [
        {
            name: "Priya S.",
            role: "Small Business Owner",
            content: "Nyay Sathi helped me understand my contract obligations when a client refused to pay. The guidance was clear and practical.",
            rating: 5
        },
        {
            name: "Rajesh K.",
            role: "Homeowner",
            content: "I was facing a property dispute with no idea where to start. Nyay Sathi connected me with a property lawyer who resolved my case in weeks.",
            rating: 5
        },
        {
            name: "Meera P.",
            role: "Working Professional",
            content: "The document analysis feature saved me from signing a problematic employment contract. Worth every rupee of the premium subscription.",
            rating: 4
        }
    ];

    return (
        <div className="home">
            <section
                ref={sectionRefs.hero}
                className={`hero ${isVisible.hero ? 'visible' : ''}`}
            >
                <div className="hero-content">
                    <h1>Justice Made <span className="highlight">Simple</span></h1>
                    <p className="hero-subtitle">Your AI-powered legal companion for quick and reliable legal assistance</p>
                    <div className="hero-actions" >
                        <Link to="/auth" className="button primary" onClick={() => window.scrollTo(0, 0)} >
                            Get Started
                            <FaArrowRight className="button-icon" />
                        </Link>
                        <Link to="/about" className="button outline" onClick={() => window.scrollTo(0, 0)} >
                            Learn More
                        </Link>
                    </div>
                </div>
                <div className="hero-stats">
                    {stats.map((stat, index) => (
                        <div className="stat-card-user" key={index}>
                            <div className="stat-icon">{stat.icon}</div>
                            <h3>{stat.title}</h3>
                            <p>{stat.description}</p>
                        </div>
                    ))}
                </div>
                <div className="hero-image">
                    <img src="/img_ai_law.png" alt="AI Legal Assistant" />
                </div>
                <div className="hero-backdrop"></div>
            </section>

            <section
                ref={sectionRefs.features}
                className={`features ${isVisible.features ? 'visible' : ''}`}
            >
                <h2>How We <span className="highlight">Help</span></h2>
                <div className="features-grid">
                    {features.map((feature, index) => (
                        <div
                            className="feature-card"
                            key={index}
                            style={{
                                animationDelay: `${index * 0.1}s`,
                                transitionDelay: `${index * 0.1}s`
                            }}
                        >
                            <div className="feature-icon" style={{ background: feature.color }}>
                                {feature.icon}
                                <div className="feature-icon-ring"></div>
                            </div>
                            <h3>{feature.title}</h3>
                            <p>{feature.description}</p>
                            {feature.link ? (
                                <Link to={feature.link} className="feature-link">
                                    Learn more <FaArrowRight />
                                </Link>
                            ) : (
                                <span className="feature-link disabled">
                                    Learn more <FaArrowRight />
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            <section
                ref={sectionRefs.testimonials}
                className={`testimonials ${isVisible.testimonials ? 'visible' : ''}`}
            >
                <div className="testimonials-header">
                    <h2>What Our <span className="highlight">Users</span> Say</h2>
                    <p>Real experiences from people who found justice with our help</p>
                </div>
                <div className="testimonials-grid">
                    {testimonials.map((testimonial, index) => (
                        <div
                            className="testimonial-card"
                            key={index}
                            style={{
                                animationDelay: `${index * 0.15}s`,
                                transitionDelay: `${index * 0.15}s`
                            }}
                        >
                            <div className="testimonial-rating">
                                {[...Array(testimonial.rating)].map((_, i) => (
                                    <span key={i} className="star">★</span>
                                ))}
                            </div>
                            <p className="testimonial-content">"{testimonial.content}"</p>
                            <div className="testimonial-author">
                                <div className="testimonial-avatar">
                                    {testimonial.name.charAt(0)}
                                </div>
                                <div className="testimonial-info">
                                    <h4>{testimonial.name}</h4>
                                    <p>{testimonial.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section
                ref={sectionRefs.cta}
                className={`cta ${isVisible.cta ? 'visible' : ''}`}
            >
                <div className="cta-content">
                    <h2>Ready to Seek <span className="highlight">Justice?</span></h2>
                    <p>Get started with Nyay Sathi today and take the first step toward resolving your legal concerns</p>
                    <div className="cta-actions">
                        <Link to="/auth" className="button primary" onClick={() => window.scrollTo(0, 0)}>
                            Join Now
                            <FaArrowRight className="button-icon" />
                        </Link>
                        <Link to="/services" className="button secondary" onClick={() => window.scrollTo(0, 0)}>
                            View Plans
                        </Link>
                    </div>
                </div>
                <div className="cta-highlight">
                    <div className="cta-stats">
                        <div className="cta-stat">
                            <h3>Free</h3>
                            <p>Basic Legal Guidance</p>
                        </div>
                        <div className="cta-divider"></div>
                        <div className="cta-stat">
                            <h3>5 Min</h3>
                            <p>Average Response Time</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}