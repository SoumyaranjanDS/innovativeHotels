import React, { useState } from 'react';
import { Star, Send } from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'react-toastify';

const ReviewForm = ({ bookingId, onSuccess }) => {
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) {
      toast.error('Please select a rating');
      return;
    }

    setLoading(true);
    try {
      await api.post(`/hotel-bookings/${bookingId}/review`, { rating, comment });
      toast.success('Thank you for your review!');
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Rate Your Stay</h3>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="focus:outline-none transition-transform hover:scale-110"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
              >
                <Star
                  size={32}
                  className={`${
                    star <= (hoveredRating || rating)
                      ? 'text-accent fill-accent'
                      : 'text-gray-200'
                  } transition-colors`}
                />
              </button>
            ))}
            <span className="ml-3 text-sm font-semibold text-gray-500">
              {rating === 5 ? 'Excellent' : rating === 4 ? 'Good' : rating === 3 ? 'Average' : rating === 2 ? 'Poor' : 'Terrible'}
            </span>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Share your experience</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none transition resize-none text-sm"
            rows="4"
            placeholder="What did you like or dislike?"
          ></textarea>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-accent text-primary-dark rounded-xl font-bold hover:bg-[#b59540] transition disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? 'Submitting...' : <><Send size={16} /> Submit Review</>}
        </button>
      </form>
    </div>
  );
};

export default ReviewForm;
