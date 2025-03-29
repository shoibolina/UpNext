import React, { useState } from "react";
import { createVenue, uploadVenueImage, createAvailability } from "../../services/venueServices";

const CreateVenue = () => {
  const [form, setForm] = useState({ name: "", description: "", address: "", city: "", state: "", zip_code: "", country: "United States", capacity: 0, hourly_rate: 0 });
  const [image, setImage] = useState(null);
  const [availability, setAvailability] = useState([]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleFileChange = (e) => setImage(e.target.files[0]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const venue = await createVenue(form);
    if (image) await uploadVenueImage(venue.id, { image, is_primary: true });
    for (const slot of availability) await createAvailability(venue.id, slot);
    alert("Venue created successfully!");
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" onChange={handleChange} placeholder="Venue Name" required />
      <textarea name="description" onChange={handleChange} placeholder="Description" />
      <input name="address" onChange={handleChange} placeholder="Address" />
      <input name="city" onChange={handleChange} placeholder="City" />
      <input name="state" onChange={handleChange} placeholder="State" />
      <input name="zip_code" onChange={handleChange} placeholder="ZIP Code" />
      <input name="capacity" type="number" onChange={handleChange} placeholder="Capacity" />
      <input name="hourly_rate" type="number" onChange={handleChange} placeholder="Hourly Rate" />
      <input type="file" onChange={handleFileChange} />
      <button type="submit">Create Venue</button>
    </form>
  );
};

export default CreateVenue;