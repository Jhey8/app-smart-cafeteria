import * as Haptics from "expo-haptics";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colores, espacio, radio, sombra, texto } from "@/tema";
import type { DatosDelComprobante } from "@/utils/comprobante";
import { Campo } from "./Controles";

type Opcion = "BOLETA" | "BOLETA_CON_DNI" | "FACTURA";

const OPCIONES: { valor: Opcion; texto: string }[] = [
    { valor: "BOLETA", texto: "Boleta" },
    { valor: "BOLETA_CON_DNI", texto: "Boleta con DNI" },
    { valor: "FACTURA", texto: "Factura" },
];

function opcionDe(datos: DatosDelComprobante): Opcion {
    if (datos.tipo === "FACTURA") {
        return "FACTURA";
    }
    return datos.tipoDocumento === "DNI" ? "BOLETA_CON_DNI" : "BOLETA";
}

interface Props {
    valor: DatosDelComprobante;
    alCambiar: (valor: DatosDelComprobante) => void;
    /** El nombre de la cuenta, para no escribirlo en la boleta con DNI. */
    nombreDeLaCuenta?: string;
}

/**
 * Boleta, boleta con DNI o factura. La mayoría pide boleta sin más, por eso
 * es lo que viene marcado; la factura pide el RUC y la razón social de la
 * empresa, que el backend valida antes de reservar nada.
 */
export function ElegirComprobante({ valor, alCambiar, nombreDeLaCuenta }: Props) {
    const opcion = opcionDe(valor);
    const cambiar = (cambios: Partial<DatosDelComprobante>) => alCambiar({ ...valor, ...cambios });

    function elegir(nueva: Opcion) {
        if (nueva === opcion) {
            return;
        }
        void Haptics.selectionAsync().catch(() => {});
        if (nueva === "FACTURA") {
            alCambiar({ tipo: "FACTURA", tipoDocumento: "RUC", numeroDocumento: "", nombre: "" });
        } else if (nueva === "BOLETA_CON_DNI") {
            alCambiar({ tipo: "BOLETA", tipoDocumento: "DNI", numeroDocumento: "", nombre: nombreDeLaCuenta ?? "" });
        } else {
            alCambiar({ tipo: "BOLETA", tipoDocumento: "SIN_DOCUMENTO" });
        }
    }

    return (
        <View style={estilos.tarjeta}>
            <Text style={texto.fuerte}>Comprobante</Text>
            <View style={estilos.opciones} accessibilityRole="radiogroup">
                {OPCIONES.map((cada) => {
                    const elegida = cada.valor === opcion;
                    return (
                        <Pressable
                            key={cada.valor}
                            onPress={() => elegir(cada.valor)}
                            accessibilityRole="radio"
                            accessibilityState={{ checked: elegida }}
                            style={[estilos.opcion, elegida && estilos.elegida]}
                        >
                            <Text style={[estilos.textoDeOpcion, elegida && { color: colores.superficie }]}>{cada.texto}</Text>
                        </Pressable>
                    );
                })}
            </View>

            {opcion === "BOLETA_CON_DNI" && (
                <>
                    <Campo
                        etiqueta="DNI"
                        value={valor.numeroDocumento ?? ""}
                        onChangeText={(escrito) => cambiar({ numeroDocumento: escrito.replace(/\D/g, "").slice(0, 8) })}
                        keyboardType="number-pad"
                        maxLength={8}
                        placeholder="12345678"
                    />
                    <Campo etiqueta="Nombre" value={valor.nombre ?? ""} onChangeText={(escrito) => cambiar({ nombre: escrito })} maxLength={150} />
                </>
            )}

            {opcion === "FACTURA" && (
                <>
                    <Campo
                        etiqueta="RUC"
                        value={valor.numeroDocumento ?? ""}
                        onChangeText={(escrito) => cambiar({ numeroDocumento: escrito.replace(/\D/g, "").slice(0, 11) })}
                        keyboardType="number-pad"
                        maxLength={11}
                        placeholder="20123456789"
                    />
                    <Campo
                        etiqueta="Razón social"
                        value={valor.nombre ?? ""}
                        onChangeText={(escrito) => cambiar({ nombre: escrito })}
                        maxLength={150}
                        autoCapitalize="characters"
                    />
                    <Campo
                        etiqueta="Dirección (opcional)"
                        value={valor.direccion ?? ""}
                        onChangeText={(escrito) => cambiar({ direccion: escrito })}
                        maxLength={200}
                    />
                </>
            )}

            <Text style={texto.nota}>
                {opcion === "BOLETA" ? "Una boleta simple, sin datos." : "Lo recordamos en este teléfono para tu próximo pedido."}
            </Text>
        </View>
    );
}

const estilos = StyleSheet.create({
    tarjeta: { backgroundColor: colores.superficie, borderRadius: radio.grande, padding: espacio.l, gap: espacio.m, ...sombra },
    opciones: { flexDirection: "row", gap: espacio.s, flexWrap: "wrap" },
    opcion: {
        paddingHorizontal: espacio.m,
        paddingVertical: espacio.s,
        borderRadius: radio.pildora,
        borderWidth: 1,
        borderColor: colores.borde,
        backgroundColor: colores.superficie,
    },
    elegida: { backgroundColor: colores.acento, borderColor: colores.acento },
    textoDeOpcion: { fontSize: 15, fontWeight: "600", color: colores.texto },
});
