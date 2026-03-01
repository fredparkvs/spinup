export function SpinUpLogo({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Black ring */}
      <circle cx="50" cy="48" r="33" stroke="#0a0a0a" strokeWidth="13" />
      {/* Red upward triangle — launches through the ring */}
      <polygon points="50,14 69,66 31,66" fill="#DC2626" />
    </svg>
  );
}
