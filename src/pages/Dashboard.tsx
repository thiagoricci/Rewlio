import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { InfoRequestList } from "@/components/dashboard/InfoRequestList";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { Database, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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

      if (error) {
        console.error('Error fetching requests:', error);
        throw error;
      }

      return data || [];
    },
    refetchInterval: 5000, // Poll every 5 seconds
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

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Database className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">SMS Collection Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  Monitor information requests from Retell AI voice agents
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
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

        <InfoRequestList requests={filteredRequests} isLoading={isLoading} />

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Showing {filteredRequests.length} of {requests.length} requests
          <span className="mx-2">•</span>
          Auto-refreshes every 5 seconds
        </div>
      </div>
    </div>
  );
}
