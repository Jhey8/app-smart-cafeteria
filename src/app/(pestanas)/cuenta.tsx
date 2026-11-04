import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState, type ReactNode } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar } from "@/componentes/Avatar";
import { useEspacioDeLaBarra } from "@/componentes/BarraDePestanas";
import { HojaDeOpciones, type Opcion } from "@/componentes/HojaDeOpciones";
import { Icono, type NombreDeIcono } from "@/componentes/Icono";
import { entorno } from "@/config/entorno";
import { useAvisos } from "@/estado/avisos";
import { useCuenta } from "@/estado/cuenta";
import { useSesion } from "@/estado/sesion";
import { mensajeDe } from "@/servicios/api";
import { cambiarPreferencias, cerrarOtrasSesiones, quitarMiFoto, subirMiFoto } from "@/servicios/cafeteria";
import { prepararFoto } from "@/servicios/foto";
import { activarPush } from "@/servicios/push";
import { colores, espacio } from "@/tema";

const TIPOS: Record<string, string> = { ALUMNO: "Alumno", DOCENTE: "Docente", ADMINISTRATIVO: "Administrativo" };

/**
 * Mi perfil, al estilo de las apps de pedidos: títulos de sección y debajo
 * filas sueltas (ícono, texto y flecha) sobre blanco, sin tarjetas. Arriba,
 * la foto y el nombre; tocar la foto la cambia.
 */
export default function Perfil() {
    const { sesion, cerrar, abrir } = useSesion();
    const { cuenta, bandeja, ponerCuenta } = useCuenta();
    const { avisar } = useAvisos();
    const { top } = useSafeAreaInsets();
    const espacioDeLaBarra = useEspacioDeLaBarra();
    const [opcionesDeFoto, setOpcionesDeFoto] = useState(false);
    const [subiendo, setSubiendo] = useState(false);
    const [guardandoPreferencia, setGuardandoPreferencia] = useState(false);

    if (!sesion) {
        return null;
    }
    const nombres = cuenta?.nombres ?? sesion.nombres;
    const apellidos = cuenta?.apellidos ?? sesion.apellidos;

    async function elegirFoto(desde: "galeria" | "camara") {
        const opciones: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.8 };
        if (desde === "camara" && !(await ImagePicker.requestCameraPermissionsAsync()).granted) {
            Alert.alert("Sin permiso para la cámara", "Actívalo en los ajustes del teléfono para tomarte la foto.");
            return;
        }
        let resultado: ImagePicker.ImagePickerResult;
        try {
            resultado = desde === "camara" ? await ImagePicker.launchCameraAsync(opciones) : await ImagePicker.launchImageLibraryAsync(opciones);
        } catch {
            // Por ejemplo, la cámara en un simulador, o un permiso negado en los ajustes.
            Alert.alert(
                desde === "camara" ? "No se pudo abrir la cámara" : "No se pudo abrir la galería",
                "Revisa en los ajustes del teléfono que la app tenga permiso e inténtalo otra vez.",
            );
            return;
        }
        const foto = resultado.canceled ? undefined : resultado.assets[0];
        if (!foto) {
            return;
        }
        setSubiendo(true);
        try {
            // Reducida y en JPEG: una foto del teléfono puede pasar de 3 MB o venir en HEIC.
            ponerCuenta(await subirMiFoto(await prepararFoto(foto.uri)));
            avisar("Foto actualizada");
        } catch (error) {
            Alert.alert("No se pudo subir la foto", mensajeDe(error));
        } finally {
            setSubiendo(false);
        }
    }

    async function quitarFoto() {
        try {
            ponerCuenta(await quitarMiFoto());
            avisar("Foto quitada");
        } catch (error) {
            Alert.alert("No se pudo quitar la foto", mensajeDe(error));
        }
    }

    async function cambiarAvisos(quiere: boolean) {
        setGuardandoPreferencia(true);
        try {
            ponerCuenta(await cambiarPreferencias(quiere));
            if (quiere) {
                await activarPush();
            }
        } catch (error) {
            Alert.alert("No se pudo guardar", mensajeDe(error));
        } finally {
            setGuardandoPreferencia(false);
        }
    }

    function confirmarCerrarOtras() {
        Alert.alert("¿Cerrar sesión en otros dispositivos?", "Los demás teléfonos donde entraste tendrán que volver a iniciar sesión. Aquí sigues dentro.", [
            { text: "Cancelar", style: "cancel" },
            {
                text: "Cerrar las demás",
                onPress: async () => {
                    try {
                        await abrir(await cerrarOtrasSesiones());
                        avisar("Sesiones cerradas en tus otros dispositivos");
                    } catch (error) {
                        Alert.alert("No se pudo cerrar", mensajeDe(error));
                    }
                },
            },
        ]);
    }

    function confirmarSalida() {
        Alert.alert("¿Cerrar sesión?", "Para volver a pedir tendrás que entrar con tu contraseña.", [
            { text: "Cancelar", style: "cancel" },
            { text: "Cerrar sesión", style: "destructive", onPress: () => void cerrar() },
        ]);
    }

    const opcionesDeLaFoto: Opcion[] = [
        { texto: "Elegir de la galería", icono: "galeria", alElegir: () => void elegirFoto("galeria") },
        { texto: "Tomar foto", icono: "camara", alElegir: () => void elegirFoto("camara") },
        ...(cuenta?.fotoUrl ? [{ texto: "Quitar foto", icono: "basura" as const, peligrosa: true, alElegir: () => void quitarFoto() }] : []),
    ];

    return (
        <>
            <ScrollView style={{ backgroundColor: colores.superficie }} contentContainerStyle={{ paddingTop: top + espacio.l, paddingBottom: espacioDeLaBarra }}>
                <Pressable onPress={() => setOpcionesDeFoto(true)} disabled={subiendo} accessibilityRole="button" accessibilityLabel="Cambiar tu foto" style={estilos.cabecera}>
                    <View>
                        <Avatar nombres={nombres} apellidos={apellidos} fotoUrl={cuenta?.fotoUrl} tamano={72} />
                        <View style={estilos.camara}>
                            {subiendo ? <ActivityIndicator size="small" color={colores.superficie} /> : <Icono nombre="camara" color={colores.superficie} tamano={13} />}
                        </View>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={estilos.nombre} numberOfLines={2}>
                            {nombres} {apellidos}
                        </Text>
                        <Text style={estilos.subtitulo}>
                            {TIPOS[sesion.tipo] ?? sesion.tipo}, {sesion.codigo}
                        </Text>
                    </View>
                </Pressable>

                <Seccion titulo="Perfil">
                    <Fila icono="ficha" texto="Información personal" onPress={() => router.push("/cuenta/datos")} />
                    <Fila icono="candado" texto="Cambiar contraseña" onPress={() => router.push("/cuenta/clave")} />
                </Seccion>

                <Seccion titulo="Actividad">
                    <Fila icono="pedidos" texto="Mis pedidos" onPress={() => router.push("/pedidos")} />
                    <Fila
                        icono="campana"
                        texto="Notificaciones"
                        contador={bandeja?.noLeidas ?? 0}
                        onPress={() => router.push("/notificaciones")}
                    />
                </Seccion>

                <Seccion titulo="Configuración">
                    <View style={estilos.fila}>
                        <Icono nombre="vibrar" color={colores.texto} tamano={24} />
                        <View style={{ flex: 1 }}>
                            <Text style={estilos.textoDeFila}>Avisos en el teléfono</Text>
                            <Text style={estilos.ayuda}>Cuando paguen y cuando tu pedido esté listo</Text>
                        </View>
                        <Switch
                            value={cuenta?.notificacionesPush ?? true}
                            onValueChange={(valor) => void cambiarAvisos(valor)}
                            disabled={guardandoPreferencia || cuenta === null}
                            trackColor={{ true: colores.acento, false: colores.borde }}
                            accessibilityLabel="Avisos en el teléfono"
                        />
                    </View>
                </Seccion>

                <Seccion titulo="Ayuda y legal">
                    <Fila icono="libro" texto="Libro de reclamaciones" onPress={() => router.push("/reclamaciones")} />
                    <Fila icono="legal" texto="Información legal" onPress={() => router.push("/legal")} />
                </Seccion>

                <View style={{ marginTop: espacio.l }}>
                    <Fila icono="dispositivos" texto="Cerrar sesión en otros dispositivos" onPress={confirmarCerrarOtras} />
                    <Fila icono="salir" texto="Cerrar sesión" onPress={confirmarSalida} />
                </View>

                <Pressable onPress={() => router.push("/cuenta/eliminar")} accessibilityRole="button" style={estilos.eliminar}>
                    <Text style={estilos.textoEliminar}>Eliminar cuenta</Text>
                    <Icono nombre="siguiente" color={colores.suave} tamano={16} />
                </Pressable>

                <Text style={estilos.version}>
                    UTP Smart Cafetería, versión 1.0.0{"\n"}Servidor: {entorno.urlApi}
                </Text>
            </ScrollView>

            <HojaDeOpciones visible={opcionesDeFoto} titulo="Tu foto de perfil" opciones={opcionesDeLaFoto} alCerrar={() => setOpcionesDeFoto(false)} />
        </>
    );
}

function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
    return (
        <View style={estilos.seccion}>
            <Text style={estilos.tituloDeSeccion}>{titulo}</Text>
            {children}
        </View>
    );
}

function Fila({ icono, texto, contador = 0, onPress }: { icono: NombreDeIcono; texto: string; contador?: number; onPress: () => void }) {
    return (
        <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [estilos.fila, pressed && { backgroundColor: colores.fondo }]}>
            <Icono nombre={icono} color={colores.texto} tamano={24} />
            <Text style={[estilos.textoDeFila, { flex: 1 }]}>{texto}</Text>
            {contador > 0 && (
                <View style={estilos.contador}>
                    <Text style={estilos.textoDelContador}>{contador > 9 ? "9+" : contador}</Text>
                </View>
            )}
            <Icono nombre="siguiente" color={colores.texto} tamano={18} />
        </Pressable>
    );
}

const estilos = StyleSheet.create({
    cabecera: { flexDirection: "row", alignItems: "center", gap: espacio.l, paddingHorizontal: espacio.xl, paddingBottom: espacio.s },
    camara: {
        position: "absolute",
        right: -2,
        bottom: -2,
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: colores.acento,
        borderWidth: 2.5,
        borderColor: colores.superficie,
        alignItems: "center",
        justifyContent: "center",
    },
    nombre: { fontSize: 24, fontWeight: "800", color: colores.texto },
    subtitulo: { fontSize: 15, color: colores.suave, marginTop: 2 },
    seccion: { marginTop: espacio.xl },
    tituloDeSeccion: { fontSize: 22, fontWeight: "800", color: colores.texto, paddingHorizontal: espacio.xl, marginBottom: espacio.xs },
    fila: { flexDirection: "row", alignItems: "center", gap: espacio.l, paddingHorizontal: espacio.xl, paddingVertical: 17 },
    textoDeFila: { fontSize: 17, color: colores.texto },
    ayuda: { fontSize: 13, color: colores.suave, marginTop: 1 },
    contador: { minWidth: 22, height: 22, borderRadius: 11, backgroundColor: colores.calido, alignItems: "center", justifyContent: "center", paddingHorizontal: 6 },
    textoDelContador: { fontSize: 12, fontWeight: "800", color: colores.acentoProfundo },
    eliminar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: espacio.xl, paddingVertical: 17, marginTop: espacio.m },
    textoEliminar: { fontSize: 16, color: colores.error },
    version: { fontSize: 12, color: colores.suave, textAlign: "center", marginTop: espacio.xl, lineHeight: 18 },
});
