import { Platform } from "react-native";
import { colores } from "@/tema";

/*
 * Ajustes de accesibilidad que solo existen en el navegador. En el celular
 * no hace nada: allí el idioma y el foco los maneja el sistema operativo.
 */
const ESTILOS = `
    /* WCAG 2.4.7: al navegar con Tab siempre se ve dónde está el foco. */
    :focus-visible {
        outline: 3px solid ${colores.acento};
        outline-offset: 2px;
    }
    /* WCAG 1.4.3: el texto de ejemplo de los campos también debe leerse (4.5:1). */
    input::placeholder, textarea::placeholder {
        color: ${colores.suave} !important;
        opacity: 1;
    }
    /* WCAG 2.4.1: el enlace «Ir al contenido principal» espera fuera de la vista y aparece al recibir el foco. */
    .saltar-al-contenido {
        position: absolute;
        top: -100px;
        left: 8px;
        z-index: 1000;
        padding: 12px 16px;
        background: ${colores.superficie};
        color: ${colores.acentoProfundo};
        border: 2px solid ${colores.acento};
        border-radius: 6px;
        font: 600 16px system-ui, sans-serif;
        text-decoration: none;
    }
    .saltar-al-contenido:focus {
        top: 8px;
    }
    /* El contenido recibe el foco solo para que Tab siga desde ahí; no necesita contorno. */
    #contenido:focus {
        outline: none;
    }
`;

export function prepararAccesibilidadWeb(): void {
    if (Platform.OS !== "web" || typeof document === "undefined") {
        return;
    }
    // WCAG 3.1.1: el lector de pantalla pronuncia en español.
    document.documentElement.lang = "es";
    if (document.getElementById("estilos-de-accesibilidad") === null) {
        const estilo = document.createElement("style");
        estilo.id = "estilos-de-accesibilidad";
        estilo.textContent = ESTILOS;
        document.head.appendChild(estilo);
    }
}
