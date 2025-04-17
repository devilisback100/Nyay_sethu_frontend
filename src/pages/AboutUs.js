import { useEffect } from 'react';
import { FaBalanceScale, FaHandshake, FaUsers, FaAward } from 'react-icons/fa';
import './AboutUs.css';

export function AboutUs() {
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animate');
                    }
                });
            },
            { threshold: 0.1 }
        );

        document.querySelectorAll('.fade-in').forEach((el) => observer.observe(el));

        return () => observer.disconnect();
    }, []);

    return (
        <div className="about-page">
            <section className="about-hero">
                <div className="about-hero-content fade-in">
                    <h1>Our Mission for <span className="highlight">Justice</span></h1>
                    <p>Empowering individuals with accessible legal solutions and guidance</p>
                </div>
            </section>

            <section className="mission-values">
                <div className="container">
                    <div className="values-grid">
                        <div className="value-card fade-in">
                            <FaBalanceScale className="value-icon" />
                            <h3>Justice for All</h3>
                            <p>Making legal support accessible and affordable for everyone</p>
                        </div>
                        <div className="value-card fade-in">
                            <FaHandshake className="value-icon" />
                            <h3>Trust & Integrity</h3>
                            <p>Building relationships based on transparency and honesty</p>
                        </div>
                        <div className="value-card fade-in">
                            <FaUsers className="value-icon" />
                            <h3>Community First</h3>
                            <p>Serving and empowering our communities</p>
                        </div>
                        <div className="value-card fade-in">
                            <FaAward className="value-icon" />
                            <h3>Excellence</h3>
                            <p>Committed to providing the highest quality legal assistance</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="team-section">
                <div className="container">
                    <h2 className="section-title fade-in">Our Leadership Team</h2>
                    <div className="team-grid">
                        {[1, 2, 3].map((member) => (
                            <div key={member} className="team-card fade-in">
                                <div className="member-image">
                                    <img src={`https://via.placeholder.com/200`} alt="Team member" />
                                </div>
                                <div className="member-info">
                                    <h3>Name Surname</h3>
                                    <p className="position">Position</p>
                                    <p className="bio">Brief description about the team member and their role in NyaySathi.</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="impact-section">
                <div className="container">
                    <h2 className="section-title fade-in">Our Impact</h2>
                    <div className="stats-grid">
                        <div className="stat-item fade-in">
                            <h3>50,000+</h3>
                            <p>People Helped</p>
                        </div>
                        <div className="stat-item fade-in">
                            <h3>95%</h3>
                            <p>Success Rate</p>
                        </div>
                        <div className="stat-item fade-in">
                            <h3>1000+</h3>
                            <p>Legal Experts</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
