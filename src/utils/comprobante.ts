import * as almacen from "@/utils/almacen";

/** Lo que viaja al crear el pedido: boleta o factura, y a nombre de quién. */
export interface DatosDelComprobante {
    tipo: "BOLETA" | "FACTURA";
    tipoDocumento: "SIN_DOCUMENTO" | "DNI" | "RUC";
    numeroDocumento?: string;
    nombre?: string;
    direccion?: string;
}

export const BOLETA_SIN_DOCUMENTO: DatosDelComprobante = { tipo: "BOLETA", tipoDocumento: "SIN_DOCUMENTO" };

/** Desde este importe una boleta lleva el DNI (lo mismo que exige el backend). */
export const TOPE_DE_BOLETA_SIN_DOCUMENTO = 700;

/** Lo que falta para poder pedir con estos datos, o null si está completo. */
export function faltaEnElComprobante(datos: DatosDelComprobante, total: number): string | null {
    const numero = datos.numeroDocumento?.trim() ?? "";
    if (datos.tipo === "FACTURA") {
        if (numero.length !== 11) {
            return "El RUC tiene 11 dígitos.";
        }
        return (datos.nombre?.trim() ?? "") === "" ? "Escribe la razón social." : null;
    }
    if (datos.tipoDocumento === "DNI") {
        return numero.length === 8 ? null : "El DNI tiene 8 dígitos.";
    }
    return total > TOPE_DE_BOLETA_SIN_DOCUMENTO ? `Una boleta de más de S/ ${TOPE_DE_BOLETA_SIN_DOCUMENTO} lleva tu DNI.` : null;
}

/** Sin espacios de más ni campos vacíos. */
export function limpiarDatos(datos: DatosDelComprobante): DatosDelComprobante {
    const texto = (valor?: string) => {
        const limpio = valor?.trim().replace(/\s+/g, " ") ?? "";
        return limpio === "" ? undefined : limpio;
    };
    return {
        tipo: datos.tipo,
        tipoDocumento: datos.tipoDocumento,
        numeroDocumento: texto(datos.numeroDocumento),
        nombre: texto(datos.nombre),
        direccion: texto(datos.direccion),
    };
}

/*
 * Lo último que se usó, para no volver a escribir el RUC en cada pedido.
 * Vive solo en el teléfono (como la sesión) y se guarda recién cuando el
 * pedido se creó, es decir, cuando el backend ya lo aceptó.
 */
const CLAVE = "comprobante.preferido";

export async function comprobantePreferido(): Promise<DatosDelComprobante | null> {
    try {
        const guardado = await almacen.getItemAsync(CLAVE);
        if (guardado === null) {
            return null;
        }
        const datos = JSON.parse(guardado) as Partial<DatosDelComprobante>;
        return datos.tipo === "BOLETA" || datos.tipo === "FACTURA" ? (datos as DatosDelComprobante) : null;
    } catch {
        return null;
    }
}

export async function recordarComprobante(datos: DatosDelComprobante): Promise<void> {
    try {
        await almacen.setItemAsync(CLAVE, JSON.stringify(datos));
    } catch {
        // Recordarlo es una comodidad: si falla, la próxima vez se vuelve a escribir.
    }
}

export async function olvidarComprobante(): Promise<void> {
    await almacen.deleteItemAsync(CLAVE).catch(() => {});
}
