import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: 'pending' | 'completed' | 'expired' | 'invalid';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const variants: Record<string, { variant: any; label: string }> = {
    pending: { variant: 'warning', label: 'Pending' },
    completed: { variant: 'success', label: 'Completed' },
    expired: { variant: 'destructive', label: 'Expired' },
    invalid: { variant: 'secondary', label: 'Invalid' }
  };

  const config = variants[status] || variants.pending;

  return (
    <Badge variant={config.variant as any}>
      {config.label}
    </Badge>
  );
}
