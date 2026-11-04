import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Chip } from "@/componentes/Controles";
import { useEspacioDeLaBarra } from "@/componentes/BarraDePestanas";
import { ListaEsqueleto } from "@/componentes/Esqueleto";
import { ErrorConReintento, Vacio } from "@/componentes/Estados";
import { Corazon } from "@/componentes/Corazon";
import { FotoDelProducto } from "@/componentes/FotoDelProducto";
import { Icono } from "@/componentes/Icono";
import { useCarrito } from "@/estado/carrito";
import { useCarga } from "@/estado/useCarga";
import { obtenerMenu } from "@/servicios/cafeteria";
import { colores, espacio, radio, sombra, texto } from "@/tema";
import type { Producto } from "@/tipos/api";
import { soles } from "@/utils/formato";

/**
 * El menú de hoy: categorías arriba, platos en lista, y el pedido en curso
 * abajo. La categoría elegida va en la ruta (?categoria=Bebidas), así los
 * cuadros de Inicio abren el menú ya filtrado; ?buscar=1 abre el buscador
 * listo para escribir, que es lo que hace la barra de búsqueda de Inicio.
 */
export default function Menu() {
    const { datos, error, actualizando, recargar } = useCarga(obtenerMenu);
    const parametros = useLocalSearchParams<{ categoria?: string; buscar?: string }>();
    const categoria = parametros.categoria ?? null;
    const setCategoria = (nueva: string | null) => router.setParams({ categoria: nueva ?? undefined });
    const carrito = useCarrito();
    const espacioDeLaBarra = useEspacioDeLaBarra();
    const [busqueda, setBusqueda] = useState("");
    const buscador = useRef<TextInput>(null);
    const hayMenu = datos !== undefined;

    useEffect(() => {
        if (parametros.buscar === "1" && hayMenu) {
            buscador.current?.focus();
            router.setParams({ buscar: undefined });
        }
    }, [parametros.buscar, hayMenu]);

    if (datos === undefined) {
        return error === null ? <ListaEsqueleto /> : <ErrorConReintento mensaje={error} alReintentar={() => void recargar()} />;
    }

    const categorias = [...new Set(datos.map((producto) => producto.categoria))];
    const palabras = normalizar(busqueda).split(/\s+/).filter(Boolean);
    const visibles = datos
        .filter((producto) => categoria === null || producto.categoria === categoria)
        .filter((producto) => {
            const donde = normalizar(`${producto.nombre} ${producto.descripcion ?? ""} ${producto.categoria}`);
            return palabras.every((palabra) => donde.includes(palabra));
        });

    return (
        <View style={{ flex: 1 }}>
            <View style={estilos.barraDeCategorias}>
                <View style={estilos.buscador}>
                    <Icono nombre="buscar" color={colores.suave} tamano={18} />
                    <TextInput
                        ref={buscador}
                        value={busqueda}
                        onChangeText={setBusqueda}
                        placeholder="Busca platos, bebidas o postres"
                        placeholderTextColor={colores.suave}
                        returnKeyType="search"
                        autoCorrect={false}
                        accessibilityLabel="Buscar en el menú"
                        style={estilos.campoDeBusqueda}
                    />
                    {busqueda !== "" && (
                        <Pressable onPress={() => setBusqueda("")} accessibilityRole="button" accessibilityLabel="Borrar búsqueda" hitSlop={8}>
                            <Icono nombre="cerrar" color={colores.suave} tamano={16} />
                        </Pressable>
                    )}
                </View>
                {categorias.length > 1 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.categorias}>
                        {[null, ...categorias].map((opcion) => {
                            const activa = opcion === categoria;
                            return (
                                <Pressable
                                    key={opcion ?? "todas"}
                                    onPress={() => setCategoria(opcion)}
                                    accessibilityRole="button"
                                    accessibilityState={{ selected: activa }}
                                    style={[estilos.categoria, activa && { backgroundColor: colores.acento, borderColor: colores.acento }]}
                                >
                                    <Text style={[estilos.textoDeCategoria, activa && { color: colores.superficie }]}>{opcion ?? "Todo"}</Text>
                                </Pressable>
                            );
                        })}
                    </ScrollView>
                )}
            </View>

            <FlatList
                data={visibles}
                keyExtractor={(producto) => String(producto.id)}
                renderItem={({ item }) => <TarjetaDeProducto producto={item} />}
                contentContainerStyle={[estilos.lista, { paddingBottom: espacioDeLaBarra + (carrito.unidades > 0 ? 70 : 0) }]}
                refreshControl={<RefreshControl refreshing={actualizando} onRefresh={() => void recargar()} tintColor={colores.acento} colors={[colores.acento]} />}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                ListEmptyComponent={
                    palabras.length > 0 ? (
                        <Vacio icono="buscar" titulo={`No encontramos "${busqueda.trim()}"`} detalle={categoria ? `Busca en todo el menú y no solo en ${categoria.toLowerCase()}.` : "Prueba con otra palabra."} />
                    ) : categoria !== null && datos.length > 0 ? (
                        <Vacio icono="plato" titulo={`Hoy no hay ${categoria.toLowerCase()} en el menú`} />
                    ) : (
                        <Vacio icono="plato" titulo="Todavía no hay menú para hoy" detalle="Desliza hacia abajo para volver a mirar." />
                    )
                }
            />

            {carrito.unidades > 0 && (
                <Pressable onPress={() => router.push("/carrito")} style={({ pressed }) => [estilos.barraDelPedido, { bottom: espacioDeLaBarra - 6 }, pressed && { backgroundColor: colores.acentoOscuro }]} accessibilityRole="button">
                    <View style={estilos.contador}>
                        <Text style={estilos.textoDelContador}>{carrito.unidades}</Text>
                    </View>
                    <Text style={[estilos.textoDelPedido, { flex: 1 }]}>Ver mi pedido</Text>
                    <Text style={estilos.textoDelPedido}>{soles(carrito.total)}</Text>
                </Pressable>
            )}
        </View>
    );
}

/** Sin tildes ni mayúsculas: "aji" encuentra "Ají de gallina". */
function normalizar(texto: string): string {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function TarjetaDeProducto({ producto }: { producto: Producto }) {
    return (
        <View>
            <Pressable
                onPress={() => router.push(`/producto/${producto.id}`)}
                accessibilityRole="button"
                accessibilityLabel={`${producto.nombre}, ${soles(producto.precio)}${producto.disponible ? "" : ", agotado"}`}
                style={({ pressed }) => [estilos.tarjeta, pressed && { opacity: 0.85 }, !producto.disponible && { opacity: 0.6 }]}
            >
                <FotoDelProducto imagenUrl={producto.imagenUrl} estilo={estilos.foto} />
                <View style={{ flex: 1, gap: 4 }}>
                    <Text style={[texto.fuerte, estilos.nombreJuntoAlCorazon]} numberOfLines={2}>
                        {producto.nombre}
                    </Text>
                    {producto.descripcion && (
                        <Text style={texto.nota} numberOfLines={2}>
                            {producto.descripcion}
                        </Text>
                    )}
                    <View style={estilos.pieDeTarjeta}>
                        <Text style={estilos.precio}>{soles(producto.precio)}</Text>
                        {!producto.disponible ? (
                            <Chip tono="error">Agotado</Chip>
                        ) : (
                            producto.minutosPreparacion > 0 && (
                                <View style={estilos.tiempo}>
                                    <Icono nombre="reloj" color={colores.suave} tamano={14} />
                                    <Text style={texto.nota}>{producto.minutosPreparacion} min</Text>
                                </View>
                            )
                        )}
                    </View>
                </View>
            </Pressable>
            {/* Al lado de la tarjeta y no dentro: en la web un botón no puede contener otro (WCAG 4.1.2). */}
            <View style={estilos.corazonDeTarjeta}>
                <Corazon idProducto={producto.id} nombre={producto.nombre} tamano={20} />
            </View>
        </View>
    );
}

const estilos = StyleSheet.create({
    barraDeCategorias: { backgroundColor: colores.superficie, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colores.borde },
    buscador: {
        flexDirection: "row",
        alignItems: "center",
        gap: espacio.s,
        marginHorizontal: espacio.l,
        marginTop: espacio.m,
        paddingHorizontal: espacio.m,
        minHeight: 44,
        borderRadius: radio.pildora,
        backgroundColor: colores.fondo,
    },
    campoDeBusqueda: { flex: 1, fontSize: 16, color: colores.texto, paddingVertical: 8 },
    categorias: { paddingHorizontal: espacio.l, paddingVertical: espacio.m, gap: espacio.s },
    categoria: { borderWidth: 1.5, borderColor: colores.borde, borderRadius: radio.pildora, paddingHorizontal: 14, paddingVertical: 7 },
    textoDeCategoria: { fontSize: 15, fontWeight: "600", color: colores.texto },
    lista: { padding: espacio.l, gap: espacio.m },
    tarjeta: { flexDirection: "row", gap: espacio.m, backgroundColor: colores.superficie, borderRadius: radio.grande, padding: espacio.m, ...sombra },
    foto: { width: 92, height: 92, borderRadius: radio.medio },
    // El nombre deja libre la esquina donde va el corazón.
    nombreJuntoAlCorazon: { paddingRight: 36 },
    corazonDeTarjeta: { position: "absolute", top: 4, right: 4 },
    pieDeTarjeta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: "auto" },
    precio: { fontSize: 17, fontWeight: "700", color: colores.acento },
    tiempo: { flexDirection: "row", alignItems: "center", gap: 4 },
    barraDelPedido: {
        position: "absolute",
        left: espacio.l,
        right: espacio.l,
        bottom: espacio.l,
        minHeight: 58,
        borderRadius: radio.grande,
        backgroundColor: colores.acento,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: espacio.l,
        gap: espacio.m,
        boxShadow: "0 6px 16px rgba(11, 95, 208, 0.35)",
    },
    contador: { minWidth: 28, height: 28, borderRadius: 14, backgroundColor: colores.superficie, alignItems: "center", justifyContent: "center", paddingHorizontal: 6 },
    textoDelContador: { color: colores.acento, fontWeight: "700", fontSize: 15 },
    textoDelPedido: { color: colores.superficie, fontWeight: "700", fontSize: 17 },
});
