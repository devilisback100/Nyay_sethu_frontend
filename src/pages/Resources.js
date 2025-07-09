import { FaBook, FaDownload } from 'react-icons/fa';
import './Resources.css';

export function Resources() {
    const basePath = '/resources/';

    const resources = [
        { title: "Child Protection in India", file: "child Protection in India.pdf", size: "3.15 MB" },
        { title: "Consumer Rights", file: "Consumer.pdf", size: "0.69 MB" },
        { title: "Cyber Crime Awareness", file: "Cyber_Crime.pdf", size: "5.82 MB" },
        { title: "Domestic Violence", file: "Domestic Violence.pdf", size: "0.01 MB" },
        { title: "E-Filing Guide", file: "E-filling.pdf", size: "0.76 MB" },
        { title: "Entitlements in India", file: "Entitlement in India.pdf", size: "0.03 MB" },
        { title: "Family Law - I", file: "Family_Law-I.pdf", size: "9.95 MB" },
        { title: "How to File an FIR", file: "fir.pdf", size: "0.47 MB" },
        { title: "Fundamental Rights & Duties", file: "fundamental rights and duties.pdf", size: "0.54 MB" },
        { title: "Legal System Handbook", file: "Handbook on Legal System & Procedure.pdf", size: "14.17 MB" },
        { title: "IPC Sections Overview", file: "ipc's.pdf", size: "1.05 MB" },
        { title: "Rights of the Accused", file: "rights of the accused.pdf", size: "0.08 MB" },
        { title: "Women’s Rights in India", file: "Women’s Rights in India.pdf", size: "4.96 MB" }
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
                    <div className="category-card">
                        <div className="category-header">
                            <span className="category-icon"><FaBook /></span>
                            <h2>Legal Guides</h2>
                        </div>
                        <div className="resource-list">
                            {resources.map((res, index) => (
                                <div className="resource-item" key={index}>
                                    <div className="resource-info">
                                        <h3>{res.title}</h3>
                                        <span className="resource-meta">PDF • {res.size}</span>
                                    </div>
                                    <a
                                        href={`${basePath}${encodeURIComponent(res.file)}`}
                                        download
                                        className="download-button"
                                        title="Download PDF"
                                    >
                                        <FaDownload style={{ marginRight: "6px" }} />Download
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
