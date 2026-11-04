import { router } from "expo-router";
import { useState, type ReactNode } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { Aviso, Boton, Campo } from "@/componentes/Controles";
import { useAvisos } from "@/estado/avisos";
import { useCuenta } from "@/estado/cuenta";
import { useCarga } from "@/estado/useCarga";
import { ErrorApi, mensajeDe } from "@/servicios/api";
import { misPedidos, presentarReclamacion } from "@/servicios/cafeteria";
import { colores, espacio, radio, texto } from "@/tema";
import type { PedidoDelHistorial } from "@/tipos/api";
import { diaYHora, soles } from "@/utils/formato";

/**
 * La hoja de reclamación, con las partes del formato de INDECOPI: qué tipo
 * es, sobre qué, qué pasó y qué se pide, y quién la presenta. Lo que la app
 * ya sabe (nombre, correo, celular, el pedido) viene escrito; la persona lo
 * confirma o lo cambia.
 */
export default function NuevaReclamacion() {
    const { cuenta } = useCuenta();
    const { avisar } = useAvisos();
    const pedidos = useCarga(misPedidos);
    const [pedido, setPedido] = useState<PedidoDelHistorial | null>(null);
    const [tipo, setTipo] = useState<"RECLAMO" | "QUEJA">("RECLAMO");
    const [bien, setBien] = useState<"PRODUCTO" | "SERVICIO">("PRODUCTO");
    const [tipoDocumento, setTipoDocumento] = useState<"DNI" | "CE" | "PAS">("DNI");
    const [menor, setMenor] = useState(false);
    const [valores, setValores] = useState({
        nombres: cuenta ? `${cuenta.nombres} ${cuenta.apellidos}` : "",
        numeroDocumento: cuenta?.correoEditable ? cuenta.codigo : "",
        correo: cuenta?.correo ?? "",
        telefono: cuenta?.telefono ?? "",
        domicilio: "",
        apoderado: "",
        monto: "",
        descripcionBien: "",
        detalle: "",
        pedidoConsumidor: "",
    });
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState<{ mensaje: string; campo: string | null } | null>(null);
    const cambiar = (campo: keyof typeof valores) => (valor: string) => setValores((actuales) => ({ ...actuales, [campo]: valor }));
    const conError = (campo: string) => error?.campo === campo;

    function elegirPedido(elegido: PedidoDelHistorial | null) {
        setPedido(elegido);
        if (elegido) {
            setValores((actuales) => ({
                ...actuales,
                monto: elegido.total.toFixed(2),
                descripcionBien: elegido.items.map((item) => `${item.cantidad} × ${item.producto}`).join(", ").slice(0, 300),
            }));
        }
    }

    async function presentar() {
        setEnviando(true);
        setError(null);
        try {
            const hoja = await presentarReclamacion({
                tipo,
                idPedido: pedido?.id ?? null,
                nombres: valores.nombres.trim(),
                tipoDocumento,
                numeroDocumento: valores.numeroDocumento.trim(),
                correo: valores.correo.trim(),
                telefono: valores.telefono.trim() === "" ? null : valores.telefono.trim(),
                domicilio: valores.domicilio.trim(),
                menorDeEdad: menor,
                apoderado: menor ? valores.apoderado.trim() : null,
                bien,
                monto: valores.monto.trim() === "" ? null : Number(valores.monto.replace(",", ".")),
                descripcionBien: valores.descripcionBien.trim(),
                detalle: valores.detalle.trim(),
                pedidoConsumidor: valores.pedidoConsumidor.trim(),
            });
            avisar(`Hoja ${hoja.numero} presentada`);
            Alert.alert(
                "Recibimos tu hoja",
                `Tu número de constancia es ${hoja.numero}. Te responderemos en un plazo máximo de 15 días hábiles; la respuesta llegará a la app y a tus notificaciones.`,
                [{ text: "Entendido", onPress: () => router.back() }],
            );
        } catch (fallo) {
            setError({ mensaje: mensajeDe(fallo), campo: fallo instanceof ErrorApi ? fallo.campo : null });
            setEnviando(false);
        }
    }

    return (
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colores.superficie }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <ScrollView contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled">
                <Seccion titulo="1. ¿Qué quieres presentar?">
                    <Segmentado
                        opciones={[
                            { valor: "RECLAMO", texto: "Reclamo" },
                            { valor: "QUEJA", texto: "Queja" },
                        ]}
                        valor={tipo}
                        alCambiar={setTipo}
                    />
                    <Text style={texto.nota}>
                        {tipo === "RECLAMO"
                            ? "Reclamo: no estás conforme con lo que compraste (el producto o el servicio)."
                            : "Queja: no estás conforme con la atención, aunque no sea sobre lo que compraste."}
                    </Text>
                </Seccion>

                <Seccion titulo="2. ¿Sobre qué?">
                    <Text style={estilos.etiqueta}>Pedido relacionado (opcional)</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: espacio.s }}>
                        <Ficha activa={pedido === null} onPress={() => elegirPedido(null)} texto="Ninguno" />
                        {(pedidos.datos ?? []).slice(0, 8).map((candidato) => (
                            <Ficha
                                key={candidato.id}
                                activa={pedido?.id === candidato.id}
                                onPress={() => elegirPedido(candidato)}
                                texto={`${candidato.numero ?? `Pedido ${candidato.id}`}, ${diaYHora(candidato.creadoEn)}`}
                            />
                        ))}
                    </ScrollView>
                    <Segmentado
                        opciones={[
                            { valor: "PRODUCTO", texto: "Un producto" },
                            { valor: "SERVICIO", texto: "Un servicio" },
                        ]}
                        valor={bien}
                        alCambiar={setBien}
                    />
                    <Campo
                        etiqueta="Qué compraste o qué servicio recibiste"
                        value={valores.descripcionBien}
                        onChangeText={cambiar("descripcionBien")}
                        placeholder="Lomo saltado"
                        conError={conError("descripcionBien")}
                    />
                    <Campo
                        etiqueta="Monto (S/, opcional)"
                        value={valores.monto}
                        onChangeText={cambiar("monto")}
                        keyboardType="decimal-pad"
                        placeholder={pedido ? soles(pedido.total) : "0.00"}
                        conError={conError("monto")}
                    />
                </Seccion>

                <Seccion titulo="3. Qué pasó y qué pides">
                    <Campo
                        etiqueta="Detalle"
                        value={valores.detalle}
                        onChangeText={cambiar("detalle")}
                        multiline
                        textAlignVertical="top"
                        altoMinimo={110}
                        placeholder="Cuéntanos qué pasó, cuándo y con quién."
                        conError={conError("detalle")}
                    />
                    <Campo
                        etiqueta="Lo que pides a la cafetería"
                        value={valores.pedidoConsumidor}
                        onChangeText={cambiar("pedidoConsumidor")}
                        multiline
                        textAlignVertical="top"
                        altoMinimo={80}
                        placeholder="Por ejemplo: que me devuelvan el importe."
                        conError={conError("pedidoConsumidor")}
                    />
                </Seccion>

                <Seccion titulo="4. Tus datos">
                    <Campo etiqueta="Nombre completo" value={valores.nombres} onChangeText={cambiar("nombres")} autoComplete="name" conError={conError("nombres")} />
                    <Segmentado
                        opciones={[
                            { valor: "DNI", texto: "DNI" },
                            { valor: "CE", texto: "Carné de extranjería" },
                            { valor: "PAS", texto: "Pasaporte" },
                        ]}
                        valor={tipoDocumento}
                        alCambiar={setTipoDocumento}
                    />
                    <Campo
                        etiqueta="Número de documento"
                        value={valores.numeroDocumento}
                        onChangeText={cambiar("numeroDocumento")}
                        autoCapitalize="characters"
                        keyboardType={tipoDocumento === "DNI" ? "number-pad" : "default"}
                        conError={conError("numeroDocumento")}
                    />
                    <Campo
                        etiqueta="Correo para la respuesta"
                        value={valores.correo}
                        onChangeText={cambiar("correo")}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        conError={conError("correo")}
                    />
                    <Campo
                        etiqueta="Celular (opcional)"
                        value={valores.telefono}
                        onChangeText={cambiar("telefono")}
                        keyboardType="phone-pad"
                        autoComplete="tel"
                        conError={conError("telefono")}
                    />
                    <Campo
                        etiqueta="Domicilio"
                        value={valores.domicilio}
                        onChangeText={cambiar("domicilio")}
                        placeholder="Av. Bolognesi 123, Chiclayo"
                        autoComplete="street-address"
                        conError={conError("domicilio")}
                    />
                    <View style={estilos.fila}>
                        <Text style={[texto.cuerpo, { flex: 1 }]}>Soy menor de edad</Text>
                        <Switch value={menor} onValueChange={setMenor} trackColor={{ true: colores.acento, false: colores.borde }} />
                    </View>
                    {menor && (
                        <Campo
                            etiqueta="Nombre de tu padre, madre o apoderado"
                            value={valores.apoderado}
                            onChangeText={cambiar("apoderado")}
                            conError={conError("apoderado")}
                        />
                    )}
                </Seccion>

                <Text style={texto.nota}>
                    Presentar esta hoja no impide acudir a otras vías de solución de controversias ni es requisito previo para interponer una
                    denuncia ante el INDECOPI.
                </Text>
                {error && <Aviso>{error.mensaje}</Aviso>}
                <Boton onPress={() => void presentar()} cargando={enviando}>
                    Presentar hoja
                </Boton>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
    return (
        <View style={{ gap: espacio.m }}>
            <Text style={estilos.titulo}>{titulo}</Text>
            {children}
        </View>
    );
}

function Segmentado<T extends string>({ opciones, valor, alCambiar }: { opciones: { valor: T; texto: string }[]; valor: T; alCambiar: (valor: T) => void }) {
    return (
        <View style={estilos.segmentado}>
            {opciones.map((opcion) => (
                <Pressable
                    key={opcion.valor}
                    onPress={() => alCambiar(opcion.valor)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: valor === opcion.valor }}
                    style={[estilos.segmento, valor === opcion.valor && estilos.segmentoActivo]}
                >
                    <Text style={[estilos.textoDeSegmento, valor === opcion.valor && { color: colores.acento }]} numberOfLines={1}>
                        {opcion.texto}
                    </Text>
                </Pressable>
            ))}
        </View>
    );
}

function Ficha({ activa, onPress, texto: etiqueta }: { activa: boolean; onPress: () => void; texto: string }) {
    return (
        <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ selected: activa }} style={[estilos.ficha, activa && estilos.fichaActiva]}>
            <Text style={[estilos.textoDeFicha, activa && { color: colores.superficie }]}>{etiqueta}</Text>
        </Pressable>
    );
}

const estilos = StyleSheet.create({
    contenido: { padding: espacio.xl, gap: espacio.xl, paddingBottom: espacio.xxl * 2 },
    titulo: { fontSize: 19, fontWeight: "800", color: colores.texto },
    etiqueta: { fontSize: 14, fontWeight: "600", color: colores.texto },
    fila: { flexDirection: "row", alignItems: "center" },
    segmentado: { flexDirection: "row", backgroundColor: colores.fondo, borderRadius: radio.pildora, padding: 4 },
    segmento: { flex: 1, paddingVertical: 10, paddingHorizontal: 6, borderRadius: radio.pildora, alignItems: "center" },
    segmentoActivo: { backgroundColor: colores.superficie, boxShadow: "0 1px 3px rgba(20, 23, 31, 0.12)" },
    textoDeSegmento: { fontSize: 14, fontWeight: "600", color: colores.suave },
    ficha: { borderWidth: 1.5, borderColor: colores.borde, borderRadius: radio.pildora, paddingHorizontal: 14, paddingVertical: 8 },
    fichaActiva: { backgroundColor: colores.acento, borderColor: colores.acento },
    textoDeFicha: { fontSize: 14, fontWeight: "600", color: colores.texto },
});
