import React, { useState } from 'react';

interface StarRatingProps {
  rating: number | null;
  onRate: (rating: number, feedback?: string) => void;
}

export const StarRating: React.FC<StarRatingProps> = ({ rating, onRate }) => {
  const [hovered, setHovered] = useState<number | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');

  const handleStarClick = (star: number) => {
    if (star === 1) {
      setShowPopup(true);
    } else {
      onRate(star);
    }
  };

  const handlePopupSubmit = () => {
    onRate(1, feedbackText);
    setShowPopup(false);
    setFeedbackText('');
  };

  const handlePopupCancel = () => {
    setShowPopup(false);
    setFeedbackText('');
  };

  const displayRating = hovered ?? rating ?? 0;

  return (
    <>
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500 mr-1">Rate this answer:</span>
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => handleStarClick(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(null)}
            className="text-xl leading-none transition-colors focus:outline-none"
          >
            <span className={star <= displayRating ? 'text-yellow-400' : 'text-gray-600'}>
              ★
            </span>
          </button>
        ))}
        {rating !== null && (
          <span className="text-xs text-gray-500 ml-1">{rating}/5</span>
        )}
      </div>

      {/* 1-star feedback popup */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-gray-800 border-2 border-gray-600 p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-yellow-400 text-lg">★</span>
              <h3 className="text-white font-semibold text-lg">Tell us more please!</h3>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              What could be improved about this answer?
            </p>
            <textarea
              autoFocus
              value={feedbackText}
              onChange={e => setFeedbackText(e.target.value)}
              placeholder="Share your feedback..."
              rows={4}
              className="w-full bg-gray-900 text-white border border-gray-600 px-3 py-2 text-sm resize-none focus:outline-none focus:border-blue-500"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={handlePopupCancel}
                className="px-4 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePopupSubmit}
                className="px-4 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
