export type SidebarNotification = {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
};

export const sidebarNotificationsMock: SidebarNotification[] = [
  {
    id: "1",
    title: "Venta registrada",
    description: "Boleta B001-00241 emitida correctamente.",
    time: "Hace 12 min",
    read: false,
  },
  {
    id: "2",
    title: "Stock bajo",
    description: "Toner HP 85A por debajo del mínimo.",
    time: "Hace 1 h",
    read: false,
  },
  {
    id: "3",
    title: "Cliente actualizado",
    description: "Se guardaron los datos de MCC IT Solutions.",
    time: "Ayer",
    read: true,
  },
];
