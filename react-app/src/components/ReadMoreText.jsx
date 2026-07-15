import React, { useState } from 'react';

export default function ReadMoreText({ text }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div>
      <p className="text-on-surface-variant font-body-md text-body-md leading-relaxed">
        {isExpanded ? text : text.substring(0, 100) + '...'}
      </p>
      {text.length > 100 && (
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-primary font-label-large mt-2 hover:underline focus:outline-none"
        >
          {isExpanded ? 'Read Less' : 'Read More'}
        </button>
      )}
    </div>
  );
}
