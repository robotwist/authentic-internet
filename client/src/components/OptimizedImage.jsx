import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './OptimizedImage.css';

/**
 * OptimizedImage component
 * Handles lazy loading, responsive images, and provides loading states
 * 
 * @param {Object} props
 * @param {string} props.src - Image source URL
 * @param {string} props.alt - Alt text for image
 * @param {string} props.className - Additional CSS classes
 * @param {number} props.width - Width of image
 * @param {number} props.height - Height of image
 * @param {string} props.fallbackSrc - Fallback image if primary fails to load
 * @param {boolean} props.eager - If true, loads immediately instead of lazy
 * @param {string} props.objectFit - CSS object-fit property
 */

  // Progressive loading support
  const [isLoaded, setIsLoaded] = useState(false);
  const [isProgressive, setIsProgressive] = useState(true);
  
  const handleLoad = () => {
    setIsLoaded(true);
    setIsProgressive(false);
  };
  
  const handleError = () => {
    setIsProgressive(false);
    // Fallback to placeholder or error state
  };
  
  // Add progressive loading classes
  const imageClasses = `optimized-image ${isLoaded ? 'loaded' : ''} ${isProgressive ? 'progressive' : ''}`;


  // Responsive image support
  const generateSrcSet = (src) => {
    const baseName = src.replace(/\.[^/.]+$/, '');
    const ext = src.split('.').pop();
    return `${baseName}-320.${ext} 320w, ${baseName}-640.${ext} 640w, ${baseName}-1024.${ext} 1024w`;
  };
  
  const srcSet = generateSrcSet(src);

const OptimizedImage = ({
  src,
  alt,
  className = '',
  width,
  height,
  fallbackSrc,
  eager = false,
  objectFit = 'cover',
  ...rest
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageSrc, setImageSrc] = useState(src);
  const [isIntersecting, setIsIntersecting] = useState(eager);

  useEffect(() => {
    // Skip for eagerly loaded images
    if (eager) return;

    // Set up intersection observer for lazy loading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsIntersecting(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '200px', // Start loading when image is 200px from viewport
        threshold: 0.01      // Trigger when 1% of the image is visible
      }
    );

    // Get reference to current DOM element
    const element = document.getElementById(`img-${src.split('/').pop()}`);
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [src, eager]);

  // Handle image load success
  const handleLoad = () => {
    setIsLoading(false);
    setError(false);
  };

  // Handle image load failure
  const handleError = () => {
    setIsLoading(false);
    setError(true);
    
    // Use fallback image if available
    if (fallbackSrc && fallbackSrc !== src) {
      setImageSrc(fallbackSrc);
    }
  };

  // Generate unique ID from image source
  const imgId = `img-${src.split('/').pop()}`;

  return (
    <div 
      className={`optimized-image-container ${className}`}
      style={{ 
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : 'auto',
      }}
      id={imgId}
    >
      {/* Loading spinner shown while image is loading */}
      {isLoading && (
        <div className="image-loading-indicator">
          <div className="spinner"></div>
        </div>
      )}
      
      {/* Only load image when in viewport or eager loading is enabled */}
      {(isIntersecting || eager) && (
        <img srcSet={srcSet} sizes="(max-width: 320px) 320px, (max-width: 640px) 640px, 1024px"
          src={imageSrc}
          alt={alt}
          className={`optimized-image ${isLoading ? 'loading' : ''} ${error ? 'error' : ''}`}
          onLoad={handleLoad}
          onError={handleError}
          loading={eager ? 'eager' : 'lazy'}
          style={{ objectFit }}
          width={width}
          height={height}
          {...rest}
        />
      )}
      
      {/* Error state */}
      {error && !fallbackSrc && (
        <div className="image-error">
          <span>!</span>
        </div>
      )}
    </div>
  );
};

OptimizedImage.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  className: PropTypes.string,
  width: PropTypes.number,
  height: PropTypes.number,
  fallbackSrc: PropTypes.string,
  eager: PropTypes.bool,
  objectFit: PropTypes.string
};

export default OptimizedImage; 