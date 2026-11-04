import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Producto } from "@/tipos/api";
import * as reglas from "@/utils/carrito";

interface ContextoDelCarrito {
    lineas: reglas.LineaDelCarrito[];
    total: number;
    unidades: number;
    agregar: (producto: Producto, cantidad?: number) => void;
    cambiarCantidad: (idProducto: number, cantidad: number) => void;
    vaciar: () => void;
}

const Contexto = createContext<ContextoDelCarrito | null>(null);

/** El carrito vive en memoria: si se cierra la app, se empieza de nuevo, como en el kiosco. */
export function ProveedorDelCarrito({ children }: { children: ReactNode }) {
    const [lineas, setLineas] = useState<reglas.LineaDelCarrito[]>([]);

    const valor = useMemo<ContextoDelCarrito>(
        () => ({
            lineas,
            total: reglas.total(lineas),
            unidades: reglas.unidades(lineas),
            agregar: (producto, cantidad) => setLineas((actuales) => reglas.agregar(actuales, producto, cantidad)),
            cambiarCantidad: (idProducto, cantidad) => setLineas((actuales) => reglas.cambiarCantidad(actuales, idProducto, cantidad)),
            vaciar: () => setLineas([]),
        }),
        [lineas],
    );

    return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useCarrito(): ContextoDelCarrito {
    const contexto = useContext(Contexto);
    if (contexto === null) {
        throw new Error("useCarrito se usa dentro de ProveedorDelCarrito");
    }
    return contexto;
}
