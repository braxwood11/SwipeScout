import React from "react";

/**
 * Simple “#” / hash icon to show when no photo is available.
 * – Inherits current text color (`currentColor`)
 * – Works with Tailwind/utility classes via the `className` prop
 */
export function HashSvg({ className = "", ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Horizontal bars */}
      <path d="M4 9h16" />
      <path d="M4 15h16" />
      {/* Vertical bars */}
      <path d="M10 3L8 21" />
      <path d="M16 3l-2 18" />
    </svg>
  );
}
