import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { ActivityIndicator, AppState, StyleSheet, Text, View } from "react-native";
import { mensajeDe } from "@/servicios/api";
import { iniciarPago, verificarPago, type PagoIniciado } from "@/servicios/pagos";
import { colores, espacio, radio, sombra, texto } from "@/tema";
import { soles } from "@/utils/formato";
import { Aviso, Boton } from "./Controles";
import { Icono, type NombreDeIcono } from "./Icono";

/* Mientras se espera, se pregunta cada pocos segundos; el backend no consulta a Mercado Pago más seguido que eso. */
const MILISEGUNDOS_ENTRE_CONSULTAS = 4000;

type Estado =
    | { tipo: "inicio" }
    | { tipo: "abriendo" }
    | { tipo: "esperando"; pago: PagoIniciado }
    | { tipo: "aprobado" }
    | { tipo: "rechazado"; mensaje: string }
    | { tipo: "vencido" };

/**
 * Pagar con Mercado Pago desde la app: su página de pago se abre dentro de la
 * app. Si la persona entra con su cuenta de Mercado Pago, ahí están sus
 * tarjetas guardadas; si no, paga como invitada con tarjeta. La app nunca ve
 * los datos de la tarjeta.
 *
 * Al volver, la app pregunta cómo quedó; el backend se lo pregunta a Mercado
 * Pago con su clave secreta. Lo que diga esta pantalla no confirma nada.
 */
export function PagoConMercadoPago({ idPedido, monto }: { idPedido: number; monto: number }) {
    const [estado, setEstado] = useState<Estado>({ tipo: "inicio" });
    const [error, setError] = useState<string | null>(null);

    const idPago = estado.tipo === "esperando" ? estado.pago.idPago : null;

    // Mientras se espera: cada pocos segundos, y apenas la app vuelve al frente (al cerrar la página de pago).
    useEffect(() => {
        if (idPago === null) {
            return;
        }
        let vigente = true;
        const revisar = () => {
            verificarPago(idPago).then(
                (resultado) => {
                    if (!vigente) {
                        return;
                    }
                    if (resultado.aprobado) {
                        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                        setEstado({ tipo: "aprobado" });
                        setTimeout(() => router.back(), 1400);
                    } else if (resultado.estado === "RECHAZADO") {
                        setEstado({ tipo: "rechazado", mensaje: resultado.mensaje ?? "El pago no se aprobó." });
                    } else if (resultado.estado === "EXPIRADO") {
                        setEstado({ tipo: "vencido" });
                    }
                },
                () => {
                    // Sin red un momento: el próximo intento vuelve a preguntar.
                },
            );
        };
        revisar();
        const intervalo = setInterval(revisar, MILISEGUNDOS_ENTRE_CONSULTAS);
        const suscripcion = AppState.addEventListener("change", (actual) => actual === "active" && revisar());
        return () => {
            vigente = false;
            clearInterval(intervalo);
            suscripcion.remove();
        };
    }, [idPago]);

    async function abrirPagina(url: string) {
        // Solo se abre una página segura de Mercado Pago.
        if (!/^https:\/\/([a-z0-9-]+\.)*mercadopago\.com(\.pe)?\//.test(url)) {
            setError("La página de pago no es de Mercado Pago. Intenta otra vez en un momento.");
            return;
        }
        await WebBrowser.openBrowserAsync(url, {
            controlsColor: colores.acento,
            dismissButtonStyle: "close",
            enableBarCollapsing: true,
            showTitle: true,
        });
    }

    async function empezar() {
        setEstado({ tipo: "abriendo" });
        setError(null);
        try {
            const pago = await iniciarPago(idPedido, "TARJETA");
            if (!pago.urlDePago) {
                throw new Error("Mercado Pago no devolvió la página de pago.");
            }
            setEstado({ tipo: "esperando", pago });
            await abrirPagina(pago.urlDePago);
        } catch (fallo) {
            setEstado({ tipo: "inicio" });
            setError(fallo instanceof Error ? fallo.message : mensajeDe(fallo));
        }
    }

    if (estado.tipo === "aprobado") {
        return <Resultado icono="listo" color={colores.ok} titulo="¡Pago aprobado!" detalle="Ya sale tu número." />;
    }

    if (estado.tipo === "vencido") {
        return (
            <View style={{ gap: espacio.l }}>
                <Resultado icono="reloj" color={colores.error} titulo="Se acabó el tiempo para pagar" detalle="Tu pedido se liberó. Puedes hacer uno nuevo." />
                <Boton variante="secundario" onPress={() => router.dismissTo("/")}>
                    Volver al inicio
                </Boton>
            </View>
        );
    }

    if (estado.tipo === "rechazado") {
        return (
            <View style={{ gap: espacio.l }}>
                <Resultado icono="cerrar" color={colores.error} titulo="El pago no se aprobó" detalle={estado.mensaje} />
                <Boton onPress={() => void empezar()}>Intentar otra vez</Boton>
            </View>
        );
    }

    if (estado.tipo === "esperando") {
        return (
            <View style={{ gap: espacio.l }}>
                <View style={[estilos.tarjeta, { alignItems: "center" }]} accessibilityLiveRegion="polite">
                    <ActivityIndicator color={colores.acento} size="large" />
                    <Text style={[texto.subtitulo, { textAlign: "center" }]}>Confirmando tu pago</Text>
                    <Text style={[texto.cuerpo, { textAlign: "center", color: colores.suave }]}>
                        Si ya pagaste en Mercado Pago, en unos segundos aparece tu número.
                    </Text>
                </View>
                <Boton variante="secundario" icono="tarjeta" onPress={() => void abrirPagina(estado.pago.urlDePago ?? "")}>
                    Volver a la página de pago
                </Boton>
            </View>
        );
    }

    return (
        <View style={{ gap: espacio.l }}>
            <View style={estilos.tarjeta}>
                <View style={estilos.marca}>
                    <View style={estilos.circulo}>
                        <Icono nombre="tarjeta" color={colores.acento} tamano={26} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={texto.subtitulo}>Paga con Mercado Pago</Text>
                        <Text style={texto.nota}>Se abre su página de pago, dentro de la app</Text>
                    </View>
                </View>
                <Punto icono="cuenta" texto="Entra con tu cuenta de Mercado Pago y usa tus tarjetas guardadas." />
                <Punto icono="tarjeta" texto="O paga como invitado con tu tarjeta de débito o crédito." />
                <Punto icono="candado" texto="Tus datos de pago los maneja Mercado Pago. La cafetería nunca ve tu tarjeta." />
            </View>

            {error && <Aviso>{error}</Aviso>}

            <Boton onPress={() => void empezar()} cargando={estado.tipo === "abriendo"}>
                {`Continuar a Mercado Pago ${soles(monto)}`}
            </Boton>
        </View>
    );
}

function Punto({ icono, texto: contenido }: { icono: NombreDeIcono; texto: string }) {
    return (
        <View style={estilos.punto}>
            <Icono nombre={icono} color={colores.suave} tamano={20} />
            <Text style={[texto.cuerpo, { flex: 1, color: colores.suave, lineHeight: 22 }]}>{contenido}</Text>
        </View>
    );
}

function Resultado({ icono, color, titulo, detalle }: { icono: NombreDeIcono; color: string; titulo: string; detalle: string }) {
    return (
        <View style={[estilos.tarjeta, { alignItems: "center" }]} accessibilityLiveRegion="polite">
            <Icono nombre={icono} color={color} tamano={48} />
            <Text style={[texto.subtitulo, { color, textAlign: "center" }]}>{titulo}</Text>
            <Text style={[texto.cuerpo, { textAlign: "center", color: colores.suave }]}>{detalle}</Text>
        </View>
    );
}

const estilos = StyleSheet.create({
    tarjeta: { backgroundColor: colores.superficie, borderRadius: radio.grande, padding: espacio.l, gap: espacio.m, ...sombra },
    marca: { flexDirection: "row", alignItems: "center", gap: espacio.m, paddingBottom: espacio.s },
    circulo: { width: 52, height: 52, borderRadius: 26, backgroundColor: colores.acentoClaro, alignItems: "center", justifyContent: "center" },
    punto: { flexDirection: "row", alignItems: "flex-start", gap: espacio.m },
});
