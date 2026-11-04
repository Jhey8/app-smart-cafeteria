import { useState } from "react";
import { Image, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { urlDeImagen } from "@/servicios/api";
import { colores } from "@/tema";
import { FotoDelProducto } from "./FotoDelProducto";

/**
 * Las fotos del plato, deslizando de lado, con puntos que dicen en cuál se
 * está. Con una sola foto (o ninguna) es la foto de siempre, sin puntos.
 *
 * Las urls son las del almacén del backend, así que lo que se sube en el
 * panel aparece aquí sin tocar la app.
 */
export function Galeria({ imagenes, imagenUrl, nombre }: { imagenes: string[]; imagenUrl: string | null; nombre: string }) {
    const { width: ancho } = useWindowDimensions();
    const [actual, setActual] = useState(0);
    const urls = imagenes.map(urlDeImagen).filter((url): url is string => url !== null);

    if (urls.length <= 1) {
        return <FotoDelProducto imagenUrl={imagenes[0] ?? imagenUrl} estilo={[estilos.foto, { width: ancho }]} tamanoDelIcono={64} />;
    }

    return (
        <View>
            <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(evento) => setActual(Math.round(evento.nativeEvent.contentOffset.x / ancho))}
                accessibilityLabel={`Fotos de ${nombre}, ${urls.length} en total`}
            >
                {urls.map((url, indice) => (
                    <Image
                        key={url}
                        source={{ uri: url }}
                        style={[estilos.foto, { width: ancho }]}
                        resizeMode="cover"
                        accessibilityLabel={`Foto ${indice + 1} de ${urls.length}`}
                    />
                ))}
            </ScrollView>
            <View style={estilos.puntos} pointerEvents="none">
                {urls.map((url, indice) => (
                    <View key={url} style={[estilos.punto, indice === actual && estilos.puntoActual]} />
                ))}
            </View>
        </View>
    );
}

const estilos = StyleSheet.create({
    foto: { aspectRatio: 4 / 3, backgroundColor: colores.acentoClaro },
    puntos: {
        position: "absolute",
        bottom: 12,
        alignSelf: "center",
        flexDirection: "row",
        gap: 6,
        backgroundColor: "rgba(7, 53, 116, 0.45)",
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    punto: { width: 7, height: 7, borderRadius: 4, backgroundColor: "rgba(255, 255, 255, 0.55)" },
    puntoActual: { width: 18, backgroundColor: colores.superficie },
});
