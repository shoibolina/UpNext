import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getVenueDetail,
  updateVenue,
  uploadVenueImage,
  getVenueCategories,
  getVenueAmenities,
} from "../../services/venueServices";
import "./CreateVenue.css"; // reuse the same styles

const EditVenue = () => {
  const { id } = useParams();
  const navigate = useNavigate();

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
  const [categories, setCategories] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const venue = await getVenueDetail(id);
        setForm({
          name: venue.name,
          description: venue.description,
          address: venue.address,
          city: venue.city,
          state: venue.state,
          zip_code: venue.zip_code,
          country: venue.country,
          capacity: venue.capacity,
          hourly_rate: venue.hourly_rate,
        });
        setSelectedCategories(venue.categories.map((c) => c.id));
        setSelectedAmenities(venue.amenities.map((a) => a.id));

        const catData = await getVenueCategories();
        const amenityData = await getVenueAmenities();
        setCategories(catData);
        setAmenities(amenityData);
      } catch (err) {
        console.error("Failed to fetch venue data", err);
      }
    };
    fetchData();
  }, [id]);

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
      await updateVenue(id, payload);

      if (image) {
        await uploadVenueImage(id, { image, is_primary: true });
      }

      alert("Venue updated successfully!");
      navigate(`/venues/${id}`);
    } catch (err) {
      console.error("Error updating venue", err);
      alert("Failed to update venue.");
    }
  };

  return (
    <div className="create-venue-container">
      <h2>Edit Venue</h2>
      <form className="venue-form" onSubmit={handleSubmit}>
        <input type="text" name="name" value={form.name} onChange={handleChange} required />
        <textarea name="description" value={form.description} onChange={handleChange} />
        <div className="form-row">
          <input type="text" name="address" value={form.address} onChange={handleChange} />
          <input type="text" name="city" value={form.city} onChange={handleChange} />
          <input type="text" name="state" value={form.state} onChange={handleChange} />
          <input type="text" name="zip_code" value={form.zip_code} onChange={handleChange} />
        </div>
        <div className="form-row">
          <input type="number" name="capacity" value={form.capacity} onChange={handleChange} />
          <input type="number" name="hourly_rate" value={form.hourly_rate} onChange={handleChange} />
        </div>

        <label>
          Category:
          <select
            multiple
            value={selectedCategories}
            onChange={(e) =>
              setSelectedCategories(Array.from(e.target.selectedOptions, (opt) => parseInt(opt.value)))
            }
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </label>

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
        <button type="submit" className="btn-primary">Update Venue</button>
      </form>
    </div>
  );
};

export default EditVenue;