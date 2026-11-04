import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Boton, Chip } from "@/componentes/Controles";
import { Bloque } from "@/componentes/Esqueleto";
import { ErrorConReintento, Vacio } from "@/componentes/Estados";
import { Corazon } from "@/componentes/Corazon";
import { Galeria } from "@/componentes/Galeria";
import { Contador } from "@/componentes/Contador";
import { useAvisos } from "@/estado/avisos";
import { useCarrito } from "@/estado/carrito";
import { useCarga } from "@/estado/useCarga";
import { obtenerMenu } from "@/servicios/cafeteria";
import { colores, espacio, texto } from "@/tema";
import { MAXIMO_POR_PRODUCTO } from "@/utils/carrito";
import { soles } from "@/utils/formato";

/**
 * Un plato: la foto grande, la descripción y cuántos agregar.
 *
 * Vuelve a pedir el menú en vez de recibir el producto desde la lista: así
 * el precio y si quedan porciones son los de este momento.
 */
export default function DetalleDelProducto() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { datos, error, recargar } = useCarga(obtenerMenu);
    const carrito = useCarrito();
    const { avisar } = useAvisos();
    const [cantidad, setCantidad] = useState(1);

    if (datos === undefined) {
        return error === null ? <DetalleEsqueleto /> : <ErrorConReintento mensaje={error} alReintentar={() => void recargar()} />;
    }

    const producto = datos.find((candidato) => String(candidato.id) === id);
    if (!producto) {
        return <Vacio icono="plato" titulo="Este plato ya no está en el menú de hoy" />;
    }

    const enElCarrito = carrito.lineas.find((linea) => linea.producto.id === producto.id)?.cantidad ?? 0;
    const maximo = MAXIMO_POR_PRODUCTO - enElCarrito;

    function agregar() {
        if (producto) {
            carrito.agregar(producto, cantidad);
            avisar(`Agregado: ${cantidad > 1 ? `${cantidad} × ` : ""}${producto.nombre}`);
            router.back();
        }
    }

    return (
        <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: colores.superficie }}>
            <ScrollView contentContainerStyle={{ paddingBottom: espacio.xl }}>
                <View>
                    <Galeria imagenes={producto.imagenes} imagenUrl={producto.imagenUrl} nombre={producto.nombre} />
                    <View style={estilos.corazon}>
                        <Corazon idProducto={producto.id} nombre={producto.nombre} sobreFoto />
                    </View>
                </View>
                <View style={estilos.cuerpo}>
                    <Text style={texto.nota}>{producto.categoria}</Text>
                    <Text style={texto.titulo}>{producto.nombre}</Text>
                    <Text style={estilos.precio}>{soles(producto.precio)}</Text>
                    <View style={{ flexDirection: "row", gap: espacio.s, flexWrap: "wrap" }}>
                        {!producto.disponible && <Chip tono="error">Agotado</Chip>}
                        {producto.disponible && producto.minutosPreparacion > 0 && <Chip tono="acento">{`Listo en unos ${producto.minutosPreparacion} min`}</Chip>}
                        {producto.disponible && producto.tipoPreparacion === "REVENTA" && <Chip tono="ok">Listo al pagar</Chip>}
                    </View>
                    {producto.descripcion && <Text style={[texto.cuerpo, { color: colores.suave, lineHeight: 23 }]}>{producto.descripcion}</Text>}
                </View>
            </ScrollView>

            {producto.disponible && (
                <View style={estilos.pie}>
                    {maximo > 0 ? (
                        <>
                            <Contador valor={Math.min(cantidad, maximo)} minimo={1} maximo={maximo} alCambiar={setCantidad} />
                            <View style={{ flex: 1 }}>
                                <Boton onPress={agregar}>{`Agregar ${soles(producto.precio * Math.min(cantidad, maximo))}`}</Boton>
                            </View>
                        </>
                    ) : (
                        <Text style={[texto.nota, { flex: 1, textAlign: "center" }]}>
                            Ya tienes {MAXIMO_POR_PRODUCTO} en tu pedido, el máximo por plato.
                        </Text>
                    )}
                </View>
            )}
        </SafeAreaView>
    );
}

function DetalleEsqueleto() {
    return (
        <View style={{ flex: 1, backgroundColor: colores.superficie }}>
            <Bloque alto={280} redondeo={0} />
            <View style={[estilos.cuerpo, { gap: espacio.m }]}>
                <Bloque ancho="30%" alto={12} />
                <Bloque ancho="80%" alto={26} />
                <Bloque ancho="25%" alto={20} />
                <Bloque alto={14} />
                <Bloque ancho="70%" alto={14} />
            </View>
        </View>
    );
}

const estilos = StyleSheet.create({
    corazon: { position: "absolute", top: espacio.l, right: espacio.l },
    cuerpo: { padding: espacio.xl, gap: espacio.s },
    precio: { fontSize: 22, fontWeight: "700", color: colores.acento, marginBottom: espacio.xs },
    pie: {
        flexDirection: "row",
        alignItems: "center",
        gap: espacio.l,
        paddingHorizontal: espacio.l,
        paddingTop: espacio.m,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colores.borde,
    },
});
