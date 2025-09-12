import { useEffect, useState } from 'react';
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

const INITIAL_RADIUS = 50000;
const RESULTS_PER_PAGE = 10;
const WARNING_TIMEOUT = 3000;

export function FindHelp() {
    const [userLocation, setUserLocation] = useState(null);
    const [places, setPlaces] = useState([]);
    const [selectedPlace, setSelectedPlace] = useState(null);
    const [directions, setDirections] = useState(null);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({ openNow: false, minRating: 0, keyword: '' });
    const [sortBy, setSortBy] = useState('distance');
    const [selectedFacility, setSelectedFacility] = useState(null);
    const [showMore, setShowMore] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [travelInfo, setTravelInfo] = useState({});
    const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(''), WARNING_TIMEOUT);
            return () => clearTimeout(timer);
        }
    }, [error]);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude }),
                () => setError('Unable to access your location. You may need to grant permission.')
            );
        } else {
            setError('Geolocation is not supported by your browser.');
        }
    }, []);

    const calculateTravelTimes = async (place) => {
        if (!userLocation || !window.google) return;
        const service = new window.google.maps.DistanceMatrixService();
        const destination = place.geometry.location;
        try {
            const modes = ['DRIVING', 'WALKING'];
            const results = {};
            for (const mode of modes) {
                const response = await service.getDistanceMatrix({
                    origins: [userLocation],
                    destinations: [destination],
                    travelMode: mode,
                });
                if (response.rows[0].elements[0].status === 'OK') {
                    results[mode.toLowerCase()] = {
                        distance: response.rows[0].elements[0].distance.text,
                        duration: response.rows[0].elements[0].duration.text
                    };
                }
            }
            setTravelInfo(prev => ({ ...prev, [place.place_id]: results }));
        } catch (e) {
            console.error("Distance Matrix error:", e);
        }
    };

    // ✨ MAJOR CHANGE: This function now performs the required 2-step search process.
    const performSearch = async (searchQuery) => {
        if (!userLocation) {
            setError('User location is not available. Please enable location services.');
            return;
        }
        setIsSearching(true);
        setPlaces([]);
        setDirections(null);
        setSelectedPlace(null);

        const map = new window.google.maps.Map(document.createElement('div'));
        const service = new window.google.maps.places.PlacesService(map);
        const userLatLng = new window.google.maps.LatLng(userLocation.lat, userLocation.lng);

        const searchRequest = {
            location: userLatLng,
            query: searchQuery,
            radius: sortBy === 'distance' ? undefined : INITIAL_RADIUS,
            rankBy: sortBy === 'distance' ? window.google.maps.places.RankBy.DISTANCE : window.google.maps.places.RankBy.PROMINENCE,
        };

        // Step 1: Initial search to get a list of places
        service.textSearch(searchRequest, (results, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && results?.length > 0) {

                // Step 2: For each place, fetch its details to get the reliable isOpen() method
                const detailPromises = results.map(place => {
                    return new Promise((resolve, reject) => {
                        const detailRequest = {
                            placeId: place.place_id,
                            fields: ['name', 'place_id', 'geometry', 'formatted_address', 'rating', 'opening_hours', 'vicinity']
                        };
                        service.getDetails(detailRequest, (detailResult, detailStatus) => {
                            if (detailStatus === window.google.maps.places.PlacesServiceStatus.OK) {
                                resolve(detailResult);
                            } else {
                                // If details fail, resolve with the original basic info
                                resolve(place);
                            }
                        });
                    });
                });

                Promise.all(detailPromises).then(detailedResults => {
                    setError('');

                    // Now apply filters on the detailed results
                    const filteredResults = detailedResults
                        .filter(place => (place.rating || 0) >= filters.minRating)
                        .filter(place => !filters.openNow || (place.opening_hours?.isOpen && place.opening_hours.isOpen()));

                    setPlaces(filteredResults);
                    filteredResults.forEach(calculateTravelTimes);
                    setShowMore(filteredResults.length > RESULTS_PER_PAGE);
                });

            } else {
                setError('No results found. Please try a different search term or category.');
                setPlaces([]);
            }
            setIsSearching(false);
        });
    };

    const handleSearchSubmit = async (e) => {
        e.preventDefault();
        const searchQuery = filters.keyword.trim();
        if (!searchQuery) {
            setError("Please enter a search term.");
            return;
        }
        setSelectedFacility(null);
        await performSearch(searchQuery);
    };

    const handleFacilityClick = (facility) => {
        setFilters({ ...filters, keyword: '' });
        setSelectedFacility(facility.id);
        performSearch(facility.keyword);
    };

    const calculateRoute = async (destination, mode = 'DRIVING') => {
        if (!userLocation) {
            setError('User location is required to calculate the route.');
            return;
        }
        const directionsService = new window.google.maps.DirectionsService();
        try {
            const result = await directionsService.route({
                origin: userLocation,
                destination: destination,
                travelMode: window.google.maps.TravelMode[mode],
            });
            setDirections(result);
            setSelectedPlace(null);
        } catch (e) {
            setError('Failed to calculate route. Please try again.');
        }
    };

    const handleSort = (placesToSort) => {
        if (sortBy === 'rating') {
            return [...placesToSort].sort((a, b) => (b.rating || 0) - (a.rating || 0));
        }
        return placesToSort;
    };

    const renderPlacesList = () => {
        const sortedPlaces = handleSort(places);
        const displayedPlaces = showMore ? sortedPlaces : sortedPlaces.slice(0, RESULTS_PER_PAGE);
        return (
            <>
                {displayedPlaces.map((place) => (
                    <div key={place.place_id} className="list-item" onMouseEnter={() => setSelectedPlace(place)}>
                        <h3>{place.name}</h3>
                        <div className="list-item-details">
                            <p>{place.formatted_address}</p>
                            <p><b>Rating:</b> {place.rating ? `${place.rating} ⭐` : 'N/A'}</p>

                            {/* ✨ UPDATED: Using the reliable isOpen() method instead of the deprecated open_now */}
                            <p>
                                {place.opening_hours
                                    ? (place.opening_hours.isOpen?.() ? '✅ Open Now' : '❌ Closed')
                                    : 'ℹ️ Hours not available'
                                }
                            </p>

                            {travelInfo[place.place_id] && (
                                <div className="travel-info">
                                    {travelInfo[place.place_id].driving && (
                                        <div className="travel-mode"><span className="travel-icon">🚗</span><p>{travelInfo[place.place_id].driving.distance} <span className="travel-time">({travelInfo[place.place_id].driving.duration})</span></p></div>
                                    )}
                                    {travelInfo[place.place_id].walking && (
                                        <div className="travel-mode"><span className="travel-icon">🚶</span><p>{travelInfo[place.place_id].walking.distance} <span className="travel-time">({travelInfo[place.place_id].walking.duration})</span></p></div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="list-item-actions">
                            <div className="route-options">
                                <button className="action-button route-button" onClick={() => calculateRoute(place.geometry.location, 'DRIVING')}>🚗 Drive</button>
                                <button className="action-button route-button" onClick={() => calculateRoute(place.geometry.location, 'WALKING')}>🚶 Walk</button>
                            </div>
                        </div>
                    </div>
                ))}
                {places.length > RESULTS_PER_PAGE && (
                    <button className="show-more-button" onClick={() => setShowMore(!showMore)}>
                        {showMore ? 'Show Less' : `Show More (${places.length - RESULTS_PER_PAGE} more)`}
                    </button>
                )}
            </>
        );
    };

    return (
        <div className="find-help">
            <h1>Find Legal Help Nearby</h1>
            {error && <div className="list-item" style={{ borderColor: '#d9534f', color: '#d9534f', backgroundColor: '#f2dede', textAlign: 'center' }}><p style={{ margin: 0, fontWeight: '500' }}>{error}</p></div>}

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
                    placeholder="Search for 'registration office', 'notary', etc."
                    value={filters.keyword}
                    onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                />
                <div className="filter-group">
                    <label>
                        <input type="checkbox" checked={filters.openNow} onChange={(e) => setFilters({ ...filters, openNow: e.target.checked })} />
                        Open Now
                    </label>
                </div>
                <div className="filter-group">
                    <label>
                        Rating:
                        <select value={filters.minRating} onChange={(e) => setFilters({ ...filters, minRating: parseFloat(e.target.value) })}>
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
                <button type="submit" disabled={isSearching}>
                    {isSearching ? '...' : 'Search'}
                </button>
            </form>

            <div className="split-view">
                <div className="list-view">
                    {isSearching ? (
                        <div className="loading-state"><p>Searching...</p></div>
                    ) : places.length === 0 ? (
                        <div className="empty-state"><p>Select a category or use the search bar to find legal help.</p></div>
                    ) : (
                        renderPlacesList()
                    )}
                </div>
                <div className="map-view">
                    <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY} libraries={libraries}>
                        <GoogleMap center={userLocation || { lat: 12.9716, lng: 77.5946 }} zoom={userLocation ? 12 : 10} mapContainerStyle={{ height: '100%', width: '100%' }}>
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