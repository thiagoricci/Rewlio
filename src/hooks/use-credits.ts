import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useCredits = () => {
  const queryClient = useQueryClient();

  const { data: creditBalance, isLoading, error } = useQuery({
    queryKey: ["credits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_credits")
        .select("credits")
        .maybeSingle();

      if (error) throw error;
      return data?.credits ?? null;
    },
  });

  return {
    creditBalance,
    isLoading,
    error,
    invalidateCredits: () => queryClient.invalidateQueries({ queryKey: ["credits"] }),
  };
};