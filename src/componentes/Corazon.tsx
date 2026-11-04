import * as Haptics from "expo-haptics";
import { Pressable, StyleSheet } from "react-native";
import { useCuenta } from "@/estado/cuenta";
import { colores } from "@/tema";
import { Icono } from "./Icono";

/** El corazón de favoritos, sobre una foto (círculo blanco) o en una fila (solo el ícono). */
export function Corazon({ idProducto, nombre, sobreFoto = false, tamano = 22 }: { idProducto: number; nombre: string; sobreFoto?: boolean; tamano?: number }) {
    const { favoritos, alternarFavorito } = useCuenta();
    const marcado = favoritos.has(idProducto);
    return (
        <Pressable
            onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                void alternarFavorito(idProducto);
            }}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityState={{ selected: marcado }}
            accessibilityLabel={marcado ? `Quitar ${nombre} de favoritos` : `Agregar ${nombre} a favoritos`}
            style={sobreFoto ? estilos.sobreFoto : undefined}
        >
            <Icono nombre={marcado ? "corazonLleno" : "corazon"} color={marcado ? colores.acento : sobreFoto ? colores.texto : colores.suave} tamano={tamano} />
        </Pressable>
    );
}

const estilos = StyleSheet.create({
    sobreFoto: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 2px 8px rgba(20, 23, 31, 0.2)",
    },
});
