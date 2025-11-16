import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { InfoRequestList } from "@/components/dashboard/InfoRequestList";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { Database, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<{ id: string; request_id: string; info_type: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data: requests = [], isLoading, refetch } = useQuery({
    queryKey: ['info-requests', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('info_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as 'pending' | 'completed' | 'expired' | 'invalid');
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 5000,
  });

  const filteredRequests = requests.filter((request) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      request.recipient_phone.toLowerCase().includes(searchLower) ||
      request.call_id.toLowerCase().includes(searchLower) ||
      request.request_id.toLowerCase().includes(searchLower)
    );
  });

  const handleDeleteRequest = async () => {
    if (!requestToDelete) return;
    
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("info_requests")
        .delete()
        .eq("id", requestToDelete.id);

      if (error) throw error;

      toast({
        title: "Request deleted",
        description: "The info request has been removed.",
      });

      refetch();
    } catch (error) {
      console.error("Error deleting request:", error);
      toast({
        title: "Error",
        description: "Failed to delete request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setRequestToDelete(null);
    }
  };

  const handleDeleteClick = (id: string, request_id: string, info_type: string) => {
    setRequestToDelete({ id, request_id, info_type });
    setDeleteDialogOpen(true);
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-background">
        <div className="border-b bg-card">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Database className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">SMS Collection Dashboard</h1>
                  <p className="text-sm text-muted-foreground">Monitor your information requests</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-8">
          <FilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
          />
          <InfoRequestList 
            requests={filteredRequests} 
            isLoading={isLoading}
            onDelete={handleDeleteClick}
          />
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Showing {filteredRequests.length} of {requests.length} requests
          </div>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete request <span className="font-mono">{requestToDelete?.request_id}</span> for <span className="font-semibold">{requestToDelete?.info_type}</span>? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRequest}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
