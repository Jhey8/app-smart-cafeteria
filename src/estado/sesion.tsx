import * as almacen from "@/utils/almacen";
import { olvidarComprobante } from "@/utils/comprobante";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { z } from "zod";
import { alPerderLaSesion, usarToken } from "@/servicios/api";
import { desactivarPush } from "@/servicios/push";
import type { RespuestaDeSesion } from "@/tipos/api";

/*
 * La sesión del estudiante. Se guarda en SecureStore (el llavero del
 * teléfono, cifrado), no en un almacenamiento plano: el token permite pedir
 * a su nombre. En el navegador va en sessionStorage (ver utils/almacen).
 */
const CLAVE = "sesion";

const esquemaGuardada = z.object({
    token: z.string(),
    venceEn: z.number(),
    codigo: z.string(),
    nombres: z.string(),
    apellidos: z.string(),
    tipo: z.string(),
});

export type Sesion = z.infer<typeof esquemaGuardada>;

interface ContextoDeSesion {
    /** undefined mientras se lee lo guardado; null si no hay nadie dentro. */
    sesion: Sesion | null | undefined;
    abrir: (respuesta: RespuestaDeSesion) => Promise<void>;
    cerrar: () => Promise<void>;
}

const Contexto = createContext<ContextoDeSesion | null>(null);

export function ProveedorDeSesion({ children }: { children: ReactNode }) {
    const [sesion, setSesion] = useState<Sesion | null | undefined>(undefined);

    const cerrar = useCallback(async () => {
        // Primero, con el token todavía puesto: este teléfono deja de recibir los avisos de la cuenta.
        await desactivarPush();
        usarToken(null);
        setSesion(null);
        await almacen.deleteItemAsync(CLAVE).catch(() => {});
        // El RUC o el DNI de la última boleta son de esta persona, no de quien entre después.
        await olvidarComprobante();
    }, []);

    const abrir = useCallback(async ({ token, expiraEnSegundos, codigo, nombres, apellidos, tipo }: RespuestaDeSesion) => {
        const nueva: Sesion = { token, venceEn: Date.now() + expiraEnSegundos * 1000, codigo, nombres, apellidos, tipo };
        usarToken(token);
        setSesion(nueva);
        await almacen.setItemAsync(CLAVE, JSON.stringify(nueva));
    }, []);

    useEffect(() => {
        alPerderLaSesion(() => void cerrar());
        almacen.getItemAsync(CLAVE)
            .then((texto) => {
                const guardada = texto === null ? null : esquemaGuardada.safeParse(JSON.parse(texto));
                // Un token vencido no sirve: mejor pedir la contraseña ya que fallar en el primer pedido.
                if (guardada?.success && guardada.data.venceEn > Date.now() + 60_000) {
                    usarToken(guardada.data.token);
                    setSesion(guardada.data);
                } else {
                    void cerrar();
                }
            })
            .catch(() => void cerrar());
    }, [cerrar]);

    const valor = useMemo(() => ({ sesion, abrir, cerrar }), [sesion, abrir, cerrar]);
    return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useSesion(): ContextoDeSesion {
    const contexto = useContext(Contexto);
    if (contexto === null) {
        throw new Error("useSesion se usa dentro de ProveedorDeSesion");
    }
    return contexto;
}
