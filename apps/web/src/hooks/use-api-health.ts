import { HEALTH_ROUTE, parseHealthResponse } from "@kresliarska/shared";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-fetch";

type ApiHealthStatus = "loading" | "ok" | "down";

export const useApiHealth = (): ApiHealthStatus => {
  const [status, setStatus] = useState<ApiHealthStatus>("loading");

  useEffect(() => {
    let cancelled = false;

    const check = async (): Promise<void> => {
      try {
        const response = await apiFetch(HEALTH_ROUTE);
        parseHealthResponse(await response.json());
        if (!cancelled) {
          setStatus("ok");
        }
      } catch {
        if (!cancelled) {
          setStatus("down");
        }
      }
    };

    void check();
    return () => {
      cancelled = true;
    };
  }, []);

  return status;
};
