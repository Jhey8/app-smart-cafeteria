import { useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Chip } from "@/componentes/Controles";
import { Cargando, ErrorConReintento } from "@/componentes/Estados";
import { useCarga } from "@/estado/useCarga";
import { obtenerComprobante } from "@/servicios/cafeteria";
import { colores, espacio, radio, sombra, texto } from "@/tema";
import type { Comprobante } from "@/tipos/api";
import { diaYHora, soles } from "@/utils/formato";

/**
 * La boleta o factura del pedido, como sale impresa: quién la emite, a
 * nombre de quién, qué se compró, el IGV y el total en letras.
 */
export default function VerComprobante() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { datos: comprobante, error, recargar } = useCarga(() => obtenerComprobante(Number(id)));

    if (comprobante === undefined) {
        return error === null ? <Cargando /> : <ErrorConReintento mensaje={error} alReintentar={() => void recargar()} />;
    }

    return (
        <ScrollView contentContainerStyle={estilos.contenido}>
            <View style={estilos.papel}>
                <Cabecera comprobante={comprobante} />

                <View style={estilos.caja}>
                    <Text style={estilos.tipo}>{comprobante.nombreDelTipo}</Text>
                    <Text style={estilos.numero}>{comprobante.numero}</Text>
                </View>

                <View style={{ gap: 2 }}>
                    <Text style={texto.nota}>Emitida el {diaYHora(comprobante.fechaEmision)}</Text>
                    <Text style={texto.cuerpo}>
                        {comprobante.tipo === "FACTURA" ? "Razón social" : "Cliente"}: {comprobante.receptor.nombre ?? "Clientes varios"}
                    </Text>
                    {comprobante.receptor.tipoDocumento !== "SIN_DOCUMENTO" && comprobante.receptor.numeroDocumento && (
                        <Text style={texto.cuerpo}>{`${comprobante.receptor.tipoDocumento} ${comprobante.receptor.numeroDocumento}`}</Text>
                    )}
                    {comprobante.receptor.direccion && <Text style={texto.nota}>{comprobante.receptor.direccion}</Text>}
                    {comprobante.anula && <Text style={texto.cuerpo}>Anula: {comprobante.anula.numero}</Text>}
                </View>

                <View style={estilos.lineas}>
                    {(comprobante.lineas ?? []).map((linea, indice) => (
                        <View key={indice} style={estilos.linea}>
                            <Text style={[texto.cuerpo, { flex: 1 }]}>
                                {linea.cantidad} × {linea.descripcion}
                            </Text>
                            <Text style={texto.cuerpo}>{soles(linea.importe)}</Text>
                        </View>
                    ))}
                </View>

                <View style={{ gap: espacio.xs }}>
                    <Monto etiqueta={comprobante.tasaIgv > 0 ? "Op. gravada" : "Op. exonerada"} valor={comprobante.valorVenta} />
                    <Monto etiqueta={`IGV (${comprobante.tasaIgv}%)`} valor={comprobante.igv} />
                    <Monto etiqueta="Total" valor={comprobante.total} fuerte />
                </View>

                {comprobante.montoEnLetras && <Text style={texto.nota}>SON: {comprobante.montoEnLetras}</Text>}
            </View>

            {/* Sin conexión con SUNAT todavía: se dice tal cual, sin dar por aceptado algo que nadie aceptó. */}
            {comprobante.estadoSunat === "PENDIENTE" && (
                <View style={{ alignItems: "center", gap: espacio.s }}>
                    <Chip>Pendiente de envío a SUNAT</Chip>
                </View>
            )}
            {comprobante.anuladoPor && (
                <View style={{ alignItems: "center" }}>
                    <Chip tono="error">{`Anulada con ${comprobante.anuladoPor.numero}`}</Chip>
                </View>
            )}
        </ScrollView>
    );
}

function Cabecera({ comprobante }: { comprobante: Comprobante }) {
    const { emisor } = comprobante;
    if (!emisor) {
        return null;
    }
    return (
        <View style={{ alignItems: "center", gap: 2 }}>
            <Text style={[texto.fuerte, { fontSize: 18, textAlign: "center" }]}>{emisor.nombreComercial ?? emisor.razonSocial}</Text>
            {emisor.nombreComercial && <Text style={[texto.nota, { textAlign: "center" }]}>{emisor.razonSocial}</Text>}
            <Text style={texto.nota}>RUC {emisor.ruc}</Text>
            <Text style={[texto.nota, { textAlign: "center" }]}>{emisor.direccionFiscal}</Text>
        </View>
    );
}

function Monto({ etiqueta, valor, fuerte = false }: { etiqueta: string; valor: number; fuerte?: boolean }) {
    const estilo = fuerte ? [texto.fuerte, { fontSize: 18 }] : texto.cuerpo;
    return (
        <View style={estilos.linea}>
            <Text style={estilo}>{etiqueta}</Text>
            <Text style={estilo}>{soles(valor)}</Text>
        </View>
    );
}

const estilos = StyleSheet.create({
    contenido: { padding: espacio.l, gap: espacio.l },
    papel: { backgroundColor: colores.superficie, borderRadius: radio.grande, padding: espacio.xl, gap: espacio.l, ...sombra },
    caja: { borderWidth: 1, borderColor: colores.texto, borderRadius: radio.chico, paddingVertical: espacio.s, alignItems: "center" },
    tipo: { fontSize: 13, fontWeight: "700", textTransform: "uppercase", color: colores.texto, textAlign: "center" },
    numero: { fontSize: 20, fontWeight: "800", color: colores.texto, fontVariant: ["tabular-nums"] },
    lineas: { borderTopWidth: 1, borderBottomWidth: 1, borderStyle: "dashed", borderColor: colores.borde, paddingVertical: espacio.s, gap: espacio.s },
    linea: { flexDirection: "row", justifyContent: "space-between", gap: espacio.m },
});
