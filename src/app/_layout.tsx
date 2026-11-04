import * as Notifications from "expo-notifications";
import { router, SplashScreen, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Platform } from "react-native";
import { ProveedorDeAvisos } from "@/estado/avisos";
import { ProveedorDelCarrito } from "@/estado/carrito";
import { ProveedorDeCuenta, useCuenta } from "@/estado/cuenta";
import { ProveedorDeSesion, useSesion } from "@/estado/sesion";
import { ContenidoPrincipal } from "@/componentes/ContenidoPrincipal";
import { PuertaDeTerminos } from "@/componentes/PuertaDeTerminos";
import { SaltarAlContenido } from "@/componentes/SaltarAlContenido";
import { activarPush, destinoDelAviso } from "@/servicios/push";
import { prepararAccesibilidadWeb } from "@/utils/accesibilidadWeb";
import { colores } from "@/tema";

// La pantalla de inicio se queda hasta saber si hay una sesión guardada: así no parpadea la entrada.
void SplashScreen.preventAutoHideAsync();
prepararAccesibilidadWeb();

export default function Raiz() {
    return (
        <ProveedorDeSesion>
            <ProveedorDeCuenta>
                <ProveedorDelCarrito>
                    <ProveedorDeAvisos>
                        <StatusBar style="dark" />
                        <Navegacion />
                    </ProveedorDeAvisos>
                </ProveedorDelCarrito>
            </ProveedorDeCuenta>
        </ProveedorDeSesion>
    );
}

/**
 * Sin sesión solo se ve la entrada y el registro; con sesión, todo lo demás.
 * Si la sesión se cierra o vence, Expo Router saca a la persona de las
 * pantallas protegidas y borra ese historial.
 */
function Navegacion() {
    const { sesion } = useSesion();
    const { recargarBandeja } = useCuenta();
    const hayAlguien = Boolean(sesion);

    useEffect(() => {
        // En el navegador no hay push: la campana se pone al día al abrirla.
        if (!hayAlguien || Platform.OS === "web") {
            return;
        }
        void activarPush();
        const abrirPedido = (respuesta: Notifications.NotificationResponse) => {
            const destino = destinoDelAviso(respuesta);
            if (destino !== null) {
                router.push(destino as Parameters<typeof router.push>[0]);
            }
        };
        // Si la app se abrió tocando un aviso, se va directo a ese pedido.
        const conLaQueSeAbrio = Notifications.getLastNotificationResponse();
        if (conLaQueSeAbrio) {
            abrirPedido(conLaQueSeAbrio);
        }
        const alTocar = Notifications.addNotificationResponseReceivedListener(abrirPedido);
        // Un push que llega con la app abierta pone al día la campana en el acto.
        const alLlegar = Notifications.addNotificationReceivedListener(() => void recargarBandeja());
        return () => {
            alTocar.remove();
            alLlegar.remove();
        };
    }, [hayAlguien, recargarBandeja]);

    if (sesion === undefined) {
        return null;
    }
    SplashScreen.hide();

    return (
        <>
            <SaltarAlContenido />
            <Stack
                // Las pestañas tienen su propio <main> por pantalla: así la barra inferior queda fuera de él.
                screenLayout={({ route, children }) => (route.name === "(pestanas)" ? children : <ContenidoPrincipal>{children}</ContenidoPrincipal>)}
                screenOptions={{
                    headerTintColor: colores.acento,
                    headerTitleStyle: { color: colores.texto },
                    headerStyle: { backgroundColor: colores.superficie },
                    headerShadowVisible: false,
                    contentStyle: { backgroundColor: colores.fondo },
                    headerBackTitle: "Atrás",
                }}
            >
                <Stack.Protected guard={sesion !== null}>
                    <Stack.Screen name="(pestanas)" options={{ headerShown: false }} />
                    {/* Sin título en la barra: el nombre del plato es el h1 de la pantalla, y un título vacío sería un error de accesibilidad. */}
                    <Stack.Screen name="producto/[id]" options={{ title: "", headerTitle: () => null, presentation: "modal" }} />
                    <Stack.Screen name="carrito" options={{ title: "Tu pedido" }} />
                    <Stack.Screen name="pedido/[id]" options={{ title: "Seguimiento" }} />
                    <Stack.Screen name="pago/[id]" options={{ title: "Pagar", presentation: "modal" }} />
                    <Stack.Screen name="comprobante/[id]" options={{ title: "Comprobante" }} />
                    <Stack.Screen name="notificaciones" options={{ title: "Notificaciones" }} />
                    <Stack.Screen name="cuenta/datos" options={{ title: "Información personal" }} />
                    <Stack.Screen name="cuenta/clave" options={{ title: "Cambiar contraseña" }} />
                    <Stack.Screen name="cuenta/eliminar" options={{ title: "Eliminar cuenta" }} />
                    <Stack.Screen name="reclamaciones/index" options={{ title: "Libro de reclamaciones" }} />
                    <Stack.Screen name="reclamaciones/nueva" options={{ title: "Hoja de reclamación", presentation: "modal" }} />
                </Stack.Protected>
                <Stack.Protected guard={sesion === null}>
                    <Stack.Screen name="entrar" options={{ headerShown: false }} />
                    <Stack.Screen name="registro" options={{ headerShown: false }} />
                    <Stack.Screen name="recuperar" options={{ headerShown: false }} />
                </Stack.Protected>
                {/* Se lee con o sin cuenta: el registro enlaza aquí antes de pedir que se acepte. */}
                <Stack.Screen name="legal" options={{ title: "Información legal" }} />
            </Stack>
            {sesion !== null && <PuertaDeTerminos />}
        </>
    );
}
