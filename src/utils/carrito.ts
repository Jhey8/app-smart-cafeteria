import type { Producto } from "@/tipos/api";

/*
 * Las reglas del carrito, como funciones puras: las mismas que el kiosco
 * (apps/kiosko/src/utils/carrito.ts). Todas devuelven un arreglo nuevo.
 */

/** Los topes de CrearPedidoPeticion en el backend; así el botón deja de sumar en vez de fallar al pedir. */
export const MAXIMO_POR_PRODUCTO = 10;
export const MAXIMO_DE_PRODUCTOS = 15;

export interface LineaDelCarrito {
    producto: Producto;
    cantidad: number;
}

/** Suma `cantidad` si el producto ya estaba; si no, lo agrega al final. */
export function agregar(lineas: LineaDelCarrito[], producto: Producto, cantidad = 1): LineaDelCarrito[] {
    if (!lineas.some((linea) => linea.producto.id === producto.id)) {
        return lineas.length >= MAXIMO_DE_PRODUCTOS
            ? lineas
            : [...lineas, { producto, cantidad: Math.min(cantidad, MAXIMO_POR_PRODUCTO) }];
    }
    return lineas.map((linea) =>
        linea.producto.id === producto.id ? { ...linea, cantidad: Math.min(linea.cantidad + cantidad, MAXIMO_POR_PRODUCTO) } : linea,
    );
}

/** Bajar de uno equivale a quitar la línea. */
export function cambiarCantidad(lineas: LineaDelCarrito[], idProducto: number, cantidad: number): LineaDelCarrito[] {
    if (cantidad < 1) {
        return lineas.filter((linea) => linea.producto.id !== idProducto);
    }
    return lineas.map((linea) =>
        linea.producto.id === idProducto ? { ...linea, cantidad: Math.min(cantidad, MAXIMO_POR_PRODUCTO) } : linea,
    );
}

/**
 * Total de referencia. El que vale lo recalcula el backend con los precios
 * vigentes; nunca se le manda un total. Se redondea para no arrastrar restos
 * de sumar decimales (35.000000000000004).
 */
export function total(lineas: readonly LineaDelCarrito[]): number {
    return Math.round(lineas.reduce((suma, linea) => suma + linea.producto.precio * linea.cantidad, 0) * 100) / 100;
}

export function unidades(lineas: readonly LineaDelCarrito[]): number {
    return lineas.reduce((suma, linea) => suma + linea.cantidad, 0);
}
