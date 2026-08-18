import { Maximize2, Minus, Plus, Redo2, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";

type MuralApuntesCanvasControlsProps = {
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onFullscreen?: () => void;
  className?: string;
};

export function MuralApuntesCanvasControls({
  canUndo = true,
  canRedo = true,
  onUndo,
  onRedo,
  onFullscreen,
  className,
}: MuralApuntesCanvasControlsProps) {
  return (
    <div
      className={cn(
        "pointer-events-auto absolute right-4 top-4 z-30 flex items-center gap-2",
        className,
      )}
    >
      <div className="inline-flex items-center gap-0.5 rounded-full border border-slate-200 bg-white/95 px-1 py-1 shadow-lg shadow-slate-900/10 backdrop-blur-sm">
        <button
          type="button"
          title="Deshacer"
          aria-label="Deshacer"
          disabled={!canUndo}
          onClick={onUndo}
          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 disabled:opacity-40"
        >
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          title="Rehacer"
          aria-label="Rehacer"
          disabled={!canRedo}
          onClick={onRedo}
          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 disabled:opacity-40"
        >
          <Redo2 className="h-4 w-4" />
        </button>
      </div>

      <div id="mural-zoom-slot" className="inline-flex items-center" />

      <button
        type="button"
        title="Pantalla completa"
        aria-label="Pantalla completa"
        onClick={onFullscreen}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-600 shadow-lg shadow-slate-900/10 backdrop-blur-sm transition hover:bg-slate-100"
      >
        <Maximize2 className="h-4 w-4" />
      </button>
    </div>
  );
}

export function MuralZoomFallbackControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onReset,
  min,
  max,
}: {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  min: number;
  max: number;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white/95 px-1.5 py-1 shadow-lg shadow-slate-900/10 backdrop-blur-sm">
      <button
        type="button"
        className="flex h-7 w-7 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 disabled:opacity-40"
        onClick={onZoomOut}
        disabled={zoom <= min}
        aria-label="Reducir zoom"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        className="min-w-[3.25rem] px-1 text-center text-[12px] font-semibold tabular-nums text-slate-700"
        onClick={onReset}
      >
        {Math.round(zoom * 100)}%
      </button>
      <button
        type="button"
        className="flex h-7 w-7 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 disabled:opacity-40"
        onClick={onZoomIn}
        disabled={zoom >= max}
        aria-label="Ampliar zoom"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
