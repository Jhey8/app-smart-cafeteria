import * as Haptics from "expo-haptics";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icono } from "@/componentes/Icono";
import { colores, radio } from "@/tema";

/*
 * La confirmación corta de que algo pasó ("Agregado: Lomo saltado"): una
 * píldora que aparece abajo, una vibración suave, y se va sola. Sin botones
 * ni nada que cerrar, para no frenar a quien está pidiendo.
 */
const DURACION = 1800;

interface ContextoDeAvisos {
    avisar: (texto: string) => void;
}

const Contexto = createContext<ContextoDeAvisos | null>(null);

export function ProveedorDeAvisos({ children }: { children: ReactNode }) {
    const [aviso, setAviso] = useState<{ texto: string; vez: number } | null>(null);

    const avisar = useCallback((texto: string) => {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        // "vez" hace que dos avisos iguales seguidos vuelvan a animarse.
        setAviso((anterior) => ({ texto, vez: (anterior?.vez ?? 0) + 1 }));
    }, []);

    const valor = useMemo(() => ({ avisar }), [avisar]);
    const quitar = useCallback(() => setAviso(null), []);

    return (
        <Contexto.Provider value={valor}>
            {children}
            {aviso && <Pildora key={aviso.vez} texto={aviso.texto} alTerminar={quitar} />}
        </Contexto.Provider>
    );
}

function Pildora({ texto, alTerminar }: { texto: string; alTerminar: () => void }) {
    const margenes = useSafeAreaInsets();
    const [aparicion] = useState(() => new Animated.Value(0));

    useEffect(() => {
        const animacion = Animated.sequence([
            Animated.spring(aparicion, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6 }),
            Animated.delay(DURACION),
            Animated.timing(aparicion, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]);
        animacion.start(({ finished }) => finished && alTerminar());
        return () => animacion.stop();
    }, [aparicion, alTerminar]);

    return (
        // Por encima de la barra de pestañas y de "Ver mi pedido", que es donde suele estar el pulgar.
        <View pointerEvents="none" style={[estilos.capa, { bottom: margenes.bottom + 160 }]}>
            <Animated.View
                accessibilityLiveRegion="polite"
                accessibilityRole="alert"
                style={[
                    estilos.pildora,
                    { opacity: aparicion, transform: [{ translateY: aparicion.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] },
                ]}
            >
                <Icono nombre="listo" color={colores.calido} tamano={18} />
                <Text style={estilos.texto} numberOfLines={1}>
                    {texto}
                </Text>
            </Animated.View>
        </View>
    );
}

export function useAvisos(): ContextoDeAvisos {
    const contexto = useContext(Contexto);
    if (contexto === null) {
        throw new Error("useAvisos se usa dentro de ProveedorDeAvisos");
    }
    return contexto;
}

const estilos = StyleSheet.create({
    capa: { position: "absolute", left: 0, right: 0, alignItems: "center", paddingHorizontal: 24 },
    pildora: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        maxWidth: "100%",
        backgroundColor: colores.acentoProfundo,
        borderRadius: radio.pildora,
        paddingHorizontal: 18,
        paddingVertical: 12,
        boxShadow: "0 6px 18px rgba(7, 53, 116, 0.35)",
    },
    texto: { color: colores.superficie, fontSize: 15, fontWeight: "600", flexShrink: 1 },
});
