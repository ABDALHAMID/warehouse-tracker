import React from 'react'

/**
 * BeamIcon
 * High-precision symbolic SVG icon representing a Prestressed Concrete Beam / Poutrelle (ديبو / بوطريل)
 * Features inverted-T cross-section with 3D isometric slab-joist projection & steel reinforcement tendons.
 */
export default function BeamIcon({
  className = 'w-6 h-6',
  variant = 'isometric',
  ...props
}) {
  if (variant === 'profile') {
    // 2D Elevation Cross-Section of Inverted-T Beam
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden="true"
        {...props}
      >
        {/* Inverted T Base & Web */}
        <path
          d="M3 20V16H8.5V7C8.5 6.44772 8.94772 6 9.5 6H14.5C15.0523 6 15.5 6.44772 15.5 7V16H21V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20Z"
          fill="currentColor"
          fillOpacity="0.18"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        {/* Steel rebar truss apex wire on top */}
        <path
          d="M10 6L12 3L14 6"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Prestressing high-tensile steel tendons (3 cables inside base) */}
        <circle cx="6" cy="18.5" r="1" fill="currentColor" />
        <circle cx="12" cy="18.5" r="1" fill="currentColor" />
        <circle cx="18" cy="18.5" r="1" fill="currentColor" />
      </svg>
    )
  }

  // Default: Isometric 3D Prestressed Concrete Joist (Poutrelle)
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* Front Face: Inverted-T Cross-Section */}
      <path
        d="M4 25V21H8.5V14.5C8.5 14.2239 8.72386 14 9 14H11C11.2761 14 11.5 14.2239 11.5 14.5V21H16V25H4Z"
        fill="currentColor"
        fillOpacity="0.32"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />

      {/* Top Surface of the Stem/Rib extending back in 3D */}
      <path
        d="M9 14L21 6.5H23L11.5 14H9Z"
        fill="currentColor"
        fillOpacity="0.45"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />

      {/* Right Side Wall of the Rib */}
      <path
        d="M11.5 14L23 6.5V13.5L12 21H11.5V14Z"
        fill="currentColor"
        fillOpacity="0.18"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />

      {/* Right Base Flange Shelf (where Hourdis rests) */}
      <path
        d="M12 21L23.5 13.5H27.5L16 21H12Z"
        fill="currentColor"
        fillOpacity="0.4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />

      {/* Right Base Outer Thickness Wall */}
      <path
        d="M16 21L27.5 13.5V17.5L16 25V21Z"
        fill="currentColor"
        fillOpacity="0.25"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />

      {/* High-Tensile Steel Wire Lattice / Treillis along the top spine */}
      <path
        d="M10 14L13.5 9.5L17 11.5L20.5 7L23 6.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />

      {/* Prestressing Steel Tendon Endings (3 dots on front face base) */}
      <circle cx="6" cy="23" r="0.9" fill="currentColor" />
      <circle cx="10" cy="23" r="0.9" fill="currentColor" />
      <circle cx="14" cy="23" r="0.9" fill="currentColor" />
    </svg>
  )
}

