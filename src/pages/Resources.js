import { FaBook, FaFileAlt, FaVideo, FaQuestion } from 'react-icons/fa';
import './Resources.css';

export function Resources() {
    const categories = [
        {
            title: "Legal Guides",
            icon: <FaBook />,
            items: [
                { title: "Family Law Basics", type: "PDF", size: "2.5 MB" },
                { title: "Property Rights Guide", type: "PDF", size: "1.8 MB" },
                { title: "Consumer Protection", type: "PDF", size: "3.2 MB" }
            ]
        },
        {
            title: "Document Templates",
            icon: <FaFileAlt />,
            items: [
                { title: "Rental Agreement", type: "DOCX", size: "500 KB" },
                { title: "Legal Notice Format", type: "DOCX", size: "350 KB" },
                { title: "Affidavit Template", type: "DOCX", size: "400 KB" }
            ]
        },
        {
            title: "Video Resources",
            icon: <FaVideo />,
            items: [
                { title: "Court Procedures", type: "MP4", size: "25 MB" },
                { title: "Legal Rights Explained", type: "MP4", size: "30 MB" },
                { title: "Filing a Police Complaint", type: "MP4", size: "28 MB" }
            ]
        },
        {
            title: "FAQs",
            icon: <FaQuestion />,
            items: [
                { title: "Common Legal Questions", type: "Article" },
                { title: "Legal Process Guide", type: "Article" },
                { title: "Rights & Duties", type: "Article" }
            ]
        }
    ];

    return (
        <div className="resources-page">
            <div className="resources-hero">
                <h1>Legal <span className="highlight">Resources</span></h1>
                <p>Free access to legal guides, templates, and educational materials</p>
            </div>

            <div className="resources-container">
                <div className="search-bar">
                    <input type="text" placeholder="Search resources..." />
                </div>

                <div className="resources-grid">
                    {categories.map((category, index) => (
                        <div className="category-card" key={index}>
                            <div className="category-header">
                                <span className="category-icon">{category.icon}</span>
                                <h2>{category.title}</h2>
                            </div>
                            <div className="resource-list">
                                {category.items.map((item, i) => (
                                    <div className="resource-item" key={i}>
                                        <div className="resource-info">
                                            <h3>{item.title}</h3>
                                            <span className="resource-meta">
                                                {item.type} {item.size && `• ${item.size}`}
                                            </span>
                                        </div>
                                        <button className="download-button">
                                            Download
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
