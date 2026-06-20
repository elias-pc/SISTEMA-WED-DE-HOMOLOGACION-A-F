type BadgeVariant = 'default' | 'success' | 'warning' | 'danger';

interface Props {
  children: string;
  variant?: BadgeVariant;
}

const badgeStyles: Record<BadgeVariant, React.CSSProperties> = {
  default: { background: '#e5e7eb', color: '#374151' },
  success: { background: '#dcfce7', color: '#166534' },
  warning: { background: '#fef3c7', color: '#92400e' },
  danger: { background: '#fee2e2', color: '#991b1b' },
};

function Badge({ children, variant = 'default' }: Props) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: '0.35rem 0.75rem',
        borderRadius: '999px',
        fontSize: '0.85rem',
        fontWeight: 600,
        ...badgeStyles[variant],
      }}
    >
      {children}
    </span>
  );
}

export default Badge;
