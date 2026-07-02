import type { ReactNode } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";

type AppRightPanelSlotProps = {
  panelHidden: boolean;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  children: ReactNode;
};

export function AppRightPanelSlot({
  panelHidden,
  mobileOpen,
  onMobileOpenChange,
  children,
}: AppRightPanelSlotProps) {
  return (
    <>
      {!panelHidden && <div className="hidden shrink-0 xl:block">{children}</div>}
      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent side="right" className="w-[min(100vw,300px)] p-0 xl:hidden">
          <div className="h-full overflow-y-auto">{children}</div>
        </SheetContent>
      </Sheet>
    </>
  );
}
