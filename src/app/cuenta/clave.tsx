import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from "react-native";
import { Aviso, Boton, Campo } from "@/componentes/Controles";
import { useAvisos } from "@/estado/avisos";
import { useSesion } from "@/estado/sesion";
import { ErrorApi, mensajeDe } from "@/servicios/api";
import { cambiarClave } from "@/servicios/cafeteria";
import { espacio } from "@/tema";

/**
 * Pide la actual: un teléfono desbloqueado y olvidado no debe bastar para
 * quedarse con la cuenta. Al cambiarla se cierran las sesiones de los otros
 * teléfonos. Las reglas de la nueva son las del registro y las
 * aplica el backend; aquí solo se comprueba que se escribió igual dos veces.
 */
export default function CambiarClave() {
    const { avisar } = useAvisos();
    const { abrir } = useSesion();
    const [actual, setActual] = useState("");
    const [nueva, setNueva] = useState("");
    const [repetida, setRepetida] = useState("");
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState<{ mensaje: string; campo: string | null } | null>(null);

    async function guardar() {
        if (nueva !== repetida) {
            setError({ mensaje: "La contraseña nueva no coincide en los dos campos.", campo: "repetida" });
            return;
        }
        setGuardando(true);
        setError(null);
        try {
            // Las demás sesiones quedan cerradas; este teléfono sigue con la nueva.
            await abrir(await cambiarClave(actual, nueva));
            avisar("Contraseña cambiada");
            router.back();
        } catch (fallo) {
            setError({ mensaje: mensajeDe(fallo), campo: fallo instanceof ErrorApi ? fallo.campo : null });
            setGuardando(false);
        }
    }

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <ScrollView contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled">
                <Campo
                    etiqueta="Contraseña actual"
                    value={actual}
                    onChangeText={setActual}
                    secureTextEntry
                    autoComplete="current-password"
                    textContentType="password"
                    conError={error?.campo === "claveActual"}
                />
                <Campo
                    etiqueta="Contraseña nueva"
                    value={nueva}
                    onChangeText={setNueva}
                    secureTextEntry
                    autoComplete="new-password"
                    textContentType="newPassword"
                    ayuda="Al menos 8 caracteres, con mayúscula, minúscula, número y un carácter especial (! @ # $ -)."
                    conError={error?.campo === "claveNueva"}
                />
                <Campo
                    etiqueta="Repite la contraseña nueva"
                    value={repetida}
                    onChangeText={setRepetida}
                    secureTextEntry
                    autoComplete="new-password"
                    textContentType="newPassword"
                    conError={error?.campo === "repetida"}
                />
                {error && <Aviso>{error.mensaje}</Aviso>}
                <Boton onPress={() => void guardar()} cargando={guardando} deshabilitado={!actual || !nueva || !repetida}>
                    Cambiar contraseña
                </Boton>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const estilos = StyleSheet.create({
    contenido: { padding: espacio.xl, gap: espacio.l },
});
