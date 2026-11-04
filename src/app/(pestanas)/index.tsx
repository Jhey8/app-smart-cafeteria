import { router, useFocusEffect } from "expo-router";
import { setStatusBarStyle } from "expo-status-bar";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Animated, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Boton } from "@/componentes/Controles";
import { useEspacioDeLaBarra } from "@/componentes/BarraDePestanas";
import { Bloque } from "@/componentes/Esqueleto";
import { CarruselDeHoy, CuadrosDeCategorias, useLadoDeCuadro } from "@/componentes/SeccionesDeInicio";
import { FotoDelProducto } from "@/componentes/FotoDelProducto";
import { Icono } from "@/componentes/Icono";
import { useAvisos } from "@/estado/avisos";
import { useCarrito } from "@/estado/carrito";
import { useCuenta } from "@/estado/cuenta";
import { useSesion } from "@/estado/sesion";
import { useCarga } from "@/estado/useCarga";
import { misPedidos, obtenerCategorias, obtenerExpress, obtenerHorario, obtenerMenu } from "@/servicios/cafeteria";
import { colores, espacio, radio, sombra, texto } from "@/tema";
import type { PedidoDelHistorial, Producto } from "@/tipos/api";
import { soles } from "@/utils/formato";

/** El alto de la fila del saludo, fijo. */
const ALTO_DEL_SALUDO = 72;
/** Lo que mide la búsqueda antes de medirla de verdad (onLayout la corrige en el primer cuadro). */
const ALTO_DE_LA_BUSQUEDA_ESTIMADO = 66;

/**
 * La pantalla de entrada: lo más rápido primero.
 *
 * Arriba, fija, la barra azul con el saludo, los avisos y el carrito; debajo,
 * la búsqueda, que se esconde al bajar y vuelve apenas se sube un poco, como
 * en las apps de delivery. Después el plato express del día, repetir el
 * último pedido, las categorías en cuadros con foto y los platos de hoy.
 * Todo lleva al pedido antes de enviarlo: nada se pide sin ver el total.
 */
export default function Inicio() {
    const carrito = useCarrito();
    const { avisar } = useAvisos();
    const espacioDeLaBarra = useEspacioDeLaBarra();
    const ladoDeCuadro = useLadoDeCuadro();
    const menu = useCarga(obtenerMenu);
    const express = useCarga(obtenerExpress);
    const historial = useCarga(misPedidos);
    const horario = useCarga(obtenerHorario, 60);
    const delPanel = useCarga(obtenerCategorias);
    const recargarHistorial = historial.recargar;

    useFocusEffect(
        useCallback(() => {
            // Al volver de hacer un pedido, el "último pedido" ya es otro.
            void recargarHistorial();
            // La hora y la batería van en blanco sobre el azul; en las otras pestañas, en negro.
            setStatusBarStyle("light");
            return () => setStatusBarStyle("dark");
        }, [recargarHistorial]),
    );

    const margenes = useSafeAreaInsets();
    const [altoDeLaBusqueda, setAltoDeLaBusqueda] = useState(ALTO_DE_LA_BUSQUEDA_ESTIMADO);
    // Animated.Value en estado y no en una ref: se crea una vez y no se lee durante el render.
    const [desplazamiento] = useState(() => new Animated.Value(0));
    const altoDeLaBarra = margenes.top + ALTO_DEL_SALUDO + altoDeLaBusqueda;

    /*
     * Cuánto está escondida la búsqueda, de 0 a su alto. diffClamp suma lo que
     * se desliza y lo recorta a ese rango: al bajar se esconde, y al subir un
     * poco vuelve, esté donde esté la lista (lo que hace PedidosYa). El rebote
     * de arriba (desplazamiento negativo) no cuenta.
     */
    const escondida = useMemo(
        () =>
            Animated.diffClamp(
                desplazamiento.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolateLeft: "clamp" }),
                0,
                altoDeLaBusqueda,
            ),
        [desplazamiento, altoDeLaBusqueda],
    );

    const actualizar = () => Promise.all([menu.recargar(), express.recargar(), historial.recargar(), horario.recargar(), delPanel.recargar()]);
    // Las del panel; si el backend todavía no las ofrece, las que trae el menú de hoy.
    const categorias = delPanel.datos ?? [...new Set((menu.datos ?? []).map((producto) => producto.categoria))].map((nombre) => ({ nombre, icono: null }));
    const ultimo = historial.datos?.[0];

    function pedirExpress(producto: Producto) {
        carrito.agregar(producto);
        avisar(`Agregado: ${producto.nombre}`);
        router.push("/carrito");
    }

    function repetir(pedido: PedidoDelHistorial) {
        const hoy = new Map((menu.datos ?? []).map((producto) => [producto.id, producto]));
        const faltan: string[] = [];
        let agregados = 0;
        for (const item of pedido.items) {
            const producto = hoy.get(item.idProducto);
            if (producto?.disponible) {
                carrito.agregar(producto, item.cantidad);
                agregados++;
            } else {
                faltan.push(item.producto);
            }
        }
        if (agregados === 0) {
            Alert.alert("Hoy no se puede repetir", "Ninguno de esos platos está en el menú de hoy o ya se agotaron.");
            return;
        }
        avisar(agregados === 1 ? "Agregamos tu último pedido" : `Agregamos ${agregados} platos de tu último pedido`);
        router.push("/carrito");
        if (faltan.length > 0) {
            Alert.alert("Agregamos lo que hay hoy", `No está en el menú de hoy: ${faltan.join(", ")}.`);
        }
    }

    return (
        <View style={{ flex: 1, backgroundColor: colores.fondo }}>
            <Animated.ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: espacioDeLaBarra }}
                scrollEventThrottle={16}
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: desplazamiento } } }], { useNativeDriver: true })}
                refreshControl={
                    <RefreshControl
                        refreshing={menu.actualizando}
                        onRefresh={() => void actualizar()}
                        // En Android la ruedita aparece debajo de la barra; en iOS se ve la de la barra (BarraSuperior).
                        progressViewOffset={altoDeLaBarra}
                        tintColor={colores.acento}
                        colors={[colores.acento]}
                    />
                }
            >
                {/* El azul empieza detrás de la barra fija y baja con la ola; si hoy hay express, va adentro. */}
                <Ola altoDeLaBarra={altoDeLaBarra} express={express.datos ?? null} alPedir={pedirExpress} />

                <View style={estilos.cuerpo}>
                    {horario.datos && !horario.datos.abierto && (
                        <View style={estilos.cerrado} accessibilityRole="alert">
                            <Icono nombre="reloj" color={colores.calidoOscuro} tamano={22} />
                            <View style={{ flex: 1 }}>
                                <Text style={[texto.fuerte, { color: colores.calidoOscuro }]}>Ahora estamos cerrados</Text>
                                <Text style={[texto.nota, { color: colores.calidoOscuro }]}>{horario.datos.mensaje}</Text>
                            </View>
                        </View>
                    )}

                    {historial.datos !== undefined && (ultimo === undefined || ultimo.items.length === 0) && (
                        <View style={estilos.repetirVacio}>
                            <Icono nombre="repetir" color={colores.suave} tamano={18} />
                            <Text style={[texto.nota, { flex: 1 }]}>Tu último pedido aparecerá aquí para repetirlo con un toque.</Text>
                        </View>
                    )}

                    {ultimo && ultimo.items.length > 0 && (
                        <Pressable onPress={() => repetir(ultimo)} accessibilityRole="button" style={({ pressed }) => [estilos.repetir, pressed && { opacity: 0.85 }]}>
                            <View style={estilos.iconoDeRepetir}>
                                <Icono nombre="repetir" color={colores.acento} />
                            </View>
                            <View style={{ flex: 1, gap: 2 }}>
                                <Text style={texto.fuerte}>Repetir mi último pedido</Text>
                                <Text style={texto.nota} numberOfLines={1}>
                                    {ultimo.items.map((item) => `${item.cantidad > 1 ? `${item.cantidad} × ` : ""}${item.producto}`).join(" + ")}
                                </Text>
                                <Text style={[texto.nota, { color: colores.acento, fontWeight: "600" }]}>{soles(ultimo.total)}</Text>
                            </View>
                            <Icono nombre="siguiente" color={colores.suave} tamano={18} />
                        </Pressable>
                    )}

                    {/* Los favoritos que hoy están en el menú; si ninguno está, la sección no aparece. */}
                    {menu.datos !== undefined && <CarruselDeHoy menu={menu.datos} titulo="Tus favoritos" soloFavoritos />}
                    {menu.datos !== undefined && categorias.length > 0 && <CuadrosDeCategorias categorias={categorias} menu={menu.datos} />}
                    {menu.datos !== undefined && <CarruselDeHoy menu={menu.datos} />}

                    {menu.datos === undefined && menu.error === null && (
                        <View style={estilos.cuadricula} accessibilityLabel="Cargando" accessibilityRole="progressbar">
                            {[0, 1, 2, 3].map((indice) => (
                                <View key={indice} style={[estilos.cuadroCargando, { width: ladoDeCuadro, height: ladoDeCuadro }]}>
                                    <Bloque ancho={44} alto={44} redondeo={22} />
                                    <Bloque ancho="60%" alto={12} />
                                </View>
                            ))}
                        </View>
                    )}

                    {menu.datos !== undefined && categorias.length === 0 && (
                        <Text style={[texto.nota, { textAlign: "center" }]}>Todavía no hay menú para hoy.</Text>
                    )}
                    {menu.error && menu.datos === undefined && (
                        <View style={estilos.sinMenu}>
                            <Text style={[texto.fuerte, { textAlign: "center" }]}>No pudimos cargar el menú</Text>
                            <Text style={[texto.nota, { textAlign: "center" }]}>{menu.error}</Text>
                            <Boton variante="secundario" onPress={() => void menu.recargar()}>
                                Reintentar
                            </Boton>
                        </View>
                    )}
                </View>
            </Animated.ScrollView>

            <BarraSuperior
                desplazamiento={desplazamiento}
                escondida={escondida}
                altoDeLaBusqueda={altoDeLaBusqueda}
                actualizando={menu.actualizando}
                alMedirLaBusqueda={setAltoDeLaBusqueda}
            />
        </View>
    );
}

/**
 * La barra azul de arriba, fija. Son dos capas:
 *
 *   El fondo azul con la búsqueda, que sube cuando la búsqueda se esconde y
 *   lleva las esquinas de abajo redondeadas (así la barra se ve redondeada
 *   esté la búsqueda o no). La búsqueda se desvanece mientras sube, para no
 *   cruzarse con el saludo.
 *   El saludo con los avisos y el carrito, encima, quieto.
 *
 * Todo con transform y opacity: corre en el hilo nativo y no se traba al
 * deslizar rápido.
 */
function BarraSuperior({
    desplazamiento,
    escondida,
    altoDeLaBusqueda,
    actualizando,
    alMedirLaBusqueda,
}: {
    desplazamiento: Animated.Value;
    escondida: ReturnType<typeof Animated.diffClamp>;
    altoDeLaBusqueda: number;
    actualizando: boolean;
    alMedirLaBusqueda: (alto: number) => void;
}) {
    const { sesion } = useSesion();
    const margenes = useSafeAreaInsets();
    const { cuenta, bandeja } = useCuenta();
    const { unidades } = useCarrito();
    const nombre = (cuenta?.nombres ?? sesion?.nombres ?? "").split(" ")[0];
    const sinLeer = bandeja?.noLeidas ?? 0;

    const subida = Animated.multiply(escondida, -1);
    const opacidadDeLaBusqueda = escondida.interpolate({ inputRange: [0, altoDeLaBusqueda * 0.6], outputRange: [1, 0], extrapolate: "clamp" });
    // Quieta, la barra y la ola son un solo azul; en cuanto algo pasa por debajo, aparece la sombra.
    const opacidadDeLaSombra = desplazamiento.interpolate({ inputRange: [0, 24], outputRange: [0, 1], extrapolate: "clamp" });

    return (
        <View style={estilos.barra} pointerEvents="box-none">
            <Animated.View style={[estilos.fondoDeLaBarra, { paddingTop: margenes.top, transform: [{ translateY: subida }] }]}>
                <Animated.View style={[estilos.sombraDeLaBarra, { opacity: opacidadDeLaSombra }]} pointerEvents="none" />
                <View style={{ height: ALTO_DEL_SALUDO }} />
                <Animated.View style={{ opacity: opacidadDeLaBusqueda }} onLayout={(evento) => alMedirLaBusqueda(evento.nativeEvent.layout.height)}>
                    <View style={estilos.contenedorDeLaBusqueda}>
                        <Pressable
                            onPress={() => router.push({ pathname: "/menu", params: { buscar: "1" } })}
                            accessibilityRole="search"
                            accessibilityLabel="Buscar en el menú"
                            style={estilos.buscador}
                        >
                            <Text style={estilos.textoDelBuscador}>Busca platos, bebidas o postres</Text>
                            <View style={estilos.lupa}>
                                <Icono nombre="buscar" color={colores.superficie} tamano={18} />
                            </View>
                        </Pressable>
                    </View>
                </Animated.View>
            </Animated.View>

            <View style={[estilos.saludo, { top: margenes.top }]}>
                <View style={{ flex: 1 }}>
                    <Text role="heading" aria-level={1} style={estilos.hola} numberOfLines={1}>
                        Hola, {nombre}
                    </Text>
                    <Text style={estilos.pregunta}>¿Qué pedirás hoy?</Text>
                </View>
                {actualizando && <ActivityIndicator color={colores.superficie} />}
                <Pressable
                    onPress={() => router.push("/notificaciones")}
                    accessibilityRole="button"
                    accessibilityLabel={sinLeer > 0 ? `Notificaciones, ${sinLeer} sin leer` : "Notificaciones"}
                    style={estilos.circuloDeLaBarra}
                >
                    <Icono nombre="campana" color={colores.superficie} tamano={22} />
                    {sinLeer > 0 && (
                        <View style={estilos.contador}>
                            <Text style={estilos.textoDelContador}>{sinLeer > 9 ? "9+" : sinLeer}</Text>
                        </View>
                    )}
                </Pressable>
                {/* El carrito a mano desde Inicio: después de agregar un plato no hay que ir al menú para ver el pedido. La cuenta ya está en la pestaña "Tú". */}
                <Pressable
                    onPress={() => router.push("/carrito")}
                    accessibilityRole="button"
                    accessibilityLabel={unidades > 0 ? `Tu pedido, ${unidades} ${unidades === 1 ? "producto" : "productos"}` : "Tu pedido, vacío"}
                    style={[estilos.circuloDeLaBarra, unidades > 0 && estilos.carritoConAlgo]}
                >
                    <Icono nombre="carrito" color={unidades > 0 ? colores.acento : colores.superficie} tamano={22} />
                    {unidades > 0 && (
                        <View style={estilos.contador}>
                            <Text style={estilos.textoDelContador}>{unidades > 9 ? "9+" : unidades}</Text>
                        </View>
                    )}
                </Pressable>
            </View>
        </View>
    );
}

/**
 * El bloque azul de arriba, como siempre: empieza detrás de la barra fija y
 * baja con la esquina derecha muy redondeada y la izquierda apenas, como una
 * ola. Adentro, el plato express del día (lo que la cafetería marca para la
 * hora punta), con la foto saliendo por el borde de la pantalla. Si hoy no
 * hay express, queda solo la ola.
 */
function Ola({ altoDeLaBarra, express, alPedir }: { altoDeLaBarra: number; express: Producto | null; alPedir: (producto: Producto) => void }) {
    return (
        <View style={[estilos.ola, { paddingTop: altoDeLaBarra + (express ? espacio.s : 0), paddingBottom: express ? espacio.xxl : espacio.l }]}>
            {/* Al estirar hacia abajo para actualizar, arriba se sigue viendo azul y no el gris del fondo. */}
            <View style={estilos.estiramiento} />
            {/* Dos círculos de luz detrás, para que el azul no sea un bloque plano. */}
            <View style={estilos.decoracion} pointerEvents="none">
                <View style={[estilos.circulo, { width: 260, height: 260, top: -90, right: -80 }]} />
                <View style={[estilos.circulo, { width: 180, height: 180, bottom: -70, left: -60 }]} />
            </View>

            {express && (
                <View style={estilos.oferta}>
                    <View style={{ flex: 1, gap: espacio.s }}>
                        <View style={estilos.sello}>
                            <Icono nombre="express" color={colores.acentoProfundo} tamano={14} />
                            <Text style={estilos.textoDelSello}>EXPRESS DEL DÍA</Text>
                        </View>
                        <Text style={estilos.nombreDelPlato} numberOfLines={3}>
                            {express.nombre}
                        </Text>
                        <Text style={estilos.precio}>por {soles(express.precio)}</Text>
                        {express.disponible ? (
                            <>
                                {express.minutosPreparacion > 0 && (
                                    <View style={estilos.tiempo}>
                                        <Icono nombre="reloj" color={colores.superficie} tamano={14} />
                                        <Text style={estilos.textoDelTiempo}>Listo en unos {express.minutosPreparacion} min</Text>
                                    </View>
                                )}
                                <Pressable
                                    onPress={() => alPedir(express)}
                                    accessibilityRole="button"
                                    style={({ pressed }) => [estilos.botonPedir, pressed && { opacity: 0.85 }]}
                                >
                                    <Text style={estilos.textoPedir}>Pedir esto</Text>
                                </Pressable>
                            </>
                        ) : (
                            <Text style={estilos.textoDelTiempo}>Se agotó por hoy</Text>
                        )}
                    </View>
                    <FotoDelProducto imagenUrl={express.imagenUrl} estilo={estilos.foto} tamanoDelIcono={48} />
                </View>
            )}
        </View>
    );
}

const estilos = StyleSheet.create({
    barra: { position: "absolute", top: 0, left: 0, right: 0 },
    fondoDeLaBarra: { backgroundColor: colores.acento, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
    sombraDeLaBarra: {
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        backgroundColor: colores.acento,
        boxShadow: "0 4px 14px rgba(7, 53, 116, 0.28)",
    },
    ola: {
        backgroundColor: colores.acento,
        paddingHorizontal: espacio.xl,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 72,
    },
    estiramiento: { position: "absolute", left: 0, right: 0, top: -1000, height: 1000, backgroundColor: colores.acento },
    decoracion: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, overflow: "hidden", borderBottomLeftRadius: 28, borderBottomRightRadius: 72 },
    circulo: { position: "absolute", borderRadius: 999, backgroundColor: "rgba(255, 255, 255, 0.07)" },
    contenedorDeLaBusqueda: { paddingHorizontal: espacio.l, paddingBottom: espacio.l },
    buscador: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colores.superficie,
        borderRadius: radio.pildora,
        paddingLeft: espacio.l,
        padding: 5,
        boxShadow: "0 4px 12px rgba(7, 53, 116, 0.25)",
    },
    textoDelBuscador: { flex: 1, fontSize: 16, color: colores.suave },
    lupa: { width: 40, height: 40, borderRadius: 20, backgroundColor: colores.acento, alignItems: "center", justifyContent: "center" },
    saludo: {
        position: "absolute",
        left: 0,
        right: 0,
        height: ALTO_DEL_SALUDO,
        flexDirection: "row",
        alignItems: "center",
        gap: espacio.m,
        paddingHorizontal: espacio.l,
    },
    hola: { fontSize: 24, fontWeight: "800", color: colores.superficie },
    pregunta: { fontSize: 15, color: "rgba(255, 255, 255, 0.85)", marginTop: 1 },
    carritoConAlgo: { backgroundColor: colores.superficie },
    circuloDeLaBarra: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255, 255, 255, 0.14)", alignItems: "center", justifyContent: "center" },
    contador: {
        position: "absolute",
        top: 2,
        right: 0,
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        paddingHorizontal: 5,
        backgroundColor: colores.calido,
        borderWidth: 2,
        borderColor: colores.acento,
        alignItems: "center",
        justifyContent: "center",
    },
    textoDelContador: { fontSize: 11, fontWeight: "800", color: colores.acentoProfundo },
    oferta: { flexDirection: "row", alignItems: "center", gap: espacio.m },
    sello: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        alignSelf: "flex-start",
        backgroundColor: colores.calido,
        borderRadius: radio.pildora,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    textoDelSello: { color: colores.acentoProfundo, fontSize: 14, fontWeight: "800", letterSpacing: 0.5 },
    nombreDelPlato: { fontSize: 26, fontWeight: "800", color: colores.superficie, lineHeight: 31 },
    precio: { fontSize: 24, fontWeight: "800", color: colores.superficie },
    tiempo: { flexDirection: "row", alignItems: "center", gap: 6 },
    textoDelTiempo: { color: "rgba(255, 255, 255, 0.9)", fontSize: 14, fontWeight: "600" },
    botonPedir: {
        alignSelf: "flex-start",
        backgroundColor: colores.calido,
        borderRadius: radio.pildora,
        paddingHorizontal: espacio.xl,
        paddingVertical: espacio.m,
        marginTop: espacio.xs,
    },
    textoPedir: { color: colores.acentoProfundo, fontSize: 16, fontWeight: "800" },
    // La foto llega hasta el borde derecho de la pantalla, como si el plato se saliera del azul.
    foto: {
        width: 158,
        height: 188,
        marginRight: -espacio.xl,
        borderTopLeftRadius: 28,
        borderBottomLeftRadius: 28,
        boxShadow: "-8px 12px 28px rgba(4, 30, 70, 0.4)",
    },
    cuerpo: { padding: espacio.l, paddingTop: espacio.xl, gap: espacio.xl },
    repetir: { flexDirection: "row", alignItems: "center", gap: espacio.m, backgroundColor: colores.superficie, borderRadius: radio.grande, padding: espacio.l, ...sombra },
    sinMenu: { gap: espacio.s, padding: espacio.l, borderRadius: radio.grande, backgroundColor: colores.superficie, ...sombra },
    cerrado: { flexDirection: "row", alignItems: "center", gap: espacio.m, backgroundColor: colores.calidoClaro, borderRadius: radio.grande, padding: espacio.l },
    repetirVacio: {
        flexDirection: "row",
        alignItems: "center",
        gap: espacio.s,
        paddingHorizontal: espacio.m,
        paddingVertical: espacio.s,
        borderWidth: 1.5,
        borderStyle: "dashed",
        borderColor: colores.borde,
        borderRadius: radio.medio,
    },
    iconoDeRepetir: { width: 44, height: 44, borderRadius: radio.medio, backgroundColor: colores.acentoClaro, alignItems: "center", justifyContent: "center" },
    cuadricula: { flexDirection: "row", flexWrap: "wrap", gap: espacio.s },
    cuadroCargando: { borderRadius: radio.grande, backgroundColor: colores.superficie, alignItems: "center", justifyContent: "center", gap: 8 },
});
