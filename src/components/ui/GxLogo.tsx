import React from 'react';

export const GxLogo = ({ className = "w-6 h-6", color = "currentColor" }: { className?: string, color?: string }) => (
    <svg
        viewBox="0 0 120 100"
        fill={color}
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={{ display: 'block' }}
    >
        {/* G */}
        <rect x="15" y="15" width="45" height="15" />
        <rect x="15" y="30" width="15" height="55" />
        <rect x="15" y="70" width="45" height="15" />
        <rect x="45" y="45" width="15" height="40" />
        <rect x="35" y="45" width="10" height="15" />

        {/* X */}
        <polygon points="65,15 82,15 95,43 108,15 125,15 106,50 125,85 108,85 95,57 82,85 65,85 84,50" />
    </svg>
);
