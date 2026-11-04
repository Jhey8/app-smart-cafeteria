import { Link } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { PantallaDeAcceso } from "@/componentes/CabeceraDeAcceso";
import { Aviso, Boton, Campo } from "@/componentes/Controles";
import { useSesion } from "@/estado/sesion";
import { ErrorApi, mensajeDe } from "@/servicios/api";
import { entrar } from "@/servicios/cafeteria";
import { colores, espacio } from "@/tema";

/**
 * La entrada: el logo arriba, que baja al abrir la app, y abajo, dentro del
 * bloque azul, el código UTP (o el DNI) y la contraseña. No hay "continuar
 * con Google": la cuenta va unida al código de la universidad.
 */
export default function Entrar() {
    const { abrir } = useSesion();
    const { height } = useWindowDimensions();
    const [identificador, setIdentificador] = useState("");
    const [clave, setClave] = useState("");
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState<{ mensaje: string; campo: string | null } | null>(null);

    async function enviar() {
        setEnviando(true);
        setError(null);
        try {
            await abrir(await entrar(identificador.trim(), clave));
        } catch (fallo) {
            setError({ mensaje: mensajeDe(fallo), campo: fallo instanceof ErrorApi ? fallo.campo : null });
            setEnviando(false);
        }
    }

    return (
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colores.superficie }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" bounces={false}>
                <PantallaDeAcceso proporcion={0.42} altoDePantalla={height}>
                    <Text style={estilos.titulo}>Inicia sesión</Text>
                    <Campo
                        sobreAzul
                        redondo
                        etiqueta="Código UTP o DNI"
                        value={identificador}
                        onChangeText={setIdentificador}
                        placeholder="U1533148"
                        autoCapitalize="characters"
                        autoCorrect={false}
                        autoComplete="username"
                        textContentType="username"
                        returnKeyType="next"
                        conError={error?.campo === "identificador"}
                    />
                    <Campo
                        sobreAzul
                        redondo
                        etiqueta="Contraseña"
                        value={clave}
                        onChangeText={setClave}
                        secureTextEntry
                        autoComplete="current-password"
                        textContentType="password"
                        returnKeyType="go"
                        onSubmitEditing={() => void enviar()}
                        conError={error?.campo === "clave"}
                    />
                    {error && <Aviso>{error.mensaje}</Aviso>}
                    <Boton variante="calido" redondo onPress={() => void enviar()} cargando={enviando} deshabilitado={!identificador || !clave}>
                        Entrar
                    </Boton>
                    <Link href={{ pathname: "/recuperar", params: { identificador: identificador.trim() } }} style={estilos.olvide}>
                        ¿Olvidaste tu contraseña?
                    </Link>

                    <View style={estilos.pie}>
                        <Text style={estilos.textoDelPie}>¿Primera vez?</Text>
                        <Link href="/registro" style={estilos.enlace}>
                            Crea tu cuenta
                        </Link>
                    </View>
                    <Link href="/legal" style={estilos.legal}>
                        Términos y privacidad
                    </Link>
                </PantallaDeAcceso>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const estilos = StyleSheet.create({
    titulo: { fontSize: 26, fontWeight: "800", color: colores.superficie, textAlign: "center" },
    pie: { flexDirection: "row", justifyContent: "center", gap: espacio.xs },
    textoDelPie: { fontSize: 15, color: "rgba(255, 255, 255, 0.85)" },
    enlace: { fontSize: 15, fontWeight: "800", color: colores.calido },
    olvide: { fontSize: 15, fontWeight: "700", color: colores.superficie, textAlign: "center" },
    legal: { fontSize: 13, color: "rgba(255, 255, 255, 0.75)", textAlign: "center", textDecorationLine: "underline" },
});
