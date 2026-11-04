import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { colores, espacio, texto } from "@/tema";
import { Boton } from "./Controles";
import { Icono, type NombreDeIcono } from "./Icono";

/* Lo que se ve mientras algo carga, cuando falla, o cuando no hay nada. */

export function Cargando() {
    return (
        <View style={estilos.centro}>
            <ActivityIndicator size="large" color={colores.acento} />
        </View>
    );
}

export function ErrorConReintento({ mensaje, alReintentar }: { mensaje: string; alReintentar: () => void }) {
    return (
        <View style={estilos.centro}>
            <Text style={[texto.cuerpo, estilos.texto]}>{mensaje}</Text>
            <Boton variante="secundario" onPress={alReintentar}>
                Reintentar
            </Boton>
        </View>
    );
}

export function Vacio({ icono, titulo, detalle }: { icono: NombreDeIcono; titulo: string; detalle?: string }) {
    return (
        <View style={estilos.centro}>
            <Icono nombre={icono} color={colores.suave} tamano={44} />
            <Text style={[texto.fuerte, estilos.texto]}>{titulo}</Text>
            {detalle && <Text style={[texto.nota, estilos.texto]}>{detalle}</Text>}
        </View>
    );
}

const estilos = StyleSheet.create({
    centro: { flex: 1, alignItems: "center", justifyContent: "center", gap: espacio.m, padding: espacio.xl },
    texto: { textAlign: "center" },
});
