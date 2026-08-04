export const WIKI_STORAGE_KEY = "haisales-wiki-pages-v9";

/** Secciones que abren en Wiki con panel de Pendientes a la derecha */
export const WIKI_MURAL_SIDEBAR_SECTIONS = [
  "comercial",
  "administracion",
  "soporte-tecnico",
] as const;

export type WikiViewType = "gallery" | "kanban" | "table" | "todos" | "mural" | "blocks";

export type WikiDocBlockType = "paragraph" | "heading" | "todo" | "bullet" | "divider";

export type WikiDocBlock = {
  id: string;
  type: WikiDocBlockType;
  content: string;
  done?: boolean;
};

export function reorderList<T>(list: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return list;
  if (fromIndex >= list.length || toIndex >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

export type WikiGalleryItem = {
  id: string;
  title: string;
  icon: string;
  updatedAt: string;
  coverGradient: string;
  coverLabel?: string;
  tagLabel: string;
  tagClassName: string;
};

export type WikiCardKind = "note" | "shape" | "text";

export type WikiShapeType = "square" | "circle" | "triangle" | "polygon";

export type WikiKanbanCard = {
  id: string;
  /** Título flotante (tooltip al hover) */
  title: string;
  /** Contenido único de la tarjeta */
  note?: string;
  /** Tipo de bloque en el lienzo (nota por defecto) */
  kind?: WikiCardKind;
  /** Forma geométrica cuando kind === "shape" */
  shape?: WikiShapeType;
  /** Color de relleno (formas) */
  fill?: string;
  /** Color de borde (formas) */
  stroke?: string;
  /** Grosor del borde en px (formas) */
  strokeWidth?: number;
  /** Ancho de la tarjeta en px (el texto no se escala) */
  width?: number;
  /** Alto mínimo de la tarjeta en px */
  height?: number;
  /** Posición libre en el lienzo (px) */
  x?: number;
  y?: number;
  /** Orden de apilado (mayor = al frente) */
  z?: number;
  /** Bloquea arrastre de la tarjeta */
  locked?: boolean;
  /**
   * Si es true, la tarjeta es independiente del bloque/columna:
   * no se mueve ni se elimina junto con la columna.
   */
  independent?: boolean;
  /** @deprecated migrado a width */
  scale?: number;
};

/** Ancla de conexión en una forma (esquinas / lados) */
export type WikiConnectorAnchor =
  | "tl"
  | "tr"
  | "bl"
  | "br"
  | "tm"
  | "bm"
  | "ml"
  | "mr";

/** Conector / flecha entre dos tarjetas o formas del lienzo */
export type WikiConnector = {
  id: string;
  fromCardId: string;
  toCardId: string;
  /** Ancla de origen (esquina o lado) */
  fromAnchor?: WikiConnectorAnchor;
  /** Ancla de destino (esquina o lado) */
  toAnchor?: WikiConnectorAnchor;
  /** Flecha con punta (default) o línea simple */
  kind?: "arrow" | "line";
};

export type WikiKanbanColumn = {
  id: string;
  title: string;
  color: string;
  /** Etiqueta editable junto al conteo (ej. "tarjetas") */
  countLabel?: string;
  /** Posición libre del bloque general en el lienzo (px) */
  x?: number;
  y?: number;
  /** Orden de apilado del bloque general */
  z?: number;
  /**
   * Contenedor invisible: solo guarda tarjetas libres del lienzo.
   * No se pinta el bloque blanco (evita que “Lienzo” reaparezca al borrar).
   */
  hideShell?: boolean;
  /** Conectores del tablero (suelen vivir en la columna host) */
  connectors?: WikiConnector[];
  cards: WikiKanbanCard[];
};

export type WikiTodoItem = {
  id: string;
  title: string;
  done: boolean;
  reminderAt?: string;
};

export type WikiLinkItem = {
  id: string;
  title: string;
  url: string;
};

export type WikiMuralBlockType = "note" | "link" | "todo" | "table" | "image";

export type WikiMuralBlock = {
  id: string;
  type: WikiMuralBlockType;
  content: string;
  url?: string;
  done?: boolean;
  table?: { columns: string[]; rows: string[][] };
  x: number;
  y: number;
  w?: number;
};

export type WikiMuralColumn = {
  id: string;
  title: string;
  blocks: WikiMuralBlock[];
};

export type WikiPage = {
  id: string;
  sectionId: string;
  title: string;
  icon: string;
  viewType: WikiViewType;
  updatedAt: string;
  coverGradient: string;
  tagLabel: string;
  tagClassName: string;
  galleryCards: WikiGalleryItem[];
  kanbanColumns: WikiKanbanColumn[];
  table: { columns: string[]; rows: string[][] };
  todos: WikiTodoItem[];
  links: WikiLinkItem[];
  muralColumns: WikiMuralColumn[];
  blocks: WikiDocBlock[];
};

export function createWikiId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function createEmptyDocBlock(type: WikiDocBlockType = "paragraph"): WikiDocBlock {
  const id = createWikiId("dblock");
  if (type === "heading") {
    return { id, type, content: "Título de sección" };
  }
  if (type === "todo") {
    return { id, type, content: "Pendiente", done: false };
  }
  if (type === "bullet") {
    return { id, type, content: "Elemento de lista" };
  }
  if (type === "divider") {
    return { id, type, content: "" };
  }
  return { id, type: "paragraph", content: "Escribe aquí… Usa *negrita* y emojis 👋" };
}

export function createEmptyMuralBlock(
  type: WikiMuralBlockType,
  position?: { x?: number; y?: number },
): WikiMuralBlock {
  const id = createWikiId("mblock");
  const x = position?.x ?? 24 + Math.round(Math.random() * 40);
  const y = position?.y ?? 24 + Math.round(Math.random() * 40);
  if (type === "link") {
    return { id, type, content: "Nuevo enlace", url: "https://", x, y, w: 260 };
  }
  if (type === "todo") {
    return { id, type, content: "Nuevo pendiente", done: false, x, y, w: 260 };
  }
  if (type === "image") {
    return { id, type, content: "Imagen", url: "", x, y, w: 280 };
  }
  if (type === "table") {
    return {
      id,
      type,
      content: "Tabla",
      table: {
        columns: ["Campo", "Valor"],
        rows: [["", ""]],
      },
      x,
      y,
      w: 300,
    };
  }
  return {
    id,
    type: "note",
    content: "👋 *Nueva nota*\nEscribe aquí con formato WhatsApp",
    x,
    y,
    w: 280,
  };
}

export type WikiNavSection = {
  id: string;
  title: string;
  items: { id: string; label: string; icon: string }[];
};

const GRADIENTS = [
  "from-slate-800 via-slate-700 to-amber-600",
  "from-indigo-900 via-slate-800 to-cyan-700",
  "from-sky-400 via-blue-500 to-indigo-600",
  "from-rose-400 via-orange-400 to-amber-300",
  "from-emerald-600 via-teal-500 to-cyan-400",
  "from-orange-500 via-amber-400 to-yellow-300",
  "from-fuchsia-500 via-pink-400 to-rose-300",
  "from-teal-700 via-emerald-600 to-lime-400",
  "from-violet-600 via-purple-500 to-fuchsia-400",
  "from-blue-700 via-sky-500 to-cyan-300",
];

function nowLabel() {
  return new Date().toLocaleString("es-PE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function emptyPageContent(title: string, icon: string, gradient: string, tagLabel: string, tagClassName: string) {
  return {
    galleryCards: [
      {
        id: createWikiId("card"),
        title,
        icon,
        updatedAt: nowLabel(),
        coverGradient: gradient,
        tagLabel,
        tagClassName,
      },
    ] as WikiGalleryItem[],
    kanbanColumns: [
      {
        id: createWikiId("col"),
        title: "Por hacer",
        color: "border-t-slate-400",
        countLabel: "tarjetas",
        cards: [
          {
            id: createWikiId("kcard"),
            title: `Empezar ${title}`,
            note: "👋 Nota editable con emojis WhatsApp",
          },
        ],
      },
      {
        id: createWikiId("col"),
        title: "En proceso",
        color: "border-t-violet-500",
        cards: [],
      },
      {
        id: createWikiId("col"),
        title: "Hecho",
        color: "border-t-emerald-500",
        countLabel: "tarjetas",
        cards: [],
      },
    ] as WikiKanbanColumn[],
    table: {
      columns: ["Nombre", "Responsable", "Estado", "Fecha"],
      rows: [
        [title, "Sin asignar", "Activo", nowLabel()],
      ],
    },
    todos: [
      {
        id: createWikiId("todo"),
        title: `Revisar ${title}`,
        done: false,
        reminderAt: "",
      },
    ] as WikiTodoItem[],
    links: [] as WikiLinkItem[],
    muralColumns: [
      {
        id: createWikiId("mcol"),
        title: "Canvas",
        blocks: [
          {
            id: createWikiId("mblock"),
            type: "note" as const,
            content: `👋 *${title}*\nEscribe mensajes con emojis WhatsApp aquí`,
            x: 40,
            y: 40,
            w: 280,
          },
        ],
      },
    ] as WikiMuralColumn[],
    blocks: [
      { id: createWikiId("dblock"), type: "heading" as const, content: title },
      {
        id: createWikiId("dblock"),
        type: "paragraph" as const,
        content: `Documento de *${title}*. Arrastra los bloques con ⠿ para reordenarlos.`,
      },
      {
        id: createWikiId("dblock"),
        type: "todo" as const,
        content: "Completar esta sección",
        done: false,
      },
      { id: createWikiId("dblock"), type: "bullet" as const, content: "Primer punto clave" },
      { id: createWikiId("dblock"), type: "bullet" as const, content: "Segundo punto clave" },
    ] as WikiDocBlock[],
  };
}

type SeedDef = {
  id: string;
  sectionId: string;
  title: string;
  icon: string;
  tagLabel: string;
  tagClassName: string;
  viewType?: WikiViewType;
};

const SEED_DEFS: SeedDef[] = [
  {
    id: "wiki-empresa-docs",
    sectionId: "general",
    title: "Empresa y Documentos",
    icon: "🏢",
    tagLabel: "General",
    tagClassName: "bg-slate-100 text-slate-700",
    viewType: "kanban",
  },
  {
    id: "wiki-organigrama",
    sectionId: "general",
    title: "Organigrama y Funciones",
    icon: "👥",
    tagLabel: "General",
    tagClassName: "bg-slate-100 text-slate-700",
    viewType: "kanban",
  },
  {
    id: "wiki-tareas",
    sectionId: "general",
    title: "Tareas",
    icon: "📄",
    tagLabel: "General",
    tagClassName: "bg-slate-100 text-slate-700",
    viewType: "kanban",
  },
  {
    id: "wiki-ventas",
    sectionId: "comercial",
    title: "Ventas",
    icon: "💼",
    tagLabel: "Comercial",
    tagClassName: "bg-emerald-100 text-emerald-700",
    viewType: "kanban",
  },
  {
    id: "wiki-marketing",
    sectionId: "comercial",
    title: "Marketing",
    icon: "📢",
    tagLabel: "Comercial",
    tagClassName: "bg-emerald-100 text-emerald-700",
    viewType: "kanban",
  },
  {
    id: "wiki-alquiler",
    sectionId: "comercial",
    title: "Alquiler",
    icon: "🖨️",
    tagLabel: "Comercial",
    tagClassName: "bg-emerald-100 text-emerald-700",
    viewType: "kanban",
  },
  {
    id: "wiki-planes-mantenimiento",
    sectionId: "comercial",
    title: "Planes de Mantenimiento",
    icon: "🛠️",
    tagLabel: "Comercial",
    tagClassName: "bg-emerald-100 text-emerald-700",
    viewType: "kanban",
  },
  {
    id: "wiki-logistica",
    sectionId: "administracion",
    title: "Logística y Almacén",
    icon: "📦",
    tagLabel: "Administración",
    tagClassName: "bg-violet-100 text-violet-700",
    viewType: "kanban",
  },
  {
    id: "wiki-contabilidad",
    sectionId: "administracion",
    title: "Contabilidad",
    icon: "💰",
    tagLabel: "Administración",
    tagClassName: "bg-violet-100 text-violet-700",
    viewType: "kanban",
  },
  {
    id: "wiki-soporte-tickets",
    sectionId: "soporte-tecnico",
    title: "Tickets y Soporte",
    icon: "💻",
    tagLabel: "Soporte Técnico",
    tagClassName: "bg-blue-100 text-blue-800",
    viewType: "kanban",
  },
  {
    id: "wiki-soporte-manuales",
    sectionId: "soporte-tecnico",
    title: "Manuales técnicos",
    icon: "📚",
    tagLabel: "Soporte Técnico",
    tagClassName: "bg-blue-100 text-blue-800",
    viewType: "kanban",
  },
];

export const wikiNavSections: WikiNavSection[] = [
  {
    id: "general",
    title: "General",
    items: SEED_DEFS.filter((d) => d.sectionId === "general").map((d) => ({
      id: d.id,
      label: d.title,
      icon: d.icon,
    })),
  },
  {
    id: "comercial",
    title: "Comercial",
    items: SEED_DEFS.filter((d) => d.sectionId === "comercial").map((d) => ({
      id: d.id,
      label: d.title,
      icon: d.icon,
    })),
  },
  {
    id: "administracion",
    title: "Administración",
    items: SEED_DEFS.filter((d) => d.sectionId === "administracion").map((d) => ({
      id: d.id,
      label: d.title,
      icon: d.icon,
    })),
  },
  {
    id: "soporte-tecnico",
    title: "Soporte Técnico",
    items: SEED_DEFS.filter((d) => d.sectionId === "soporte-tecnico").map((d) => ({
      id: d.id,
      label: d.title,
      icon: d.icon,
    })),
  },
];

export function createMockupKanbanBoard(): WikiKanbanColumn[] {
  const col = (title: string, cards: Array<{ title: string; note: string }>): WikiKanbanColumn => ({
    id: createWikiId("col"),
    title,
    color: "border-t-slate-300",
    countLabel: "tarjetas",
    cards: cards.map((card) => ({
      id: createWikiId("kcard"),
      title: card.title,
      note: card.note,
    })),
  });

  return [
    col("Ventas", [
      {
        title: "Saludo comercial",
        note: [
          "¡Buenos dias! 👏 Soy *Nicolas Aliaga* 🙋‍♂️, Asesor Comercial de *NBN Tecnologia Total SAC*, distribuidor autorizado de *RICOH DEL PERU* tengo el producto solicitado en stock",
        ].join("\n"),
      },
      {
        title: "Presentación WhatsApp",
        note: [
          "👋 Hola, soy *Nicolas Aliaga*",
          "Asesor Comercial — *NBN Tecnologia Total SAC*",
          "",
          "✅ Distribuidor autorizado *RICOH DEL PERU*",
          "✅ Cotizaciones y stock al instante",
          "",
          "📱 Escríbeme por WhatsApp para ayudarte",
        ].join("\n"),
      },
    ]),
    col("Productos", [
      {
        title: "RICOH IM 430F",
        note: [
          "🖨️ *NUEVA RICOH IM 430F (A4)* — *$989 o S/ 4000*",
          "",
          "✅ Copia, Imprime, Escanea",
          "✅ Pantalla Tablet Android",
          "✅ Dúplex automático",
          "✅ Red / WiFi",
          "",
          "🎁 Toner de inicio incluido",
          "📌 Precio especial por contado",
        ].join("\n"),
      },
      {
        title: "RICOH IM C3000",
        note: [
          "🖨️ *NUEVA RICOH IM C3000* — *$3,890 o S/ 14,450*",
          "",
          "✅ Color A3",
          "✅ Escáner + Finisher",
          "✅ 30 ppm",
          "",
          "🎁 Toner de inicio",
          "📌 Incluye instalación",
        ].join("\n"),
      },
    ]),
    col("Equipos", [
      {
        title: "Laptop DELL i3",
        note: [
          "💻 *NUEVA LAPTOP DELL i3 11va Gen*",
          "",
          "✅ RAM 8 GB / SSD M.2 256 GB",
          "✅ Pantalla 15.6\" FHD",
          "✅ Garantía 12 meses",
          "",
          "🎁 Programas incluidos",
          "💰 *$580 o S/ 2,150*",
        ].join("\n"),
      },
      {
        title: "PC Escritorio i5",
        note: [
          "💻 *PC ESCRITORIO i5*",
          "",
          "✅ RAM 16 GB / SSD 512 GB",
          "✅ Ideal oficina / diseño",
          "",
          "🎁 Suite oficina incluida",
          "💰 *$720 o S/ 2,680*",
        ].join("\n"),
      },
    ]),
    col("Envíos", [
      {
        title: "Envío 20/10/2022",
        note: [
          "📅 *20/10/2022*",
          "",
          "📦 *Datos de Envío:*",
          "Razón Social: Cliente Demo SAC",
          "Ruc: 20123456789",
          "Dirección: Av. Javier Prado 1234",
          "Destino: Lima",
          "Agencia: Olva Courier",
          "",
          "📕 *Pedido:*",
          "RICOH IM 430F × 1",
          "",
          "Total *$149* (TC 3.859) = Soles *S/ 575*",
        ].join("\n"),
      },
      {
        title: "Envío provincia",
        note: [
          "📅 *Despacho a provincia*",
          "",
          "📦 *Datos de Envío:*",
          "Razón Social: Negocios Sur EIRL",
          "Destino: Arequipa",
          "Agencia: Shalom",
          "",
          "📕 *Pedido:* #HS-1058",
          "Total *$210* = Soles *S/ 810*",
        ].join("\n"),
      },
    ]),
  ];
}

/** @deprecated alias */
function createVentasMockupKanban(): WikiKanbanColumn[] {
  return createMockupKanbanBoard();
}

export const WIKI_HOME_BOARD_KEY = "haisales-wiki-home-board-v1";

export function loadHomeBoard(): WikiKanbanColumn[] {
  if (typeof window === "undefined") return createMockupKanbanBoard();
  try {
    const raw = localStorage.getItem(WIKI_HOME_BOARD_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw) as WikiKanbanColumn[];
      // [] es válido: el usuario vació el lienzo (no restaurar el mockup)
      if (Array.isArray(parsed)) {
        return parsed.map((column) => ({
          ...column,
          id: column.id || createWikiId("col"),
          title: column.title || "Columna",
          color: column.color || "border-t-slate-300",
          countLabel: column.countLabel?.trim() ? column.countLabel : "tarjetas",
          cards: Array.isArray(column.cards) ? column.cards : [],
        }));
      }
    }
    return createMockupKanbanBoard();
  } catch {
    return createMockupKanbanBoard();
  }
}

export function saveHomeBoard(columns: WikiKanbanColumn[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(WIKI_HOME_BOARD_KEY, JSON.stringify(columns));
}

export function createSeedWikiPages(): WikiPage[] {
  return SEED_DEFS.map((def, index) => {
    const gradient = GRADIENTS[index % GRADIENTS.length];
    const content = emptyPageContent(def.title, def.icon, gradient, def.tagLabel, def.tagClassName);
    if (def.id === "wiki-ventas") {
      content.kanbanColumns = createVentasMockupKanban();
    }
    return {
      id: def.id,
      sectionId: def.sectionId,
      title: def.title,
      icon: def.icon,
      viewType: def.viewType ?? "kanban",
      updatedAt: nowLabel(),
      coverGradient: gradient,
      tagLabel: def.tagLabel,
      tagClassName: def.tagClassName,
      ...content,
    };
  });
}

export function createWikiPage(input: {
  sectionId: string;
  title: string;
  icon?: string;
}): WikiPage {
  const icon = input.icon ?? "📄";
  const section = wikiNavSections.find((s) => s.id === input.sectionId);
  const tagLabel = section?.title ?? "General";
  const tagClassName =
    input.sectionId === "comercial"
      ? "bg-emerald-100 text-emerald-700"
      : input.sectionId === "administracion"
        ? "bg-violet-100 text-violet-700"
        : input.sectionId === "soporte-tecnico"
          ? "bg-blue-100 text-blue-800"
          : "bg-slate-100 text-slate-700";
  const gradient = GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)];
  const content = emptyPageContent(input.title, icon, gradient, tagLabel, tagClassName);

  return {
    id: createWikiId("wiki"),
    sectionId: input.sectionId,
    title: input.title.trim() || "Nueva página",
    icon,
    viewType: "kanban",
    updatedAt: nowLabel(),
    coverGradient: gradient,
    tagLabel,
    tagClassName,
    ...content,
  };
}

function normalizeMuralBlock(block: WikiMuralBlock, index: number): WikiMuralBlock {
  return {
    ...block,
    x: typeof block.x === "number" ? block.x : 24 + (index % 3) * 300,
    y: typeof block.y === "number" ? block.y : 24 + Math.floor(index / 3) * 200,
    w: typeof block.w === "number" ? block.w : 280,
  };
}

function normalizePage(page: WikiPage): WikiPage {
  const validViews: WikiViewType[] = ["gallery", "kanban", "table", "todos", "mural", "blocks"];
  const muralColumns = Array.isArray(page.muralColumns)
    ? page.muralColumns.map((column) => ({
        ...column,
        blocks: column.blocks.map((block, index) => normalizeMuralBlock(block, index)),
      }))
    : [
        {
          id: createWikiId("mcol"),
          title: "Canvas",
          blocks: [createEmptyMuralBlock("note", { x: 40, y: 40 })],
        },
      ];
  const kanbanColumns = Array.isArray(page.kanbanColumns)
    ? page.kanbanColumns.map((column) => ({
        ...column,
        countLabel: column.countLabel?.trim() ? column.countLabel : "tarjetas",
        cards: Array.isArray(column.cards) ? column.cards : [],
      }))
    : page.kanbanColumns;

  return {
    ...page,
    muralColumns,
    kanbanColumns,
    blocks: Array.isArray(page.blocks) && page.blocks.length > 0
      ? page.blocks
      : [
          createEmptyDocBlock("heading"),
          createEmptyDocBlock("paragraph"),
        ],
    viewType: validViews.includes(page.viewType) ? page.viewType : "kanban",
  };
}

export function loadWikiPages(): WikiPage[] {
  if (typeof window === "undefined") return createSeedWikiPages();
  try {
    const raw = localStorage.getItem(WIKI_STORAGE_KEY);
    if (!raw) return createSeedWikiPages();
    const parsed = JSON.parse(raw) as WikiPage[];
    if (!Array.isArray(parsed) || parsed.length === 0) return createSeedWikiPages();
    return parsed.map(normalizePage);
  } catch {
    return createSeedWikiPages();
  }
}

export function saveWikiPages(pages: WikiPage[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(WIKI_STORAGE_KEY, JSON.stringify(pages));
}

export const WIKI_HOME_CARDS_KEY = "haisales-wiki-home-cards-v2";
/** @deprecated migrado a content único por tarjeta */
export const WIKI_HOME_CARDS_V1_KEY = "haisales-wiki-home-cards-v1";

/** @deprecated migrado a WikiHomeCard[] */
export const WIKI_HOME_COLUMNS_KEY = "haisales-wiki-home-columns-v1";

export type WikiHomeCard = {
  id: string;
  /** Etiqueta corta encima del título (ej. "Tarjeta") */
  label: string;
  title: string;
  /** Un solo bloque de texto por tarjeta */
  content: string;
};

/** Compat: 3 columnas fijas antiguas */
export type WikiHomeColumns = [WikiDocBlock[], WikiDocBlock[], WikiDocBlock[]];

export function blocksToHomeContent(blocks: WikiDocBlock[]): string {
  return blocks
    .map((block) => {
      if (block.type === "divider") return "---";
      if (block.type === "heading") return block.content.trim();
      if (block.type === "bullet") return `• ${block.content.trim()}`;
      if (block.type === "todo") {
        return `${block.done ? "☑" : "☐"} ${block.content.trim()}`;
      }
      return block.content.trim();
    })
    .filter(Boolean)
    .join("\n");
}

export function createHomeCard(
  title = "Nueva tarjeta",
  content = "",
  label = "Tarjeta",
): WikiHomeCard {
  return {
    id: createWikiId("hcard"),
    label,
    title,
    content,
  };
}

export function createSeedHomeCards(): WikiHomeCard[] {
  return [
    {
      id: createWikiId("hcard"),
      label: "Tarjeta",
      title: "Empresa y documentos",
      content: [
        "Información general, políticas y archivos clave de la empresa.",
        "",
        "• Razón social y datos fiscales",
        "• Contratos y documentos legales",
        "☐ Actualizar carpeta de documentos",
      ].join("\n"),
    },
    {
      id: createWikiId("hcard"),
      label: "Tarjeta",
      title: "Equipo y organización",
      content: [
        "Roles, organigrama y responsabilidades del equipo.",
        "",
        "• Organigrama y funciones",
        "• Contactos por área",
        "☐ Revisar cargos y responsables",
      ].join("\n"),
    },
    {
      id: createWikiId("hcard"),
      label: "Tarjeta",
      title: "Anuncios e ideas",
      content: [
        "Comunicados internos, ideas del equipo y novedades.",
        "",
        "• Aviso de la semana",
        "• Ideas de mejora",
        "☐ Publicar comunicado interno",
      ].join("\n"),
    },
  ];
}

function normalizeHomeCard(card: Partial<WikiHomeCard> & { blocks?: WikiDocBlock[] }): WikiHomeCard {
  const fromBlocks =
    typeof card.content === "string"
      ? card.content
      : Array.isArray(card.blocks)
        ? blocksToHomeContent(card.blocks)
        : "";

  return {
    id: card.id || createWikiId("hcard"),
    label: card.label?.trim() ? card.label : "Tarjeta",
    title: card.title || "Sin título",
    content: fromBlocks,
  };
}

function migrateColumnsToCards(columns: WikiDocBlock[][]): WikiHomeCard[] {
  const titles = ["Empresa y documentos", "Equipo y organización", "Anuncios e ideas"];
  return columns.slice(0, 3).map((blocks, index) => ({
    id: createWikiId("hcard"),
    label: "Tarjeta",
    title: titles[index] ?? `Tarjeta ${index + 1}`,
    content: blocksToHomeContent(Array.isArray(blocks) ? blocks : []),
  }));
}

export function loadHomeCards(): WikiHomeCard[] {
  if (typeof window === "undefined") return createSeedHomeCards();
  try {
    const rawCards = localStorage.getItem(WIKI_HOME_CARDS_KEY);
    if (rawCards) {
      const parsed = JSON.parse(rawCards) as Array<Partial<WikiHomeCard> & { blocks?: WikiDocBlock[] }>;
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(normalizeHomeCard);
      }
    }

    const rawV1 = localStorage.getItem(WIKI_HOME_CARDS_V1_KEY);
    if (rawV1) {
      const parsed = JSON.parse(rawV1) as Array<Partial<WikiHomeCard> & { blocks?: WikiDocBlock[] }>;
      if (Array.isArray(parsed) && parsed.length > 0) {
        const cards = parsed.map(normalizeHomeCard);
        localStorage.setItem(WIKI_HOME_CARDS_KEY, JSON.stringify(cards));
        return cards;
      }
    }

    const rawColumns = localStorage.getItem(WIKI_HOME_COLUMNS_KEY);
    if (rawColumns) {
      const parsed = JSON.parse(rawColumns) as WikiDocBlock[][];
      if (Array.isArray(parsed) && parsed.length > 0) {
        const cards = migrateColumnsToCards(parsed);
        localStorage.setItem(WIKI_HOME_CARDS_KEY, JSON.stringify(cards));
        return cards;
      }
    }

    return createSeedHomeCards();
  } catch {
    return createSeedHomeCards();
  }
}

export function saveHomeCards(cards: WikiHomeCard[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(WIKI_HOME_CARDS_KEY, JSON.stringify(cards));
}

/** @deprecated usar loadHomeCards / saveHomeCards */
export function loadHomeColumns(): WikiHomeColumns {
  const cards = loadHomeCards();
  return [
    cards[0] ? [createEmptyDocBlock("paragraph")] : [],
    cards[1] ? [createEmptyDocBlock("paragraph")] : [],
    cards[2] ? [createEmptyDocBlock("paragraph")] : [],
  ];
}

/** @deprecated usar saveHomeCards */
export function saveHomeColumns(columns: WikiHomeColumns) {
  saveHomeCards(migrateColumnsToCards(columns));
}

export function pagesToGalleryCards(pages: WikiPage[]) {
  return pages.map((page) => ({
    id: page.id,
    title: page.title,
    icon: page.icon,
    updatedAt: page.updatedAt,
    coverGradient: page.coverGradient,
    coverLabel: undefined as string | undefined,
    tags: [{ label: page.tagLabel, className: page.tagClassName }],
    section: page.sectionId,
  }));
}
