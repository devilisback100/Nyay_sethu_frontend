import { useEffect, useState, useRef } from 'react';
import { GoogleMap, LoadScript, Marker, DirectionsRenderer, InfoWindow } from '@react-google-maps/api';
import './FindHelp.css';

const libraries = ['places'];

const FACILITY_TYPES = [
    { id: 'police', label: 'Police Stations', keyword: 'police', icon: '👮‍♂️' },
    { id: 'ngo', label: 'NGOs', keyword: 'ngo legal aid', icon: '🏢' },
    { id: 'volunteer', label: 'Legal Aid Volunteers', keyword: 'legal aid volunteer center', icon: '🤝' },
    { id: 'court', label: 'Courts', keyword: 'court law', icon: '⚖️' },
    { id: 'women_help', label: 'Women Help Centers', keyword: 'women help center safety', icon: '👩‍⚖️' }
];

const RESULTS_PER_PAGE = 10;
const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

export function FindHelp() {
    const [userLocation, setUserLocation] = useState(null);
    const [places, setPlaces] = useState([]);
    const [selectedPlace, setSelectedPlace] = useState(null);
    const [directions, setDirections] = useState(null);
    const [statusMessage, setStatusMessage] = useState('Select a category or use the search bar to find legal help.');
    const [filters, setFilters] = useState({ openNow: false, minRating: 0, keyword: '' });
    const [sortBy, setSortBy] = useState('distance');
    const [selectedFacility, setSelectedFacility] = useState(null);
    const [showMore, setShowMore] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [travelInfo, setTravelInfo] = useState({});

    const placesServiceRef = useRef(null);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude }),
                () => setStatusMessage('Error: Unable to access your location. Please grant permission and refresh.')
            );
        } else {
            setStatusMessage('Error: Geolocation is not supported by your browser.');
        }
    }, []);

    const handleMapLoad = (map) => {
        placesServiceRef.current = new window.google.maps.places.PlacesService(map);
    };

    const calculateTravelTimes = async (placesToCalculate) => {
        if (!userLocation || !window.google || placesToCalculate.length === 0) return;

        const service = new window.google.maps.DistanceMatrixService();
        const destinations = placesToCalculate.map(p => p.geometry.location);

        try {
            const response = await new Promise((resolve, reject) => {
                service.getDistanceMatrix({
                    origins: [userLocation],
                    destinations: destinations,
                    travelMode: 'DRIVING',
                }, (response, status) => {
                    if (status === 'OK') {
                        resolve(response);
                    } else {
                        reject(new Error(`Distance Matrix API error: ${status}`));
                    }
                });
            });

            const newTravelInfo = {};
            response.rows[0].elements.forEach((element, index) => {
                const placeId = placesToCalculate[index].place_id;
                if (element.status === 'OK') {
                    newTravelInfo[placeId] = {
                        distance: element.distance.text,
                        duration: element.duration.text,
                    };
                }
            });

            setTravelInfo(prev => ({ ...prev, ...newTravelInfo }));

        } catch (e) {
            console.error("Distance Matrix error:", e);
        }
    };

    // Fixed function to check if a place is currently open
    const isPlaceOpen = (place) => {
        if (!place.opening_hours) return null; // Unknown status

        // Check if opening_hours has the periods property (detailed hours)
        if (place.opening_hours.periods) {
            const now = new Date();
            const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
            const currentTime = now.getHours() * 60 + now.getMinutes(); // Minutes since midnight

            // Find today's opening hours
            const todayHours = place.opening_hours.periods.find(period =>
                period.open && period.open.day === currentDay
            );

            if (!todayHours) return false; // Closed today

            const openTime = todayHours.open.time ?
                parseInt(todayHours.open.time.substring(0, 2)) * 60 +
                parseInt(todayHours.open.time.substring(2, 4)) : 0;

            const closeTime = todayHours.close && todayHours.close.time ?
                parseInt(todayHours.close.time.substring(0, 2)) * 60 +
                parseInt(todayHours.close.time.substring(2, 4)) : 1440; // 24:00 if no close time

            // Handle cases where close time is next day (e.g., open until 2 AM)
            if (closeTime < openTime) {
                return currentTime >= openTime || currentTime <= closeTime;
            }

            return currentTime >= openTime && currentTime <= closeTime;
        }

        // Fallback: use open_now if available
        return place.opening_hours.open_now !== undefined ? place.opening_hours.open_now : null;
    };

    // Function to get contact information
    const getContactInfo = (place) => {
        const contacts = [];
        if (place.formatted_phone_number) {
            contacts.push({ type: 'phone', value: place.formatted_phone_number });
        }
        if (place.international_phone_number && place.international_phone_number !== place.formatted_phone_number) {
            contacts.push({ type: 'international', value: place.international_phone_number });
        }
        if (place.website) {
            contacts.push({ type: 'website', value: place.website });
        }
        return contacts;
    };

    // Function to render travel information
    const renderTravelInfo = (place) => {
        const info = travelInfo[place.place_id];
        if (!info) return <p>Calculating distance...</p>;

        return (
            <div className="travel-options">
                {info.driving && (
                    <div className="travel-mode">
                        <span className="travel-icon">🚗</span>
                        <div className="travel-details">
                            <span className="travel-distance">{info.driving.distance}</span>
                            <span className="travel-time">({info.driving.duration})</span>
                        </div>
                    </div>
                )}
                {info.walking && (
                    <div className="travel-mode">
                        <span className="travel-icon">🚶‍♂️</span>
                        <div className="travel-details">
                            <span className="travel-distance">{info.walking.distance}</span>
                            <span className="travel-time">({info.walking.duration})</span>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const performSearch = (searchQuery) => {
        if (!userLocation) {
            setStatusMessage('Error: User location is not available.');
            return;
        }
        if (!placesServiceRef.current) {
            setStatusMessage('Error: Map service is not ready. Please wait a moment and try again.');
            return;
        }

        setIsSearching(true);
        setPlaces([]);
        setDirections(null);
        setSelectedPlace(null);
        setTravelInfo({});
        setStatusMessage('Searching...');

        const service = placesServiceRef.current;
        const searchRequest = {
            location: userLocation,
            query: searchQuery,
            rankBy: window.google.maps.places.RankBy.DISTANCE,
        };

        service.textSearch(searchRequest, (baseResults, status) => {
            if (status !== window.google.maps.places.PlacesServiceStatus.OK || !baseResults || baseResults.length === 0) {
                setStatusMessage('No results found. Please try a different search term.');
                setIsSearching(false);
                return;
            }

            const detailPromises = baseResults.map(place =>
                new Promise(resolve => {
                    const detailRequest = {
                        placeId: place.place_id,
                        // Fixed: Request all necessary fields including opening_hours
                        fields: [
                            'name',
                            'place_id',
                            'geometry',
                            'formatted_address',
                            'rating',
                            'opening_hours',  // This will include periods and open_now
                            'vicinity',
                            'business_status'
                        ]
                    };
                    service.getDetails(detailRequest, (detailResult, detailStatus) => {
                        resolve(detailStatus === window.google.maps.places.PlacesServiceStatus.OK ? detailResult : null);
                    });
                })
            );

            Promise.all(detailPromises).then(detailedResults => {
                const validResults = detailedResults.filter(Boolean);

                // Apply filters after getting detailed results
                const filteredResults = validResults.filter(place => {
                    // Rating filter
                    if ((place.rating || 0) < filters.minRating) return false;

                    // Open now filter - Fixed logic
                    if (filters.openNow) {
                        const openStatus = isPlaceOpen(place);
                        return openStatus === true; // Only include if definitely open
                    }

                    return true;
                });

                if (filteredResults.length === 0) {
                    setStatusMessage('No results match your current filters.');
                } else {
                    setStatusMessage(`Found ${filteredResults.length} result(s)`);
                }

                setPlaces(filteredResults);
                setShowMore(filteredResults.length > RESULTS_PER_PAGE);
                calculateTravelTimes(filteredResults);
                setIsSearching(false);
            });
        });
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        const searchQuery = filters.keyword.trim();
        if (!searchQuery) {
            setStatusMessage("Error: Please enter a search term.");
            return;
        }
        setSelectedFacility(null);
        performSearch(searchQuery);
    };

    const handleFacilityClick = (facility) => {
        setFilters(prev => ({ ...prev, keyword: '' }));
        setSelectedFacility(facility.id);
        performSearch(facility.keyword);
    };

    const calculateRoute = (destination) => {
        if (!userLocation) return;
        const directionsService = new window.google.maps.DirectionsService();
        directionsService.route({
            origin: userLocation,
            destination: destination,
            travelMode: window.google.maps.TravelMode.DRIVING,
        }, (result, status) => {
            if (status === window.google.maps.DirectionsStatus.OK) {
                setDirections(result);
                setSelectedPlace(null);
            } else {
                setStatusMessage("Error: Could not calculate route.");
            }
        });
    };

    // Fixed function to get open status text
    

    // Re-apply filters when filter state changes
    useEffect(() => {
        if (places.length > 0) {
            // Re-filter existing results when filters change
            const filteredPlaces = places.filter(place => {
                if ((place.rating || 0) < filters.minRating) return false;
                if (filters.openNow) {
                    const openStatus = isPlaceOpen(place);
                    return openStatus === true;
                }
                return true;
            });

            // Only update if the filtered results are different
            if (filteredPlaces.length !== places.length) {
                setPlaces(filteredPlaces);
            }
        }
    }, [filters.openNow, filters.minRating]); // Only re-filter when these specific filters change

    const sortedPlaces = sortBy === 'rating'
        ? [...places].sort((a, b) => (b.rating || 0) - (a.rating || 0))
        : places;

    const displayedPlaces = showMore ? sortedPlaces : sortedPlaces.slice(0, RESULTS_PER_PAGE);

    return (
        <div className="find-help">
            <h1>Find Legal Help Nearby</h1>

            <div className="facility-types">
                {FACILITY_TYPES.map((facility) => (
                    <button key={facility.id} className={`facility-button ${selectedFacility === facility.id ? 'active' : ''}`} onClick={() => handleFacilityClick(facility)} disabled={isSearching}>
                        <span className="facility-icon">{facility.icon}</span>{facility.label}
                    </button>
                ))}
            </div>

            <form className="filters" onSubmit={handleSearchSubmit}>
                <input
                    type="text"
                    className="search-input"
                    placeholder="Search for 'registration office', etc."
                    value={filters.keyword}
                    onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
                />
                <div className="filter-group">
                    <label>
                        <input
                            type="checkbox"
                            checked={filters.openNow}
                            onChange={(e) => setFilters(prev => ({ ...prev, openNow: e.target.checked }))}
                        />
                        Open Now
                    </label>
                </div>
                <div className="filter-group">
                    <label>
                        Rating:
                        <select value={filters.minRating} onChange={(e) => setFilters(prev => ({ ...prev, minRating: parseFloat(e.target.value) }))}>
                            <option value="0">Any</option>
                            <option value="3">3+ ★</option>
                            <option value="4">4+ ★</option>
                        </select>
                    </label>
                </div>
                <div className="filter-group">
                    <label>
                        Sort By:
                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                            <option value="distance">Distance</option>
                            <option value="rating">Rating</option>
                        </select>
                    </label>
                </div>
                <button type="submit" disabled={isSearching || !filters.keyword}>
                    {isSearching ? '...' : 'Search'}
                </button>
            </form>

            <div className="split-view">
                <div className="list-view">
                    {(isSearching || places.length > 0) ? (
                        <>
                            {isSearching && <div className="loading-state"><p>Searching...</p></div>}
                            {displayedPlaces.map((place) => (
                                <div key={place.place_id} className="list-item" onMouseEnter={() => setSelectedPlace(place)}>
                                    <h3>{place.name}</h3>
                                    <div className="list-item-details">
                                        <p><strong>📍 Address:</strong> {place.formatted_address}</p>
                                        <p><strong>⭐ Rating:</strong> {place.rating ? `${place.rating}/5` : 'N/A'}</p>

                                        {/* Contact Information */}
                                        <div className="contact-info">
                                            {getContactInfo(place).map((contact, idx) => (
                                                <div key={idx} className="contact-item">
                                                    {contact.type === 'phone' && (
                                                        <p><strong>📞 Phone:</strong>
                                                            <a href={`tel:${contact.value}`}>{contact.value}</a>
                                                        </p>
                                                    )}
                                                    {contact.type === 'international' && (
                                                        <p><strong>🌍 International:</strong>
                                                            <a href={`tel:${contact.value}`}>{contact.value}</a>
                                                        </p>
                                                    )}
                                                    {contact.type === 'website' && (
                                                        <p><strong>🌐 Website:</strong>
                                                            <a href={contact.value} target="_blank" rel="noopener noreferrer">
                                                                Visit Website
                                                            </a>
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                            {getContactInfo(place).length === 0 && (
                                                <p><em>No contact information available</em></p>
                                            )}
                                        </div>

                                        {/* Travel Information */}
                                        <div className="travel-info">
                                            <strong>🚗 Travel Options:</strong>
                                            {renderTravelInfo(place)}
                                        </div>
                                    </div>
                                    <div className="list-item-actions">
                                        <button className="action-button route-button" onClick={() => calculateRoute(place.geometry.location)}>Get Route</button>
                                    </div>
                                </div>
                            ))}
                            {places.length > RESULTS_PER_PAGE && (
                                <button className="show-more-button" onClick={() => setShowMore(prev => !prev)}>
                                    {showMore ? 'Show Less' : `Show More (${places.length - RESULTS_PER_PAGE} more)`}
                                </button>
                            )}
                        </>
                    ) : (
                        <div className="empty-state"><p>{statusMessage}</p></div>
                    )}
                </div>
                <div className="map-view">
                    <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY} libraries={libraries}>
                        <GoogleMap
                            center={userLocation || { lat: 12.9716, lng: 77.5946 }}
                            zoom={12}
                            mapContainerStyle={{ height: '100%', width: '100%' }}
                            onLoad={handleMapLoad}
                        >
                            {userLocation && <Marker position={userLocation} />}
                            {places.map((place) => (
                                <Marker key={place.place_id} position={place.geometry.location} onClick={() => setSelectedPlace(place)} />
                            ))}
                            {selectedPlace && (
                                <InfoWindow position={selectedPlace.geometry.location} onCloseClick={() => setSelectedPlace(null)}>
                                    <div><h3>{selectedPlace.name}</h3><p>{selectedPlace.vicinity}</p></div>
                                </InfoWindow>
                            )}
                            {directions && <DirectionsRenderer directions={directions} />}
                        </GoogleMap>
                    </LoadScript>
                </div>
            </div>
        </div>
    );
}