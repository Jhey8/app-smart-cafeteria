import { useId, type ReactNode } from "react";
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
    // El id une la casilla con su texto: así el lector dice qué se acepta (WCAG 4.1.2).
    const idDelTexto = useId();
    return (
        <View style={estilos.fila}>
            <Pressable
                onPress={() => alCambiar(!marcada)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: marcada }}
                // En la web, el estado marcado o no marcado.
                aria-checked={marcada}
                aria-labelledby={idDelTexto}
                aria-invalid={conError && !marcada}
                // Se toca un área de 44 × 44 aunque el cuadro se vea de 24 (WCAG 2.5.5).
                style={estilos.area}
            >
                <View
                    style={[
                        estilos.caja,
                        sobreAzul && { borderColor: colores.superficie },
                        marcada && (sobreAzul ? estilos.marcadaSobreAzul : estilos.marcada),
                        conError && !marcada && { borderColor: sobreAzul ? colores.calido : colores.error },
                    ]}
                >
                    {marcada && <Icono nombre="listo" color={sobreAzul ? colores.acentoProfundo : colores.superficie} tamano={16} />}
                </View>
            </Pressable>
            <View id={idDelTexto} style={{ flex: 1 }}>
                {children}
            </View>
        </View>
    );
}

const estilos = StyleSheet.create({
    // Los márgenes negativos compensan el área extra para que el cuadro quede donde estaba.
    fila: { flexDirection: "row", alignItems: "flex-start", gap: 2 },
    area: { width: 44, height: 44, alignItems: "center", justifyContent: "center", marginTop: -9, marginLeft: -10 },
    caja: { width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: colores.borde, alignItems: "center", justifyContent: "center" },
    marcada: { backgroundColor: colores.acento, borderColor: colores.acento },
    marcadaSobreAzul: { backgroundColor: colores.calido, borderColor: colores.calido },
});
