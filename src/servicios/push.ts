import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import * as almacen from "@/utils/almacen";
import { Platform } from "react-native";
import { colores } from "@/tema";
import { olvidarTelefono, registrarTelefono } from "./cafeteria";

/*
 * El push al teléfono ("¡Tu pedido A-14 está listo!") por el servicio de Expo.
 *
 * Es un extra sobre la campana de la app, que funciona siempre. El push
 * necesita tres cosas, y si falta cualquiera simplemente no se registra:
 *   - un teléfono de verdad (no un simulador);
 *   - el id del proyecto en Expo (app.json, extra.eas.projectId), que da
 *     `npx eas-cli init`;
 *   - en Android, una compilación propia: Expo Go ya no recibe push en
 *     Android desde el SDK 53. En iPhone, Expo Go sí.
 */
const CLAVE_DEL_TOKEN = "tokenPush";

// Con la app abierta también se muestra el aviso arriba, con sonido.
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

async function tokenDelTelefono(): Promise<string | null> {
    const idDelProyecto = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!Device.isDevice || !idDelProyecto) {
        return null;
    }
    if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("pedidos", {
            name: "Pedidos",
            importance: Notifications.AndroidImportance.HIGH,
            lightColor: colores.acento,
        });
    }
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
        ({ status } = await Notifications.requestPermissionsAsync());
    }
    if (status !== "granted") {
        return null;
    }
    try {
        return (await Notifications.getExpoPushTokenAsync({ projectId: idDelProyecto })).data;
    } catch {
        // Expo Go en Android, o sin conexión con Expo: sin push, la campana sigue.
        return null;
    }
}

/** Al entrar: este teléfono recibe los avisos de esta cuenta. Nunca falla hacia afuera. */
export async function activarPush(): Promise<void> {
    try {
        const token = await tokenDelTelefono();
        if (token === null || (Platform.OS !== "ios" && Platform.OS !== "android")) {
            return;
        }
        await registrarTelefono(token, Platform.OS);
        await almacen.setItemAsync(CLAVE_DEL_TOKEN, token);
    } catch {
        // Un push que no se pudo activar no impide usar la app.
    }
}

/** Al salir, antes de soltar el token de la sesión: los avisos de esta cuenta dejan de llegar aquí. */
export async function desactivarPush(): Promise<void> {
    try {
        const token = await almacen.getItemAsync(CLAVE_DEL_TOKEN);
        if (token !== null) {
            await almacen.deleteItemAsync(CLAVE_DEL_TOKEN);
            await olvidarTelefono(token);
        }
    } catch {
        // Si la sesión ya había vencido, el backend lo pasará a la próxima cuenta que entre aquí.
    }
}

/** A qué pantalla lleva un push al tocarlo: el seguimiento del pedido o el Libro de Reclamaciones. */
export function destinoDelAviso(respuesta: Notifications.NotificationResponse): string | null {
    const datos = respuesta.notification.request.content.data;
    if (datos?.tipo === "RECLAMACION_RESPONDIDA") {
        return "/reclamaciones";
    }
    return typeof datos?.idPedido === "number" ? `/pedido/${datos.idPedido}` : null;
}
