/*
 * Los colores de todas las apps del proyecto: azul y blanco. Son los mismos
 * tokens que apps/kiosko/src/styles/global.css; aquí van en un objeto porque
 * React Native no tiene CSS.
 *
 * El ámbar es el complemento del azul y se usa poco, para lo que tiene que
 * llamar la atención (el plato express). Sobre ámbar el texto va oscuro: el
 * blanco no se lee. El rojo de error y el verde de "listo" dicen un estado,
 * no la marca.
 */
export const colores = {
    acento: "#0b5fd0",
    acentoOscuro: "#084aa3",
    acentoProfundo: "#073574",
    acentoClaro: "#e7f0fc",
    calido: "#f5a524",
    calidoClaro: "#fff4d6",
    calidoOscuro: "#8a5300",
    superficie: "#ffffff",
    fondo: "#eef1f5",
    texto: "#14171f",
    suave: "#4c5462",
    borde: "#cfd5de",
    error: "#b42318",
    errorClaro: "#fdecea",
    ok: "#1a7f37",
    okClaro: "#e6f4ea",
} as const;

export const radio = { chico: 10, medio: 14, grande: 20, pildora: 999 } as const;

export const espacio = { xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32 } as const;

export const texto = {
    titulo: { fontSize: 28, fontWeight: "700", color: colores.texto },
    subtitulo: { fontSize: 20, fontWeight: "700", color: colores.texto },
    cuerpo: { fontSize: 16, color: colores.texto },
    fuerte: { fontSize: 16, fontWeight: "600", color: colores.texto },
    nota: { fontSize: 14, color: colores.suave },
} as const;

/** La sombra suave de las tarjetas, igual en las dos plataformas. */
export const sombra = {
    boxShadow: "0 1px 3px rgba(20, 23, 31, 0.10)",
} as const;
