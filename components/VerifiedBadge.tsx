export default function VerifiedBadge({
  size = 17,
  color = "#2FC1A3",
  title = "Pro vérifié — SIRET contrôlé",
}: {
  size?: number;
  color?: string;
  title?: string;
}) {
  return (
    <span title={title} className="inline-flex flex-shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 24 24" width={size} height={size} aria-label={title}>
        <polygon
          fill={color}
          points="12.00,0.00 14.43,2.92 18.00,1.61 18.65,5.35 22.39,6.00 21.08,9.57 24.00,12.00 21.08,14.43 22.39,18.00 18.65,18.65 18.00,22.39 14.43,21.08 12.00,24.00 9.57,21.08 6.00,22.39 5.35,18.65 1.61,18.00 2.92,14.43 0.00,12.00 2.92,9.57 1.61,6.00 5.35,5.35 6.00,1.61 9.57,2.92"
        />
        <polyline
          points="7.5 12.2 10.5 15.2 16.5 9.2"
          fill="none"
          stroke="white"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
