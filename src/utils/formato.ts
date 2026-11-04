import type { EstadoDePedido } from "@/tipos/api";

/** 14.5 → "S/ 14.50". A mano y no con Intl, para que salga igual en cualquier teléfono. */
export function soles(monto: number): string {
    return `S/ ${monto.toFixed(2)}`;
}

/**
 * La hora de una fecha del backend. Llega sin zona ("2026-10-03T13:45:00")
 * y ya en hora de Lima, así que se toma tal cual en vez de convertirla con
 * la zona del teléfono, que podría estar mal configurada.
 */
export function hora(fecha: string | null | undefined): string | null {
    return fecha ? fecha.slice(11, 16) : null;
}

/** "3 oct, 13:45" */
export function diaYHora(fecha: string): string {
    const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "set", "oct", "nov", "dic"];
    const dia = Number(fecha.slice(8, 10));
    const mes = meses[Number(fecha.slice(5, 7)) - 1] ?? "";
    return `${dia} ${mes}, ${hora(fecha)}`;
}

export const ESTADOS: Record<EstadoDePedido, { texto: string; tono: "neutro" | "acento" | "ok" | "error" }> = {
    RECIBIDO: { texto: "Sin pagar", tono: "neutro" },
    PAGADO: { texto: "En cola", tono: "acento" },
    PREPARANDO: { texto: "Preparando", tono: "acento" },
    LISTO: { texto: "Listo para recoger", tono: "ok" },
    ENTREGADO: { texto: "Entregado", tono: "neutro" },
    CANCELADO: { texto: "Cancelado", tono: "error" },
};

/** Un pedido que todavía puede cambiar de estado: vale la pena seguir preguntando. */
export function sigueEnCurso(estado: EstadoDePedido): boolean {
    return estado === "RECIBIDO" || estado === "PAGADO" || estado === "PREPARANDO" || estado === "LISTO";
}
