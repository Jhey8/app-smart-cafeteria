import { router } from "expo-router";
import { FlatList, Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useAvisos } from "@/estado/avisos";
import { useCarrito } from "@/estado/carrito";
import { useCuenta } from "@/estado/cuenta";
import { urlDeImagen } from "@/servicios/api";
import { colores, espacio, radio, sombra, texto } from "@/tema";
import type { Producto } from "@/tipos/api";
import { iconoDeCategoria } from "@/utils/categorias";
import { soles } from "@/utils/formato";
import { FotoDelProducto } from "./FotoDelProducto";
import { Icono } from "./Icono";

/*
 * Las secciones de Inicio que se arman con el menú de hoy. Las fotos son las
 * que se suben en el panel: mientras más platos tengan foto, más apetitoso
 * se ve el inicio, sin tocar la app.
 */

/**
 * El lado de cada cuadro: tres por fila dentro del margen de Inicio. Se
 * calcula con el ancho de la pantalla en vez de porcentaje y proporción,
 * porque esa combinación dejaba los cuadros con alto cero en algunos
 * teléfonos y la sección desaparecía.
 */
export function useLadoDeCuadro(): number {
    const { width } = useWindowDimensions();
    return Math.floor((width - espacio.l * 2 - espacio.s * 2) / 3);
}

/** Cada categoría con la foto de uno de sus platos de hoy (el primero que tenga), o null. */
function conFoto(categorias: readonly { nombre: string; icono?: string | null }[], menu: readonly Producto[]) {
    return categorias.map(({ nombre, icono }) => {
        const plato = menu.find((producto) => producto.categoria === nombre && urlDeImagen(producto.imagenUrl) !== null);
        return { nombre, icono, foto: plato ? urlDeImagen(plato.imagenUrl) : null };
    });
}

/**
 * Los cuadros de "O elige del menú". Las categorías son las del panel (en
 * su orden); la foto, la de un plato de esa categoría en el menú de hoy.
 *
 * La sombra va en una capa y el recorte de las esquinas en otra: juntas en
 * la misma vista, en iPhone el cuadro ocupaba su lugar pero no se dibujaba.
 */
export function CuadrosDeCategorias({ categorias, menu }: { categorias: readonly { nombre: string; icono?: string | null }[]; menu: readonly Producto[] }) {
    const lado = useLadoDeCuadro();
    return (
        <View style={{ gap: espacio.m }}>
            <Text style={texto.subtitulo}>O elige del menú</Text>
            <View style={estilos.cuadricula}>
                {conFoto(categorias, menu).map(({ nombre, icono, foto }, indice) => (
                    <View key={nombre} style={[estilos.sombraDelCuadro, { width: lado, height: lado }]}>
                        <Pressable
                            onPress={() => router.push({ pathname: "/menu", params: { categoria: nombre } })}
                            accessibilityRole="button"
                            accessibilityLabel={nombre}
                            style={estilos.cuadro}
                        >
                            {foto ? (
                                <>
                                    <Image source={{ uri: foto }} style={estilos.fotoDelCuadro} resizeMode="cover" />
                                    <View style={estilos.bandaDelNombre}>
                                        <Text style={estilos.nombreSobreFoto} numberOfLines={1}>
                                            {nombre}
                                        </Text>
                                    </View>
                                </>
                            ) : (
                                <View style={estilos.cuadroSinFoto}>
                                    <View style={[estilos.iconoDeCategoria, indice % 2 === 1 && { backgroundColor: colores.calidoClaro }]}>
                                        <Icono nombre={iconoDeCategoria(nombre, icono)} color={indice % 2 === 1 ? colores.calidoOscuro : colores.acento} tamano={22} />
                                    </View>
                                    <Text style={estilos.nombreSinFoto} numberOfLines={1}>
                                        {nombre}
                                    </Text>
                                </View>
                            )}
                        </Pressable>
                    </View>
                ))}
            </View>
        </View>
    );
}

/** Platos de hoy de lado a lado, los que tienen foto primero, con un + para agregar sin abrirlos. */
export function CarruselDeHoy({ menu, titulo = "Hoy en el menú", soloFavoritos = false }: { menu: readonly Producto[]; titulo?: string; soloFavoritos?: boolean }) {
    const { favoritos } = useCuenta();
    const carrito = useCarrito();
    const { avisar } = useAvisos();
    // Copia con sort y no toSorted: no todos los motores de los teléfonos lo tienen.
    const platos = [...menu]
        .filter((producto) => producto.disponible && (!soloFavoritos || favoritos.has(producto.id)))
        .sort((a, b) => Number(urlDeImagen(b.imagenUrl) !== null) - Number(urlDeImagen(a.imagenUrl) !== null))
        .slice(0, 10);

    if (platos.length === 0) {
        return null;
    }

    return (
        <View style={{ gap: espacio.m }}>
            <View style={estilos.titulo}>
                <Text style={texto.subtitulo}>{titulo}</Text>
                <Pressable onPress={() => router.push("/menu")} accessibilityRole="link" hitSlop={8}>
                    <Text style={estilos.verTodo}>Ver todo</Text>
                </Pressable>
            </View>
            <FlatList
                horizontal
                data={platos}
                keyExtractor={(producto) => String(producto.id)}
                showsHorizontalScrollIndicator={false}
                // El carrusel llega hasta el borde de la pantalla, pero empieza alineado con el resto.
                style={{ marginHorizontal: -espacio.l }}
                contentContainerStyle={{ paddingHorizontal: espacio.l, paddingBottom: espacio.xs, gap: espacio.m }}
                renderItem={({ item }) => (
                    <View style={estilos.sombraDelPlato}>
                        <Pressable
                            onPress={() => router.push(`/producto/${item.id}`)}
                            accessibilityRole="button"
                            accessibilityLabel={`${item.nombre}, ${soles(item.precio)}`}
                            style={estilos.plato}
                        >
                            <FotoDelProducto imagenUrl={item.imagenUrl} estilo={estilos.fotoDelPlato} />
                            <View style={estilos.cuerpoDelPlato}>
                                <Text style={estilos.nombreDelPlato} numberOfLines={2}>
                                    {item.nombre}
                                </Text>
                                <View style={estilos.pieDelPlato}>
                                    <Text style={estilos.precio}>{soles(item.precio)}</Text>
                                </View>
                            </View>
                        </Pressable>
                        {/* Al lado de la tarjeta y no dentro: en la web un botón no puede contener otro (WCAG 4.1.2). */}
                        <Pressable
                            onPress={() => {
                                carrito.agregar(item);
                                avisar(`Agregado: ${item.nombre}`);
                            }}
                            accessibilityRole="button"
                            accessibilityLabel={`Agregar ${item.nombre}`}
                            style={({ pressed }) => [estilos.areaDelMas, pressed && { opacity: 0.8 }]}
                        >
                            <View style={estilos.mas}>
                                <Icono nombre="mas" color={colores.acentoProfundo} tamano={16} />
                            </View>
                        </Pressable>
                    </View>
                )}
            />
        </View>
    );
}

const estilos = StyleSheet.create({
    cuadricula: { flexDirection: "row", flexWrap: "wrap", gap: espacio.s },
    sombraDelCuadro: { borderRadius: radio.grande, backgroundColor: colores.superficie, ...sombra },
    cuadro: { flex: 1, borderRadius: radio.grande, overflow: "hidden" },
    fotoDelCuadro: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, width: "100%", height: "100%" },
    bandaDelNombre: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 8, paddingVertical: 6, backgroundColor: "rgba(7, 53, 116, 0.72)" },
    nombreSobreFoto: { color: colores.superficie, fontSize: 14, fontWeight: "700", textAlign: "center" },
    cuadroSinFoto: { flex: 1, alignItems: "center", justifyContent: "center", gap: 6, padding: 6 },
    iconoDeCategoria: { width: 44, height: 44, borderRadius: 22, backgroundColor: colores.acentoClaro, alignItems: "center", justifyContent: "center" },
    nombreSinFoto: { fontSize: 14, fontWeight: "600", color: colores.texto },
    titulo: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
    verTodo: { color: colores.acento, fontSize: 15, fontWeight: "600" },
    sombraDelPlato: { width: 152, borderRadius: radio.grande, backgroundColor: colores.superficie, ...sombra },
    plato: { flex: 1, borderRadius: radio.grande, overflow: "hidden" },
    fotoDelPlato: { width: "100%", height: 108 },
    cuerpoDelPlato: { padding: espacio.s, paddingTop: 6, gap: 6, flex: 1 },
    nombreDelPlato: { fontSize: 15, fontWeight: "600", color: colores.texto, minHeight: 38 },
    // minHeight deja el espacio del botón «+», que va encima en la esquina.
    pieDelPlato: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: "auto", minHeight: 36 },
    // El círculo se ve de 30 px, pero el área que se toca mide 44 × 44 (WCAG 2.5.5).
    areaDelMas: { position: "absolute", right: 0, bottom: 0, width: 44, height: 44, alignItems: "center", justifyContent: "center" },
    precio: { fontSize: 15, fontWeight: "700", color: colores.acento },
    mas: { width: 30, height: 30, borderRadius: 15, backgroundColor: colores.calido, alignItems: "center", justifyContent: "center" },
});
