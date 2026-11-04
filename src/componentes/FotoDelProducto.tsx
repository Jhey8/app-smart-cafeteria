import { useState } from "react";
import { Image, View, type StyleProp, type ViewStyle } from "react-native";
import { urlDeImagen } from "@/servicios/api";
import { colores } from "@/tema";
import { Icono } from "./Icono";

/** La foto principal del plato; si no tiene o no carga, un ícono sobre azul claro. */
export function FotoDelProducto({ imagenUrl, estilo, tamanoDelIcono = 28 }: { imagenUrl: string | null; estilo: StyleProp<ViewStyle>; tamanoDelIcono?: number }) {
    const [fallo, setFallo] = useState(false);
    const url = urlDeImagen(imagenUrl);

    return (
        <View style={[{ backgroundColor: colores.acentoClaro, overflow: "hidden", alignItems: "center", justifyContent: "center" }, estilo]}>
            {url !== null && !fallo ? (
                <Image source={{ uri: url }} style={{ width: "100%", height: "100%" }} resizeMode="cover" onError={() => setFallo(true)} accessibilityIgnoresInvertColors />
            ) : (
                <Icono nombre="menu" color={colores.acento} tamano={tamanoDelIcono} />
            )}
        </View>
    );
}
