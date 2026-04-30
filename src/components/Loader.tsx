import { useState, useEffect } from 'react';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function Loader({ size = 'md', className = '' }: LoaderProps) {
  const [index, setIndex] = useState(0);
  const letters = ['N', 'B', 'T'];

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % letters.length);
    }, 1500); // Matches the CSS animation duration

    return () => clearInterval(interval);
  }, [letters.length]);

  const sizeClasses = {
    sm: 'text-2xl h-8 w-8',
    md: 'text-5xl h-16 w-16',
    lg: 'text-8xl h-32 w-32',
  };

  return (
    <div className={`flex items-center justify-center perspective-1000 ${className}`}>
      <div 
        key={index}
        className={`font-black text-primary animate-flip-3d flex items-center justify-center ${sizeClasses[size]}`}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {letters[index]}
      </div>
    </div>
  );
}
