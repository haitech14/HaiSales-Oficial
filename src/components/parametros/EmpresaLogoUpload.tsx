import { ImagePlus, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { uploadEmpresaLogo } from "@/lib/parametros/empresa-service";
import { cn } from "@/lib/utils";

const MAX_LOGO_SIZE_MB = 5;
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"];

type EmpresaLogoUploadProps = {
  userId?: string;
  value: string;
  onChange: (logoUrl: string) => void;
  className?: string;
  compact?: boolean;
};

export function EmpresaLogoUpload({
  userId,
  value,
  onChange,
  className,
  compact = false,
}: EmpresaLogoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFile = async (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Formato no válido. Usa PNG, JPG, WEBP o SVG.");
      return;
    }
    if (file.size > MAX_LOGO_SIZE_MB * 1024 * 1024) {
      toast.error(`El logo no debe superar ${MAX_LOGO_SIZE_MB} MB`);
      return;
    }

    setIsUploading(true);
    try {
      const url = await uploadEmpresaLogo(userId, file);
      onChange(url);
      toast.success("Logo cargado correctamente");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo subir el logo");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div
        className={cn(
          "flex items-center gap-4 rounded-[12px] border border-dashed border-slate-200 bg-slate-50/80 p-4",
          compact && "p-3",
        )}
      >
        <div
          className={cn(
            "flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white",
            compact ? "h-16 w-16" : "h-20 w-20",
          )}
        >
          {value ? (
            <img src={value} alt="Logo de la empresa" className="h-full w-full object-contain p-1" />
          ) : (
            <ImagePlus className="h-8 w-8 text-slate-300" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-800">Logo de la empresa</p>
          <p className="mt-0.5 text-xs text-slate-500">PNG, JPG, WEBP o SVG. Máx. {MAX_LOGO_SIZE_MB} MB.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 rounded-lg text-xs"
              disabled={isUploading}
              onClick={() => inputRef.current?.click()}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Subiendo...
                </>
              ) : (
                "Subir logo"
              )}
            </Button>
            {value && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 gap-1 rounded-lg text-xs text-slate-500"
                onClick={() => onChange("")}
              >
                <X className="h-3.5 w-3.5" />
                Quitar
              </Button>
            )}
          </div>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
    </div>
  );
}
