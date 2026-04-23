import { useEffect, useRef } from 'react';

const useScrollReveal = (options = {}) => {
  const elementsRef = useRef([]);

  useEffect(() => {
    const defaultOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1,
      ...options,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, defaultOptions);

    const currentElements = elementsRef.current;
    
    // Select any elements that have a 'reveal-on-scroll' class but aren't being tracked yet
    const rawElements = document.querySelectorAll('.reveal-on-scroll');
    const newElements = Array.from(rawElements).filter(el => !currentElements.includes(el));
    
    newElements.forEach((el) => {
      observer.observe(el);
      currentElements.push(el);
    });

    return () => {
      currentElements.forEach((el) => {
        observer.unobserve(el);
      });
    };
  }, [options]);
};

export default useScrollReveal;
