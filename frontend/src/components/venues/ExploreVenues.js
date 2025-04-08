import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchWithAuth } from "../../services/venueServices";
import "./ExploreVenues.css";

const ExploreVenues = () => {
  const [venues, setVenues] = useState([]);
  const [filteredVenues, setFilteredVenues] = useState([]);
  const [filters, setFilters] = useState({
    city: "",
    minCapacity: "",
    maxRate: "",
  });
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const res = await fetchWithAuth("/api/v1/venues/");
        const data = await res.json();
        console.log("Fetched venues:", data);
        setVenues(data.results || []);
        setFilteredVenues(data.results || []);
      } catch (err) {
        console.error("Error loading venues", err);
      } finally {
        setLoading(false);
      }
    };

    fetchVenues();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

    const applyFilters = () => {
        setFiltersApplied(true);

        const { city, minCapacity, maxRate } = filters;

        const filtered = venues.filter((venue) => {
        const venueCity = venue.city?.toLowerCase() || "";
        const venueCapacity = Number(venue.capacity);
        const venueRate = Number(venue.hourly_rate);

        const cityMatch = venueCity.includes(city.toLowerCase());
        const capacityMatch = minCapacity
            ? venueCapacity >= Number(minCapacity)
            : true;
        const rateMatch = maxRate
            ? venueRate <= Number(maxRate)
            : true;

        return cityMatch && capacityMatch && rateMatch;
        });

        setFilteredVenues(filtered);
    };

  if (loading) return <div className="loading">Loading venues...</div>;

  return (
    <div className="explore-venues-container">
      <h1>Explore Venues</h1>

      {/* Filter Form */}
      <div className="venue-filters">
        <input
          type="text"
          placeholder="City"
          name="city"
          value={filters.city}
          onChange={handleFilterChange}
        />
        <input
          type="number"
          placeholder="Min Capacity"
          name="minCapacity"
          value={filters.minCapacity}
          onChange={handleFilterChange}
        />
        <input
          type="number"
          placeholder="Max Hourly Rate"
          name="maxRate"
          value={filters.maxRate}
          onChange={handleFilterChange}
        />
        <button onClick={applyFilters} className="btn-primary">Filter</button>
      </div>

      {/* Venue Cards */}
      <div className="venue-grid">
        {filteredVenues.length === 0 && filtersApplied ? (
            <p>No venues match the selected filters.</p>
        ) : (
            filteredVenues.map((venue) => (
            <div className="venue-card" key={venue.id}>
                <h3 className="venue-name">{venue.name}</h3>
                <hr className="venue-divider" />
                <p className="venue-location">
                {venue.city}, {venue.state}
                </p>
                <p className="venue-capacity">Capacity: {venue.capacity}</p>
                <p className="venue-rate">Rate: ${venue.hourly_rate}/hr</p>
                <Link to={`/venues/${venue.id}`}  state={{ from: "explore" }} className="venue-details-link">
                View Details
                </Link>
            </div>
            ))
        )}
        </div>

    </div>
  );
};

export default ExploreVenues;