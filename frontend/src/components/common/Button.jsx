import React from 'react';

const base = 'inline-flex items-center justify-center rounded-lg px-5 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2';

const styles = {
  primary: 'bg-primary text-white hover:bg-primary-hover focus:ring-primary/30',
  secondary: 'bg-secondary text-white hover:bg-secondary-hover focus:ring-secondary/30',
  ghost: 'bg-white text-primary border border-primary/20 hover:border-primary/60',
};

export default function Button({ variant = 'primary', className = '', ...props }) {
  return <button className={`${base} ${styles[variant]} ${className}`} {...props} />;
}
