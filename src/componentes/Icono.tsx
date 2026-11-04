import { SymbolView } from "expo-symbols";
import type { ComponentProps } from "react";
import { View, type ColorValue } from "react-native";
import { colores } from "@/tema";

type NombreDelSimbolo = ComponentProps<typeof SymbolView>["name"];

/*
 * Los íconos de la app con un nombre propio: en iPhone salen de SF Symbols y
 * en Android de Material Symbols, que es lo que cada persona reconoce en su
 * teléfono.
 */
const ICONOS = {
    menu: { ios: "fork.knife", android: "restaurant" },
    pedidos: { ios: "bag", android: "shopping_bag" },
    cuenta: { ios: "person.crop.circle", android: "person" },
    carrito: { ios: "cart", android: "shopping_cart" },
    mas: { ios: "plus", android: "add" },
    menos: { ios: "minus", android: "remove" },
    reloj: { ios: "clock", android: "schedule" },
    listo: { ios: "checkmark.circle.fill", android: "check_circle" },
    cerrar: { ios: "xmark", android: "close" },
    basura: { ios: "trash", android: "delete" },
    plato: { ios: "takeoutbag.and.cup.and.straw", android: "no_food" },
    salir: { ios: "rectangle.portrait.and.arrow.right", android: "logout" },
    tienda: { ios: "storefront", android: "storefront" },
    inicio: { ios: "house", android: "home" },
    buscar: { ios: "magnifyingglass", android: "search" },
    campana: { ios: "bell", android: "notifications" },
    dinero: { ios: "banknote", android: "payments" },
    camara: { ios: "camera", android: "photo_camera" },
    galeria: { ios: "photo.on.rectangle", android: "photo_library" },
    editar: { ios: "pencil", android: "edit" },
    candado: { ios: "lock", android: "lock" },
    ficha: { ios: "person.text.rectangle", android: "badge" },
    correo: { ios: "envelope", android: "mail" },
    vibrar: { ios: "iphone.radiowaves.left.and.right", android: "vibration" },
    libro: { ios: "book", android: "menu_book" },
    tarjeta: { ios: "creditcard", android: "credit_card" },
    recibo: { ios: "doc.text", android: "receipt_long" },
    corazon: { ios: "heart", android: "favorite_border" },
    corazonLleno: { ios: "heart.fill", android: "favorite" },
    legal: { ios: "info.circle", android: "info" },
    dispositivos: { ios: "iphone.and.arrow.forward", android: "devices" },
    telefono: { ios: "phone", android: "call" },
    express: { ios: "bolt.fill", android: "bolt" },
    repetir: { ios: "arrow.counterclockwise", android: "replay" },
    siguiente: { ios: "chevron.right", android: "chevron_right" },
    almuerzo: { ios: "fork.knife", android: "ramen_dining" },
    sandwich: { ios: "takeoutbag.and.cup.and.straw", android: "lunch_dining" },
    bebida: { ios: "cup.and.saucer", android: "local_cafe" },
    postre: { ios: "birthday.cake", android: "cake" },
    snack: { ios: "popcorn", android: "cookie" },
} satisfies Record<string, NombreDelSimbolo>;

export type NombreDeIcono = keyof typeof ICONOS;

export function Icono({ nombre, color = colores.texto, tamano = 22 }: { nombre: NombreDeIcono; color?: ColorValue; tamano?: number }) {
    const simbolo = ICONOS[nombre];
    return (
        // Decorativo: el botón que lo contiene ya tiene su nombre. Sin esto el lector de pantalla diría el carácter del ícono.
        <View aria-hidden>
            {/* En la web se usa el mismo ícono de Material Symbols que en Android. */}
            <SymbolView name={{ ...simbolo, web: simbolo.android }} tintColor={color} size={tamano} />
        </View>
    );
}
