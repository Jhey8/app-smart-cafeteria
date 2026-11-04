import { router } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Contador } from "@/componentes/Contador";
import { ElegirComprobante } from "@/componentes/ElegirComprobante";
import { Aviso, Boton } from "@/componentes/Controles";
import { Vacio } from "@/componentes/Estados";
import { FotoDelProducto } from "@/componentes/FotoDelProducto";
import { Icono } from "@/componentes/Icono";
import { useAvisos } from "@/estado/avisos";
import { useCarrito } from "@/estado/carrito";
import { useCuenta } from "@/estado/cuenta";
import { useCarga } from "@/estado/useCarga";
import { mensajeDe } from "@/servicios/api";
import { hacerPedido, obtenerHorario, obtenerSugerencias } from "@/servicios/cafeteria";
import { colores, espacio, radio, sombra, texto } from "@/tema";
import type { Producto } from "@/tipos/api";
import { MAXIMO_POR_PRODUCTO } from "@/utils/carrito";
import {
    BOLETA_SIN_DOCUMENTO,
    comprobantePreferido,
    faltaEnElComprobante,
    limpiarDatos,
    recordarComprobante,
    type DatosDelComprobante,
} from "@/utils/comprobante";
import { soles } from "@/utils/formato";

/**
 * El pedido antes de enviarlo: cantidades, "¿lo acompañas con…?" y el total.
 *
 * Al confirmar, el backend reserva las porciones y recalcula el total con
 * los precios del momento; el de aquí es solo de referencia.
 */
export default function Carrito() {
    const carrito = useCarrito();
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const horario = useCarga(obtenerHorario);
    const cerrado = horario.datos?.abierto === false;
    const { cuenta } = useCuenta();
    const [comprobante, setComprobante] = useState<DatosDelComprobante>(BOLETA_SIN_DOCUMENTO);

    // Lo último que se pidió en este teléfono (la factura de siempre, por ejemplo).
    useEffect(() => {
        let vigente = true;
        void comprobantePreferido().then((guardado) => vigente && guardado !== null && setComprobante(guardado));
        return () => {
            vigente = false;
        };
    }, []);

    if (carrito.lineas.length === 0) {
        return (
            <View style={{ flex: 1 }}>
                <Vacio icono="carrito" titulo="Tu pedido está vacío" detalle="Elige algo del menú de hoy." />
                <View style={{ padding: espacio.l }}>
                    <Boton variante="secundario" onPress={() => router.back()}>
                        Ver el menú
                    </Boton>
                </View>
            </View>
        );
    }

    async function confirmar() {
        const falta = faltaEnElComprobante(comprobante, carrito.total);
        if (falta !== null) {
            setError(falta);
            return;
        }
        setEnviando(true);
        setError(null);
        try {
            const datos = limpiarDatos(comprobante);
            const creado = await hacerPedido(
                carrito.lineas.map((linea) => ({ productoId: linea.producto.id, cantidad: linea.cantidad })),
                datos,
            );
            await recordarComprobante(datos);
            carrito.vaciar();
            router.replace(`/pedido/${creado.idPedido}`);
        } catch (fallo) {
            setError(mensajeDe(fallo));
            setEnviando(false);
        }
    }

    return (
        <SafeAreaView edges={["bottom"]} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={estilos.contenido}>
                <View style={estilos.tarjeta}>
                    {carrito.lineas.map((linea, indice) => (
                        <View key={linea.producto.id} style={[estilos.linea, indice > 0 && estilos.separada]}>
                            <FotoDelProducto imagenUrl={linea.producto.imagenUrl} estilo={estilos.miniatura} tamanoDelIcono={20} />
                            <View style={{ flex: 1, gap: 2 }}>
                                <Text style={texto.fuerte} numberOfLines={2}>
                                    {linea.producto.nombre}
                                </Text>
                                <Text style={texto.nota}>{soles(linea.producto.precio * linea.cantidad)}</Text>
                            </View>
                            <Contador
                                valor={linea.cantidad}
                                minimo={0}
                                maximo={MAXIMO_POR_PRODUCTO}
                                alCambiar={(cantidad) => carrito.cambiarCantidad(linea.producto.id, cantidad)}
                            />
                        </View>
                    ))}
                </View>

                <Sugerencias
                    key={carrito.lineas.map((linea) => linea.producto.id).join(",")}
                    ids={carrito.lineas.map((linea) => linea.producto.id)}
                    alAgregar={(producto) => carrito.agregar(producto)}
                />

                <ElegirComprobante
                    valor={comprobante}
                    alCambiar={(nuevo) => {
                        setComprobante(nuevo);
                        setError(null);
                    }}
                    nombreDeLaCuenta={cuenta ? `${cuenta.nombres} ${cuenta.apellidos}` : undefined}
                />

                <View style={estilos.total}>
                    <Text style={texto.subtitulo}>Total</Text>
                    <Text style={[texto.subtitulo, { color: colores.acento }]}>{soles(carrito.total)}</Text>
                </View>
                {cerrado && horario.datos?.mensaje && <Aviso>{horario.datos.mensaje}</Aviso>}
                {error && <Aviso>{error}</Aviso>}
            </ScrollView>

            <View style={estilos.pie}>
                <Boton onPress={() => void confirmar()} cargando={enviando} deshabilitado={cerrado}>
                    {`Pedir ${soles(carrito.total)}`}
                </Boton>
            </View>
        </SafeAreaView>
    );
}

/**
 * Lo que la cafetería sugiere para acompañar. Si no hay o falla, simplemente
 * no aparece. Se vuelve a montar (key) cuando cambian los platos del pedido.
 */
function Sugerencias({ ids, alAgregar }: { ids: number[]; alAgregar: (producto: Producto) => void }) {
    const { avisar } = useAvisos();
    const { datos } = useCarga(() => obtenerSugerencias(ids));
    const disponibles = (datos ?? []).filter((producto) => producto.disponible && !ids.includes(producto.id));

    if (disponibles.length === 0) {
        return null;
    }

    return (
        <View style={{ gap: espacio.s }}>
            <Text style={texto.fuerte}>¿Lo acompañas con…?</Text>
            <FlatList
                horizontal
                data={disponibles}
                keyExtractor={(producto) => String(producto.id)}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: espacio.m, paddingVertical: 4 }}
                renderItem={({ item }) => (
                    <Pressable
                        onPress={() => {
                            alAgregar(item);
                            avisar(`Agregado: ${item.nombre}`);
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={`Agregar ${item.nombre}, ${soles(item.precio)}`}
                        style={({ pressed }) => [estilos.sugerencia, pressed && { opacity: 0.85 }]}
                    >
                        <FotoDelProducto imagenUrl={item.imagenUrl} estilo={estilos.fotoDeSugerencia} />
                        <Text style={texto.fuerte} numberOfLines={1}>
                            {item.nombre}
                        </Text>
                        <View style={estilos.filaDeSugerencia}>
                            <Text style={texto.nota}>{soles(item.precio)}</Text>
                            <View style={estilos.mas}>
                                <Icono nombre="mas" color={colores.superficie} tamano={16} />
                            </View>
                        </View>
                    </Pressable>
                )}
            />
        </View>
    );
}

const estilos = StyleSheet.create({
    contenido: { padding: espacio.l, gap: espacio.l },
    tarjeta: { backgroundColor: colores.superficie, borderRadius: radio.grande, paddingHorizontal: espacio.l, ...sombra },
    linea: { flexDirection: "row", alignItems: "center", gap: espacio.m, paddingVertical: espacio.m },
    separada: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colores.borde },
    miniatura: { width: 52, height: 52, borderRadius: radio.chico },
    total: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    pie: { padding: espacio.l, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colores.borde, backgroundColor: colores.superficie },
    sugerencia: { width: 148, backgroundColor: colores.superficie, borderRadius: radio.grande, padding: espacio.s, gap: 6, ...sombra },
    fotoDeSugerencia: { width: "100%", height: 92, borderRadius: radio.medio },
    filaDeSugerencia: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    mas: { width: 28, height: 28, borderRadius: 14, backgroundColor: colores.acento, alignItems: "center", justifyContent: "center" },
});
