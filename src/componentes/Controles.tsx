import { useId, useState, type ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { colores, espacio, radio, texto } from "@/tema";
import { Icono, type NombreDeIcono } from "./Icono";

/* Botones, campos y chips: las piezas que se repiten en todas las pantallas. */

interface PropsDeBoton {
    children: string;
    onPress: () => void;
    /** "calido": ámbar con letras azul oscuro, el botón que resalta sobre el azul (Entrar). */
    variante?: "principal" | "secundario" | "peligro" | "calido";
    cargando?: boolean;
    deshabilitado?: boolean;
    icono?: NombreDeIcono;
    /** Píldora: los botones de Entrar y Crear cuenta. */
    redondo?: boolean;
}

export function Boton({ children, onPress, variante = "principal", cargando = false, deshabilitado = false, icono, redondo = false }: PropsDeBoton) {
    const inactivo = cargando || deshabilitado;
    const colorDelTexto =
        variante === "principal" ? colores.superficie : variante === "peligro" ? colores.error : variante === "calido" ? colores.acentoProfundo : colores.acento;
    return (
        <Pressable
            onPress={onPress}
            disabled={inactivo}
            accessibilityRole="button"
            accessibilityState={{ disabled: inactivo, busy: cargando }}
            style={({ pressed }) => [
                estilos.boton,
                redondo && { borderRadius: radio.pildora, minHeight: 54 },
                variante === "principal" && { backgroundColor: pressed ? colores.acentoOscuro : colores.acento },
                variante === "secundario" && { backgroundColor: pressed ? colores.borde : colores.acentoClaro },
                variante === "peligro" && { backgroundColor: pressed ? colores.borde : colores.errorClaro },
                variante === "calido" && { backgroundColor: colores.calido, opacity: pressed ? 0.85 : 1 },
                inactivo && { opacity: 0.5 },
            ]}
        >
            {cargando ? (
                <ActivityIndicator color={colorDelTexto} />
            ) : (
                <>
                    {icono && <Icono nombre={icono} color={colorDelTexto} tamano={20} />}
                    <Text style={[estilos.textoDeBoton, { color: colorDelTexto }]}>{children}</Text>
                </>
            )}
        </Pressable>
    );
}

interface PropsDeCampo extends Omit<TextInputProps, "style"> {
    etiqueta: string;
    /** Para los de varias líneas (el detalle de una reclamación). */
    altoMinimo?: number;
    /** Píldora gris sin borde, como en Entrar y Crear cuenta. */
    redondo?: boolean;
    /** Sobre el bloque azul de Entrar y Crear cuenta: etiqueta blanca y campo blanco. */
    sobreAzul?: boolean;
    ayuda?: string;
    conError?: boolean;
}

export function Campo({ etiqueta, ayuda, conError = false, altoMinimo, redondo = false, sobreAzul = false, ...resto }: PropsDeCampo) {
    const [enfocado, setEnfocado] = useState(false);
    // Ids para unir, en la web, la etiqueta y la ayuda con su campo.
    const id = useId();
    const idEtiqueta = `${id}-etiqueta`;
    const idAyuda = `${id}-ayuda`;
    return (
        <View style={{ gap: espacio.xs }}>
            <Text id={idEtiqueta} style={[estilos.etiqueta, sobreAzul && { color: colores.superficie }]}>
                {etiqueta}
            </Text>
            <TextInput
                {...resto}
                accessibilityLabel={etiqueta}
                // WCAG 1.3.1: el campo se nombra con la etiqueta visible que tiene encima.
                aria-labelledby={idEtiqueta}
                // WCAG 3.3.1: el texto de ayuda o de error se lee junto al campo, y el error no queda solo en el color del borde.
                aria-describedby={ayuda ? idAyuda : undefined}
                aria-invalid={conError}
                placeholderTextColor={colores.suave}
                onFocus={(evento) => {
                    setEnfocado(true);
                    resto.onFocus?.(evento);
                }}
                onBlur={(evento) => {
                    setEnfocado(false);
                    resto.onBlur?.(evento);
                }}
                style={[
                    estilos.campo,
                    redondo && estilos.campoRedondo,
                    sobreAzul && estilos.campoSobreAzul,
                    altoMinimo !== undefined && { minHeight: altoMinimo, paddingTop: espacio.m, paddingBottom: espacio.m },
                    enfocado && { borderColor: sobreAzul ? colores.calido : colores.acento },
                    conError && { borderColor: sobreAzul ? colores.calido : colores.error },
                ]}
            />
            {ayuda && (
                <Text
                    id={idAyuda}
                    style={[
                        texto.nota,
                        sobreAzul && { color: "rgba(255, 255, 255, 0.85)" },
                        // Sobre azul el error va en blanco y negrita: el ámbar daba 2.9:1 y no llegaba a 4.5:1 (WCAG 1.4.3).
                        conError && (sobreAzul ? estilos.errorSobreAzul : { color: colores.error }),
                    ]}
                >
                    {ayuda}
                </Text>
            )}
        </View>
    );
}

const TONOS = {
    neutro: { fondo: colores.fondo, color: colores.suave },
    acento: { fondo: colores.acentoClaro, color: colores.acento },
    ok: { fondo: colores.okClaro, color: colores.ok },
    error: { fondo: colores.errorClaro, color: colores.error },
} as const;

export function Chip({ children, tono = "neutro" }: { children: ReactNode; tono?: keyof typeof TONOS }) {
    return (
        <View style={[estilos.chip, { backgroundColor: TONOS[tono].fondo }]}>
            <Text style={[estilos.textoDeChip, { color: TONOS[tono].color }]}>{children}</Text>
        </View>
    );
}

/** Un aviso dentro de la pantalla, en rojo, para errores que no cortan el paso. */
export function Aviso({ children }: { children: string }) {
    return (
        <View style={estilos.aviso} accessibilityRole="alert">
            <Text style={{ color: colores.error, fontSize: 15 }}>{children}</Text>
        </View>
    );
}

const estilos = StyleSheet.create({
    boton: {
        minHeight: 52,
        borderRadius: radio.medio,
        paddingHorizontal: espacio.l,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: espacio.s,
    },
    textoDeBoton: { fontSize: 17, fontWeight: "600" },
    etiqueta: { fontSize: 14, fontWeight: "600", color: colores.texto },
    errorSobreAzul: { color: colores.superficie, fontWeight: "700" },
    campo: {
        minHeight: 50,
        borderWidth: 1.5,
        borderColor: colores.borde,
        borderRadius: radio.medio,
        paddingHorizontal: espacio.m,
        fontSize: 16,
        color: colores.texto,
        backgroundColor: colores.superficie,
    },
    campoSobreAzul: { backgroundColor: colores.superficie, borderColor: colores.superficie },
    campoRedondo: { borderRadius: radio.pildora, backgroundColor: colores.fondo, borderColor: colores.fondo, minHeight: 54, paddingHorizontal: espacio.xl },
    chip: { alignSelf: "flex-start", borderRadius: radio.pildora, paddingHorizontal: 10, paddingVertical: 4 },
    textoDeChip: { fontSize: 14, fontWeight: "600" },
    aviso: { backgroundColor: colores.errorClaro, borderRadius: radio.medio, padding: espacio.m },
});
