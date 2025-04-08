import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createVenue,
  uploadVenueImage,
  createAvailability,
  getVenueCategories, 
  getVenueAmenities
} from "../../services/venueServices";
import { useEffect } from "react";
import "./CreateVenue.css";

const CreateVenue = () => {
  const [form, setForm] = useState({
    name: "",
    description: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    country: "United States",
    capacity: "",
    hourly_rate: "",
  });

  const [image, setImage] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [categories, setCategories] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);

  const navigate = useNavigate();


  useEffect(() => {
    const fetchMetaData = async () => {
      const catData = await getVenueCategories();
      const amenityData = await getVenueAmenities();
      console.log("Fetched categories:", catData);
      console.log("Fetched amenities:", amenityData); 
      setCategories(catData);
      setAmenities(amenityData);
    };
    fetchMetaData();
  }, []);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => setImage(e.target.files[0]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {      
      const payload = {
        ...form,
        category_ids: selectedCategories.map(Number),
        amenity_ids: selectedAmenities.map(Number),
      };
      console.log("Venue payload:", payload);
      
      const venue = await createVenue(payload);

      if (image) {
        await uploadVenueImage(venue.id, { image, is_primary: true });
      }
      for (const slot of availability) {
        await createAvailability(venue.id, slot);
      }
      alert("Venue created successfully!");
      navigate("/dashboard?tab=venues");
    } catch (err) {
      console.error("Error creating venue:", err);
      alert("Failed to create venue.");
    }
  };

  return (
    <div className="create-venue-container">
      <h2>List a New Venue</h2>
      <form className="venue-form" onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="Venue Name"
          value={form.name}
          onChange={handleChange}
          required
        />
        <textarea
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
        />
        <div className="form-row">
          <input
            type="text"
            name="address"
            placeholder="Address"
            value={form.address}
            onChange={handleChange}
          />
          <input
            type="text"
            name="city"
            placeholder="City"
            value={form.city}
            onChange={handleChange}
          />
          <input
            type="text"
            name="state"
            placeholder="State"
            value={form.state}
            onChange={handleChange}
          />
          <input
            type="text"
            name="zip_code"
            placeholder="ZIP Code"
            value={form.zip_code}
            onChange={handleChange}
          />
        </div>
        <div className="form-row">
          <input
            type="number"
            name="capacity"
            placeholder="Capacity"
            value={form.capacity}
            onChange={handleChange}
          />
          <input
            type="number"
            name="hourly_rate"
            placeholder="Hourly Rate"
            value={form.hourly_rate}
            onChange={handleChange}
          />
        </div>
        {/* Category Dropdown */}
        <label>
          Category:
          <select
            multiple
            value={selectedCategories}
            onChange={(e) => {
              const values = Array.from(e.target.selectedOptions, (option) => parseInt(option.value));
              setSelectedCategories(values);
            }}
          >
            {(Array.isArray(categories) ? categories : []).map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </label>

        {/* Amenities Checkboxes */}
        <fieldset>
          <legend>Amenities:</legend>
          <div className="amenities-grid">
            {amenities.map((amenity) => (
              <div key={amenity.id} className="amenity-option">
                <span>{amenity.name}</span>
                <input
                  type="checkbox"
                  value={amenity.id}
                  checked={selectedAmenities.includes(amenity.id)}
                  onChange={(e) => {
                    const id = parseInt(e.target.value);
                    setSelectedAmenities((prev) =>
                      e.target.checked ? [...prev, id] : prev.filter((a) => a !== id)
                    );
                  }}
                />
              </div>
            ))}
          </div>
        </fieldset>


        <input type="file" onChange={handleFileChange} />
        <button type="submit" className="btn-primary">Create Venue</button>
      </form>
    </div>
  );
};

export default CreateVenue;