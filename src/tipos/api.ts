import { z } from "zod";

/*
 * Lo que responde /api/canal. Se valida con zod igual que en el kiosco: si el
 * backend cambia un campo, la app avisa con un error claro en vez de pintar
 * "undefined" o romperse a mitad de un pedido.
 */

export const esquemaSesion = z.object({
    token: z.string().min(1),
    expiraEnSegundos: z.number(),
    codigo: z.string(),
    nombres: z.string(),
    apellidos: z.string(),
    tipo: z.enum(["ALUMNO", "DOCENTE", "ADMINISTRATIVO"]),
});

export type RespuestaDeSesion = z.infer<typeof esquemaSesion>;

export const TIPOS_DE_PREPARACION = ["AL_MOMENTO", "POR_LOTE", "REVENTA"] as const;

export const esquemaProducto = z.object({
    id: z.number().int().positive(),
    nombre: z.string().min(1),
    descripcion: z.string().nullable(),
    precio: z.number().nonnegative(),
    categoria: z.string().min(1),
    imagenUrl: z.string().min(1).nullable(),
    minutosPreparacion: z.number().int().nonnegative(),
    tipoPreparacion: z.enum(TIPOS_DE_PREPARACION),
    disponible: z.boolean(),
    /** Todas las fotos, la principal primero. Si el backend todavía no la manda, vacía. */
    imagenes: z.array(z.string()).default([]),
});

export type Producto = z.infer<typeof esquemaProducto>;

export const ESTADOS_DE_PEDIDO = ["RECIBIDO", "PAGADO", "PREPARANDO", "LISTO", "ENTREGADO", "CANCELADO"] as const;
export type EstadoDePedido = (typeof ESTADOS_DE_PEDIDO)[number];
const esquemaEstado = z.enum(ESTADOS_DE_PEDIDO);

export const esquemaPedidoCreado = z.object({
    idPedido: z.number(),
    total: z.number(),
    requiereCocina: z.boolean(),
    minutosEstimados: z.number().nullish(),
    listoEstimadoEn: z.string().nullish(),
});

export type PedidoCreado = z.infer<typeof esquemaPedidoCreado>;

/** El seguimiento: el número llega recién cuando el pago se confirma. */
export const esquemaEstadoDelPedido = z.object({
    idPedido: z.number(),
    numero: z.string().nullish(),
    estado: esquemaEstado,
    total: z.number(),
    requiereCocina: z.boolean(),
    minutosEstimados: z.number().nullish(),
    listoEstimadoEn: z.string().nullish(),
    pagadoEn: z.string().nullish(),
    listoEn: z.string().nullish(),
    items: z
        .array(z.object({ idProducto: z.number(), producto: z.string(), cantidad: z.number(), subtotal: z.number() }))
        .default([]),
    /** La boleta o factura, si ya salió (al pagar). */
    comprobante: z.object({ id: z.number(), tipo: z.string(), numero: z.string() }).nullish(),
    /** El secreto del QR de recojo. Solo llega mientras el pedido se puede recoger. */
    codigoRecojo: z.string().nullish(),
});

export type EstadoDelPedido = z.infer<typeof esquemaEstadoDelPedido>;

const esquemaRelacionado = z.object({ id: z.number(), tipo: z.string(), numero: z.string() });

/** ComprobanteRespuesta en services/api: lo que va en la representación impresa. */
export const esquemaComprobante = z.object({
    id: z.number(),
    tipo: z.enum(["BOLETA", "FACTURA", "NOTA_DE_CREDITO"]),
    nombreDelTipo: z.string(),
    numero: z.string(),
    fechaEmision: z.string(),
    emisor: z
        .object({ ruc: z.string(), razonSocial: z.string(), nombreComercial: z.string().nullish(), direccionFiscal: z.string() })
        .nullish(),
    receptor: z.object({
        tipoDocumento: z.string(),
        numeroDocumento: z.string().nullish(),
        nombre: z.string().nullish(),
        direccion: z.string().nullish(),
    }),
    valorVenta: z.number(),
    tasaIgv: z.number(),
    igv: z.number(),
    total: z.number(),
    montoEnLetras: z.string().nullish(),
    anula: esquemaRelacionado.nullish(),
    anuladoPor: esquemaRelacionado.nullish(),
    estadoSunat: z.string(),
    lineas: z.array(z.object({ descripcion: z.string(), cantidad: z.number(), importe: z.number() })).nullish(),
});

export type Comprobante = z.infer<typeof esquemaComprobante>;

export const esquemaCuenta = z.object({
    codigo: z.string(),
    tipo: z.enum(["ALUMNO", "DOCENTE", "ADMINISTRATIVO"]),
    nombres: z.string(),
    apellidos: z.string(),
    correo: z.string(),
    /** Con código UTP el correo es el institucional y no se cambia. */
    correoEditable: z.boolean(),
    telefono: z.string().nullish(),
    fotoUrl: z.string().nullish(),
    notificacionesPush: z.boolean(),
    /** Ley 29733: null en las cuentas de antes de los términos; la app se los pide. */
    terminosAceptadosEn: z.string().nullish(),
    creadoEn: z.string().nullish(),
});

export type Cuenta = z.infer<typeof esquemaCuenta>;

export const esquemaBandeja = z.object({
    noLeidas: z.number(),
    avisos: z.array(
        z.object({
            id: z.number(),
            tipo: z.enum(["PAGO_CONFIRMADO", "PEDIDO_LISTO", "PEDIDO_CANCELADO", "RECLAMACION_RESPONDIDA"]).or(z.string()),
            titulo: z.string(),
            cuerpo: z.string(),
            idPedido: z.number().nullish(),
            leida: z.boolean(),
            creadaEn: z.string(),
        }),
    ),
});

export type Bandeja = z.infer<typeof esquemaBandeja>;
export type Aviso = Bandeja["avisos"][number];

export const esquemaHorario = z.object({
    abierto: z.boolean(),
    apertura: z.string().nullish(),
    cierre: z.string().nullish(),
    mensaje: z.string().nullish(),
});

export type Horario = z.infer<typeof esquemaHorario>;

/** Una categoría del panel, para los cuadros de Inicio. */
export const esquemaCategoria = z.object({ id: z.number(), nombre: z.string(), icono: z.string().nullish(), orden: z.number() });
export type Categoria = z.infer<typeof esquemaCategoria>;

/** Quién es la cafetería: lo que los términos y la hoja de reclamación tienen que mostrar. */
export const esquemaEmpresa = z.object({
    configurada: z.boolean(),
    razonSocial: z.string().nullish(),
    nombreComercial: z.string().nullish(),
    ruc: z.string().nullish(),
    direccionFiscal: z.string().nullish(),
    telefonos: z.array(z.string()),
    correos: z.array(z.string()),
});

export type Empresa = z.infer<typeof esquemaEmpresa>;

export const esquemaReclamacion = z.object({
    id: z.number(),
    numero: z.string(),
    tipo: z.enum(["RECLAMO", "QUEJA"]),
    estado: z.enum(["PENDIENTE", "RESPONDIDO"]),
    idPedido: z.number().nullish(),
    nombres: z.string(),
    bien: z.enum(["PRODUCTO", "SERVICIO"]),
    monto: z.number().nullish(),
    descripcionBien: z.string(),
    detalle: z.string(),
    pedidoConsumidor: z.string(),
    respuesta: z.string().nullish(),
    respondidoEn: z.string().nullish(),
    creadoEn: z.string(),
    responderHasta: z.string(),
});

export type Reclamacion = z.infer<typeof esquemaReclamacion>;

export const esquemaPedidoDelHistorial = z.object({
    id: z.number(),
    numero: z.string().nullish(),
    estado: esquemaEstado,
    total: z.number(),
    creadoEn: z.string(),
    minutosEstimados: z.number().nullish(),
    listoEstimadoEn: z.string().nullish(),
    listoEn: z.string().nullish(),
    items: z.array(
        z.object({
            idProducto: z.number(),
            producto: z.string(),
            cantidad: z.number(),
            precioUnitario: z.number(),
            subtotal: z.number(),
            nota: z.string().nullish(),
        }),
    ),
});

export type PedidoDelHistorial = z.infer<typeof esquemaPedidoDelHistorial>;
