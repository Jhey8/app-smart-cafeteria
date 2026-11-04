import * as Haptics from "expo-haptics";
import type { Tabs } from "expo-router";
import type { ComponentProps } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colores } from "@/tema";

type PropsDeLaBarra = Parameters<NonNullable<ComponentProps<typeof Tabs>["tabBar"]>>[0];

/** Lo que mide la cápsula, sin el margen de abajo. */
const ALTO = 66;

/**
 * Cuánto espacio dejar al final de una pantalla con pestañas: la barra flota
 * encima del contenido, y sin este margen el último plato quedaría debajo.
 */
export function useEspacioDeLaBarra(): number {
    const { bottom } = useSafeAreaInsets();
    return ALTO + Math.max(bottom, 12) + 16;
}

/**
 * La barra de abajo como las de iOS de ahora (WhatsApp, Música): una cápsula
 * blanca que flota sobre el contenido, con la pestaña activa dentro de una
 * píldora azul claro. El contenido se ve pasar por detrás.
 */
export function BarraDePestanas({ state, descriptors, navigation, insets }: PropsDeLaBarra) {
    return (
        // WCAG 1.3.1: en la web la barra es un <nav>, y sus pestañas van dentro de una lista de pestañas.
        <View role="navigation" aria-label="Secciones de la app" pointerEvents="box-none" style={[estilos.capa, { bottom: Math.max(insets.bottom, 12) }]}>
            <View role="tablist" style={estilos.capsula}>
                {state.routes.map((ruta, indice) => {
                    const descriptor = descriptors[ruta.key];
                    if (!descriptor) {
                        return null;
                    }
                    const { options } = descriptor;
                    const enfocada = state.index === indice;
                    const color = enfocada ? colores.acento : colores.texto;
                    const etiqueta = typeof options.tabBarLabel === "string" ? options.tabBarLabel : (options.title ?? ruta.name);

                    function tocar() {
                        const evento = navigation.emit({ type: "tabPress", target: ruta.key, canPreventDefault: true });
                        if (!enfocada && !evento.defaultPrevented) {
                            void Haptics.selectionAsync().catch(() => {});
                            navigation.navigate(ruta.name, ruta.params);
                        }
                    }

                    return (
                        <Pressable
                            key={ruta.key}
                            onPress={tocar}
                            accessibilityRole="tab"
                            accessibilityState={{ selected: enfocada }}
                            accessibilityLabel={options.tabBarAccessibilityLabel ?? etiqueta}
                            style={[estilos.pestana, enfocada && estilos.activa]}
                        >
                            {options.tabBarIcon?.({ focused: enfocada, color, size: 24 })}
                            <Text style={[estilos.etiqueta, { color }, enfocada && { fontWeight: "700" }]} numberOfLines={1}>
                                {etiqueta}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}

const estilos = StyleSheet.create({
    capa: { position: "absolute", left: 16, right: 16 },
    capsula: {
        height: ALTO,
        flexDirection: "row",
        alignItems: "center",
        padding: 5,
        borderRadius: 999,
        backgroundColor: "rgba(255, 255, 255, 0.97)",
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: "rgba(20, 23, 31, 0.08)",
        boxShadow: "0 10px 30px rgba(7, 53, 116, 0.18)",
    },
    pestana: { flex: 1, height: "100%", alignItems: "center", justifyContent: "center", gap: 2, borderRadius: 999 },
    activa: { backgroundColor: colores.acentoClaro },
    etiqueta: { fontSize: 12, fontWeight: "500" },
});
