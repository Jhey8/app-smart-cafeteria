import { z } from "zod";
import { obtener, pedir } from "./api";

/* PagoIniciadoRespuesta, ResultadoDelPagoRespuesta y ConfiguracionDePagosRespuesta en services/api. */

export type MetodoDePago = "YAPE" | "TARJETA" | "QR";

/**
 * Qué pasarela está activa: "SIMULADA" (la de prueba, sin dinero real) o
 * "MERCADOPAGO" (su página de pago, que la app abre dentro de la app).
 */
const esquemaConfiguracion = z.object({
    modo: z.string(),
    llavePublica: z.string().nullish(),
    medios: z.array(z.string()),
});

export type ConfiguracionDePagos = z.infer<typeof esquemaConfiguracion>;

const esquemaPagoIniciado = z.object({
    idPago: z.number(),
    metodo: z.string(),
    monto: z.number(),
    modo: z.string(),
    token: z.string().nullish(),
    llavePublica: z.string().nullish(),
    /** La página de pago de Mercado Pago. */
    urlDePago: z.string().nullish(),
    expiraEn: z.string().nullish(),
});

export type PagoIniciado = z.infer<typeof esquemaPagoIniciado>;

const esquemaResultado = z.object({
    aprobado: z.boolean(),
    mensaje: z.string().nullish(),
    /** PENDIENTE (todavía no pagó o en revisión), CONFIRMADO, RECHAZADO o EXPIRADO. */
    estado: z.string(),
});

export type ResultadoDelPago = z.infer<typeof esquemaResultado>;

/** Lo que se escribe en el formulario de prueba; cada medio usa sus campos. */
export interface DatosDePrueba {
    numeroTarjeta?: string;
    vencimiento?: string;
    cvv?: string;
    celular?: string;
    codigoYape?: string;
}

export const obtenerConfiguracionDePagos = () => obtener("/api/canal/pagos/configuracion", esquemaConfiguracion);

/** Abre el pago en la pasarela con el medio elegido. */
export const iniciarPago = (idPedido: number, metodo: MetodoDePago) =>
    pedir("POST", `/api/canal/pedidos/${idPedido}/pagos`, esquemaPagoIniciado, { metodo });

/**
 * Cómo va el pago. El backend le pregunta a la pasarela y, si se aprobó, el
 * pedido ya entró a la cola. Nada de lo que diga la app confirma un pago.
 */
export const verificarPago = (idPago: number) => pedir("POST", `/api/canal/pagos/${idPago}/verificacion`, esquemaResultado);

/** La pasarela de prueba: lo que haría Izipay al pulsar "Pagar". */
export const pagarEnModoDePrueba = (idPago: number, datos: DatosDePrueba) =>
    pedir("POST", `/api/canal/pagos/${idPago}/simulacion`, esquemaResultado, datos);
