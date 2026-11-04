import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colores, radio, texto } from "@/tema";
import { hora } from "@/utils/formato";
import { Icono } from "./Icono";

/** Cada cuánto se recalcula: el número de minutos no cambia más rápido que eso. */
const MILISEGUNDOS_ENTRE_REPASOS = 10_000;

/**
 * "2026-10-03T13:45:00" a un Date en la hora local. Se arma a mano: la fecha
 * del backend viene sin zona y ya en hora de Lima, y no todos los motores de
 * los teléfonos interpretan igual ese formato.
 */
function aFecha(texto: string): Date | null {
    const partes = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/.exec(texto);
    if (!partes) {
        return null;
    }
    const [, anio, mes, dia, horas, minutos, segundos] = partes;
    return new Date(Number(anio), Number(mes) - 1, Number(dia), Number(horas), Number(minutos), Number(segundos ?? 0));
}

/**
 * Cuánto falta para que el pedido esté listo, según la estimación del
 * backend (el modelo de tiempos): "Faltan 5 min", que se va actualizando
 * sola. Cuando la hora estimada ya pasó, dice que ya casi está en vez de
 * mostrar un número negativo; el aviso de "listo" llega aparte.
 */
export function CuentaRegresiva({ listoEstimadoEn }: { listoEstimadoEn: string }) {
    const [ahora, setAhora] = useState(() => Date.now());

    useEffect(() => {
        const intervalo = setInterval(() => setAhora(Date.now()), MILISEGUNDOS_ENTRE_REPASOS);
        return () => clearInterval(intervalo);
    }, []);

    const limite = aFecha(listoEstimadoEn);
    if (limite === null) {
        return null;
    }
    const minutos = Math.ceil((limite.getTime() - ahora) / 60_000);

    return (
        <View style={estilos.caja} accessibilityLiveRegion="polite">
            <Icono nombre="reloj" color={colores.acento} tamano={22} />
            <View>
                <Text style={estilos.principal}>{minutos > 1 ? `Faltan ${minutos} min` : minutos === 1 ? "Falta 1 min" : "Ya casi está"}</Text>
                <Text style={texto.nota}>Listo aprox. a las {hora(listoEstimadoEn)}</Text>
            </View>
        </View>
    );
}

const estilos = StyleSheet.create({
    caja: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        backgroundColor: colores.acentoClaro,
        borderRadius: radio.pildora,
        paddingHorizontal: 18,
        paddingVertical: 10,
    },
    principal: { fontSize: 20, fontWeight: "800", color: colores.acento },
});
