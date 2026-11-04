import { z } from "zod";
import { entorno } from "@/config/entorno";

/**
 * Un error que se le puede mostrar a la persona tal cual.
 *
 * El backend escribe sus mensajes para el estudiante (formato único de
 * error: codigo, mensaje y, en validaciones, el campo). Los de red los
 * escribe la app.
 */
export class ErrorApi extends Error {
    constructor(
        readonly codigo: string,
        mensaje: string,
        readonly estado: number | null = null,
        readonly campo: string | null = null,
    ) {
        super(mensaje);
        this.name = "ErrorApi";
    }
}

const esquemaError = z.object({ codigo: z.string(), mensaje: z.string(), campo: z.string().nullish() });

type Metodo = "GET" | "POST" | "PUT" | "DELETE";

/*
 * El token vive en el contexto de sesión; aquí se guarda una copia para no
 * pasarlo en cada llamada. Cuando el backend dice que la sesión ya no vale
 * (venció, o la cuenta se desactivó) se avisa para volver a la entrada.
 */
let token: string | null = null;
let alVencerLaSesion: () => void = () => {};

export function usarToken(nuevo: string | null) {
    token = nuevo;
}

export function alPerderLaSesion(funcion: () => void) {
    alVencerLaSesion = funcion;
}

export async function pedir<T>(metodo: Metodo, ruta: string, esquema: z.ZodType<T>, cuerpo?: unknown): Promise<T> {
    const respuesta = await enviar(metodo, ruta, cuerpo);
    const datos: unknown = respuesta.status === 204 ? null : await respuesta.json().catch(() => null);
    const validado = esquema.safeParse(datos);
    if (!validado.success) {
        throw new ErrorApi("RESPUESTA_INESPERADA", "La cafetería respondió algo que la app no entiende. Actualiza la app e inténtalo de nuevo.");
    }
    return validado.data;
}

export const obtener = <T>(ruta: string, esquema: z.ZodType<T>) => pedir("GET", ruta, esquema);

/** Para lo que no devuelve nada (204): cancelar, marcar leídas. */
export async function ejecutar(metodo: Metodo, ruta: string, cuerpo?: unknown): Promise<void> {
    await enviar(metodo, ruta, cuerpo);
}

/**
 * Una imagen ya preparada (servicios/foto), como multipart en el campo "archivo".
 *
 * La fetch de Expo arma cada parte del multipart con su name, su type y lo
 * que devuelve bytes(). El objeto { uri, type, name } de React Native no le
 * sirve: lo rechaza antes de enviar.
 */
export async function subirImagen<T>(ruta: string, imagen: { bytes: Uint8Array; tipo: string; nombre: string }, esquema: z.ZodType<T>): Promise<T> {
    const formulario = new FormData();
    const parte = { name: imagen.nombre, type: imagen.tipo, bytes: () => Promise.resolve(imagen.bytes) };
    formulario.append("archivo", parte as unknown as Blob);
    const respuesta = await enviar("PUT", ruta, formulario, MILISEGUNDOS_PARA_SUBIR);
    const validado = esquema.safeParse(await respuesta.json().catch(() => null));
    if (!validado.success) {
        throw new ErrorApi("RESPUESTA_INESPERADA", "La cafetería respondió algo que la app no entiende. Actualiza la app e inténtalo de nuevo.");
    }
    return validado.data;
}

/** Una foto tarda más que una consulta, sobre todo con datos móviles o un Wi-Fi lento. */
const MILISEGUNDOS_PARA_SUBIR = 30_000;

async function enviar(metodo: Metodo, ruta: string, cuerpo?: unknown, limite: number = entorno.milisegundosTiempoLimite): Promise<Response> {
    const controlador = new AbortController();
    const temporizador = setTimeout(() => controlador.abort(), limite);

    let respuesta: Response;
    try {
        respuesta = await fetch(`${entorno.urlApi}${ruta}`, {
            method: metodo,
            signal: controlador.signal,
            headers: {
                Accept: "application/json",
                // Con FormData no se pone: el teléfono agrega el suyo, con el separador del multipart.
                ...(cuerpo === undefined || cuerpo instanceof FormData ? {} : { "Content-Type": "application/json" }),
                ...(token === null ? {} : { Authorization: `Bearer ${token}` }),
            },
            body: cuerpo === undefined ? undefined : cuerpo instanceof FormData ? cuerpo : JSON.stringify(cuerpo),
        });
    } catch (error) {
        // En desarrollo, el error de verdad a la consola de Metro: "sin conexión" también tapa errores de la propia app.
        if (__DEV__) {
            console.warn(`${metodo} ${ruta} falló antes de recibir respuesta:`, error);
        }
        if (error instanceof Error && error.name === "AbortError") {
            throw new ErrorApi("TIEMPO_AGOTADO", "La cafetería está tardando en responder. Revisa tu conexión e inténtalo otra vez.");
        }
        throw new ErrorApi(
            "SIN_CONEXION",
            "No se pudo conectar con la cafetería. Revisa que el servidor esté encendido y que estés en la misma red Wi-Fi.",
        );
    } finally {
        clearTimeout(temporizador);
    }

    if (respuesta.ok) {
        return respuesta;
    }

    const detalle = esquemaError.safeParse(await respuesta.json().catch(() => null));
    if (respuesta.status === 401 && token !== null) {
        alVencerLaSesion();
    }
    if (detalle.success) {
        throw new ErrorApi(detalle.data.codigo, detalle.data.mensaje, respuesta.status, detalle.data.campo ?? null);
    }
    throw new ErrorApi("ERROR_DEL_SERVIDOR", "Algo falló en la cafetería. Inténtalo en un momento.", respuesta.status);
}

/** El texto para mostrar de cualquier error, sea de la API o no. */
export function mensajeDe(error: unknown): string {
    return error instanceof ErrorApi ? error.message : "Algo salió mal. Inténtalo otra vez.";
}

/** Las fotos subidas desde el panel viven en el backend; las demás rutas no se pueden mostrar aquí. */
export function urlDeImagen(ruta: string | null): string | null {
    return ruta !== null && ruta.startsWith("/api/") ? `${entorno.urlApi}${ruta}` : null;
}
