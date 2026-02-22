import { useCallback, useState } from "react";

const useAsyncError = () => {
  const [_, setError] = useState();
  return useCallback(
    (e: unknown, context?: string) => {
      setError(() => {
        throw context
          ? new Error(
              `${context}: ${e instanceof Error ? e.message : JSON.stringify(e)}`,
            )
          : e;
      });
    },
    [setError],
  );
};

export default useAsyncError;
