import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Star, MessageSquare } from 'lucide-react';

const ProviderReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await api.get('/provider/reviews');
        setReviews(res.data.reviews || []);
      } catch (error) {
        console.error("Failed to fetch reviews", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  if (loading) return <div className="p-8 text-center">Loading reviews...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Reviews</h1>
          <p className="text-gray-500">Read what guests are saying about your properties.</p>
        </div>
        <div className="bg-primary/10 text-primary px-4 py-2 rounded-xl font-semibold flex items-center gap-2">
          <Star size={18} />
          {reviews.length} Reviews
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl shadow-sm border border-gray-100">
          <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">No Reviews Yet</h2>
          <p className="text-gray-500">You haven't received any reviews yet. Provide great service to get your first 5-star review!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reviews.map(review => (
            <div key={review._id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold">
                    {review.userId?.name?.charAt(0) || 'G'}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{review.userId?.name || 'Guest'}</h3>
                    <p className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center bg-yellow-50 px-2 py-1 rounded text-yellow-700 font-bold text-sm">
                  <Star size={14} className="fill-current mr-1" />
                  {review.rating}.0
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Property</p>
                <p className="text-sm text-indigo-600 font-medium">{review.hotelId?.profile?.hotelName || 'N/A'}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="text-gray-700 text-sm italic">"{review.comment}"</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProviderReviews;
