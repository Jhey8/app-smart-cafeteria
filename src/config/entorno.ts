import Constants from "expo-constants";

/**
 * Dónde está el backend.
 *
 * En el celular "localhost" es el propio celular, no la laptop. Por eso, si
 * no se configura EXPO_PUBLIC_API_URL en apps/mobile/.env, se usa la misma
 * máquina desde la que Expo sirve la app (hostUri, "192.168.1.19:8081") con
 * el puerto del backend. Así funciona sin tocar nada aunque cambie la red o
 * la IP de la laptop.
 */
const PUERTO_DEL_BACKEND = 8080;

function obtenerUrlApi(): string {
    const configurada = process.env.EXPO_PUBLIC_API_URL;
    if (configurada) {
        return configurada.replace(/\/$/, "");
    }
    const maquina = Constants.expoConfig?.hostUri?.split(":")[0];
    return `http://${maquina ?? "localhost"}:${PUERTO_DEL_BACKEND}`;
}

export const entorno = {
    urlApi: obtenerUrlApi(),
    milisegundosTiempoLimite: 10_000,
    /** Cada cuánto se pregunta por un pedido en curso. */
    segundosEntreConsultas: 5,
} as const;
