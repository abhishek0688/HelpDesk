import React from 'react';

export default function WordCounter({ text = '', maxWords = 100 }) {
  const words = text.trim() ? text.trim().split(/\s+/).filter(Boolean) : [];
  const count = words.length;
  const isOverLimit = count > maxWords;

  return (
    <div className={`word-counter ${isOverLimit ? 'invalid' : 'valid'}`}>
      {count} / {maxWords} words {isOverLimit && `(Exceeds limit by ${count - maxWords})`}
    </div>
  );
}
