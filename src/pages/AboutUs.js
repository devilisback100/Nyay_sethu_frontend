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
                        <div className="team-card fade-in">
                            <div className="member-image">
                                <img style={{rotate:"7.3deg"}} className='About_us_profile_img' src="../profile_photo.png" alt="Suresh Paliwal" />
                            </div>
                            <div className="member-info">
                                <h3>Suresh Paliwal</h3>
                                <p className="position">Full Stack Developer & Product Architect</p>
                                <p className="bio">
                                    B.Tech AIML Student | Full Stack & AI Developer. Developed the NyaySathi frontend and backend integration, and contributed to AI module enhancement including chatbot improvement, FAISS optimization, and smart legal suggestion flows.
                                </p>

                                <p>
                                    <a href="https://www.linkedin.com/in/suresh-paliwal-a75a41266/" target="_blank" rel="noopener noreferrer">LinkedIn</a> |{' '}
                                    <a href="https://suresh-portfolio-webapp.vercel.app/" target="_blank" rel="noopener noreferrer">Portfolio</a>
                                </p>
                            </div>
                        </div>

                        <div className="team-card fade-in">
                            <div className="member-image">
                                <img className='About_us_profile_img' src="../sumit_profile.jpg" alt="Sumit Kumar" / >
                            </div>
                            <div className="member-info">
                                <h3>Sumit Kumar</h3>
                                <p className="position">AI & Backend Lead</p>
                                <p className="bio">
                                    Leads the backend and AI logic of NyaySathi including RAG pipelines, FAISS integration, Neo4j-based reasoning, and Gemini-powered chatbot logic. Focused on making legal assistance smarter and scalable.
                                </p>
                                <p>
                                    <a href="http://www.linkedin.com/in/sumit-kumar-5b4344301" target="_blank" rel="noopener noreferrer">LinkedIn</a>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="impact-section">
                <div className="container">
                    <h2 className="section-title fade-in">Our Impact</h2>
                    <div className="stats-grid">
                        <div className="stat-item fade-in">
                            <h3>8000+</h3>
                            <p>People Helped</p>
                        </div>
                        <div className="stat-item fade-in">
                            <h3>99%</h3>
                            <p>Success Rate</p>
                        </div>
                        <div className="stat-item fade-in">
                            <h3>50+</h3>
                            <p>Legal Experts</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
