import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Star, MessageSquare } from 'lucide-react';
import { toast } from 'react-toastify';

const ProviderReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await api.get('/providers/reviews');
        if (res.data.success) {
          setReviews(res.data.reviews);
        }
      } catch (err) {
        toast.error('Failed to load reviews');
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  if (loading) {
    return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-heading">Customer Reviews</h1>
          <p className="text-gray-500 mt-1">See what your guests are saying about their stay</p>
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center text-center">
          <MessageSquare size={48} className="text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">No reviews yet</h3>
          <p className="text-gray-500 max-w-md mt-2">When customers leave reviews for your hotel, they will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reviews.map((review) => (
            <div key={review._id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                      {review.userId?.name?.charAt(0)?.toUpperCase() || 'G'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{review.userId?.name || 'Guest'}</p>
                      <p className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} size={16} className={star <= review.rating ? "text-accent fill-accent" : "text-gray-300"} />
                    ))}
                  </div>
                </div>
                {review.hotelId?.profile?.hotelName && (
                  <p className="text-xs font-semibold text-primary mb-2">Hotel: {review.hotelId.profile.hotelName}</p>
                )}
                <p className="text-gray-700 text-sm leading-relaxed mb-4">
                  "{review.comment}"
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProviderReviews;
