import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";

/** Abre un flujo (modal, etc.) cuando la URL trae `?accion=<valor>` y limpia el parámetro. */
export function useAccionQueryParam(action: string, handler: () => void) {
  const [searchParams, setSearchParams] = useSearchParams();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (searchParams.get("accion") !== action) return;

    const next = new URLSearchParams(searchParams);
    next.delete("accion");
    setSearchParams(next, { replace: true });

    handlerRef.current();
  }, [action, searchParams, setSearchParams]);
}
