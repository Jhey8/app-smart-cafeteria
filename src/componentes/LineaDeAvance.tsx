import { useEffect, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { colores, espacio, radio, sombra } from "@/tema";
import type { EstadoDelPedido } from "@/tipos/api";
import { hora } from "@/utils/formato";
import { Icono } from "./Icono";

interface Paso {
    titulo: string;
    detalle: string | null;
}

/*
 * Por dónde va el pedido, de izquierda a derecha. Lo hecho va en azul con su
 * check, el paso actual late en ámbar, y lo que falta queda en gris. Lo que
 * no pasa por cocina (una gaseosa) se salta "Preparando".
 */
function pasosDe(pedido: EstadoDelPedido): { pasos: Paso[]; actual: number } {
    const pasos: Paso[] = [{ titulo: "Pagado", detalle: pedido.pagadoEn ? hora(pedido.pagadoEn) : "Falta pagar" }];
    if (pedido.requiereCocina) {
        pasos.push({ titulo: "Preparando", detalle: "En la cocina" });
    }
    const listo = pedido.listoEn ? hora(pedido.listoEn) : pedido.listoEstimadoEn ? `aprox. ${hora(pedido.listoEstimadoEn)}` : null;
    pasos.push({ titulo: "Listo", detalle: listo });
    pasos.push({ titulo: "Entregado", detalle: null });

    const indiceListo = pasos.length - 2;
    const actual = {
        RECIBIDO: 0,
        PAGADO: pedido.requiereCocina ? 1 : indiceListo,
        PREPARANDO: 1,
        LISTO: indiceListo,
        ENTREGADO: pasos.length,
        CANCELADO: -1,
    }[pedido.estado];
    return { pasos, actual };
}

export function LineaDeAvance({ pedido }: { pedido: EstadoDelPedido }) {
    const { pasos, actual } = pasosDe(pedido);
    const enCurso = pasos[actual]?.titulo;

    return (
        <View
            style={estilos.tarjeta}
            accessibilityRole="progressbar"
            accessibilityLabel={enCurso ? `Paso ${actual + 1} de ${pasos.length}: ${enCurso}` : "Pedido entregado"}
        >
            {pasos.map((paso, indice) => {
                const hecho = indice < actual;
                const esElActual = indice === actual;
                // Cada paso dibuja la mitad del tramo que lo une con el anterior y la mitad del que va al siguiente.
                const tramoAnterior = indice === 0 ? "transparent" : indice <= actual ? colores.acento : colores.borde;
                const tramoSiguiente = indice === pasos.length - 1 ? "transparent" : hecho ? colores.acento : colores.borde;
                return (
                    <View key={paso.titulo} style={estilos.paso}>
                        <View style={estilos.carril}>
                            <View style={[estilos.tramo, { backgroundColor: tramoAnterior }]} />
                            <Marca hecho={hecho} enCurso={esElActual} />
                            <View style={[estilos.tramo, { backgroundColor: tramoSiguiente }]} />
                        </View>
                        <Text
                            style={[estilos.titulo, !hecho && !esElActual && { color: colores.suave }, esElActual && { color: colores.calidoOscuro }]}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                        >
                            {paso.titulo}
                        </Text>
                        {paso.detalle && (hecho || esElActual || indice === actual + 1) && (
                            <Text style={estilos.detalle} numberOfLines={2}>
                                {paso.detalle}
                            </Text>
                        )}
                    </View>
                );
            })}
        </View>
    );
}

function Marca({ hecho, enCurso }: { hecho: boolean; enCurso: boolean }) {
    const [latido] = useState(() => new Animated.Value(1));

    useEffect(() => {
        if (!enCurso) {
            return;
        }
        const animacion = Animated.loop(
            Animated.sequence([
                Animated.timing(latido, { toValue: 1.25, duration: 650, useNativeDriver: true }),
                Animated.timing(latido, { toValue: 1, duration: 650, useNativeDriver: true }),
            ]),
        );
        animacion.start();
        return () => animacion.stop();
    }, [enCurso, latido]);

    if (hecho) {
        return (
            <View style={[estilos.marca, { backgroundColor: colores.acento }]}>
                <Icono nombre="listo" color={colores.superficie} tamano={14} />
            </View>
        );
    }
    if (enCurso) {
        return (
            <View style={[estilos.marca, { backgroundColor: colores.calidoClaro }]}>
                <Animated.View style={[estilos.nucleo, { transform: [{ scale: latido }] }]} />
            </View>
        );
    }
    return <View style={[estilos.marca, { backgroundColor: colores.fondo, borderWidth: 2, borderColor: colores.borde }]} />;
}

const estilos = StyleSheet.create({
    tarjeta: {
        flexDirection: "row",
        backgroundColor: colores.superficie,
        borderRadius: radio.grande,
        paddingVertical: espacio.l,
        paddingHorizontal: espacio.s,
        ...sombra,
    },
    paso: { flex: 1, alignItems: "center", gap: 2 },
    carril: { flexDirection: "row", alignItems: "center", alignSelf: "stretch", marginBottom: espacio.xs },
    tramo: { flex: 1, height: 3, borderRadius: 2, marginHorizontal: 3 },
    marca: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
    nucleo: { width: 10, height: 10, borderRadius: 5, backgroundColor: colores.calido },
    titulo: { fontSize: 14, fontWeight: "700", color: colores.texto, textAlign: "center", paddingHorizontal: 2 },
    detalle: { fontSize: 12, lineHeight: 16, color: colores.suave, textAlign: "center", paddingHorizontal: 2 },
});
