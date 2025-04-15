import React, { useState, useRef, useEffect } from 'react';

function ExpandingInput() {
  const [isFocused, setIsFocused] = useState(false);
  const [width, setWidth] = useState('100%');
  const inputRef = useRef(null);

  const handleFocus = () => {
    setIsFocused(true);
    setWidth('300px');
  };

  const handleBlur = () => {
    setIsFocused(false);
    setWidth('100px');
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.addEventListener('focus', handleFocus);
      inputRef.current.addEventListener('blur', handleBlur);
    }
    return () => {
      if (inputRef.current) {
        inputRef.current.removeEventListener('focus', handleFocus);
        inputRef.current.removeEventListener('blur', handleBlur);
      }
    };
  }, []);


  return (
    <input
      type="text"
      style={{
        width: width,
        transition: 'width 0.3s ease',
        border: '1px solid #ccc',
        padding: '8px',
      }}
      ref={inputRef}
    />
  );
}

export default ExpandingInput;
