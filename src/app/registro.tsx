import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { PantallaDeAcceso } from "@/componentes/CabeceraDeAcceso";
import { Casilla } from "@/componentes/Casilla";
import { Aviso, Boton, Campo } from "@/componentes/Controles";
import { useSesion } from "@/estado/sesion";
import { ErrorApi, mensajeDe } from "@/servicios/api";
import { registrarme } from "@/servicios/cafeteria";
import { colores, espacio } from "@/tema";

/*
 * El correo solo se pide con DNI: con un código UTP el backend usa el
 * institucional (codigo@utp.edu.pe) e ignora lo que se escriba, para que
 * nadie registre el código de otro con un correo propio.
 */
const ES_DNI = /^\d{8}$/;

/** Crear cuenta: el mismo diseño que Entrar, con el logo más chico para que quepa el formulario. */
export default function Registro() {
    const { abrir } = useSesion();
    const { height } = useWindowDimensions();
    const [valores, setValores] = useState({ identificador: "", nombres: "", apellidos: "", correo: "", telefono: "", clave: "" });
    const [aceptaTerminos, setAceptaTerminos] = useState(false);
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState<{ mensaje: string; campo: string | null } | null>(null);

    const esDni = ES_DNI.test(valores.identificador.trim());
    const cambiar = (campo: keyof typeof valores) => (valor: string) => setValores((actuales) => ({ ...actuales, [campo]: valor }));
    const conError = (campo: string) => error?.campo === campo;

    async function enviar() {
        setEnviando(true);
        setError(null);
        try {
            await abrir(
                await registrarme({
                    identificador: valores.identificador.trim(),
                    nombres: valores.nombres.trim(),
                    apellidos: valores.apellidos.trim(),
                    correo: esDni && valores.correo.trim() !== "" ? valores.correo.trim() : null,
                    telefono: valores.telefono.trim() === "" ? null : valores.telefono.trim(),
                    clave: valores.clave,
                    aceptaTerminos,
                }),
            );
        } catch (fallo) {
            setError({ mensaje: mensajeDe(fallo), campo: fallo instanceof ErrorApi ? fallo.campo : null });
            setEnviando(false);
        }
    }

    return (
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colores.superficie }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" bounces={false}>
                <PantallaDeAcceso proporcion={0.26} altoDePantalla={height} alVolver={() => router.back()}>
                    <Text style={estilos.titulo}>Crea tu cuenta</Text>
                    <Text style={estilos.nota}>Con tu código UTP, tu correo es el de la universidad. Si no tienes código, usa tu DNI.</Text>
                    <Campo
                        sobreAzul
                        redondo
                        etiqueta="Código UTP o DNI"
                        value={valores.identificador}
                        onChangeText={cambiar("identificador")}
                        placeholder="U1533148"
                        autoCapitalize="characters"
                        autoCorrect={false}
                        conError={conError("identificador")}
                    />
                    <View style={estilos.fila}>
                        <View style={{ flex: 1 }}>
                            <Campo
                                sobreAzul
                                redondo
                                etiqueta="Nombres"
                                value={valores.nombres}
                                onChangeText={cambiar("nombres")}
                                autoComplete="given-name"
                                conError={conError("nombres")}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Campo
                                sobreAzul
                                redondo
                                etiqueta="Apellidos"
                                value={valores.apellidos}
                                onChangeText={cambiar("apellidos")}
                                autoComplete="family-name"
                                conError={conError("apellidos")}
                            />
                        </View>
                    </View>
                    {esDni && (
                        <Campo
                            sobreAzul
                            redondo
                            etiqueta="Correo"
                            value={valores.correo}
                            onChangeText={cambiar("correo")}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                            conError={conError("correo")}
                        />
                    )}
                    <Campo
                        sobreAzul
                        redondo
                        etiqueta="Celular (opcional)"
                        value={valores.telefono}
                        onChangeText={cambiar("telefono")}
                        keyboardType="phone-pad"
                        autoComplete="tel"
                        conError={conError("telefono")}
                    />
                    <Campo
                        sobreAzul
                        redondo
                        etiqueta="Contraseña"
                        value={valores.clave}
                        onChangeText={cambiar("clave")}
                        secureTextEntry
                        autoComplete="new-password"
                        textContentType="newPassword"
                        ayuda="Al menos 8 caracteres, con mayúscula, minúscula, número y un carácter especial (! @ # $ -)."
                        conError={conError("clave")}
                    />
                    <Casilla sobreAzul marcada={aceptaTerminos} alCambiar={setAceptaTerminos} conError={error?.campo === "aceptaTerminos"}>
                        <Text style={estilos.nota}>
                            Acepto los{" "}
                            <Text style={estilos.enlace} onPress={() => router.push("/legal")}>
                                Términos de uso
                            </Text>{" "}
                            y la{" "}
                            <Text style={estilos.enlace} onPress={() => router.push("/legal")}>
                                Política de privacidad
                            </Text>
                            , y el tratamiento de mis datos según la Ley 29733.
                        </Text>
                    </Casilla>
                    {error && <Aviso>{error.mensaje}</Aviso>}
                    <Boton variante="calido" redondo onPress={() => void enviar()} cargando={enviando}>
                        Crear cuenta
                    </Boton>
                </PantallaDeAcceso>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const estilos = StyleSheet.create({
    titulo: { fontSize: 26, fontWeight: "800", color: colores.superficie, textAlign: "center" },
    nota: { fontSize: 14, lineHeight: 20, color: "rgba(255, 255, 255, 0.85)", textAlign: "center" },
    fila: { flexDirection: "row", gap: espacio.m },
    enlace: { color: colores.calido, fontWeight: "700" },
});
