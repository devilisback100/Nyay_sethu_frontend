import { useEffect, useState } from 'react';
import { GoogleMap, LoadScript, Marker, DirectionsRenderer, InfoWindow } from '@react-google-maps/api';
import './FindHelp.css';

const libraries = ['places'];

const FACILITY_TYPES = [
    { id: 'police', label: 'Police Stations', keyword: 'police', icon: '👮‍♂️' }, // Simplified keyword
    { id: 'ngo', label: 'NGOs', keyword: 'ngo legal aid', icon: '🏢' },
    { id: 'volunteer', label: 'Legal Aid Volunteers', keyword: 'legal aid volunteer center', icon: '🤝' },
    { id: 'court', label: 'Courts', keyword: 'court law', icon: '⚖️' },
    { id: 'women_help', label: 'Women Help Centers', keyword: 'women help center safety', icon: '👩‍⚖️' }
];

const INITIAL_RADIUS = 50000; // 50km in meters
const RADIUS_INCREMENT = 50000; // 50km increment
const RESULTS_PER_PAGE = 10;
const WARNING_TIMEOUT = 2000; // 2 seconds

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
    const [searchAttempts, setSearchAttempts] = useState(0); // Track search attempts

    // Auto-remove error messages after 2 seconds
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => {
                setError('');
            }, WARNING_TIMEOUT);

            return () => clearTimeout(timer);
        }
    }, [error]);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    });
                },
                () => {
                    setError('Unable to access your location. You can enter your location manually below.');
                }
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

    const calculateTravelTimes = async (place) => {
        if (!userLocation) return;

        const service = new window.google.maps.DistanceMatrixService();
        const destination = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
        };

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

            setTravelInfo(prev => ({
                ...prev,
                [place.place_id]: results
            }));

        } catch (error) {
            // Silent error handling for travel time calculation
        }
    };

    const fetchNearbyPlaces = async (facilityType, radius = searchRadius) => {
        if (!userLocation) {
            setError('User location is required to find nearby places.');
            return;
        }

        setIsSearching(true);
        setSelectedFacility(facilityType); // Update selected facility immediately
        setPlaces([]); // Clear previous places to avoid flickering
        setError(''); // Clear any previous error messages
        setSearchAttempts(0); // Reset search attempts counter

        const map = new window.google.maps.Map(document.createElement('div'));
        const service = new window.google.maps.places.PlacesService(map);
        const userLatLng = new window.google.maps.LatLng(userLocation.lat, userLocation.lng);

        const facility = FACILITY_TYPES.find(f => f.id === facilityType);
        const searchQuery = facility ? facility.keyword : facilityType;

        try {
            // Try different search approaches based on facility type
            if (facilityType === 'police') {
                await searchForPoliceStations(service, userLatLng, radius);
            } else {
                await performRegularSearch(service, userLatLng, searchQuery, radius);
            }
        } catch (err) {
            setError('Error searching for places.');
        } finally {
            setIsSearching(false);
        }
    };

    const performRegularSearch = async (service, userLatLng, searchQuery, radius) => {
        const searchNearby = (searchRadius) => {
            return new Promise((resolve) => {
                service.nearbySearch({
                    location: userLatLng,
                    radius: searchRadius,
                    keyword: searchQuery,
                    openNow: filters.openNow,
                }, (results, status) => {
                    resolve({ results, status });
                });
            });
        };

        let currentRadius = radius;
        let { results, status } = await searchNearby(currentRadius);

        // Incrementally increase radius if results are insufficient
        while ((!results || results.length < 5) && currentRadius < 200000) { // Max 200km
            currentRadius += RADIUS_INCREMENT;
            setSearchRadius(currentRadius);
            const response = await searchNearby(currentRadius);
            results = response.results;
            status = response.status;
        }

        processSearchResults(results, status, currentRadius);
    };

    const searchForPoliceStations = async (service, userLatLng, radius) => {
        // For police stations, try multiple search approaches
        const searchMethods = [
            // Method 1: Use 'police' as keyword
            {
                method: 'nearbySearch',
                params: {
                    location: userLatLng,
                    radius: radius,
                    keyword: 'police',
                    openNow: filters.openNow,
                }
            },
            // Method 2: Use type instead of keyword
            {
                method: 'nearbySearch',
                params: {
                    location: userLatLng,
                    radius: radius,
                    type: 'police',
                    openNow: filters.openNow,
                }
            },
            // Method 3: Try with a more specific keyword
            {
                method: 'nearbySearch',
                params: {
                    location: userLatLng,
                    radius: radius,
                    keyword: 'police station',
                    openNow: filters.openNow,
                }
            },
            // Method 4: Text search instead of nearby search
            {
                method: 'textSearch',
                params: {
                    location: userLatLng,
                    radius: radius,
                    query: 'police station near me',
                }
            }
        ];

        let results = [];
        let status = '';
        let currentRadius = radius;

        // Try each method until we get results
        for (const searchMethod of searchMethods) {
            if (results.length >= 5) break;

            try {
                if (searchMethod.method === 'nearbySearch') {
                    const response = await new Promise((resolve) => {
                        service.nearbySearch(searchMethod.params, (results, status) => {
                            resolve({ results, status });
                        });
                    });

                    if (response.status === window.google.maps.places.PlacesServiceStatus.OK) {
                        results = response.results;
                        status = response.status;
                    }
                } else if (searchMethod.method === 'textSearch') {
                    const response = await new Promise((resolve) => {
                        service.textSearch(searchMethod.params, (results, status) => {
                            resolve({ results, status });
                        });
                    });

                    if (response.status === window.google.maps.places.PlacesServiceStatus.OK) {
                        results = response.results;
                        status = response.status;
                    }
                }
            } catch (error) {
                // Silent error handling for individual search methods
            }
        }

        // If still no results, try with increased radius
        if ((!results || results.length < 3) && currentRadius < 150000) {
            currentRadius = 150000; // Try with a much larger radius

            try {
                const response = await new Promise((resolve) => {
                    service.textSearch({
                        location: userLatLng,
                        radius: currentRadius,
                        query: 'police station',
                    }, (results, status) => {
                        resolve({ results, status });
                    });
                });

                if (response.status === window.google.maps.places.PlacesServiceStatus.OK) {
                    results = response.results;
                    status = response.status;
                }
            } catch (error) {
                // Silent error handling for expanded radius search
            }
        }

        processSearchResults(results, status, currentRadius);
    };

    const processSearchResults = (results, status, currentRadius) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
            const filteredResults = results.filter(place => place.rating >= filters.minRating);
            setPlaces(filteredResults);

            // Calculate travel times for each place
            for (const place of filteredResults) {
                calculateTravelTimes(place);
            }

            setShowMore(filteredResults.length > RESULTS_PER_PAGE);
            setSelectedPlace(null);
            setDirections(null);

            if (currentRadius > INITIAL_RADIUS) {
                setError(`No results found within ${INITIAL_RADIUS / 1000}km. Showing results within ${currentRadius / 1000}km.`);
            }
        } else {
            setError('No results found for the selected facility. Please try a different location or facility type.');
            setPlaces([]);
        }
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
                destination: {
                    lat: destination.lat(),
                    lng: destination.lng()
                },
                travelMode: window.google.maps.TravelMode[mode],
                provideRouteAlternatives: true // Get alternative routes
            });

            setDirections(result);
            setSelectedPlace(null); // Hide the info window when showing directions
        } catch (error) {
            setError('Failed to calculate route. Please try again.');
        }
    };

    const viewOnMap = (place) => {
        // Open in Google Maps with directions
        const origin = `${userLocation.lat},${userLocation.lng}`;
        const destination = `${place.geometry.location.lat()},${place.geometry.location.lng()}`;
        const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
        window.open(url, '_blank');
    };

    const handleSort = (places) => {
        if (sortBy === 'rating') {
            return [...places].sort((a, b) => (b.rating || 0) - (a.rating || 0));
        }
        return places;
    };

    const handleHover = (place) => {
        setSelectedPlace(place);
    };

    const renderPlacesList = () => {
        const sortedPlaces = handleSort(places);
        const displayedPlaces = showMore ? sortedPlaces : sortedPlaces.slice(0, RESULTS_PER_PAGE);

        return (
            <>
                {displayedPlaces.map((place, index) => (
                    <div
                        key={index}
                        className={`list-item ${selectedFacility ? 'active' : ''}`} // Highlight active facility
                        onMouseEnter={() => handleHover(place)}
                    >
                        <h3>{place.name}</h3>
                        <div className="list-item-details">
                            <p>{place.vicinity || place.formatted_address}</p>
                            <p>Rating: {place.rating ? `${place.rating} ⭐` : 'N/A'}</p>
                            <p>{place.opening_hours?.open_now ? '✅ Open Now' : '❌ Closed'}</p>

                            {/* Add travel information */}
                            {travelInfo[place.place_id] && (
                                <div className="travel-info">
                                    {travelInfo[place.place_id].driving && (
                                        <div className="travel-mode">
                                            <span className="travel-icon">🚗</span>
                                            <p>
                                                {travelInfo[place.place_id].driving.distance}
                                                <span className="travel-time">
                                                    ({travelInfo[place.place_id].driving.duration})
                                                </span>
                                            </p>
                                        </div>
                                    )}
                                    {travelInfo[place.place_id].walking && (
                                        <div className="travel-mode">
                                            <span className="travel-icon">🚶</span>
                                            <p>
                                                {travelInfo[place.place_id].walking.distance}
                                                <span className="travel-time">
                                                    ({travelInfo[place.place_id].walking.duration})
                                                </span>
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="list-item-actions">
                            <div className="route-options">
                                <button
                                    className="action-button route-button"
                                    onClick={() => calculateRoute(place.geometry.location, 'DRIVING')}
                                >
                                    🚗 Drive
                                </button>
                                <button
                                    className="action-button route-button"
                                    onClick={() => calculateRoute(place.geometry.location, 'WALKING')}
                                >
                                    🚶 Walk
                                </button>
                            </div>
                            <button
                                className="action-button secondary-button"
                                onClick={() => viewOnMap(place)}
                            >
                                Open in Google Maps
                            </button>
                        </div>
                    </div>
                ))}
                {places.length > RESULTS_PER_PAGE && (
                    <button
                        className="show-more-button"
                        onClick={() => setShowMore(!showMore)}
                    >
                        {showMore ? 'Show Less' : `Show More (${places.length - RESULTS_PER_PAGE} more)`}
                    </button>
                )}
            </>
        );
    };

    return (
        <div className="find-help">
            <h1>Find Legal Help Nearby</h1>

            {error && (
                <div className="error-message" style={{
                    opacity: error ? 1 : 0,
                    transition: 'opacity 0.3s ease-in-out'
                }}>
                    {error}
                </div>
            )}

            {!userLocation && (
                <div className="location-input">
                    <input
                        type="text"
                        placeholder="Enter your address..."
                        value={manualLocation}
                        onChange={(e) => setManualLocation(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && geocodeAddress(manualLocation)}
                    />
                    <button onClick={() => geocodeAddress(manualLocation)}>Submit Location</button>
                </div>
            )}

            <div className="facility-types">
                {FACILITY_TYPES.map((facility) => (
                    <button
                        key={facility.id}
                        className={`facility-button ${selectedFacility === facility.id ? 'active' : ''}`}
                        onClick={() => fetchNearbyPlaces(facility.id)}
                        disabled={isSearching}
                    >
                        <span className="facility-icon">{facility.icon}</span>
                        {facility.label}
                    </button>
                ))}
            </div>

            <div className="filters">
                <input
                    type="text"
                    className="search-input"
                    placeholder="Search for legal services..."
                    value={filters.keyword}
                    onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                />
                <div className="filter-group">
                    <label>
                        <input
                            type="checkbox"
                            checked={filters.openNow}
                            onChange={(e) => setFilters({ ...filters, openNow: e.target.checked })}
                        />
                        Open Now
                    </label>
                </div>
                <div className="filter-group">
                    <label>
                        Rating:
                        <select
                            value={filters.minRating}
                            onChange={(e) => setFilters({ ...filters, minRating: parseFloat(e.target.value) })}
                        >
                            <option value="0">Any Rating</option>
                            <option value="3">3+ Stars</option>
                            <option value="4">4+ Stars</option>
                            <option value="5">5 Stars</option>
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
            </div>

            <div className="split-view">
                <div className="list-view">
                    {isSearching ? (
                        <div className="loading-state">
                            <div className="loading-spinner"></div>
                            <p>Searching for nearby facilities...</p>
                        </div>
                    ) : places.length === 0 ? (
                        <div className="empty-state">
                            <p>Select a facility type to see nearby locations</p>
                        </div>
                    ) : (
                        renderPlacesList()
                    )}
                </div>
                <div className="map-view">
                    <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY} libraries={libraries}>
                        <GoogleMap
                            center={userLocation || { lat: 20.5937, lng: 78.9629 }}
                            zoom={userLocation ? 14 : 5}
                            mapContainerStyle={{ height: '100%', width: '100%' }}
                        >
                            {userLocation && <Marker position={userLocation} title="You" />}
                            {places.map((place, index) => (
                                <Marker
                                    key={index}
                                    position={{
                                        lat: place.geometry.location.lat(),
                                        lng: place.geometry.location.lng(),
                                    }}
                                    onClick={() => setSelectedPlace(place)}
                                />
                            ))}
                            {selectedPlace && (
                                <InfoWindow
                                    position={{
                                        lat: selectedPlace.geometry.location.lat(),
                                        lng: selectedPlace.geometry.location.lng(),
                                    }}
                                    onCloseClick={() => setSelectedPlace(null)}
                                >
                                    <div>
                                        <h3>{selectedPlace.name}</h3>
                                        <p>{selectedPlace.vicinity || selectedPlace.formatted_address}</p>
                                        <p>Rating: {selectedPlace.rating || 'N/A'}</p>
                                    </div>
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