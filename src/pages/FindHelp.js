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
const RADIUS_INCREMENT = 50000;
const RESULTS_PER_PAGE = 10;
const WARNING_TIMEOUT = 3000;

export function FindHelp() {
    const [userLocation, setUserLocation] = useState(null);
    const [manualLocation, setManualLocation] = useState('');
    const [places, setPlaces] = useState([]);
    const [selectedPlace, setSelectedPlace] = useState(null);
    const [directions, setDirections] = useState(null);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({ openNow: false, minRating: 0, keyword: '' });
    const [sortBy, setSortBy] = useState('distance');
    const [selectedFacility, setSelectedFacility] = useState(null);
    const [searchRadius, setSearchRadius] = useState(INITIAL_RADIUS);
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
                () => setError('Unable to access your location. Enter it manually.')
            );
        } else {
            setError('Geolocation is not supported. Please enter your address.');
        }
    }, []);

    const geocodeAddress = (address) => {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ address }, (results, status) => {
            if (status === 'OK') {
                const location = results[0].geometry.location;
                setUserLocation({ lat: location.lat(), lng: location.lng() });
                setError('');
            } else {
                setError('Failed to find location from address.');
            }
        });
    };

    // This function can now be used by both buttons and the search bar
    const performRegularSearch = async (searchQuery, radius) => {
        if (!userLocation) {
            setError('User location is not available.');
            return;
        }

        setIsSearching(true);
        setPlaces([]); // Clear old results

        const map = new window.google.maps.Map(document.createElement('div'));
        const service = new window.google.maps.places.PlacesService(map);
        const userLatLng = new window.google.maps.LatLng(userLocation.lat, userLocation.lng);

        const searchNearby = (currentRadius) => new Promise((resolve) => {
            service.textSearch({ // Using textSearch is better for general queries
                location: userLatLng,
                radius: currentRadius,
                query: searchQuery,
                openNow: filters.openNow,
            }, (results, status) => resolve({ results, status }));
        });

        let currentRadius = radius;
        let { results, status } = await searchNearby(currentRadius);
        while ((!results || results.length < 5) && currentRadius < 200000) {
            currentRadius += RADIUS_INCREMENT;
            setSearchRadius(currentRadius);
            ({ results, status } = await searchNearby(currentRadius));
        }

        processSearchResults(results, status, currentRadius);
        setIsSearching(false);
    };

    // ✨ NEW: Function to handle the search bar submission
    const handleSearchSubmit = async (e) => {
        e.preventDefault(); // Prevents page reload on form submit
        const searchQuery = filters.keyword.trim();

        if (!searchQuery) {
            setError("Please enter a search term.");
            return;
        }

        setSelectedFacility(null); // Deselect category buttons
        await performRegularSearch(searchQuery, INITIAL_RADIUS);
    };


    const fetchNearbyPlaces = (facility) => {
        // ✨ CHANGED: Clear the search input when a category button is clicked
        setFilters({ ...filters, keyword: '' });
        setSelectedFacility(facility.id);
        performRegularSearch(facility.keyword, INITIAL_RADIUS);
    };

    const processSearchResults = (results, status, currentRadius) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results?.length > 0) {
            const filteredResults = results.filter(place => (place.rating || 0) >= filters.minRating);
            setPlaces(filteredResults);
            // This part is not included for brevity, but you had it in your original code
            // filteredResults.forEach(calculateTravelTimes);
            setShowMore(filteredResults.length > RESULTS_PER_PAGE);
            setSelectedPlace(null);
            setDirections(null);
        } else {
            setError('No results found. Please try a different search term or category.');
            setPlaces([]);
        }
    };

    // Other functions like calculateRoute, viewOnMap, etc. remain the same...
    const calculateRoute = async (destination, mode = 'DRIVING') => {
        if (!userLocation) {
            setError('User location is required to calculate the route.');
            return;
        }
        const directionsService = new window.google.maps.DirectionsService();
        try {
            const result = await directionsService.route({
                origin: userLocation,
                destination: { lat: destination.lat(), lng: destination.lng() },
                travelMode: window.google.maps.TravelMode[mode],
                provideRouteAlternatives: true
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
    const handleHover = (place) => setSelectedPlace(place);


    const renderPlacesList = () => {
        const sortedPlaces = handleSort(places);
        const displayedPlaces = showMore ? sortedPlaces : sortedPlaces.slice(0, RESULTS_PER_PAGE);

        return (
            <>
                {displayedPlaces.map((place) => (
                    <div key={place.place_id} className="list-item" onMouseEnter={() => handleHover(place)}>
                        <h3>{place.name}</h3>
                        <p>{place.formatted_address || place.vicinity}</p>
                        <p>Rating: {place.rating ? `${place.rating} ⭐` : 'N/A'}</p>
                        <div className="list-item-actions">
                            <button className="action-button" onClick={() => calculateRoute(place.geometry.location, 'DRIVING')}>Route</button>
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
            {error && <div className="error-message">{error}</div>}

            <div className="facility-types">
                {FACILITY_TYPES.map((facility) => (
                    <button key={facility.id} className={`facility-button ${selectedFacility === facility.id ? 'active' : ''}`} onClick={() => fetchNearbyPlaces(facility)} disabled={isSearching}>
                        <span className="facility-icon">{facility.icon}</span>
                        {facility.label}
                    </button>
                ))}
            </div>

            {/* ✨ CHANGED: This is now a form that triggers a new search */}
            <form className="filters" onSubmit={handleSearchSubmit}>
                <input
                    type="text"
                    className="search-input"
                    placeholder="Search for 'registration office', 'notary', etc."
                    value={filters.keyword}
                    onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                />
                {/* ✨ NEW: A dedicated search button */}
                <button type="submit" className="search-button" disabled={isSearching}>
                    {isSearching ? 'Searching...' : 'Search'}
                </button>
            </form>

            <div className="split-view">
                <div className="list-view">
                    {isSearching ? (
                        <div className="loading-state"><div className="loading-spinner"></div><p>Searching...</p></div>
                    ) : places.length === 0 ? (
                        <div className="empty-state"><p>Select a category or use the search bar to find legal help.</p></div>
                    ) : (
                        renderPlacesList()
                    )}
                </div>
                <div className="map-view">
                    <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY} libraries={libraries}>
                        <GoogleMap center={userLocation || { lat: 20.5937, lng: 78.9629 }} zoom={userLocation ? 12 : 5} mapContainerStyle={{ height: '100%', width: '100%' }}>
                            {userLocation && <Marker position={userLocation} />}
                            {places.map((place) => (
                                <Marker key={place.place_id} position={place.geometry.location.toJSON()} onClick={() => setSelectedPlace(place)} />
                            ))}
                            {selectedPlace && (
                                <InfoWindow position={selectedPlace.geometry.location.toJSON()} onCloseClick={() => setSelectedPlace(null)}>
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