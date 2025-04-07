// ExploreVenues.js
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchWithAuth } from '../../services/venueServices';
import './ExploreVenues.css';

const ExploreVenues = () => {
  const [venues, setVenues] = useState([]);
  const [filters, setFilters] = useState({
    city: '',
    capacity: '',
    maxRate: ''
  });

  const fetchVenues = async () => {
    const params = new URLSearchParams();
    if (filters.city) params.append('city', filters.city);
    if (filters.capacity) params.append('capacity__gte', filters.capacity);
    if (filters.maxRate) params.append('hourly_rate__lte', filters.maxRate);

    params.append('is_active', 'true');

    const response = await fetchWithAuth(`/api/v1/venues/?${params.toString()}`);
    // const data = await response.json();
    // setVenues(data);
    const data = await response.json();
    setVenues(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    fetchVenues();
  }, []);

  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleFilter = (e) => {
    e.preventDefault();
    fetchVenues();
  };

  return (
    <div className="explore-venues">
      <h2>Explore Venues</h2>

      <form className="venue-filters" onSubmit={handleFilter}>
        <input
          type="text"
          name="city"
          placeholder="City"
          value={filters.city}
          onChange={handleChange}
        />
        <input
          type="number"
          name="capacity"
          placeholder="Min Capacity"
          value={filters.capacity}
          onChange={handleChange}
        />
        <input
          type="number"
          name="maxRate"
          placeholder="Max Hourly Rate"
          value={filters.maxRate}
          onChange={handleChange}
        />
        <button type="submit">Filter</button>
      </form>

      <div className="venue-list">
        {venues.map((venue) => (
          <div key={venue.id} className="venue-card">
            <h3>{venue.name}</h3>
            <p>{venue.city}, {venue.state}</p>
            <p>Capacity: {venue.capacity}</p>
            <p>Rate: ${venue.hourly_rate}/hr</p>
            {/* <Link to={`/venues/${venue.id}`}>View Details</Link> */}
            <Link to={`/venues/${venue.id}`} state={{ from: 'explore' }}>View Details</Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExploreVenues;
