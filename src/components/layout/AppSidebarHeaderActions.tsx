import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  Building2,
  CalendarClock,
  CircleHelp,
  LockKeyhole,
  LogOut,
  UserCog,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { sidebarNotificationsMock } from "@/lib/sidebar-notifications-mock";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type AppSidebarHeaderActionsProps = {
  className?: string;
  iconClassName?: string;
  onNavigate?: () => void;
};

export function AppSidebarHeaderActions({
  className,
  iconClassName = "h-[18px] w-[18px]",
  onNavigate,
}: AppSidebarHeaderActionsProps) {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { displayName, avatarUrl, email, initials } = useUserProfile();
  const [notifications, setNotifications] = useState(sidebarNotificationsMock);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications],
  );

  const iconButtonClass =
    "relative inline-flex h-8 w-8 items-center justify-center rounded-full text-white/85 outline-none transition hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/40 data-[state=open]:bg-white/15 data-[state=open]:text-white";

  const markAllRead = () => {
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
  };

  const handleSignOut = async () => {
    onNavigate?.();
    await signOut();
    navigate("/login");
  };

  const handleChangePassword = () => {
    onNavigate?.();
    if (email) {
      toast.info("Próximamente: enlace de recuperación de contraseña por correo.");
      return;
    }
    toast.info("Próximamente: cambio de contraseña");
  };

  const profileMenuItemClass =
    "cursor-pointer gap-3 rounded-none px-4 py-2.5 text-sm text-slate-700 focus:bg-slate-50 focus:text-slate-900";

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      <Link
        to="/app/anuncios"
        onClick={onNavigate}
        title="Ayuda"
        className={iconButtonClass}
      >
        <CircleHelp className={iconClassName} strokeWidth={1.75} />
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className={iconButtonClass} aria-label="Notificaciones">
            <Bell className={iconClassName} strokeWidth={1.75} />
            {unreadCount > 0 ? (
              <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white ring-2 ring-[#1845ad]">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            ) : null}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 border-slate-200 p-0">
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2.5">
            <DropdownMenuLabel className="p-0 text-sm font-semibold text-slate-900">
              Notificaciones
            </DropdownMenuLabel>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                Marcar leídas
              </button>
            ) : null}
          </div>
          <div className="max-h-72 overflow-y-auto py-1">
            {notifications.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-slate-500">
                No tienes notificaciones.
              </p>
            ) : (
              notifications.map((item) => (
                <DropdownMenuItem
                  key={item.id}
                  className="flex cursor-default flex-col items-start gap-0.5 rounded-none px-3 py-2.5 focus:bg-slate-50"
                  onSelect={() => {
                    setNotifications((current) =>
                      current.map((row) => (row.id === item.id ? { ...row, read: true } : row)),
                    );
                  }}
                >
                  <div className="flex w-full items-start justify-between gap-2">
                    <span
                      className={cn(
                        "text-sm text-slate-800",
                        item.read ? "font-medium" : "font-semibold",
                      )}
                    >
                      {item.title}
                    </span>
                    {!item.read ? (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                    ) : null}
                  </div>
                  <span className="text-xs leading-snug text-slate-500">{item.description}</span>
                  <span className="text-[11px] text-slate-400">{item.time}</span>
                </DropdownMenuItem>
              ))
            )}
          </div>
          <DropdownMenuSeparator className="m-0" />
          <DropdownMenuItem asChild className="justify-center py-2.5 text-center text-sm font-medium text-blue-600">
            <Link to="/app/anuncios" onClick={onNavigate}>
              Ver mural de avisos
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              iconButtonClass,
              "overflow-hidden p-0 ring-2 ring-white/25 hover:ring-white/45 data-[state=open]:ring-white/55",
            )}
            aria-label="Menú de perfil"
          >
            <Avatar className="h-8 w-8">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
              <AvatarFallback className="bg-white/15 text-[10px] font-semibold text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={8}
          className="w-[min(100vw-2rem,300px)] overflow-hidden rounded-xl border border-slate-200 p-0 shadow-lg"
        >
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold leading-tight text-slate-800">
                {displayName}
              </p>
              {email ? (
                <p className="mt-0.5 truncate text-sm font-normal text-slate-500">{email}</p>
              ) : null}
            </div>
            <Avatar className="h-10 w-10 shrink-0 bg-slate-100">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
              <AvatarFallback className="bg-slate-100 text-xs font-semibold text-slate-500">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="py-1">
            <DropdownMenuItem asChild className={profileMenuItemClass}>
              <Link to="/app/parametros" onClick={onNavigate}>
                <UserCog className="h-[18px] w-[18px] shrink-0 text-slate-600" strokeWidth={1.75} />
                Administrar cuenta
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className={profileMenuItemClass}>
              <Link to="/checkout" onClick={onNavigate}>
                <CalendarClock className="h-[18px] w-[18px] shrink-0 text-slate-600" strokeWidth={1.75} />
                Plan / Licencia
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className={profileMenuItemClass}>
              <Link to="/app/parametros?accion=nueva-empresa" onClick={onNavigate}>
                <Building2 className="h-[18px] w-[18px] shrink-0 text-slate-600" strokeWidth={1.75} />
                Registrar nueva empresa
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className={profileMenuItemClass} onSelect={handleChangePassword}>
              <LockKeyhole className="h-[18px] w-[18px] shrink-0 text-slate-600" strokeWidth={1.75} />
              Cambiar contraseña
            </DropdownMenuItem>
          </div>

          <DropdownMenuSeparator className="m-0 bg-slate-100" />

          <div className="py-1">
            <DropdownMenuItem
              className="cursor-pointer gap-3 rounded-none px-4 py-2.5 text-sm text-[#e07a7a] focus:bg-red-50 focus:text-[#d65f5f]"
              onSelect={() => void handleSignOut()}
            >
              <LogOut className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
              Cerrar sesión
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
