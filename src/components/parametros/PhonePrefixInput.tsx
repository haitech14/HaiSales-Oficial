import { PHONE_PREFIX_OPTIONS } from "@/lib/parametros/empresa-config-data";
import { cn } from "@/lib/utils";

type PhonePrefixInputProps = {
  prefix: string;
  phone: string;
  onPrefixChange: (prefix: string) => void;
  onPhoneChange: (phone: string) => void;
  inputClassName?: string;
  placeholder?: string;
};

export function PhonePrefixInput({
  prefix,
  phone,
  onPrefixChange,
  onPhoneChange,
  inputClassName,
  placeholder = "999 999 999",
}: PhonePrefixInputProps) {
  const selected = PHONE_PREFIX_OPTIONS.find((item) => item.code === prefix) ?? PHONE_PREFIX_OPTIONS[0];

  return (
    <div className="flex gap-2">
      <div className="relative shrink-0">
        <select
          value={prefix}
          onChange={(event) => onPrefixChange(event.target.value)}
          className={cn(
            "h-11 w-[108px] appearance-none rounded-[10px] border-transparent bg-[#eef2f8] pl-3 pr-8 text-[13px] font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/25",
            inputClassName,
          )}
          aria-label="Prefijo telefónico"
        >
          {PHONE_PREFIX_OPTIONS.map((option) => (
            <option key={option.code} value={option.code}>
              {option.flag} {option.code}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
          ▾
        </span>
      </div>
      <input
        className={cn(
          "h-11 min-w-0 flex-1 rounded-[10px] border-transparent bg-[#eef2f8] px-3 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/25",
          inputClassName,
        )}
        value={phone}
        onChange={(event) => onPhoneChange(event.target.value)}
        placeholder={placeholder}
        inputMode="tel"
        aria-label={`Teléfono ${selected.label}`}
      />
    </div>
  );
}
