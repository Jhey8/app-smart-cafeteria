import type { NombreDeIcono } from "@/componentes/Icono";

/*
 * El ícono de cada categoría se elige por su nombre, porque las categorías
 * las crea la cafetería desde el panel. Una que no se reconoce lleva el de
 * cubiertos.
 */
const POR_NOMBRE: [string, NombreDeIcono][] = [
    ["almuerzo", "almuerzo"],
    ["menu", "almuerzo"],
    ["sandw", "sandwich"],
    ["bebida", "bebida"],
    ["postre", "postre"],
    ["snack", "snack"],
];

/** Los que se pueden escribir en el campo Icono de la categoría en el panel. */
const ICONOS_DEL_PANEL: NombreDeIcono[] = ["almuerzo", "sandwich", "bebida", "postre", "snack", "menu", "express"];

export function iconoDeCategoria(nombre: string, iconoDelPanel?: string | null): NombreDeIcono {
    const pedido = iconoDelPanel?.trim().toLowerCase() as NombreDeIcono | undefined;
    if (pedido && ICONOS_DEL_PANEL.includes(pedido)) {
        return pedido;
    }
    const sinTildes = nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    return POR_NOMBRE.find(([parte]) => sinTildes.includes(parte))?.[1] ?? "menu";
}
