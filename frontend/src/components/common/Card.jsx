import React from 'react';

export default function Card({ children, className = '' }) {
  return <div className={`card-surface p-6 ${className}`}>{children}</div>;
}
