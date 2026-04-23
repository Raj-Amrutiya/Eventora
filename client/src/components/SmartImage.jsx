import { useEffect, useState } from 'react';
import fallbackImage from '../assets/image-placeholder.svg';

function SmartImage({ src, alt, className = '', loading = 'lazy', ...props }) {
  const [currentSrc, setCurrentSrc] = useState(src || fallbackImage);

  useEffect(() => {
    setCurrentSrc(src || fallbackImage);
  }, [src]);

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      loading={loading}
      onError={() => {
        if (currentSrc !== fallbackImage) {
          setCurrentSrc(fallbackImage);
        }
      }}
      {...props}
    />
  );
}

export default SmartImage;