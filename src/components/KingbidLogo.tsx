export function KingbidLogoMark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const h = size === "sm" ? 18 : size === "lg" ? 24 : 22;
  const w = size === "sm" ? 22 : size === "lg" ? 30 : 28;

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 28 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect x="8" y="0" width="12" height="3.5" rx="1" fill="#e55b3c" />
      <rect x="4" y="7" width="16" height="3.5" rx="1" fill="currentColor" />
      <rect x="0" y="14" width="24" height="3.5" rx="1" fill="currentColor" />
    </svg>
  );
}
