import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Input({
  label,
  error,
  id,
  className = "",
  ...rest
}: InputProps): React.JSX.Element {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className={`input-group ${className}`}>
      <label className="input-group__label" htmlFor={inputId}>
        {label}
      </label>
      <input
        {...rest}
        id={inputId}
        className={`input-group__field${error ? " input-group__field--error" : ""}`}
      />
      {error && <span className="input-group__error">{error}</span>}
    </div>
  );
}
