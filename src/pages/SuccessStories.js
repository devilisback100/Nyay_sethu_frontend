import { useState } from 'react';
import { FaQuoteRight, FaStar, FaUserCircle } from 'react-icons/fa';
import './SuccessStories.css';

export function SuccessStories() {
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        title: '',
        story: '',
        category: '',
        rating: 5,
        consent: false
    });

    const successStories = [
        {
            id: 1,
            name: "Rajesh Kumar",
            title: "Property Dispute Resolution",
            story: "After a 3-year long property dispute, NyaySathi's legal team helped me win my case. Their guidance was invaluable throughout the process.",
            category: "Property Law",
            rating: 5,
            date: "March 2024"
        },
        // Add more success stories...
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        // Handle form submission logic here
        console.log(formData);
        setShowForm(false);
        // Reset form
        setFormData({
            name: '',
            title: '',
            story: '',
            category: '',
            rating: 5,
            consent: false
        });
    };

    return (
        <div className="success-stories">
            <div className="success-hero">
                <h1>Success <span className="highlight">Stories</span></h1>
                <p>Real stories from people who found justice through NyaySathi</p>
                <button className="share-story-btn" onClick={() => setShowForm(true)}>
                    Share Your Story
                </button>
            </div>

            <div className="stories-container">
                <div className="stories-grid">
                    {successStories.map(story => (
                        <div className="story-card" key={story.id}>
                            <div className="story-header">
                                <FaQuoteRight className="quote-icon" />
                                <div className="rating">
                                    {[...Array(story.rating)].map((_, i) => (
                                        <FaStar key={i} className="star-icon" />
                                    ))}
                                </div>
                            </div>
                            <h3>{story.title}</h3>
                            <p className="story-text">{story.story}</p>
                            <div className="story-footer">
                                <div className="author">
                                    <FaUserCircle className="author-icon" />
                                    <div className="author-info">
                                        <h4>{story.name}</h4>
                                        <span>{story.category}</span>
                                    </div>
                                </div>
                                <span className="story-date">{story.date}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {showForm && (
                <div className="modal-overlay">
                    <div className="story-form-container">
                        <h2>Share Your Success Story</h2>
                        <form onSubmit={handleSubmit} className="story-form">
                            <div className="form-group">
                                <label htmlFor="name">Your Name</label>
                                <input
                                    type="text"
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="title">Story Title</label>
                                <input
                                    type="text"
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="category">Category</label>
                                <select
                                    id="category"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    required
                                >
                                    <option value="">Select Category</option>
                                    <option value="Property Law">Property Law</option>
                                    <option value="Family Law">Family Law</option>
                                    <option value="Criminal Law">Criminal Law</option>
                                    <option value="Civil Law">Civil Law</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="story">Your Story</label>
                                <textarea
                                    id="story"
                                    value={formData.story}
                                    onChange={(e) => setFormData({ ...formData, story: e.target.value })}
                                    required
                                    rows="5"
                                ></textarea>
                            </div>
                            <div className="form-group">
                                <label htmlFor="rating">Rating</label>
                                <div className="rating-input">
                                    {[5, 4, 3, 2, 1].map((star) => (
                                        <label key={star}>
                                            <input
                                                type="radio"
                                                name="rating"
                                                value={star}
                                                checked={formData.rating === star}
                                                onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                                            />
                                            <FaStar className={`star-icon ${formData.rating >= star ? 'active' : ''}`} />
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="form-group checkbox">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={formData.consent}
                                        onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
                                        required
                                    />
                                    I consent to share my story publicly
                                </label>
                            </div>
                            <div className="form-actions">
                                <button type="button" className="cancel-btn" onClick={() => setShowForm(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="submit-btn">
                                    Submit Story
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
