import React from 'react';
import { useNavigate } from '../../../../hooks/useNavigate';

const BackButton = () => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate('about:settings')}
      className="text-blue-400 mb-4 hover:underline"
    >
      ← Back
    </button>
  );
};

export default BackButton;
