import './NearbyHelp.css';

export function NearbyHelp() {
    return (
        <div className="nearby-help">
            <div className="nearby-help-container">
                <div className="nearby-help-header">
                    <h1>Find Legal Help Nearby</h1>
                    <p>Locate police stations, NGOs, and legal aid centers</p>
                </div>
                <div className="map-container">
                    <div className="map-placeholder">
                        Map Loading...
                    </div>
                </div>
                <div className="search-filters">
                    <input
                        type="text"
                        placeholder="Enter your location"
                        className="search-input"
                    />
                </div>
            </div>
        </div>
    );
}

