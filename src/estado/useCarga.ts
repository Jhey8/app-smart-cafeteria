import { useCallback, useEffect, useRef, useState } from "react";
import { mensajeDe } from "@/servicios/api";

interface Carga<T> {
    datos: T | undefined;
    error: string | null;
    /** true mientras se vuelve a pedir con datos ya en pantalla (deslizar para actualizar). */
    actualizando: boolean;
    recargar: () => Promise<void>;
}

/**
 * Pide algo al montar la pantalla y, si se indica, cada tantos segundos;
 * con `seguirMientras`, deja de preguntar en cuanto la respuesta dice que ya
 * no va a cambiar (un pedido entregado).
 *
 * Mientras llega lo nuevo se siguen viendo los datos anteriores, y una
 * respuesta que llega cuando la pantalla ya se cerró se descarta.
 */
export function useCarga<T>(cargar: () => Promise<T>, cadaSegundos?: number, seguirMientras?: (datos: T) => boolean): Carga<T> {
    const [datos, setDatos] = useState<T | undefined>(undefined);
    const [error, setError] = useState<string | null>(null);
    const [actualizando, setActualizando] = useState(false);
    const cargarActual = useRef(cargar);
    const seguirActual = useRef(seguirMientras);
    const ultimos = useRef<T | undefined>(undefined);
    const montada = useRef(true);

    useEffect(() => {
        cargarActual.current = cargar;
        seguirActual.current = seguirMientras;
    });

    const pedir = useCallback(async () => {
        try {
            const nuevos = await cargarActual.current();
            ultimos.current = nuevos;
            if (montada.current) {
                setDatos(nuevos);
                setError(null);
            }
        } catch (fallo) {
            if (montada.current) {
                setError(mensajeDe(fallo));
            }
        }
    }, []);

    const recargar = useCallback(async () => {
        setActualizando(true);
        await pedir();
        if (montada.current) {
            setActualizando(false);
        }
    }, [pedir]);

    useEffect(() => {
        montada.current = true;
        void pedir();
        const intervalo = cadaSegundos
            ? setInterval(() => {
                  const ultimo = ultimos.current;
                  if (ultimo === undefined || seguirActual.current === undefined || seguirActual.current(ultimo)) {
                      void pedir();
                  }
              }, cadaSegundos * 1000)
            : undefined;
        return () => {
            montada.current = false;
            clearInterval(intervalo);
        };
    }, [pedir, cadaSegundos]);

    return { datos, error, actualizando, recargar };
}
