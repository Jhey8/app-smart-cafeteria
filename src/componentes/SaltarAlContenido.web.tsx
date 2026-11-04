import { ID_DEL_CONTENIDO } from "./ContenidoPrincipal";

/*
 * WCAG 2.4.1: el primer elemento de la página es un enlace que lleva al
 * contenido sin pasar por la navegación. Está oculto hasta que recibe el foco
 * con Tab; su estilo vive en utils/accesibilidadWeb.ts.
 *
 * Es un <a> de HTML, no un componente de React Native, porque así lo
 * reconocen el navegador, el lector de pantalla y WAVE.
 */
export function SaltarAlContenido() {
    return (
        <a
            href={`#${ID_DEL_CONTENIDO}`}
            className="saltar-al-contenido"
            onClick={(evento) => {
                // Se mueve el foco a mano para no cambiar la dirección de la página, que maneja Expo Router.
                evento.preventDefault();
                document.getElementById(ID_DEL_CONTENIDO)?.focus();
            }}
        >
            Ir al contenido principal
        </a>
    );
}
