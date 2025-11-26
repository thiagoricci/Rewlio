import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./StatusBadge";
import { formatDistanceToNow } from "date-fns";
import { Trash2 } from "lucide-react";

interface InfoRequest {
  id: string;
  request_id: string;
  call_id: string;
  recipient_phone: string;
  status: 'pending' | 'completed' | 'expired' | 'invalid';
  received_value?: string;
  created_at: string;
  received_at?: string;
  expires_at: string;
}

interface InfoRequestRowProps {
  request: InfoRequest;
  onDelete?: (id: string, request_id: string) => void;
}

export function InfoRequestRow({ request, onDelete }: InfoRequestRowProps) {
  return (
    <TableRow>
      <TableCell className="font-mono text-sm">{request.request_id}</TableCell>
      <TableCell className="font-mono text-sm">{request.recipient_phone}</TableCell>
      <TableCell>
        <StatusBadge status={request.status} />
      </TableCell>
      <TableCell className="max-w-xs truncate">
        {request.received_value ? (
          <span className="font-mono text-sm">{request.received_value}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
      </TableCell>
      <TableCell>
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(request.id, request.request_id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}
