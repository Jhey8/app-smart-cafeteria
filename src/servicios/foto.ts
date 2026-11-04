import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

/** El lado de la foto de perfil que se sube: de sobra para un avatar y una ficha del panel. */
const LADO = 800;

/** Una imagen lista para subir: sus bytes, el tipo y el nombre del archivo. */
export interface ImagenParaSubir {
    bytes: Uint8Array;
    tipo: string;
    nombre: string;
}

/**
 * Prepara la foto de perfil antes de subirla.
 *
 * Una foto del teléfono recortada en cuadrado puede pasar los 3 MB que
 * acepta el backend, y en iPhone puede venir en HEIC, que el backend no
 * acepta. Aquí se reduce a 800 x 800 y se guarda como JPEG: queda en unos
 * 100 a 200 KB, sube rápido con datos móviles y siempre es un formato válido.
 *
 * Se devuelven los bytes y no la uri del archivo: la fetch de Expo (la que
 * usa la app desde Expo 57) no sabe leer un archivo a partir de su uri dentro
 * de un FormData, y fallaba antes de enviar nada.
 */
export async function prepararFoto(uri: string): Promise<ImagenParaSubir> {
    const imagen = await ImageManipulator.manipulate(uri).resize({ width: LADO }).renderAsync();
    const guardada = await imagen.saveAsync({ format: SaveFormat.JPEG, compress: 0.8, base64: true });
    if (!guardada.base64) {
        throw new Error("No se pudo preparar la foto.");
    }
    return { bytes: deBase64(guardada.base64), tipo: "image/jpeg", nombre: "perfil.jpg" };
}

function deBase64(texto: string): Uint8Array {
    const binario = atob(texto);
    const bytes = new Uint8Array(binario.length);
    for (let i = 0; i < binario.length; i++) {
        bytes[i] = binario.charCodeAt(i);
    }
    return bytes;
}
