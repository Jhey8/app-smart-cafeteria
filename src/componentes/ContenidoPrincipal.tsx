import { useIsFocused } from "expo-router";
import type { ReactNode } from "react";
import { Platform, View } from "react-native";

/** El id al que apunta el enlace «Ir al contenido principal». */
export const ID_DEL_CONTENIDO = "contenido";

/*
 * Envuelve el contenido de cada pantalla. En la web lo marca como <main>
 * (WCAG 1.3.1) y le pone el id al que salta el enlace del inicio (WCAG 2.4.1).
 *
 * La navegación deja montadas las pantallas anteriores, ocultas. Por eso solo
 * la pantalla visible lleva el <main> y el id: si no, habría varios y el
 * enlace podría saltar a una pantalla escondida.
 *
 * En el celular no cambia nada: devuelve el contenido tal cual.
 */
export function ContenidoPrincipal({ children }: { children: ReactNode }) {
    const visible = useIsFocused();
    if (Platform.OS !== "web") {
        return <>{children}</>;
    }
    return (
        // tabIndex -1: el enlace puede darle el foco, pero Tab no se detiene aquí.
        <View role={visible ? "main" : undefined} id={visible ? ID_DEL_CONTENIDO : undefined} tabIndex={-1} style={{ flex: 1 }}>
            {children}
        </View>
    );
}
