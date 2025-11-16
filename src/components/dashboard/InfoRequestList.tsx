import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InfoRequestRow } from "./InfoRequestRow";
import { Card, CardContent } from "@/components/ui/card";

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

interface InfoRequestListProps {
  requests: InfoRequest[];
  isLoading?: boolean;
  onDelete?: (id: string, request_id: string) => void;
}

export function InfoRequestList({ requests, isLoading, onDelete }: InfoRequestListProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center text-muted-foreground">
            <p className="text-lg font-medium mb-2">No requests found</p>
            <p className="text-sm">Requests will appear here once they are created</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request ID</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <InfoRequestRow 
                  key={request.id} 
                  request={request}
                  onDelete={onDelete}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
