import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { Aviso, Boton, Campo } from "@/componentes/Controles";
import { Cargando } from "@/componentes/Estados";
import { useAvisos } from "@/estado/avisos";
import { useCuenta } from "@/estado/cuenta";
import { ErrorApi, mensajeDe } from "@/servicios/api";
import { editarCuenta } from "@/servicios/cafeteria";
import { espacio, texto } from "@/tema";
import type { Cuenta } from "@/tipos/api";

/** Los datos que la persona puede cambiar. El código no se cambia, y el correo UTP tampoco. */
export default function DatosDeLaCuenta() {
    const { cuenta } = useCuenta();
    return cuenta === null ? <Cargando /> : <Formulario cuenta={cuenta} />;
}

function Formulario({ cuenta }: { cuenta: Cuenta }) {
    const { ponerCuenta } = useCuenta();
    const { avisar } = useAvisos();
    const [valores, setValores] = useState({
        nombres: cuenta.nombres,
        apellidos: cuenta.apellidos,
        correo: cuenta.correo,
        telefono: cuenta.telefono ?? "",
    });
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState<{ mensaje: string; campo: string | null } | null>(null);
    const cambiar = (campo: keyof typeof valores) => (valor: string) => setValores((actuales) => ({ ...actuales, [campo]: valor }));
    const conError = (campo: string) => error?.campo === campo;

    async function guardar() {
        setGuardando(true);
        setError(null);
        try {
            ponerCuenta(
                await editarCuenta({
                    nombres: valores.nombres.trim(),
                    apellidos: valores.apellidos.trim(),
                    correo: cuenta.correoEditable ? valores.correo.trim() : null,
                    telefono: valores.telefono.trim() === "" ? null : valores.telefono.trim(),
                }),
            );
            avisar("Datos guardados");
            router.back();
        } catch (fallo) {
            setError({ mensaje: mensajeDe(fallo), campo: fallo instanceof ErrorApi ? fallo.campo : null });
            setGuardando(false);
        }
    }

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <ScrollView contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled">
                <View style={estilos.fila}>
                    <View style={{ flex: 1 }}>
                        <Campo etiqueta="Nombres" value={valores.nombres} onChangeText={cambiar("nombres")} autoComplete="given-name" conError={conError("nombres")} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Campo etiqueta="Apellidos" value={valores.apellidos} onChangeText={cambiar("apellidos")} autoComplete="family-name" conError={conError("apellidos")} />
                    </View>
                </View>
                <Campo
                    etiqueta="Correo"
                    value={valores.correo}
                    onChangeText={cambiar("correo")}
                    editable={cuenta.correoEditable}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    ayuda={cuenta.correoEditable ? undefined : "Es tu correo de la UTP: va unido a tu código y no se cambia."}
                    conError={conError("correo")}
                />
                <Campo
                    etiqueta="Celular"
                    value={valores.telefono}
                    onChangeText={cambiar("telefono")}
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    placeholder="Opcional"
                    conError={conError("telefono")}
                />
                <Text style={texto.nota}>Tu código ({cuenta.codigo}) es con el que entras y no se puede cambiar.</Text>
                {error && <Aviso>{error.mensaje}</Aviso>}
                <Boton onPress={() => void guardar()} cargando={guardando}>
                    Guardar
                </Boton>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const estilos = StyleSheet.create({
    contenido: { padding: espacio.xl, gap: espacio.l },
    fila: { flexDirection: "row", gap: espacio.m },
});
