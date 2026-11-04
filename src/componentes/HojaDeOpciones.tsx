import { useRef } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colores, espacio, radio } from "@/tema";
import { Icono, type NombreDeIcono } from "./Icono";

export interface Opcion {
    texto: string;
    icono: NombreDeIcono;
    peligrosa?: boolean;
    alElegir: () => void;
}

/**
 * Una hoja que sube desde abajo con opciones, como las de iOS. Se usa en vez
 * de Alert porque en Android un Alert admite solo tres botones y aquí puede
 * haber cuatro (galería, cámara, quitar, cancelar).
 *
 * La opción elegida corre cuando la hoja terminó de cerrarse, no antes: en
 * iPhone no se puede abrir otra pantalla (la galería, la cámara) mientras una
 * se está cerrando, y iOS lo ignora sin avisar. Por eso "Elegir de la
 * galería" no abría nada.
 */
export function HojaDeOpciones({ visible, titulo, opciones, alCerrar }: { visible: boolean; titulo: string; opciones: Opcion[]; alCerrar: () => void }) {
    const { bottom } = useSafeAreaInsets();
    const pendiente = useRef<(() => void) | null>(null);

    function elegir(opcion: Opcion) {
        if (Platform.OS === "ios") {
            pendiente.current = opcion.alElegir;
            alCerrar();
        } else {
            alCerrar();
            opcion.alElegir();
        }
    }

    function alTerminarDeCerrar() {
        const accion = pendiente.current;
        pendiente.current = null;
        accion?.();
    }

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={alCerrar} onDismiss={alTerminarDeCerrar}>
            <Pressable style={estilos.fondo} onPress={alCerrar} accessibilityLabel="Cerrar" />
            <View style={[estilos.hoja, { paddingBottom: Math.max(bottom, espacio.l) }]}>
                <View style={estilos.asa} />
                <Text style={estilos.titulo}>{titulo}</Text>
                {opciones.map((opcion) => (
                    <Pressable
                        key={opcion.texto}
                        onPress={() => elegir(opcion)}
                        accessibilityRole="button"
                        style={({ pressed }) => [estilos.opcion, pressed && { backgroundColor: colores.fondo }]}
                    >
                        <Icono nombre={opcion.icono} color={opcion.peligrosa ? colores.error : colores.texto} tamano={22} />
                        <Text style={[estilos.texto, opcion.peligrosa && { color: colores.error }]}>{opcion.texto}</Text>
                    </Pressable>
                ))}
                <Pressable onPress={alCerrar} accessibilityRole="button" style={({ pressed }) => [estilos.cancelar, pressed && { opacity: 0.8 }]}>
                    <Text style={estilos.textoCancelar}>Cancelar</Text>
                </Pressable>
            </View>
        </Modal>
    );
}

const estilos = StyleSheet.create({
    fondo: { flex: 1, backgroundColor: "rgba(20, 23, 31, 0.35)" },
    hoja: { backgroundColor: colores.superficie, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: espacio.l, paddingTop: espacio.s },
    asa: { alignSelf: "center", width: 40, height: 5, borderRadius: 3, backgroundColor: colores.borde, marginBottom: espacio.m },
    titulo: { fontSize: 15, fontWeight: "600", color: colores.suave, textAlign: "center", marginBottom: espacio.s },
    opcion: { flexDirection: "row", alignItems: "center", gap: espacio.l, paddingVertical: 16, paddingHorizontal: espacio.s, borderRadius: radio.medio },
    texto: { fontSize: 17, color: colores.texto },
    cancelar: { marginTop: espacio.s, minHeight: 52, borderRadius: radio.medio, backgroundColor: colores.fondo, alignItems: "center", justifyContent: "center" },
    textoCancelar: { fontSize: 17, fontWeight: "600", color: colores.acento },
});
