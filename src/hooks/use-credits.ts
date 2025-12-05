import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useCredits = () => {
  const queryClient = useQueryClient();

  const { data: creditBalance, isLoading, error } = useQuery({
    queryKey: ["credits"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("user_credits")
        .select("credits")
        .eq("user_id", user.id)
        .limit(1)
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