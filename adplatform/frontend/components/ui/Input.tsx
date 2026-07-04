'use client';

import { forwardRef, useId } from 'react';
import { theme } from '@/lib/theme';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, style, id, ...rest },
  ref
) {
  const generatedId = useId();
  const inputId = id || generatedId;

  const borderColor = error ? theme.color.error : theme.color.border;

  return (
    <div>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: 11, fontWeight: 700, color: theme.color.text2, display: 'block',
            marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em',
            fontFamily: theme.font.body,
          }}
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        style={{
          width: '100%', padding: '11px 14px', background: theme.color.surface,
          border: `1.5px solid ${borderColor}`, borderRadius: theme.radius.sm, fontSize: 14,
          fontFamily: theme.font.body, color: theme.color.text1, outline: 'none', boxSizing: 'border-box',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          ...style,
        }}
        onFocus={e => {
          e.target.style.borderColor = theme.color.gold;
          e.target.style.boxShadow = `0 0 0 3px rgba(224,165,38,0.14)`;
        }}
        onBlur={e => {
          e.target.style.borderColor = borderColor;
          e.target.style.boxShadow = 'none';
        }}
        {...rest}
      />
      {error && (
        <p style={{ fontSize: 11, color: theme.color.error, margin: '5px 0 0', fontWeight: 600, fontFamily: theme.font.body }}>
          {error}
        </p>
      )}
    </div>
  );
});

export default Input;
