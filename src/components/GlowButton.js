import React, { useState, forwardRef } from 'react';
import { Sparkles } from 'lucide-react';

const GlowButton = forwardRef(({
  label = "Generate",
  onClick,
  className = "",
  disabled = false,
  showIcon = true,
  icon: Icon = Sparkles,
  type = "button",
  children
}, ref) => {
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = () => {
    if (disabled) return;
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 200);
    onClick?.();
  };

  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      className={`glow-btn ${disabled ? 'glow-btn-disabled' : ''} ${className}`}
      onClick={handleClick}
      disabled={disabled}
      data-state={isClicked ? "clicked" : undefined}
    >
      <span className="flex items-center justify-center gap-1.5">
        {children || label}
        {showIcon && !disabled && <Icon size={16} className="ml-0.5" />}
      </span>
    </button>
  );
});

GlowButton.displayName = "GlowButton";

export default GlowButton;
