interface StatusBadgeProps {
  status: 'online' | 'offline' | 'warning' | 'critical' | 'normal';
  label?: string;
  showDot?: boolean;
}

export default function StatusBadge({ status, label, showDot = true }: StatusBadgeProps) {
  const displayLabel = label || status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span className={`badge badge-${status}`}>
      {showDot && <span className="badge-dot" />}
      {displayLabel}
    </span>
  );
}
