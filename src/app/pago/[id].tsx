import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useState, type ReactNode } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Aviso, Boton, Campo } from "@/componentes/Controles";
import { Cargando, ErrorConReintento } from "@/componentes/Estados";
import { PagoConMercadoPago } from "@/componentes/PagoConMercadoPago";
import { useCarga } from "@/estado/useCarga";
import { Icono, type NombreDeIcono } from "@/componentes/Icono";
import { ErrorApi, mensajeDe } from "@/servicios/api";
import { iniciarPago, obtenerConfiguracionDePagos, pagarEnModoDePrueba, type DatosDePrueba, type MetodoDePago, type PagoIniciado } from "@/servicios/pagos";
import { colores, espacio, radio, sombra, texto } from "@/tema";
import { soles } from "@/utils/formato";

type Estado =
    | { tipo: "elegir" }
    | { tipo: "abriendo"; metodo: MetodoDePago }
    | { tipo: "formulario"; pago: PagoIniciado }
    | { tipo: "pagando"; pago: PagoIniciado }
    | { tipo: "aprobado" }
    | { tipo: "rechazado"; metodo: MetodoDePago; mensaje: string };

/**
 * Pagar un pedido desde la app, con la pasarela que esté activa: Mercado Pago
 * (su página de pago, dentro de la app) o la de prueba. El QR no se ofrece
 * aquí porque no se puede escanear la propia pantalla; en el kiosco sí.
 *
 * El pedido pasa a la cola cuando el backend lo confirma con la pasarela, no
 * por lo que diga esta pantalla. Al aprobarse se vuelve al seguimiento, que
 * ya consulta el pedido y muestra el número.
 */
export default function Pagar() {
    const { id, total } = useLocalSearchParams<{ id: string; total?: string }>();
    const idPedido = Number(id);
    const monto = Number(total ?? 0);
    const configuracion = useCarga(obtenerConfiguracionDePagos);

    if (configuracion.datos === undefined) {
        return configuracion.error === null ? <Cargando /> : <ErrorConReintento mensaje={configuracion.error} alReintentar={() => void configuracion.recargar()} />;
    }
    if (configuracion.datos.modo === "MERCADOPAGO") {
        return (
            <ScrollView contentContainerStyle={estilos.contenido}>
                {monto > 0 && (
                    <View style={estilos.total}>
                        <Text style={texto.nota}>Total a pagar</Text>
                        <Text style={estilos.monto}>{soles(monto)}</Text>
                    </View>
                )}
                <PagoConMercadoPago idPedido={idPedido} monto={monto} />
            </ScrollView>
        );
    }
    return <PagoDePrueba idPedido={idPedido} monto={monto} />;
}

/**
 * La pasarela simulada (modo de prueba, sin dinero real): Yape o tarjeta con
 * los datos de prueba, por el mismo camino que seguirá Izipay.
 */
function PagoDePrueba({ idPedido, monto }: { idPedido: number; monto: number }) {
    const [estado, setEstado] = useState<Estado>({ tipo: "elegir" });
    const [datos, setDatos] = useState<DatosDePrueba>({});
    const [error, setError] = useState<{ mensaje: string; campo: string | null } | null>(null);

    async function abrir(metodo: MetodoDePago) {
        setEstado({ tipo: "abriendo", metodo });
        setDatos({});
        setError(null);
        try {
            setEstado({ tipo: "formulario", pago: await iniciarPago(idPedido, metodo) });
        } catch (fallo) {
            setEstado({ tipo: "elegir" });
            setError({ mensaje: mensajeDe(fallo), campo: null });
        }
    }

    async function pagar() {
        if (estado.tipo !== "formulario") {
            return;
        }
        const { pago } = estado;
        setEstado({ tipo: "pagando", pago });
        setError(null);
        try {
            const resultado = await pagarEnModoDePrueba(pago.idPago, datos);
            if (resultado.aprobado) {
                void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                setEstado({ tipo: "aprobado" });
                setTimeout(() => router.back(), 1200);
            } else {
                setEstado({ tipo: "rechazado", metodo: pago.metodo as MetodoDePago, mensaje: resultado.mensaje ?? "El pago no se aprobó." });
            }
        } catch (fallo) {
            // Un dato mal escrito no gasta el intento: se corrige y se vuelve a pagar.
            setEstado({ tipo: "formulario", pago });
            setError({ mensaje: mensajeDe(fallo), campo: fallo instanceof ErrorApi ? fallo.campo : null });
        }
    }

    const cambiar = (cambios: DatosDePrueba) => setDatos((actuales) => ({ ...actuales, ...cambios }));
    const conError = (campo: string) => error?.campo === campo;

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <ScrollView contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled">
                {monto > 0 && (
                    <View style={estilos.total}>
                        <Text style={texto.nota}>Total a pagar</Text>
                        <Text style={estilos.monto}>{soles(monto)}</Text>
                    </View>
                )}

                {(estado.tipo === "elegir" || estado.tipo === "abriendo") && (
                    <>
                        <Text style={texto.subtitulo}>¿Cómo quieres pagar?</Text>
                        <Medio
                            icono="telefono"
                            titulo="Yape"
                            detalle="Con el código de aprobación de tu app"
                            cargando={estado.tipo === "abriendo" && estado.metodo === "YAPE"}
                            alElegir={() => void abrir("YAPE")}
                        />
                        <Medio
                            icono="tarjeta"
                            titulo="Tarjeta"
                            detalle="Débito o crédito"
                            cargando={estado.tipo === "abriendo" && estado.metodo === "TARJETA"}
                            alElegir={() => void abrir("TARJETA")}
                        />
                        {error && <Aviso>{error.mensaje}</Aviso>}
                    </>
                )}

                {(estado.tipo === "formulario" || estado.tipo === "pagando") && (
                    <>
                        {estado.pago.modo === "SIMULADA" && <AvisoDePrueba metodo={estado.pago.metodo as MetodoDePago} />}
                        <View style={estilos.tarjeta}>
                            {estado.pago.metodo === "YAPE" ? (
                                <>
                                    <Text style={texto.subtitulo}>Paga con Yape</Text>
                                    <Campo
                                        etiqueta="Celular de tu Yape"
                                        value={datos.celular ?? ""}
                                        onChangeText={(escrito) => cambiar({ celular: escrito.replace(/\D/g, "").slice(0, 9) })}
                                        keyboardType="number-pad"
                                        placeholder="987654321"
                                        conError={conError("celular")}
                                    />
                                    <Campo
                                        etiqueta="Código de aprobación"
                                        ayuda="Ábrelo en Yape: Menú, Código de aprobación."
                                        value={datos.codigoYape ?? ""}
                                        onChangeText={(escrito) => cambiar({ codigoYape: escrito.replace(/\D/g, "").slice(0, 6) })}
                                        keyboardType="number-pad"
                                        placeholder="000000"
                                        conError={conError("codigoYape")}
                                    />
                                </>
                            ) : (
                                <>
                                    <Text style={texto.subtitulo}>Paga con tarjeta</Text>
                                    <Campo
                                        etiqueta="Número de tarjeta"
                                        value={datos.numeroTarjeta ?? ""}
                                        onChangeText={(escrito) => cambiar({ numeroTarjeta: enGruposDeCuatro(escrito) })}
                                        keyboardType="number-pad"
                                        placeholder="0000 0000 0000 0000"
                                        conError={conError("numeroTarjeta")}
                                    />
                                    <View style={{ flexDirection: "row", gap: espacio.m }}>
                                        <View style={{ flex: 1 }}>
                                            <Campo
                                                etiqueta="Vence"
                                                value={datos.vencimiento ?? ""}
                                                onChangeText={(escrito) => cambiar({ vencimiento: comoVencimiento(escrito) })}
                                                keyboardType="number-pad"
                                                placeholder="MM/AA"
                                                conError={conError("vencimiento")}
                                            />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Campo
                                                etiqueta="CVV"
                                                value={datos.cvv ?? ""}
                                                onChangeText={(escrito) => cambiar({ cvv: escrito.replace(/\D/g, "").slice(0, 4) })}
                                                keyboardType="number-pad"
                                                secureTextEntry
                                                placeholder="123"
                                                conError={conError("cvv")}
                                            />
                                        </View>
                                    </View>
                                </>
                            )}
                            {error && <Aviso>{error.mensaje}</Aviso>}
                            <Boton onPress={() => void pagar()} cargando={estado.tipo === "pagando"}>
                                {`Pagar ${soles(estado.pago.monto)}`}
                            </Boton>
                        </View>
                        <Boton variante="secundario" onPress={() => setEstado({ tipo: "elegir" })} deshabilitado={estado.tipo === "pagando"}>
                            Elegir otro medio
                        </Boton>
                    </>
                )}

                {estado.tipo === "aprobado" && (
                    <Resultado icono="listo" color={colores.ok} titulo="¡Pago aprobado!" detalle="Ya sale tu número." />
                )}

                {estado.tipo === "rechazado" && (
                    <>
                        <Resultado icono="cerrar" color={colores.error} titulo="El pago no se aprobó" detalle={estado.mensaje} />
                        <Boton onPress={() => void abrir(estado.metodo)}>Intentar otra vez</Boton>
                        <Boton variante="secundario" onPress={() => setEstado({ tipo: "elegir" })}>
                            Elegir otro medio
                        </Boton>
                    </>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

function Medio({ icono, titulo, detalle, cargando, alElegir }: { icono: NombreDeIcono; titulo: string; detalle: string; cargando: boolean; alElegir: () => void }) {
    return (
        <Pressable
            onPress={alElegir}
            disabled={cargando}
            accessibilityRole="button"
            accessibilityLabel={`Pagar con ${titulo}`}
            style={({ pressed }) => [estilos.medio, pressed && { opacity: 0.85 }]}
        >
            <View style={estilos.iconoDelMedio}>
                <Icono nombre={icono} color={colores.acento} tamano={26} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={texto.fuerte}>{titulo}</Text>
                <Text style={texto.nota}>{cargando ? "Abriendo…" : detalle}</Text>
            </View>
            <Icono nombre="siguiente" color={colores.suave} tamano={18} />
        </Pressable>
    );
}

/** Que nadie crea que se le cobró de verdad, y los datos de prueba a la mano. */
function AvisoDePrueba({ metodo }: { metodo: MetodoDePago }) {
    return (
        <View style={estilos.prueba}>
            <Text style={estilos.textoDePrueba}>
                <Text style={{ fontWeight: "800" }}>Modo de prueba: no se cobra dinero real. </Text>
                {metodo === "YAPE"
                    ? "Cualquier celular que empiece con 9 y el código 123456 aprueban."
                    : "Usa 4111 1111 1111 1111 (aprueba) o 4000 0000 0000 0002 (sin fondos), con un vencimiento futuro y cualquier CVV."}
            </Text>
        </View>
    );
}

function Resultado({ icono, color, titulo, detalle }: { icono: NombreDeIcono; color: string; titulo: string; detalle: string }): ReactNode {
    return (
        <View style={[estilos.tarjeta, { alignItems: "center" }]} accessibilityLiveRegion="polite">
            <Icono nombre={icono} color={color} tamano={48} />
            <Text style={[texto.subtitulo, { color, textAlign: "center" }]}>{titulo}</Text>
            <Text style={[texto.cuerpo, { textAlign: "center", color: colores.suave }]}>{detalle}</Text>
        </View>
    );
}

function enGruposDeCuatro(texto: string): string {
    return texto
        .replace(/\D/g, "")
        .slice(0, 16)
        .replace(/(\d{4})(?=\d)/g, "$1 ");
}

function comoVencimiento(texto: string): string {
    const digitos = texto.replace(/\D/g, "").slice(0, 4);
    return digitos.length > 2 ? `${digitos.slice(0, 2)}/${digitos.slice(2)}` : digitos;
}

const estilos = StyleSheet.create({
    contenido: { padding: espacio.l, gap: espacio.l },
    total: { alignItems: "center", gap: 2, paddingVertical: espacio.s },
    monto: { fontSize: 32, fontWeight: "800", color: colores.acento },
    tarjeta: { backgroundColor: colores.superficie, borderRadius: radio.grande, padding: espacio.l, gap: espacio.m, ...sombra },
    medio: {
        flexDirection: "row",
        alignItems: "center",
        gap: espacio.m,
        backgroundColor: colores.superficie,
        borderRadius: radio.grande,
        padding: espacio.l,
        ...sombra,
    },
    iconoDelMedio: { width: 48, height: 48, borderRadius: 24, backgroundColor: colores.acentoClaro, alignItems: "center", justifyContent: "center" },
    prueba: { backgroundColor: colores.calidoClaro, borderRadius: radio.medio, padding: espacio.m },
    textoDePrueba: { fontSize: 14, lineHeight: 20, color: colores.calidoOscuro },
});
