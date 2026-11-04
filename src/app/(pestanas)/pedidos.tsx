import { router, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { Chip } from "@/componentes/Controles";
import { useEspacioDeLaBarra } from "@/componentes/BarraDePestanas";
import { ListaEsqueleto } from "@/componentes/Esqueleto";
import { ErrorConReintento, Vacio } from "@/componentes/Estados";
import { useCarga } from "@/estado/useCarga";
import { misPedidos } from "@/servicios/cafeteria";
import { colores, espacio, radio, sombra, texto } from "@/tema";
import type { PedidoDelHistorial } from "@/tipos/api";
import { diaYHora, ESTADOS, soles } from "@/utils/formato";

/** Lo pedido en los últimos días, lo más nuevo arriba. Se actualiza cada vez que se abre la pestaña. */
export default function Pedidos() {
    const { datos, error, actualizando, recargar } = useCarga(misPedidos);
    const espacioDeLaBarra = useEspacioDeLaBarra();

    useFocusEffect(
        useCallback(() => {
            void recargar();
        }, [recargar]),
    );

    if (datos === undefined) {
        return error === null ? <ListaEsqueleto cuantas={3} /> : <ErrorConReintento mensaje={error} alReintentar={() => void recargar()} />;
    }

    return (
        <FlatList
            data={datos}
            keyExtractor={(pedido) => String(pedido.id)}
            renderItem={({ item }) => <FilaDePedido pedido={item} />}
            contentContainerStyle={[estilos.lista, { paddingBottom: espacioDeLaBarra }, datos.length === 0 && { flex: 1 }]}
            refreshControl={<RefreshControl refreshing={actualizando} onRefresh={() => void recargar()} tintColor={colores.acento} colors={[colores.acento]} />}
            ListEmptyComponent={<Vacio icono="pedidos" titulo="Aún no has pedido nada" detalle="Lo que pidas desde el menú aparecerá aquí." />}
        />
    );
}

function FilaDePedido({ pedido }: { pedido: PedidoDelHistorial }) {
    const estado = ESTADOS[pedido.estado];
    const resumen = pedido.items.map((item) => `${item.cantidad} × ${item.producto}`).join(", ");

    return (
        <Pressable
            onPress={() => router.push(`/pedido/${pedido.id}`)}
            accessibilityRole="button"
            style={({ pressed }) => [estilos.tarjeta, pressed && { opacity: 0.85 }]}
        >
            <View style={estilos.cabecera}>
                <Text style={estilos.numero}>{pedido.numero ?? `Pedido ${pedido.id}`}</Text>
                <Chip tono={estado.tono}>{estado.texto}</Chip>
            </View>
            <Text style={texto.cuerpo} numberOfLines={2}>
                {resumen}
            </Text>
            <View style={estilos.cabecera}>
                <Text style={texto.nota}>{diaYHora(pedido.creadoEn)}</Text>
                <Text style={texto.fuerte}>{soles(pedido.total)}</Text>
            </View>
        </Pressable>
    );
}

const estilos = StyleSheet.create({
    lista: { padding: espacio.l, gap: espacio.m },
    tarjeta: { backgroundColor: colores.superficie, borderRadius: radio.grande, padding: espacio.l, gap: espacio.s, ...sombra },
    cabecera: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: espacio.s },
    numero: { fontSize: 18, fontWeight: "700", color: colores.texto },
});
