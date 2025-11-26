import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useUserCredentials = () => {
  const queryClient = useQueryClient();

  const { data: credentials, isLoading, error } = useQuery({
    queryKey: ["user_credentials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_credentials")
        .select("*")
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      return data;
    },
  });

  return {
    credentials,
    isLoading,
    error,
    invalidateCredentials: () => queryClient.invalidateQueries({ queryKey: ["user_credentials"] }),
  };
};