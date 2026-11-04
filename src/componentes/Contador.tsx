import { Pressable, StyleSheet, Text, View } from "react-native";
import { colores, radio } from "@/tema";
import { Icono } from "./Icono";

interface Props {
    valor: number;
    minimo: number;
    maximo: number;
    alCambiar: (valor: number) => void;
}

/** − 2 + para la cantidad. Con mínimo 0, bajar de 1 quita la línea del pedido. */
export function Contador({ valor, minimo, maximo, alCambiar }: Props) {
    return (
        <View style={estilos.contador}>
            <BotonDelContador icono={valor <= 1 && minimo === 0 ? "basura" : "menos"} texto="Uno menos" activo={valor > minimo} onPress={() => alCambiar(valor - 1)} />
            <Text style={estilos.valor} accessibilityLiveRegion="polite">
                {valor}
            </Text>
            <BotonDelContador icono="mas" texto="Uno más" activo={valor < maximo} onPress={() => alCambiar(valor + 1)} />
        </View>
    );
}

function BotonDelContador({ icono, texto, activo, onPress }: { icono: "mas" | "menos" | "basura"; texto: string; activo: boolean; onPress: () => void }) {
    return (
        <Pressable
            onPress={onPress}
            disabled={!activo}
            accessibilityRole="button"
            accessibilityLabel={texto}
            hitSlop={6}
            style={({ pressed }) => [estilos.boton, pressed && { backgroundColor: colores.borde }, !activo && { opacity: 0.35 }]}
        >
            <Icono nombre={icono} color={icono === "basura" ? colores.error : colores.acento} tamano={18} />
        </Pressable>
    );
}

const estilos = StyleSheet.create({
    contador: { flexDirection: "row", alignItems: "center", gap: 6 },
    boton: { width: 38, height: 38, borderRadius: radio.pildora, backgroundColor: colores.acentoClaro, alignItems: "center", justifyContent: "center" },
    valor: { minWidth: 24, textAlign: "center", fontSize: 17, fontWeight: "700", color: colores.texto },
});
