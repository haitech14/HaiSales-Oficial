import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

export function useSearchQueryParam(setSearch: (value: string) => void) {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const query = searchParams.get("q");
    if (query) {
      setSearch(query);
    }
  }, [searchParams, setSearch]);
}
