import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { colores } from "@/tema";
import { Icono } from "./Icono";

/** Una casilla para marcar, con su texto al lado (que puede llevar enlaces). */
export function Casilla({
    marcada,
    alCambiar,
    conError = false,
    sobreAzul = false,
    children,
}: {
    marcada: boolean;
    alCambiar: (marcada: boolean) => void;
    conError?: boolean;
    /** En Crear cuenta: borde blanco y, marcada, ámbar. */
    sobreAzul?: boolean;
    children: ReactNode;
}) {
    return (
        <View style={estilos.fila}>
            <Pressable
                onPress={() => alCambiar(!marcada)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: marcada }}
                hitSlop={10}
                style={[
                    estilos.caja,
                    sobreAzul && { borderColor: colores.superficie },
                    marcada && (sobreAzul ? estilos.marcadaSobreAzul : estilos.marcada),
                    conError && !marcada && { borderColor: sobreAzul ? colores.calido : colores.error },
                ]}
            >
                {marcada && <Icono nombre="listo" color={sobreAzul ? colores.acentoProfundo : colores.superficie} tamano={16} />}
            </Pressable>
            <View style={{ flex: 1 }}>{children}</View>
        </View>
    );
}

const estilos = StyleSheet.create({
    fila: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
    caja: { width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: colores.borde, alignItems: "center", justifyContent: "center", marginTop: 1 },
    marcada: { backgroundColor: colores.acento, borderColor: colores.acento },
    marcadaSobreAzul: { backgroundColor: colores.calido, borderColor: colores.calido },
});
