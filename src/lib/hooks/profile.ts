import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ProfileDTO, ProfileUpdateCommand, ProfileCreateCommand } from "../../types";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) throw new Error(String(res.status));
  return (await res.json()) as T;
}

export function useProfile() {
  const queryClient = useQueryClient();
  const query = useQuery<ProfileDTO | null>({
    queryKey: ["profile"],
    queryFn: async () => {
      try {
        return await fetchJson<ProfileDTO>("/api/v1/profile");
      } catch (e) {
        // Auto-create profile on 404
        if (e instanceof Error && e.message === "404") {
          return await fetchJson<ProfileDTO>("/api/v1/profile", { method: "POST", body: JSON.stringify({}) });
        }
        throw e;
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ProfileUpdateCommand) => {
      return await fetchJson<ProfileDTO>("/api/v1/profile", {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess(profile) {
      queryClient.setQueryData(["profile"], profile);
    },
  });

  return { ...query, updateProfile: updateMutation.mutateAsync, updating: updateMutation.isPending };
}
