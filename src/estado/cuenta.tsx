import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { marcarFavorito, obtenerAvisos, obtenerCuenta, obtenerFavoritos, quitarFavorito } from "@/servicios/cafeteria";
import type { Bandeja, Cuenta } from "@/tipos/api";
import { useSesion } from "./sesion";

/*
 * Lo que varias pantallas necesitan de la persona a la vez: su cuenta (la
 * foto sale en Inicio y en Cuenta) y la bandeja de avisos (el número de la
 * campana). Vive aquí para que, al cambiar la foto o leer los avisos, todas
 * las pantallas lo vean sin volver a pedirlo.
 *
 * La bandeja se pregunta cada 30 segundos mientras hay sesión, y en el acto
 * cuando llega un push (ver servicios/push).
 */
const SEGUNDOS_ENTRE_CONSULTAS = 30;

interface ContextoDeCuenta {
    cuenta: Cuenta | null;
    bandeja: Bandeja | null;
    /** Los platos con corazón. */
    favoritos: ReadonlySet<number>;
    alternarFavorito: (idProducto: number) => Promise<void>;
    ponerCuenta: (cuenta: Cuenta) => void;
    recargarCuenta: () => Promise<void>;
    recargarBandeja: () => Promise<void>;
}

const Contexto = createContext<ContextoDeCuenta | null>(null);

export function ProveedorDeCuenta({ children }: { children: ReactNode }) {
    const { sesion } = useSesion();
    const hayAlguien = Boolean(sesion);
    const [cuenta, setCuenta] = useState<Cuenta | null>(null);
    const [bandeja, setBandeja] = useState<Bandeja | null>(null);
    const [favoritos, setFavoritos] = useState<ReadonlySet<number>>(new Set());

    /*
     * El corazón cambia al instante y después se confirma con el backend; si
     * falla, vuelve a como estaba. Esperar la respuesta para pintarlo se
     * siente lento en un toque tan chico.
     */
    const alternarFavorito = useCallback(
        async (idProducto: number) => {
            const estaba = favoritos.has(idProducto);
            const cambiar = (marcar: boolean) =>
                setFavoritos((actuales) => {
                    const nuevos = new Set(actuales);
                    if (marcar) {
                        nuevos.add(idProducto);
                    } else {
                        nuevos.delete(idProducto);
                    }
                    return nuevos;
                });
            cambiar(!estaba);
            try {
                setFavoritos(new Set(estaba ? await quitarFavorito(idProducto) : await marcarFavorito(idProducto)));
            } catch {
                cambiar(estaba);
            }
        },
        [favoritos],
    );

    const recargarCuenta = useCallback(async () => {
        try {
            setCuenta(await obtenerCuenta());
        } catch {
            // Sin conexión se sigue mostrando lo último que llegó.
        }
    }, []);

    const recargarBandeja = useCallback(async () => {
        try {
            setBandeja(await obtenerAvisos());
        } catch {
            // Igual: la campana se queda con el último número.
        }
    }, []);

    useEffect(() => {
        if (!hayAlguien) {
            return;
        }
        let vigente = true;
        obtenerCuenta().then((nueva) => vigente && setCuenta(nueva), () => {});
        obtenerAvisos().then((nueva) => vigente && setBandeja(nueva), () => {});
        obtenerFavoritos().then((ids) => vigente && setFavoritos(new Set(ids)), () => {});
        const intervalo = setInterval(() => void recargarBandeja(), SEGUNDOS_ENTRE_CONSULTAS * 1000);
        return () => {
            vigente = false;
            clearInterval(intervalo);
            // Al cerrar sesión no queda nada de la persona anterior.
            setCuenta(null);
            setBandeja(null);
            setFavoritos(new Set());
        };
    }, [hayAlguien, recargarBandeja]);

    const valor = useMemo(
        () => ({ cuenta, bandeja, favoritos, alternarFavorito, ponerCuenta: setCuenta, recargarCuenta, recargarBandeja }),
        [cuenta, bandeja, favoritos, alternarFavorito, recargarCuenta, recargarBandeja],
    );
    return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useCuenta(): ContextoDeCuenta {
    const contexto = useContext(Contexto);
    if (contexto === null) {
        throw new Error("useCuenta se usa dentro de ProveedorDeCuenta");
    }
    return contexto;
}
