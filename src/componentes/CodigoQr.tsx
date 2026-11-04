import { useMemo } from "react";
import { View } from "react-native";
import { generarQr } from "@/utils/qr";

/** La zona blanca alrededor que pide la norma: sin ella, algunas cámaras no lo leen. */
const MARGEN = 4;

/**
 * Un código QR dibujado con vistas, sin librerías de SVG. Cada fila es una
 * línea de tramos: los módulos oscuros seguidos van en una sola vista, así un
 * QR de recojo (21×21) son unas pocas decenas de vistas y no cuatrocientas.
 *
 * Negro sobre blanco y con un tamaño de módulo entero: es lo que mejor leen
 * las cámaras, y con medidas fraccionarias aparecerían rayitas entre filas.
 */
export function CodigoQr({ texto, tamano, descripcion }: { texto: string; tamano: number; descripcion: string }) {
    const { filas, modulo } = useMemo(() => {
        const { modulos } = generarQr(texto);
        const lado = modulos.length + MARGEN * 2;
        return { filas: modulos.map(tramosDe), modulo: Math.max(1, Math.floor(tamano / lado)) };
    }, [texto, tamano]);

    return (
        <View
            accessible
            accessibilityRole="image"
            accessibilityLabel={descripcion}
            style={{ backgroundColor: "#ffffff", padding: modulo * MARGEN, alignSelf: "center" }}
        >
            {filas.map((tramos, y) => (
                <View key={y} style={{ flexDirection: "row", height: modulo }}>
                    {tramos.map((tramo, i) => (
                        <View key={i} style={{ width: tramo.largo * modulo, backgroundColor: tramo.oscuro ? "#000000" : "#ffffff" }} />
                    ))}
                </View>
            ))}
        </View>
    );
}

function tramosDe(fila: boolean[]): { oscuro: boolean; largo: number }[] {
    const tramos: { oscuro: boolean; largo: number }[] = [];
    for (const oscuro of fila) {
        const ultimo = tramos[tramos.length - 1];
        if (ultimo && ultimo.oscuro === oscuro) {
            ultimo.largo++;
        } else {
            tramos.push({ oscuro, largo: 1 });
        }
    }
    return tramos;
}
