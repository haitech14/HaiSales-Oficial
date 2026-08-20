import { MessageSquare, Target } from "lucide-react";
import { ModuleIconFilterBar } from "@/components/app/module-shell/ModuleIconFilterBar";

type CrmView = "pipeline" | "conversaciones";

type CrmViewBarProps = {
  activeView: CrmView;
  onViewChange: (view: CrmView) => void;
  className?: string;
};

const CRM_VIEWS = [
  { id: "pipeline", label: "Pipeline", Icon: Target },
  { id: "conversaciones", label: "Conversaciones", Icon: MessageSquare },
] as const;

export function CrmViewBar({ activeView, onViewChange, className }: CrmViewBarProps) {
  return (
    <ModuleIconFilterBar
      items={[...CRM_VIEWS]}
      activeId={activeView}
      onChange={(id) => onViewChange(id as CrmView)}
      activeClassName="bg-[#7e57c2]"
      className={className}
    />
  );
}
