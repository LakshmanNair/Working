import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createPromotion, getPromotion, updatePromotion } from '../../api/promotionsApi';
import PromotionForm from '../../components/promotions/PromotionForm';
import ErrorMessage from '../../components/common/ErrorMessage';
import Loader from '../../components/common/Loader';
import '../../App.css';

const PromotionCreateEditPage = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState({});
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'automatic',
    startTime: '',
    endTime: '',
    minSpending: '',
    rate: '',
    points: '',
  });

  useEffect(() => {
    if (isEdit) {
      fetchPromotion();
    }
  }, [id]);

  const fetchPromotion = async () => {
    setLoading(true);
    setError('');
    try {
      const promo = await getPromotion(id);
      
      // Helper to convert ISO string to YYYY-MM-DDThh:mm for input[type="datetime-local"]
      const toLocalISO = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        // Getting local offset to ensure the input displays correct local time
        const offsetMs = date.getTimezoneOffset() * 60 * 1000;
        const localDate = new Date(date.getTime() - offsetMs);
        return localDate.toISOString().slice(0, 16);
      };

      setFormData({
        name: promo.name || '',
        description: promo.description || '',
        type: promo.type || 'automatic',
        startTime: promo.startTime ? toLocalISO(promo.startTime) : '',
        endTime: promo.endTime ? toLocalISO(promo.endTime) : '',
        minSpending: promo.minSpending?.toString() || '',
        rate: promo.rate?.toString() || '',
        points: promo.points?.toString() || '',
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch promotion');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name?.trim()) errors.name = 'Name is required';
    if (!formData.description?.trim()) errors.description = 'Description is required';
    
    if (!formData.startTime) {
      errors.startTime = 'Start time is required';
    } else {
      const start = new Date(formData.startTime);
      const now = new Date();
      if (!isEdit && start <= now) {
        // Optional: you might allow creating promos that start immediately, 
        // strictly speaking this prevents it. 
        // errors.startTime = 'Start time must be in the future for new promotions';
      }
    }
    
    if (!formData.endTime) {
      errors.endTime = 'End time is required';
    } else {
      const start = new Date(formData.startTime);
      const end = new Date(formData.endTime);
      if (end <= start) errors.endTime = 'End time must be after start time';
    }
    
    // Check numeric constraints
    if (formData.minSpending && parseFloat(formData.minSpending) < 0) errors.minSpending = 'Cannot be negative';
    if (formData.rate && parseFloat(formData.rate) < 0) errors.rate = 'Cannot be negative';
    if (formData.points && parseInt(formData.points) < 0) errors.points = 'Cannot be negative';

    // Bonus validation
    if (!formData.minSpending && !formData.rate && !formData.points) {
      errors.bonus = 'At least one bonus type (min spending, rate, or points) must be configured';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFormErrors({});
    
    if (!validateForm()) return;

    setSaving(true);
    try {
      const data = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        type: formData.type,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
        minSpending: formData.minSpending ? parseFloat(formData.minSpending) : null,
        rate: formData.rate ? parseFloat(formData.rate) : null,
        points: formData.points ? parseInt(formData.points) : null,
      };

      if (isEdit) {
        await updatePromotion(id, data);
      } else {
        await createPromotion(data);
      }
      navigate('/manager/promotions');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save promotion');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="page-container"><Loader /></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>{isEdit ? 'Edit Promotion' : 'Create New Promotion'}</h1>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}

      {formErrors.bonus && (
        <div className="info-box" style={{ backgroundColor: '#fde8e8', borderColor: '#f98080' }}>
          <div className="info-box-title" style={{ color: '#9b1c1c' }}>Configuration Error</div>
          {formErrors.bonus}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <PromotionForm 
          formData={formData} 
          onChange={setFormData}
          errors={formErrors}
        />

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate('/manager/promotions')}
            className="btn btn-secondary"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Promotion'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PromotionCreateEditPage;