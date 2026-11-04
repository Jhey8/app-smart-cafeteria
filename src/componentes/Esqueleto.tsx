import { useEffect, useState } from "react";
import { Animated, StyleSheet, View, type DimensionValue } from "react-native";
import { colores, espacio, radio, sombra } from "@/tema";

/*
 * Mientras carga, la forma de lo que va a aparecer en gris que late, en vez
 * de una ruedita: la pantalla no salta cuando llegan los datos y se siente
 * más rápida.
 */
function useLatido() {
    const [valor] = useState(() => new Animated.Value(0.45));
    useEffect(() => {
        const latido = Animated.loop(
            Animated.sequence([
                Animated.timing(valor, { toValue: 1, duration: 700, useNativeDriver: true }),
                Animated.timing(valor, { toValue: 0.45, duration: 700, useNativeDriver: true }),
            ]),
        );
        latido.start();
        return () => latido.stop();
    }, [valor]);
    return valor;
}

export function Bloque({ ancho = "100%", alto, redondeo = radio.chico }: { ancho?: DimensionValue; alto: number; redondeo?: number }) {
    const opacidad = useLatido();
    return <Animated.View style={{ width: ancho, height: alto, borderRadius: redondeo, backgroundColor: colores.borde, opacity: opacidad }} />;
}

/** Tarjetas de plato vacías, como las del menú. */
export function ListaEsqueleto({ cuantas = 5 }: { cuantas?: number }) {
    return (
        <View style={estilos.lista} accessibilityLabel="Cargando" accessibilityRole="progressbar">
            {Array.from({ length: cuantas }, (_, indice) => (
                <View key={indice} style={estilos.tarjeta}>
                    <Bloque ancho={92} alto={92} redondeo={radio.medio} />
                    <View style={{ flex: 1, gap: espacio.s, paddingTop: 4 }}>
                        <Bloque ancho="75%" alto={16} />
                        <Bloque ancho="95%" alto={12} />
                        <Bloque ancho="40%" alto={12} />
                        <View style={{ marginTop: "auto" }}>
                            <Bloque ancho={70} alto={18} />
                        </View>
                    </View>
                </View>
            ))}
        </View>
    );
}

const estilos = StyleSheet.create({
    lista: { padding: espacio.l, gap: espacio.m },
    tarjeta: { flexDirection: "row", gap: espacio.m, backgroundColor: colores.superficie, borderRadius: radio.grande, padding: espacio.m, ...sombra },
});
