import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

/*
 * SecureStore guarda en el llavero cifrado del teléfono, pero no existe en el
 * navegador. En web se usa sessionStorage: dura mientras la pestaña siga
 * abierta, igual que la sesión del panel de administración.
 */
const enWeb = Platform.OS === "web";

export async function getItemAsync(clave: string): Promise<string | null> {
    return enWeb ? window.sessionStorage.getItem(clave) : SecureStore.getItemAsync(clave);
}

export async function setItemAsync(clave: string, valor: string): Promise<void> {
    if (enWeb) {
        window.sessionStorage.setItem(clave, valor);
        return;
    }
    await SecureStore.setItemAsync(clave, valor);
}

export async function deleteItemAsync(clave: string): Promise<void> {
    if (enWeb) {
        window.sessionStorage.removeItem(clave);
        return;
    }
    await SecureStore.deleteItemAsync(clave);
}
