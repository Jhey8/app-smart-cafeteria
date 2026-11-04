import { useEffect, useState, type ReactNode } from "react";
import { Animated, Image, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { entorno } from "@/config/entorno";
import { colores, espacio } from "@/tema";
import { Icono } from "./Icono";

/** El logo que viene con la app, para cuando el servidor no responde o todavía no se subió uno. */
const LOGO_INCLUIDO = require("../../assets/splash-icon.png");

interface Props {
    /** Qué parte de la pantalla ocupa el logo (0.42 en Entrar, menos en Crear cuenta). */
    proporcion: number;
    altoDePantalla: number;
    alVolver?: () => void;
    /** El formulario: va dentro del bloque azul de abajo. */
    children: ReactNode;
}

/**
 * Entrar y Crear cuenta, como las apps de pedidos: arriba, donde ellas ponen
 * la foto de un plato, va el logo de la empresa ocupando todo el ancho, con
 * las esquinas de abajo redondeadas; abajo, el formulario dentro de un bloque
 * azul redondeado. Al abrir, el logo baja desde arriba y el bloque azul sube.
 *
 * El logo es el que se sube en el panel (Empresa); si el servidor no
 * responde, el que viene dentro de la app.
 */
export function PantallaDeAcceso({ proporcion, altoDePantalla, alVolver, children }: Props) {
    const { top, bottom } = useSafeAreaInsets();
    const alto = Math.round(altoDePantalla * proporcion);
    const [llegada] = useState(() => new Animated.Value(0));
    const [logoIncluido, setLogoIncluido] = useState(false);

    useEffect(() => {
        Animated.spring(llegada, { toValue: 1, useNativeDriver: true, speed: 8, bounciness: 6 }).start();
    }, [llegada]);

    return (
        <View style={{ flexGrow: 1 }}>
            <Animated.View
                style={[
                    estilos.logo,
                    { height: alto, paddingTop: top + espacio.s, transform: [{ translateY: llegada.interpolate({ inputRange: [0, 1], outputRange: [-alto, 0] }) }] },
                ]}
            >
                {alVolver && (
                    <Pressable onPress={alVolver} accessibilityRole="button" accessibilityLabel="Volver" hitSlop={10} style={[estilos.volver, { top: top + espacio.s }]}>
                        <Icono nombre="siguiente" color={colores.acento} tamano={20} />
                    </Pressable>
                )}
                <Image
                    source={logoIncluido ? LOGO_INCLUIDO : { uri: `${entorno.urlApi}/api/empresa/imagenes/LOGO` }}
                    style={estilos.imagen}
                    resizeMode="contain"
                    onError={() => setLogoIncluido(true)}
                    accessibilityLabel="UTP Smart Cafetería"
                />
            </Animated.View>

            <Animated.View
                style={[
                    estilos.bloque,
                    {
                        paddingBottom: bottom + espacio.xl,
                        opacity: llegada,
                        transform: [{ translateY: llegada.interpolate({ inputRange: [0, 1], outputRange: [120, 0] }) }],
                    },
                ]}
            >
                <View style={estilos.decoracion} pointerEvents="none">
                    <View style={[estilos.circulo, { width: 240, height: 240, top: -80, right: -70 }]} />
                    <View style={[estilos.circulo, { width: 180, height: 180, bottom: -60, left: -60 }]} />
                </View>
                {children}
            </Animated.View>
        </View>
    );
}

const estilos = StyleSheet.create({
    logo: {
        backgroundColor: colores.superficie,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: espacio.xl,
        zIndex: 1,
        boxShadow: "0 10px 24px rgba(7, 53, 116, 0.12)",
    },
    imagen: { width: "88%", flex: 1, maxWidth: 360 },
    volver: {
        position: "absolute",
        left: espacio.l,
        zIndex: 2,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colores.acentoClaro,
        alignItems: "center",
        justifyContent: "center",
        transform: [{ scaleX: -1 }],
    },
    bloque: {
        flexGrow: 1,
        marginTop: espacio.l,
        backgroundColor: colores.acento,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingHorizontal: espacio.xl,
        paddingTop: espacio.xl,
        gap: espacio.l,
        overflow: "hidden",
    },
    decoracion: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
    circulo: { position: "absolute", borderRadius: 999, backgroundColor: "rgba(255, 255, 255, 0.07)" },
});
