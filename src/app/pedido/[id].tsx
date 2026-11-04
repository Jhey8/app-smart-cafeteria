import { router, useLocalSearchParams } from "expo-router";
import type { ReactNode } from "react";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Boton, Chip } from "@/componentes/Controles";
import { CodigoQr } from "@/componentes/CodigoQr";
import { Cargando, ErrorConReintento } from "@/componentes/Estados";
import { CuentaRegresiva } from "@/componentes/CuentaRegresiva";
import { Icono } from "@/componentes/Icono";
import { LineaDeAvance } from "@/componentes/LineaDeAvance";
import { entorno } from "@/config/entorno";
import { useCarga } from "@/estado/useCarga";
import { mensajeDe } from "@/servicios/api";
import { cancelarPedido, consultarPedido } from "@/servicios/cafeteria";
import { colores, espacio, radio, sombra, texto } from "@/tema";
import type { EstadoDelPedido } from "@/tipos/api";
import { ESTADOS, hora, sigueEnCurso, soles } from "@/utils/formato";

/**
 * Cómo va el pedido. Mientras puede cambiar se pregunta cada pocos segundos;
 * al entregarse o cancelarse se deja de preguntar.
 *
 * En la app se paga en línea ("Pagar ahora"). Cuando la pasarela confirma el
 * pago llega el número de recojo (A-14) y aparece aquí solo. El panel sigue
 * pudiendo cobrar en caja si hace falta, pero la app no lo ofrece.
 */
export default function Seguimiento() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const idPedido = Number(id);
    const { datos: pedido, error, recargar } = useCarga(
        () => consultarPedido(idPedido),
        entorno.segundosEntreConsultas,
        (actual) => sigueEnCurso(actual.estado),
    );

    const [cancelando, setCancelando] = useState(false);

    function confirmarCancelacion() {
        Alert.alert("¿Cancelar este pedido?", "Todavía no lo pagaste. Las porciones vuelven al menú y puedes pedir otra cosa.", [
            { text: "No", style: "cancel" },
            {
                text: "Sí, cancelar",
                style: "destructive",
                onPress: async () => {
                    setCancelando(true);
                    try {
                        await cancelarPedido(idPedido);
                        await recargar();
                    } catch (fallo) {
                        Alert.alert("No se pudo cancelar", mensajeDe(fallo));
                    } finally {
                        setCancelando(false);
                    }
                },
            },
        ]);
    }

    if (pedido === undefined) {
        return error === null ? <Cargando /> : <ErrorConReintento mensaje={error} alReintentar={() => void recargar()} />;
    }

    return (
        <ScrollView contentContainerStyle={estilos.contenido}>
            <Contenido pedido={pedido} />
            {pedido.estado !== "CANCELADO" && <LineaDeAvance pedido={pedido} />}
            {pedido.items.length > 0 && (
                <View style={estilos.resumen}>
                    <Text style={[texto.fuerte, { paddingTop: espacio.m }]}>Tu pedido</Text>
                    {pedido.items.map((item) => (
                        <Fila key={item.idProducto} etiqueta={`${item.cantidad} × ${item.producto}`}>
                            <Text style={texto.cuerpo}>{soles(item.subtotal)}</Text>
                        </Fila>
                    ))}
                </View>
            )}
            <View style={estilos.resumen}>
                <Fila etiqueta="Estado">
                    <Chip tono={ESTADOS[pedido.estado].tono}>{ESTADOS[pedido.estado].texto}</Chip>
                </Fila>
                <Fila etiqueta="Total">
                    <Text style={texto.fuerte}>{soles(pedido.total)}</Text>
                </Fila>
                {pedido.pagadoEn && (
                    <Fila etiqueta="Pagado a las">
                        <Text style={texto.cuerpo}>{hora(pedido.pagadoEn)}</Text>
                    </Fila>
                )}
                {pedido.comprobante && (
                    <Pressable
                        onPress={() => router.push(`/comprobante/${pedido.idPedido}`)}
                        accessibilityRole="button"
                        accessibilityLabel={`Ver ${pedido.comprobante.tipo === "FACTURA" ? "factura" : "boleta"} ${pedido.comprobante.numero}`}
                        style={({ pressed }) => [estilos.fila, pressed && { opacity: 0.6 }]}
                    >
                        <Text style={texto.nota}>{pedido.comprobante.tipo === "FACTURA" ? "Factura" : "Boleta"}</Text>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: espacio.xs }}>
                            <Text style={[texto.cuerpo, { color: colores.acento }]}>{pedido.comprobante.numero}</Text>
                            <Icono nombre="siguiente" color={colores.acento} tamano={16} />
                        </View>
                    </Pressable>
                )}
            </View>
            {pedido.estado === "RECIBIDO" && (
                <Boton onPress={() => router.push({ pathname: "/pago/[id]", params: { id: String(pedido.idPedido), total: String(pedido.total) } })}>
                    {`Pagar ahora ${soles(pedido.total)}`}
                </Boton>
            )}
            {pedido.estado === "RECIBIDO" && (
                <Boton variante="peligro" icono="cerrar" onPress={confirmarCancelacion} cargando={cancelando}>
                    Cancelar pedido
                </Boton>
            )}
            <Boton variante="secundario" onPress={() => router.dismissTo("/")}>
                Volver al inicio
            </Boton>
        </ScrollView>
    );
}

function Contenido({ pedido }: { pedido: EstadoDelPedido }) {
    switch (pedido.estado) {
        case "RECIBIDO":
            return (
                <Tarjeta>
                    <Text style={texto.subtitulo}>Falta pagar</Text>
                    <Text style={estilos.total}>{soles(pedido.total)}</Text>
                    <Text style={[texto.cuerpo, estilos.centrado]}>Tu pedido entra a la cocina apenas pagues. Ahí mismo aparece tu número.</Text>
                    <Text style={[texto.nota, estilos.centrado]}>Si no pagas en 10 minutos, el pedido se cancela solo.</Text>
                </Tarjeta>
            );
        case "PAGADO":
        case "PREPARANDO": {
            return (
                <Tarjeta>
                    <Text style={texto.cuerpo}>Tu número es</Text>
                    <Text style={estilos.numero}>{pedido.numero}</Text>
                    <Text style={[texto.fuerte, estilos.centrado]}>{pedido.estado === "PAGADO" ? "Tu pedido está en cola" : "Lo están preparando"}</Text>
                    {pedido.listoEstimadoEn && <CuentaRegresiva listoEstimadoEn={pedido.listoEstimadoEn} />}
                    <Text style={[texto.nota, estilos.centrado]}>
                        Te avisamos cuando esté listo, y aquí aparecerá el QR para recogerlo en el mostrador.
                    </Text>
                </Tarjeta>
            );
        }
        case "LISTO":
            return (
                <Tarjeta tono="ok">
                    <Text style={[texto.subtitulo, { color: colores.ok }]}>¡Tu pedido está listo!</Text>
                    <Text style={estilos.numero}>{pedido.numero}</Text>
                    {pedido.codigoRecojo ? (
                        <>
                            <CodigoQr texto={pedido.codigoRecojo} tamano={220} descripcion="QR para recoger tu pedido" />
                            <Text style={[texto.cuerpo, estilos.centrado]}>Muestra este QR en el mostrador para recogerlo.</Text>
                        </>
                    ) : (
                        <Text style={[texto.cuerpo, estilos.centrado]}>Acércate al recojo y muestra tu número.</Text>
                    )}
                </Tarjeta>
            );
        case "ENTREGADO":
            return (
                <Tarjeta>
                    <Icono nombre="listo" color={colores.acento} tamano={44} />
                    <Text style={texto.subtitulo}>Entregado</Text>
                    <Text style={[texto.cuerpo, estilos.centrado]}>¡Buen provecho! Pedido {pedido.numero}.</Text>
                </Tarjeta>
            );
        case "CANCELADO":
            return (
                <Tarjeta tono="error">
                    <Icono nombre="cerrar" color={colores.error} tamano={44} />
                    <Text style={[texto.subtitulo, { color: colores.error }]}>Pedido cancelado</Text>
                    <Text style={[texto.cuerpo, estilos.centrado]}>
                        {pedido.pagadoEn ? "Si tienes dudas sobre tu pago, acércate a la cafetería." : "No se registró el pago a tiempo. Puedes volver a pedir desde el menú."}
                    </Text>
                </Tarjeta>
            );
    }
}

function Tarjeta({ children, tono }: { children: ReactNode; tono?: "ok" | "error" }) {
    const borde = tono === "ok" ? colores.ok : tono === "error" ? colores.error : "transparent";
    return <View style={[estilos.tarjeta, { borderColor: borde }]}>{children}</View>;
}

function Fila({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
    return (
        <View style={estilos.fila}>
            <Text style={texto.nota}>{etiqueta}</Text>
            {children}
        </View>
    );
}

const estilos = StyleSheet.create({
    contenido: { padding: espacio.l, gap: espacio.l },
    tarjeta: {
        backgroundColor: colores.superficie,
        borderRadius: radio.grande,
        borderWidth: 2,
        padding: espacio.xl,
        alignItems: "center",
        gap: espacio.s,
        ...sombra,
    },
    centrado: { textAlign: "center" },
    total: { fontSize: 40, fontWeight: "800", color: colores.acento, fontVariant: ["tabular-nums"] },
    numero: { fontSize: 64, fontWeight: "800", color: colores.acento, letterSpacing: 1 },
    resumen: { backgroundColor: colores.superficie, borderRadius: radio.grande, paddingHorizontal: espacio.l, ...sombra },
    fila: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: espacio.m },
});
