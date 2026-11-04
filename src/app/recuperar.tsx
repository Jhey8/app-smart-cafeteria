import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions } from "react-native";
import { PantallaDeAcceso } from "@/componentes/CabeceraDeAcceso";
import { Aviso, Boton, Campo } from "@/componentes/Controles";
import { useSesion } from "@/estado/sesion";
import { ErrorApi, mensajeDe } from "@/servicios/api";
import { cambiarClaveConCodigo, pedirCodigoDeRecuperacion } from "@/servicios/cafeteria";
import { colores } from "@/tema";

/**
 * Olvidé mi contraseña. Primero el código UTP, el DNI o el correo; después
 * el código de 6 dígitos que llega al correo y la contraseña nueva. Al
 * terminar, la persona queda dentro de la app y los demás teléfonos donde
 * tenía la sesión abierta quedan fuera.
 */
export default function Recuperar() {
    const { abrir } = useSesion();
    const { height } = useWindowDimensions();
    const { identificador: escrito } = useLocalSearchParams<{ identificador?: string }>();
    const [paso, setPaso] = useState<"pedir" | "cambiar">("pedir");
    const [identificador, setIdentificador] = useState(escrito ?? "");
    const [codigo, setCodigo] = useState("");
    const [clave, setClave] = useState("");
    const [enviando, setEnviando] = useState(false);
    const [aviso, setAviso] = useState<string | null>(null);
    const [error, setError] = useState<{ mensaje: string; campo: string | null } | null>(null);

    async function pedirCodigo() {
        setEnviando(true);
        setError(null);
        try {
            await pedirCodigoDeRecuperacion(identificador.trim());
            setPaso("cambiar");
            setCodigo("");
            setAviso("Si la cuenta existe, te llegó un código de 6 dígitos al correo. Vale 15 minutos.");
        } catch (fallo) {
            setError({ mensaje: mensajeDe(fallo), campo: fallo instanceof ErrorApi ? fallo.campo : null });
        } finally {
            setEnviando(false);
        }
    }

    async function cambiar() {
        setEnviando(true);
        setError(null);
        try {
            await abrir(await cambiarClaveConCodigo(identificador.trim(), codigo, clave));
        } catch (fallo) {
            setError({ mensaje: mensajeDe(fallo), campo: fallo instanceof ErrorApi ? fallo.campo : null });
            setEnviando(false);
        }
    }

    return (
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colores.superficie }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" bounces={false}>
                <PantallaDeAcceso proporcion={0.3} altoDePantalla={height} alVolver={() => router.back()}>
                    <Text role="heading" aria-level={1} style={estilos.titulo}>
                        Recupera tu contraseña
                    </Text>

                    {paso === "pedir" ? (
                        <>
                            <Text style={estilos.texto}>Te enviaremos un código al correo de tu cuenta.</Text>
                            <Campo
                                sobreAzul
                                redondo
                                etiqueta="Código UTP, DNI o correo"
                                value={identificador}
                                onChangeText={setIdentificador}
                                autoCapitalize="none"
                                autoCorrect={false}
                                autoComplete="username"
                                textContentType="username"
                                returnKeyType="send"
                                onSubmitEditing={() => void pedirCodigo()}
                                conError={error?.campo === "identificador"}
                            />
                            {error && <Aviso>{error.mensaje}</Aviso>}
                            <Boton variante="calido" redondo onPress={() => void pedirCodigo()} cargando={enviando} deshabilitado={!identificador.trim()}>
                                Enviarme un código
                            </Boton>
                        </>
                    ) : (
                        <>
                            {aviso && <Text style={estilos.texto}>{aviso}</Text>}
                            <Campo
                                sobreAzul
                                redondo
                                etiqueta="Código"
                                value={codigo}
                                onChangeText={(texto) => setCodigo(texto.replace(/\D/g, "").slice(0, 6))}
                                keyboardType="number-pad"
                                maxLength={6}
                                autoComplete="one-time-code"
                                textContentType="oneTimeCode"
                                placeholder="123456"
                                conError={error?.campo === "codigo"}
                            />
                            <Campo
                                sobreAzul
                                redondo
                                etiqueta="Contraseña nueva"
                                value={clave}
                                onChangeText={setClave}
                                secureTextEntry
                                autoComplete="new-password"
                                textContentType="newPassword"
                                ayuda="Al menos 8 caracteres, con mayúscula, minúscula, número y un carácter especial (! @ # $ -)."
                                conError={error?.campo === "claveNueva"}
                            />
                            {error && <Aviso>{error.mensaje}</Aviso>}
                            <Boton variante="calido" redondo onPress={() => void cambiar()} cargando={enviando} deshabilitado={codigo.length !== 6 || !clave}>
                                Cambiar y entrar
                            </Boton>
                            <Pressable onPress={() => void pedirCodigo()} disabled={enviando} accessibilityRole="button" hitSlop={8}>
                                <Text style={estilos.enlace}>¿No te llegó? Pide otro código</Text>
                            </Pressable>
                        </>
                    )}
                </PantallaDeAcceso>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const estilos = StyleSheet.create({
    titulo: { fontSize: 26, fontWeight: "800", color: colores.superficie, textAlign: "center" },
    texto: { fontSize: 15, color: "rgba(255, 255, 255, 0.9)", textAlign: "center", lineHeight: 21 },
    enlace: { fontSize: 15, fontWeight: "800", color: colores.calido, textAlign: "center" },
});
