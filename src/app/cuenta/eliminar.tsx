import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { Aviso, Boton, Campo } from "@/componentes/Controles";
import { Icono } from "@/componentes/Icono";
import { useSesion } from "@/estado/sesion";
import { mensajeDe } from "@/servicios/api";
import { eliminarMiCuenta } from "@/servicios/cafeteria";
import { colores, espacio, radio, texto } from "@/tema";

const CONSECUENCIAS = [
    "Se cierra tu sesión en todos tus teléfonos.",
    "Ya no podrás entrar ni pedir con esta cuenta.",
    "Dejarás de recibir avisos.",
    "Tus pedidos y reclamaciones se conservan, como pide la ley para las ventas y el Libro de Reclamaciones.",
    "Si fue un error, la cafetería puede recuperarla: acércate a la caja.",
];

/**
 * Eliminar la cuenta. Pide la contraseña y una confirmación aparte: es
 * difícil de deshacer y no debe pasar por un toque sin querer.
 */
export default function EliminarCuenta() {
    const { cerrar } = useSesion();
    const [clave, setClave] = useState("");
    const [eliminando, setEliminando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function confirmar() {
        Alert.alert("¿Eliminar tu cuenta?", "Se cierra tu sesión en todos tus teléfonos y ya no podrás entrar con ella.", [
            { text: "No", style: "cancel" },
            { text: "Sí, eliminar", style: "destructive", onPress: () => void eliminar() },
        ]);
    }

    async function eliminar() {
        setEliminando(true);
        setError(null);
        try {
            await eliminarMiCuenta(clave);
            await cerrar();
        } catch (fallo) {
            setError(mensajeDe(fallo));
            setEliminando(false);
        }
    }

    return (
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colores.superficie }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <ScrollView contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled">
                <View style={estilos.alerta}>
                    <Icono nombre="basura" color={colores.error} tamano={28} />
                    <Text style={[texto.subtitulo, { color: colores.error, flex: 1 }]}>Vas a eliminar tu cuenta</Text>
                </View>
                <View style={{ gap: espacio.s }}>
                    {CONSECUENCIAS.map((consecuencia) => (
                        <View key={consecuencia} style={estilos.punto}>
                            <Text style={estilos.vineta}>•</Text>
                            <Text style={[texto.cuerpo, { flex: 1, color: colores.suave }]}>{consecuencia}</Text>
                        </View>
                    ))}
                </View>
                <Campo
                    etiqueta="Escribe tu contraseña para confirmar"
                    value={clave}
                    onChangeText={setClave}
                    secureTextEntry
                    autoComplete="current-password"
                    textContentType="password"
                    conError={error !== null}
                />
                {error && <Aviso>{error}</Aviso>}
                <Boton variante="peligro" icono="basura" onPress={confirmar} cargando={eliminando} deshabilitado={!clave}>
                    Eliminar mi cuenta
                </Boton>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const estilos = StyleSheet.create({
    contenido: { padding: espacio.xl, gap: espacio.xl },
    alerta: { flexDirection: "row", alignItems: "center", gap: espacio.m, padding: espacio.l, borderRadius: radio.grande, backgroundColor: colores.errorClaro },
    punto: { flexDirection: "row", gap: espacio.s },
    vineta: { fontSize: 16, color: colores.suave, lineHeight: 22 },
});
