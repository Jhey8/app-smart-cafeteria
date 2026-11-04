import { router, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { Boton, Chip } from "@/componentes/Controles";
import { ListaEsqueleto } from "@/componentes/Esqueleto";
import { ErrorConReintento } from "@/componentes/Estados";
import { Icono } from "@/componentes/Icono";
import { useCarga } from "@/estado/useCarga";
import { misReclamaciones } from "@/servicios/cafeteria";
import { colores, espacio, radio, texto } from "@/tema";
import type { Reclamacion } from "@/tipos/api";
import { diaYHora } from "@/utils/formato";

/**
 * El Libro de Reclamaciones: las hojas que presentó la persona, con su
 * número de constancia, el plazo y la respuesta cuando llega.
 */
export default function LibroDeReclamaciones() {
    const { datos, error, actualizando, recargar } = useCarga(misReclamaciones);

    useFocusEffect(
        useCallback(() => {
            void recargar();
        }, [recargar]),
    );

    if (datos === undefined) {
        return error === null ? <ListaEsqueleto cuantas={2} /> : <ErrorConReintento mensaje={error} alReintentar={() => void recargar()} />;
    }

    return (
        <FlatList
            style={{ backgroundColor: colores.superficie }}
            data={datos}
            keyExtractor={(hoja) => String(hoja.id)}
            contentContainerStyle={estilos.contenido}
            refreshControl={<RefreshControl refreshing={actualizando} onRefresh={() => void recargar()} tintColor={colores.acento} colors={[colores.acento]} />}
            ListHeaderComponent={
                <View style={{ gap: espacio.m, marginBottom: espacio.l }}>
                    <View style={estilos.libro}>
                        <Icono nombre="libro" color={colores.acento} tamano={28} />
                        <View style={{ flex: 1 }}>
                            <Text style={texto.fuerte}>Libro de Reclamaciones virtual</Text>
                            <Text style={texto.nota}>
                                Conforme al Código de Protección y Defensa del Consumidor. Te respondemos en un plazo máximo de 15 días hábiles.
                            </Text>
                        </View>
                    </View>
                    <Boton icono="mas" onPress={() => router.push("/reclamaciones/nueva")}>
                        Nueva hoja de reclamación
                    </Boton>
                    {datos.length > 0 && <Text style={estilos.titulo}>Tus hojas</Text>}
                </View>
            }
            renderItem={({ item }) => <Hoja hoja={item} />}
            ItemSeparatorComponent={() => <View style={estilos.separador} />}
        />
    );
}

function Hoja({ hoja }: { hoja: Reclamacion }) {
    const respondida = hoja.estado === "RESPONDIDO";
    return (
        <View style={{ gap: espacio.s, paddingVertical: espacio.l }}>
            <View style={estilos.cabecera}>
                <Text style={estilos.numero}>{hoja.numero}</Text>
                <Chip tono={respondida ? "ok" : "acento"}>{respondida ? "Respondida" : "En revisión"}</Chip>
            </View>
            <Text style={texto.nota}>
                {hoja.tipo === "RECLAMO" ? "Reclamo" : "Queja"} sobre {hoja.descripcionBien.toLowerCase()}, presentado el {diaYHora(hoja.creadoEn)}
            </Text>
            <Text style={texto.cuerpo}>{hoja.detalle}</Text>
            {respondida ? (
                <View style={estilos.respuesta}>
                    <Text style={[texto.fuerte, { color: colores.ok }]}>Respuesta de la cafetería</Text>
                    <Text style={texto.cuerpo}>{hoja.respuesta}</Text>
                    {hoja.respondidoEn && <Text style={texto.nota}>{diaYHora(hoja.respondidoEn)}</Text>}
                </View>
            ) : (
                <Text style={[texto.nota, { color: colores.calidoOscuro }]}>Te responderemos a más tardar el {fechaLarga(hoja.responderHasta)}.</Text>
            )}
        </View>
    );
}

/** "2026-10-23" → "23 de octubre". */
function fechaLarga(fecha: string): string {
    const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "setiembre", "octubre", "noviembre", "diciembre"];
    return `${Number(fecha.slice(8, 10))} de ${meses[Number(fecha.slice(5, 7)) - 1] ?? ""}`;
}

const estilos = StyleSheet.create({
    contenido: { padding: espacio.xl, paddingBottom: espacio.xxl * 2 },
    libro: { flexDirection: "row", gap: espacio.m, alignItems: "flex-start", padding: espacio.l, backgroundColor: colores.acentoClaro, borderRadius: radio.grande },
    titulo: { fontSize: 20, fontWeight: "800", color: colores.texto, marginTop: espacio.s },
    cabecera: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    numero: { fontSize: 17, fontWeight: "700", color: colores.texto, fontVariant: ["tabular-nums"] },
    respuesta: { gap: 4, padding: espacio.m, backgroundColor: colores.okClaro, borderRadius: radio.medio },
    separador: { height: StyleSheet.hairlineWidth, backgroundColor: colores.borde },
});
