import { useState } from "react";
import { Image, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { urlDeImagen } from "@/servicios/api";
import { colores } from "@/tema";

interface Props {
    nombres: string;
    apellidos: string;
    fotoUrl?: string | null;
    tamano: number;
    /** Sobre el azul de Inicio va translúcido con letras blancas; en Cuenta, azul claro. */
    sobreAzul?: boolean;
    estilo?: StyleProp<ViewStyle>;
}

/** La foto de la persona, o sus iniciales si no subió una (o si no carga). */
export function Avatar({ nombres, apellidos, fotoUrl, tamano, sobreAzul = false, estilo }: Props) {
    const [fallo, setFallo] = useState(false);
    const url = urlDeImagen(fotoUrl ?? null);
    const iniciales = `${nombres.charAt(0)}${apellidos.charAt(0)}`.toUpperCase();

    return (
        <View
            style={[
                {
                    width: tamano,
                    height: tamano,
                    borderRadius: tamano / 2,
                    overflow: "hidden",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: sobreAzul ? "rgba(255, 255, 255, 0.18)" : colores.acentoClaro,
                    borderWidth: sobreAzul ? 2 : 0,
                    borderColor: "rgba(255, 255, 255, 0.6)",
                },
                estilo,
            ]}
        >
            {url !== null && !fallo ? (
                <Image source={{ uri: url }} style={{ width: "100%", height: "100%" }} onError={() => setFallo(true)} accessibilityIgnoresInvertColors />
            ) : (
                <Text style={{ fontSize: tamano * 0.36, fontWeight: "700", color: sobreAzul ? colores.superficie : colores.acento }}>{iniciales}</Text>
            )}
        </View>
    );
}
