import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { ListaEsqueleto } from "@/componentes/Esqueleto";
import { Vacio } from "@/componentes/Estados";
import { Icono, type NombreDeIcono } from "@/componentes/Icono";
import { useCuenta } from "@/estado/cuenta";
import { marcarAvisosLeidos, obtenerAvisos } from "@/servicios/cafeteria";
import { colores, espacio, radio, sombra, texto } from "@/tema";
import type { Aviso } from "@/tipos/api";
import { diaYHora } from "@/utils/formato";

const ESTILO_POR_TIPO: Record<string, { icono: NombreDeIcono; color: string; fondo: string }> = {
    PAGO_CONFIRMADO: { icono: "dinero", color: colores.acento, fondo: colores.acentoClaro },
    PEDIDO_LISTO: { icono: "listo", color: colores.ok, fondo: colores.okClaro },
    PEDIDO_CANCELADO: { icono: "cerrar", color: colores.error, fondo: colores.errorClaro },
    RECLAMACION_RESPONDIDA: { icono: "libro", color: colores.calidoOscuro, fondo: colores.calidoClaro },
};
const ESTILO_COMUN = { icono: "campana" as NombreDeIcono, color: colores.acento, fondo: colores.acentoClaro };

/**
 * La campana: lo que pasó con los pedidos, lo más nuevo arriba. Al abrirla
 * se marcan como leídas (el número de Inicio vuelve a cero), pero en esta
 * visita se siguen viendo resaltadas las que eran nuevas.
 */
export default function Notificaciones() {
    const { bandeja, recargarBandeja } = useCuenta();
    const [nuevas, setNuevas] = useState<Set<number>>(new Set());
    const [actualizando, setActualizando] = useState(false);

    useFocusEffect(
        useCallback(() => {
            void (async () => {
                try {
                    const actual = await obtenerAvisos();
                    const sinLeer = actual.avisos.filter((aviso) => !aviso.leida).map((aviso) => aviso.id);
                    // Se recuerdan antes de marcarlas, para seguir resaltándolas en esta visita.
                    setNuevas(new Set(sinLeer));
                    if (sinLeer.length > 0) {
                        await marcarAvisosLeidos();
                    }
                } catch {
                    // Sin conexión se muestra lo último que llegó.
                }
                await recargarBandeja();
            })();
        }, [recargarBandeja]),
    );

    if (bandeja === null) {
        return <ListaEsqueleto cuantas={4} />;
    }

    return (
        <FlatList
            data={bandeja.avisos}
            keyExtractor={(aviso) => String(aviso.id)}
            renderItem={({ item }) => <FilaDeAviso aviso={item} nueva={nuevas.has(item.id)} />}
            contentContainerStyle={[estilos.lista, bandeja.avisos.length === 0 && { flex: 1 }]}
            refreshControl={
                <RefreshControl
                    refreshing={actualizando}
                    onRefresh={async () => {
                        setActualizando(true);
                        await recargarBandeja();
                        setActualizando(false);
                    }}
                    tintColor={colores.acento}
                    colors={[colores.acento]}
                />
            }
            ListEmptyComponent={
                <Vacio icono="campana" titulo="No tienes notificaciones" detalle="Aquí te avisaremos cuando paguen tu pedido y cuando esté listo." />
            }
        />
    );
}

function FilaDeAviso({ aviso, nueva }: { aviso: Aviso; nueva: boolean }) {
    const { icono, color, fondo } = ESTILO_POR_TIPO[aviso.tipo] ?? ESTILO_COMUN;
    const idPedido = aviso.idPedido;
    const esDeReclamacion = aviso.tipo === "RECLAMACION_RESPONDIDA";
    return (
        <Pressable
            onPress={() => (esDeReclamacion ? router.push("/reclamaciones") : idPedido && router.push(`/pedido/${idPedido}`))}
            disabled={!idPedido && !esDeReclamacion}
            accessibilityRole="button"
            style={({ pressed }) => [estilos.fila, nueva && estilos.nueva, pressed && { opacity: 0.85 }]}
        >
            <View style={[estilos.icono, { backgroundColor: fondo }]}>
                <Icono nombre={icono} color={color} tamano={20} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
                <Text style={texto.fuerte}>{aviso.titulo}</Text>
                <Text style={[texto.cuerpo, { color: colores.suave, fontSize: 15 }]}>{aviso.cuerpo}</Text>
                <Text style={[texto.nota, { fontSize: 13 }]}>{diaYHora(aviso.creadaEn)}</Text>
            </View>
            {nueva && <View style={estilos.punto} accessibilityLabel="Nueva" />}
        </Pressable>
    );
}

const estilos = StyleSheet.create({
    lista: { padding: espacio.l, gap: espacio.s },
    fila: { flexDirection: "row", gap: espacio.m, alignItems: "flex-start", backgroundColor: colores.superficie, borderRadius: radio.grande, padding: espacio.l, ...sombra },
    nueva: { borderWidth: 1.5, borderColor: colores.acento },
    icono: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
    punto: { width: 10, height: 10, borderRadius: 5, backgroundColor: colores.calido, marginTop: 6 },
});
