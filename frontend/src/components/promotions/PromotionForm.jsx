import { useState, useEffect } from 'react';

const PromotionForm = ({ initialData = {}, onSubmit, loading, isEdit }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'automatic', // or 'one_time'
    startTime: '',
    endTime: '',
    minSpending: '',
    rate: '',
    points: '',
  });

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      // Format dates for datetime-local input (YYYY-MM-DDThh:mm)
      const formatForInput = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toISOString().slice(0, 16);
      };

      setFormData({
        ...initialData,
        startTime: formatForInput(initialData.startTime),
        endTime: formatForInput(initialData.endTime),
        minSpending: initialData.minSpending || '',
        rate: initialData.rate || '',
        points: initialData.points || '',
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Convert empty strings to null for optional numbers
    const submissionData = {
      ...formData,
      minSpending: formData.minSpending ? parseFloat(formData.minSpending) : null,
      rate: formData.rate ? parseFloat(formData.rate) : null,
      points: formData.points ? parseInt(formData.points) : null,
    };
    onSubmit(submissionData);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '600px' }}>
      <div>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          style={{ width: '100%', padding: '0.5rem' }}
        />
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          style={{ width: '100%', padding: '0.5rem', minHeight: '80px' }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Type</label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            style={{ width: '100%', padding: '0.5rem' }}
          >
            <option value="automatic">Automatic</option>
            <option value="one_time">One Time</option>
          </select>
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Min. Spending ($)</label>
          <input
            type="number"
            name="minSpending"
            value={formData.minSpending}
            onChange={handleChange}
            step="0.01"
            min="0"
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Start Time</label>
          <input
            type="datetime-local"
            name="startTime"
            value={formData.startTime}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>End Time</label>
          <input
            type="datetime-local"
            name="endTime"
            value={formData.endTime}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>
      </div>

      <div style={{ padding: '1rem', backgroundColor: '#f0f9ff', borderRadius: '4px' }}>
        <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#666' }}>
          <strong>Reward Type:</strong> Fill in one or both.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Rate Multiplier (e.g. 0.5 for +50%)</label>
            <input
              type="number"
              name="rate"
              value={formData.rate}
              onChange={handleChange}
              step="0.01"
              min="0"
              style={{ width: '100%', padding: '0.5rem' }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Flat Bonus Points</label>
            <input
              type="number"
              name="points"
              value={formData.points}
              onChange={handleChange}
              min="0"
              style={{ width: '100%', padding: '0.5rem' }}
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        style={{
          marginTop: '1rem',
          padding: '0.75rem',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontWeight: 'bold',
        }}
      >
        {loading ? 'Saving...' : isEdit ? 'Update Promotion' : 'Create Promotion'}
      </button>
    </form>
  );
};

export default PromotionForm;