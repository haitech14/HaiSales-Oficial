import { useCallback, useEffect, useRef } from "react";
import type { WikiKanbanColumn } from "@/lib/anuncios/wiki-store";

const MAX_HISTORY = 50;

function cloneBoard(columns: WikiKanbanColumn[]): WikiKanbanColumn[] {
  return structuredClone(columns);
}

/**
 * Historial deshacer/rehacer para el tablero Wiki.
 * - commit: registra el estado actual y aplica el siguiente
 * - beginBatch/endBatch: un solo paso de historial durante arrastres/resize
 */
export function useWikiBoardHistory(
  columns: WikiKanbanColumn[],
  onChange: (columns: WikiKanbanColumn[]) => void,
) {
  const columnsRef = useRef(columns);
  columnsRef.current = columns;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const pastRef = useRef<WikiKanbanColumn[][]>([]);
  const futureRef = useRef<WikiKanbanColumn[][]>([]);
  const batchRef = useRef(false);
  const batchRecordedRef = useRef(false);

  const recordPast = useCallback(() => {
    pastRef.current = [...pastRef.current, cloneBoard(columnsRef.current)].slice(-MAX_HISTORY);
    futureRef.current = [];
  }, []);

  const commit = useCallback(
    (next: WikiKanbanColumn[]) => {
      if (batchRef.current) {
        if (!batchRecordedRef.current) {
          recordPast();
          batchRecordedRef.current = true;
        }
      } else {
        recordPast();
      }
      onChangeRef.current(next);
    },
    [recordPast],
  );

  const beginBatch = useCallback(() => {
    batchRef.current = true;
    batchRecordedRef.current = false;
  }, []);

  const endBatch = useCallback(() => {
    batchRef.current = false;
    batchRecordedRef.current = false;
  }, []);

  const undo = useCallback(() => {
    const past = pastRef.current;
    if (past.length === 0) return false;
    const previous = past[past.length - 1];
    pastRef.current = past.slice(0, -1);
    futureRef.current = [cloneBoard(columnsRef.current), ...futureRef.current].slice(
      0,
      MAX_HISTORY,
    );
    onChangeRef.current(cloneBoard(previous));
    return true;
  }, []);

  const redo = useCallback(() => {
    const future = futureRef.current;
    if (future.length === 0) return false;
    const next = future[0];
    futureRef.current = future.slice(1);
    pastRef.current = [...pastRef.current, cloneBoard(columnsRef.current)].slice(-MAX_HISTORY);
    onChangeRef.current(cloneBoard(next));
    return true;
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("textarea, input, select, [contenteditable='true']")) {
        return;
      }

      const mod = event.ctrlKey || event.metaKey;
      if (!mod) return;

      const key = event.key.toLowerCase();
      if (key === "z" && !event.shiftKey) {
        event.preventDefault();
        undo();
        return;
      }
      if (key === "y" || (key === "z" && event.shiftKey)) {
        event.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo, redo]);

  return { commit, beginBatch, endBatch, undo, redo };
}
