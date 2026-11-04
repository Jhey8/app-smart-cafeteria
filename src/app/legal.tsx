import { useState, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useCarga } from "@/estado/useCarga";
import { obtenerEmpresa } from "@/servicios/cafeteria";
import { colores, espacio, radio } from "@/tema";
import type { Empresa } from "@/tipos/api";

type Documento = "terminos" | "privacidad";

/**
 * Términos de uso y política de privacidad (Ley 29733, de Protección de
 * Datos Personales). Se puede leer sin cuenta: el registro enlaza aquí antes
 * de pedir que se acepten. Los datos de quién es la cafetería salen del
 * módulo de empresa del panel.
 */
export default function InformacionLegal() {
    const [documento, setDocumento] = useState<Documento>("terminos");
    const { datos: empresa } = useCarga(obtenerEmpresa);

    return (
        <ScrollView style={{ backgroundColor: colores.superficie }} contentContainerStyle={estilos.contenido}>
            <View style={estilos.selector}>
                {(["terminos", "privacidad"] as const).map((opcion) => (
                    <Pressable
                        key={opcion}
                        onPress={() => setDocumento(opcion)}
                        accessibilityRole="tab"
                        accessibilityState={{ selected: documento === opcion }}
                        style={[estilos.opcion, documento === opcion && estilos.opcionActiva]}
                    >
                        <Text style={[estilos.textoDeOpcion, documento === opcion && { color: colores.acento }]}>
                            {opcion === "terminos" ? "Términos de uso" : "Privacidad"}
                        </Text>
                    </Pressable>
                ))}
            </View>

            {documento === "terminos" ? <Terminos empresa={empresa ?? null} /> : <Privacidad empresa={empresa ?? null} />}

            <Proveedor empresa={empresa ?? null} />
            <Text style={estilos.pie}>Última actualización: octubre de 2026.</Text>
        </ScrollView>
    );
}

function nombreDe(empresa: Empresa | null): string {
    return empresa?.nombreComercial || empresa?.razonSocial || "UTP Smart Cafetería";
}

function Terminos({ empresa }: { empresa: Empresa | null }) {
    const nombre = nombreDe(empresa);
    return (
        <>
            <Titulo>Términos de uso</Titulo>
            <Parrafo>
                Esta app te permite ver el menú del día de {nombre}, hacer pedidos y recogerlos en la cafetería. Al crear tu cuenta aceptas
                estas condiciones.
            </Parrafo>
            <Subtitulo>Tu cuenta</Subtitulo>
            <Parrafo>
                La cuenta es personal. Entras con tu código UTP o tu DNI y una contraseña que solo tú debes conocer. Si crees que alguien más la
                usa, cámbiala y cierra la sesión en los otros dispositivos desde tu perfil.
            </Parrafo>
            <Subtitulo>Pedidos, precios y pago</Subtitulo>
            <Parrafo>
                Los precios y la disponibilidad son los del menú del día al momento de pedir; el total final lo calcula la cafetería. Un pedido
                se confirma cuando se paga. Si no se paga en 10 minutos, se cancela solo y las porciones vuelven al menú. Mientras no esté
                pagado, puedes cancelarlo desde la app.
            </Parrafo>
            <Subtitulo>Recojo</Subtitulo>
            <Parrafo>
                Al pagar recibes un número. Te avisamos en la app cuando tu pedido esté listo; recógelo en el mostrador mostrando ese número.
            </Parrafo>
            <Subtitulo>Horario</Subtitulo>
            <Parrafo>Solo se reciben pedidos dentro del horario de atención de la cafetería.</Parrafo>
            <Subtitulo>Reclamos y quejas</Subtitulo>
            <Parrafo>
                Tienes a tu disposición el Libro de Reclamaciones virtual en tu perfil. Respondemos en un plazo máximo de 15 días hábiles.
            </Parrafo>
        </>
    );
}

function Privacidad({ empresa }: { empresa: Empresa | null }) {
    const correo = empresa?.correos[0];
    return (
        <>
            <Titulo>Política de privacidad</Titulo>
            <Parrafo>
                Tratamos tus datos personales conforme a la Ley N.° 29733, Ley de Protección de Datos Personales, y su reglamento. El
                responsable es {empresa?.razonSocial ?? "la empresa que opera la cafetería"}
                {empresa?.ruc ? `, con RUC ${empresa.ruc}` : ""}.
            </Parrafo>
            <Subtitulo>Qué datos usamos</Subtitulo>
            <Parrafo>
                Tu código UTP o DNI, nombres, apellidos, correo, celular (si lo das), tu foto de perfil (si la subes), tus pedidos y, si los
                activas, el identificador de tu teléfono para enviarte avisos.
            </Parrafo>
            <Subtitulo>Para qué</Subtitulo>
            <Parrafo>
                Para gestionar tu cuenta y tus pedidos, avisarte cuando se pagan y cuando están listos, y atender tus reclamos. No los usamos
                para publicidad ni los vendemos.
            </Parrafo>
            <Subtitulo>Con quién se comparten</Subtitulo>
            <Parrafo>
                Solo con el servicio que entrega las notificaciones a tu teléfono (Expo) y con las autoridades cuando la ley lo exija.
            </Parrafo>
            <Subtitulo>Cómo los protegemos</Subtitulo>
            <Parrafo>Tu contraseña se guarda cifrada y nadie de la cafetería puede verla. La sesión en tu teléfono se guarda cifrada.</Parrafo>
            <Subtitulo>Tus derechos</Subtitulo>
            <Parrafo>
                Puedes acceder a tus datos, corregirlos desde tu perfil, oponerte a su uso o pedir que se cancelen. Puedes eliminar tu cuenta
                desde la app en cualquier momento{correo ? `, o escribirnos a ${correo}` : ""}.
            </Parrafo>
        </>
    );
}

function Proveedor({ empresa }: { empresa: Empresa | null }) {
    if (!empresa?.configurada) {
        return null;
    }
    return (
        <View style={estilos.proveedor}>
            <Text style={estilos.tituloProveedor}>Quién presta el servicio</Text>
            <Text style={estilos.parrafo}>{empresa.razonSocial}</Text>
            {empresa.ruc && <Text style={estilos.parrafo}>RUC {empresa.ruc}</Text>}
            {empresa.direccionFiscal && <Text style={estilos.parrafo}>{empresa.direccionFiscal}</Text>}
            {[...empresa.telefonos, ...empresa.correos].map((contacto) => (
                <Text key={contacto} style={estilos.parrafo}>
                    {contacto}
                </Text>
            ))}
        </View>
    );
}

const Titulo = ({ children }: { children: ReactNode }) => <Text style={estilos.titulo}>{children}</Text>;
const Subtitulo = ({ children }: { children: ReactNode }) => <Text style={estilos.subtitulo}>{children}</Text>;
const Parrafo = ({ children }: { children: ReactNode }) => <Text style={estilos.parrafo}>{children}</Text>;

const estilos = StyleSheet.create({
    contenido: { padding: espacio.xl, paddingBottom: espacio.xxl * 2 },
    selector: { flexDirection: "row", backgroundColor: colores.fondo, borderRadius: radio.pildora, padding: 4, marginBottom: espacio.l },
    opcion: { flex: 1, paddingVertical: 10, borderRadius: radio.pildora, alignItems: "center" },
    opcionActiva: { backgroundColor: colores.superficie, boxShadow: "0 1px 3px rgba(20, 23, 31, 0.12)" },
    textoDeOpcion: { fontSize: 15, fontWeight: "600", color: colores.suave },
    titulo: { fontSize: 24, fontWeight: "800", color: colores.texto, marginBottom: espacio.s },
    subtitulo: { fontSize: 17, fontWeight: "700", color: colores.texto, marginTop: espacio.l, marginBottom: espacio.xs },
    parrafo: { fontSize: 15, lineHeight: 22, color: colores.suave },
    proveedor: { marginTop: espacio.xl, padding: espacio.l, borderRadius: radio.grande, backgroundColor: colores.fondo, gap: 2 },
    tituloProveedor: { fontSize: 15, fontWeight: "700", color: colores.texto, marginBottom: espacio.xs },
    pie: { fontSize: 14, color: colores.suave, marginTop: espacio.l, textAlign: "center" },
});
