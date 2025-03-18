import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/shared/Layout';
import Form from '../components/shared/Form';
import Button from '../components/shared/Button';
import '../styles/CreateWorld.css';

const CreateWorld = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'fantasy'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/worlds`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      navigate(`/world/${response.data._id}`);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create world');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="create-world-container">
        <h1>Create New World</h1>
        {error && <div className="error-message">{error}</div>}
        <Form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">World Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="type">World Type</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
            >
              <option value="fantasy">Fantasy</option>
              <option value="scifi">Science Fiction</option>
              <option value="post-apocalyptic">Post-Apocalyptic</option>
              <option value="mystery">Mystery</option>
            </select>
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create World'}
          </Button>
        </Form>
      </div>
    </Layout>
  );
};

export default CreateWorld; 