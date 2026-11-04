import { router, usePathname } from "expo-router";
import { useState } from "react";
import { Alert, Modal, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCuenta } from "@/estado/cuenta";
import { useSesion } from "@/estado/sesion";
import { mensajeDe } from "@/servicios/api";
import { aceptarTerminos } from "@/servicios/cafeteria";
import { colores, espacio, texto } from "@/tema";
import { Boton } from "./Controles";
import { Icono } from "./Icono";

/**
 * Las cuentas creadas antes de los términos tienen que aceptarlos para
 * seguir (Ley 29733): sin eso no hay consentimiento para tratar sus datos.
 * La hoja se aparta mientras se leen en Información legal y vuelve al salir.
 */
export function PuertaDeTerminos() {
    const { cuenta, ponerCuenta } = useCuenta();
    const { cerrar } = useSesion();
    const { bottom } = useSafeAreaInsets();
    const enLegal = usePathname() === "/legal";
    const [aceptando, setAceptando] = useState(false);
    const visible = cuenta !== null && !cuenta.terminosAceptadosEn && !enLegal;

    async function aceptar() {
        setAceptando(true);
        try {
            ponerCuenta(await aceptarTerminos());
        } catch (error) {
            Alert.alert("No se pudo guardar", mensajeDe(error));
        } finally {
            setAceptando(false);
        }
    }

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={estilos.fondo}>
                <View style={[estilos.hoja, { paddingBottom: Math.max(bottom, espacio.xl) }]}>
                    <View style={estilos.icono}>
                        <Icono nombre="legal" color={colores.acento} tamano={30} />
                    </View>
                    <Text style={[texto.subtitulo, { textAlign: "center" }]}>Actualizamos nuestros términos</Text>
                    <Text style={[texto.cuerpo, { textAlign: "center", color: colores.suave }]}>
                        Para seguir usando la app, acepta los Términos de uso y la Política de privacidad, que explican cómo usamos tus datos
                        según la Ley 29733.
                    </Text>
                    <Boton onPress={() => void aceptar()} cargando={aceptando}>
                        Acepto
                    </Boton>
                    <Boton variante="secundario" onPress={() => router.push("/legal")}>
                        Leer los términos
                    </Boton>
                    <Boton variante="peligro" onPress={() => void cerrar()}>
                        No acepto, cerrar sesión
                    </Boton>
                </View>
            </View>
        </Modal>
    );
}

const estilos = StyleSheet.create({
    fondo: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(20, 23, 31, 0.45)" },
    hoja: { backgroundColor: colores.superficie, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: espacio.xl, gap: espacio.m },
    icono: { alignSelf: "center", width: 60, height: 60, borderRadius: 30, backgroundColor: colores.acentoClaro, alignItems: "center", justifyContent: "center" },
});
