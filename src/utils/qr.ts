/*
 * Un generador de códigos QR (ISO/IEC 18004), para mostrar el QR de recojo
 * sin depender de una librería ni de un servicio externo (que vería el
 * código secreto). Es una copia de apps/kiosko/src/utils/qr.ts, donde están
 * sus pruebas: si se corrige uno, se corrige el otro.
 *
 * Solo lo que hace falta aquí: modo byte (UTF-8) y nivel de corrección M, que
 * aguanta un 15 % de módulos dañados (una pantalla con reflejo). Sigue el
 * algoritmo de referencia de Project Nayuki ("QR Code generator library",
 * MIT) y se comprueba contra segno en las pruebas del kiosco.
 */

/** Por versión (1 a 40), nivel M: códigos de corrección por bloque y cantidad de bloques. */
const CORRECCION_POR_BLOQUE = [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28];
const BLOQUES = [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49];

/** Los bits de formato del nivel M. */
const NIVEL_M = 0;

export interface CodigoQr {
    version: number;
    mascara: number;
    /** true = módulo oscuro. Fila por fila, sin la zona blanca de alrededor. */
    modulos: boolean[][];
}

/**
 * El QR de un texto. Con `mascaraFija` se fuerza la máscara (para las
 * pruebas); sin ella se elige la de menor penalización, como manda la norma.
 */
export function generarQr(texto: string, mascaraFija?: number): CodigoQr {
    const datos = Array.from(new TextEncoder().encode(texto));

    let version = 1;
    for (; ; version++) {
        if (version > 40) {
            throw new Error("El texto es demasiado largo para un código QR.");
        }
        const bitsDeConteo = version <= 9 ? 8 : 16;
        if (4 + bitsDeConteo + datos.length * 8 <= codigosDeDatos(version) * 8) {
            break;
        }
    }

    // Modo byte (0100), la cantidad de bytes y los bytes.
    const bits: number[] = [];
    agregarBits(bits, 0b0100, 4);
    agregarBits(bits, datos.length, version <= 9 ? 8 : 16);
    for (const byte of datos) {
        agregarBits(bits, byte, 8);
    }
    const capacidad = codigosDeDatos(version) * 8;
    agregarBits(bits, 0, Math.min(4, capacidad - bits.length));
    agregarBits(bits, 0, (8 - (bits.length % 8)) % 8);
    for (let relleno = 0xec; bits.length < capacidad; relleno ^= 0xec ^ 0x11) {
        agregarBits(bits, relleno, 8);
    }
    const codigos: number[] = [];
    for (let i = 0; i < bits.length; i += 8) {
        codigos.push(bits.slice(i, i + 8).reduce((byte, bit) => (byte << 1) | bit, 0));
    }

    const matriz = new Matriz(version);
    matriz.dibujarPatrones();
    matriz.dibujarCodigos(agregarCorreccionEIntercalar(codigos, version));

    let mascara = mascaraFija ?? -1;
    if (mascara === -1) {
        let menor = Infinity;
        for (let candidata = 0; candidata < 8; candidata++) {
            matriz.aplicarMascara(candidata);
            matriz.dibujarFormato(candidata);
            const penalizacion = matriz.penalizacion();
            if (penalizacion < menor) {
                mascara = candidata;
                menor = penalizacion;
            }
            matriz.aplicarMascara(candidata); // XOR: aplicarla de nuevo la deshace
        }
    }
    matriz.aplicarMascara(mascara);
    matriz.dibujarFormato(mascara);

    return { version, mascara, modulos: matriz.modulos };
}

function agregarBits(bits: number[], valor: number, cantidad: number): void {
    for (let i = cantidad - 1; i >= 0; i--) {
        bits.push((valor >>> i) & 1);
    }
}

function modulosDeDatos(version: number): number {
    let total = (16 * version + 128) * version + 64;
    if (version >= 2) {
        const alineaciones = Math.floor(version / 7) + 2;
        total -= (25 * alineaciones - 10) * alineaciones - 55;
        if (version >= 7) {
            total -= 36;
        }
    }
    return total;
}

function codigosDeDatos(version: number): number {
    return Math.floor(modulosDeDatos(version) / 8) - CORRECCION_POR_BLOQUE[version]! * BLOQUES[version]!;
}

/* Reed-Solomon en GF(256) con el polinomio 0x11D. */
function multiplicar(x: number, y: number): number {
    let z = 0;
    for (let i = 7; i >= 0; i--) {
        z = (z << 1) ^ ((z >>> 7) * 0x11d);
        z ^= ((y >>> i) & 1) * x;
    }
    return z;
}

function divisor(grado: number): number[] {
    const resultado = new Array<number>(grado - 1).fill(0);
    resultado.push(1);
    let raiz = 1;
    for (let i = 0; i < grado; i++) {
        for (let j = 0; j < resultado.length; j++) {
            resultado[j] = multiplicar(resultado[j]!, raiz);
            if (j + 1 < resultado.length) {
                resultado[j] = resultado[j]! ^ resultado[j + 1]!;
            }
        }
        raiz = multiplicar(raiz, 0x02);
    }
    return resultado;
}

function resto(datos: readonly number[], div: readonly number[]): number[] {
    const resultado = new Array<number>(div.length).fill(0);
    for (const byte of datos) {
        const factor = byte ^ resultado.shift()!;
        resultado.push(0);
        div.forEach((coeficiente, i) => {
            resultado[i] = resultado[i]! ^ multiplicar(coeficiente, factor);
        });
    }
    return resultado;
}

function agregarCorreccionEIntercalar(datos: readonly number[], version: number): number[] {
    const cantidadDeBloques = BLOQUES[version]!;
    const largoDeCorreccion = CORRECCION_POR_BLOQUE[version]!;
    const codigosEnBruto = Math.floor(modulosDeDatos(version) / 8);
    const bloquesCortos = cantidadDeBloques - (codigosEnBruto % cantidadDeBloques);
    const largoCorto = Math.floor(codigosEnBruto / cantidadDeBloques);

    const bloques: number[][] = [];
    const div = divisor(largoDeCorreccion);
    for (let i = 0, k = 0; i < cantidadDeBloques; i++) {
        const bloque = datos.slice(k, k + largoCorto - largoDeCorreccion + (i < bloquesCortos ? 0 : 1));
        k += bloque.length;
        const correccion = resto(bloque, div);
        if (i < bloquesCortos) {
            bloque.push(0);
        }
        bloques.push(bloque.concat(correccion));
    }

    const resultado: number[] = [];
    for (let i = 0; i < bloques[0]!.length; i++) {
        bloques.forEach((bloque, j) => {
            if (i !== largoCorto - largoDeCorreccion || j >= bloquesCortos) {
                resultado.push(bloque[i]!);
            }
        });
    }
    return resultado;
}

class Matriz {
    readonly lado: number;
    readonly modulos: boolean[][];
    private readonly esFuncion: boolean[][];
    private readonly version: number;

    constructor(version: number) {
        this.version = version;
        this.lado = version * 4 + 17;
        this.modulos = Array.from({ length: this.lado }, () => new Array<boolean>(this.lado).fill(false));
        this.esFuncion = Array.from({ length: this.lado }, () => new Array<boolean>(this.lado).fill(false));
    }

    private poner(x: number, y: number, oscuro: boolean): void {
        this.modulos[y]![x] = oscuro;
        this.esFuncion[y]![x] = true;
    }

    dibujarPatrones(): void {
        for (let i = 0; i < this.lado; i++) {
            this.poner(6, i, i % 2 === 0);
            this.poner(i, 6, i % 2 === 0);
        }
        this.dibujarBuscador(3, 3);
        this.dibujarBuscador(this.lado - 4, 3);
        this.dibujarBuscador(3, this.lado - 4);

        const posiciones = this.posicionesDeAlineacion();
        const ultima = posiciones.length - 1;
        posiciones.forEach((y, i) => {
            posiciones.forEach((x, j) => {
                if (!((i === 0 && j === 0) || (i === 0 && j === ultima) || (i === ultima && j === 0))) {
                    for (let dy = -2; dy <= 2; dy++) {
                        for (let dx = -2; dx <= 2; dx++) {
                            this.poner(x + dx, y + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
                        }
                    }
                }
            });
        });

        this.dibujarFormato(0); // reserva el lugar; se escribe el definitivo al final
        this.dibujarVersion();
    }

    private dibujarBuscador(x: number, y: number): void {
        for (let dy = -4; dy <= 4; dy++) {
            for (let dx = -4; dx <= 4; dx++) {
                const distancia = Math.max(Math.abs(dx), Math.abs(dy));
                const xx = x + dx;
                const yy = y + dy;
                if (xx >= 0 && xx < this.lado && yy >= 0 && yy < this.lado) {
                    this.poner(xx, yy, distancia !== 2 && distancia !== 4);
                }
            }
        }
    }

    private posicionesDeAlineacion(): number[] {
        if (this.version === 1) {
            return [];
        }
        const cantidad = Math.floor(this.version / 7) + 2;
        const paso = this.version === 32 ? 26 : Math.ceil((this.version * 4 + 4) / (cantidad * 2 - 2)) * 2;
        const resultado = [6];
        for (let posicion = this.lado - 7; resultado.length < cantidad; posicion -= paso) {
            resultado.splice(1, 0, posicion);
        }
        return resultado;
    }

    dibujarFormato(mascara: number): void {
        const datos = (NIVEL_M << 3) | mascara;
        let resto = datos;
        for (let i = 0; i < 10; i++) {
            resto = (resto << 1) ^ ((resto >>> 9) * 0x537);
        }
        const bits = ((datos << 10) | resto) ^ 0x5412;
        const bit = (i: number) => ((bits >>> i) & 1) !== 0;

        for (let i = 0; i <= 5; i++) {
            this.poner(8, i, bit(i));
        }
        this.poner(8, 7, bit(6));
        this.poner(8, 8, bit(7));
        this.poner(7, 8, bit(8));
        for (let i = 9; i < 15; i++) {
            this.poner(14 - i, 8, bit(i));
        }
        for (let i = 0; i < 8; i++) {
            this.poner(this.lado - 1 - i, 8, bit(i));
        }
        for (let i = 8; i < 15; i++) {
            this.poner(8, this.lado - 15 + i, bit(i));
        }
        this.poner(8, this.lado - 8, true);
    }

    private dibujarVersion(): void {
        if (this.version < 7) {
            return;
        }
        let resto = this.version;
        for (let i = 0; i < 12; i++) {
            resto = (resto << 1) ^ ((resto >>> 11) * 0x1f25);
        }
        const bits = (this.version << 12) | resto;
        for (let i = 0; i < 18; i++) {
            const oscuro = ((bits >>> i) & 1) !== 0;
            const a = this.lado - 11 + (i % 3);
            const b = Math.floor(i / 3);
            this.poner(a, b, oscuro);
            this.poner(b, a, oscuro);
        }
    }

    dibujarCodigos(codigos: readonly number[]): void {
        let i = 0;
        for (let derecha = this.lado - 1; derecha >= 1; derecha -= 2) {
            if (derecha === 6) {
                derecha = 5;
            }
            for (let vertical = 0; vertical < this.lado; vertical++) {
                for (let j = 0; j < 2; j++) {
                    const x = derecha - j;
                    const haciaArriba = ((derecha + 1) & 2) === 0;
                    const y = haciaArriba ? this.lado - 1 - vertical : vertical;
                    if (!this.esFuncion[y]![x] && i < codigos.length * 8) {
                        this.modulos[y]![x] = ((codigos[i >>> 3]! >>> (7 - (i & 7))) & 1) !== 0;
                        i++;
                    }
                }
            }
        }
    }

    aplicarMascara(mascara: number): void {
        for (let y = 0; y < this.lado; y++) {
            for (let x = 0; x < this.lado; x++) {
                let invertir: boolean;
                switch (mascara) {
                    case 0: invertir = (x + y) % 2 === 0; break;
                    case 1: invertir = y % 2 === 0; break;
                    case 2: invertir = x % 3 === 0; break;
                    case 3: invertir = (x + y) % 3 === 0; break;
                    case 4: invertir = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; break;
                    case 5: invertir = ((x * y) % 2) + ((x * y) % 3) === 0; break;
                    case 6: invertir = (((x * y) % 2) + ((x * y) % 3)) % 2 === 0; break;
                    default: invertir = (((x + y) % 2) + ((x * y) % 3)) % 2 === 0;
                }
                if (!this.esFuncion[y]![x] && invertir) {
                    this.modulos[y]![x] = !this.modulos[y]![x];
                }
            }
        }
    }

    /** La penalización de la norma: corridas, bloques de 2 x 2, patrones como el buscador y equilibrio claro/oscuro. */
    penalizacion(): number {
        let total = 0;
        const linea = (leer: (i: number, j: number) => boolean) => {
            for (let i = 0; i < this.lado; i++) {
                let color = false;
                let largo = 0;
                const historia = [0, 0, 0, 0, 0, 0, 0];
                for (let j = 0; j < this.lado; j++) {
                    if (leer(i, j) === color) {
                        largo++;
                        if (largo === 5) {
                            total += 3;
                        } else if (largo > 5) {
                            total++;
                        }
                    } else {
                        this.agregarHistoria(largo, historia);
                        if (!color) {
                            total += this.contarBuscadores(historia) * 40;
                        }
                        color = leer(i, j);
                        largo = 1;
                    }
                }
                total += this.terminarYContar(color, largo, historia) * 40;
            }
        };
        linea((y, x) => this.modulos[y]![x]!);
        linea((x, y) => this.modulos[y]![x]!);

        for (let y = 0; y < this.lado - 1; y++) {
            for (let x = 0; x < this.lado - 1; x++) {
                const color = this.modulos[y]![x];
                if (color === this.modulos[y]![x + 1] && color === this.modulos[y + 1]![x] && color === this.modulos[y + 1]![x + 1]) {
                    total += 3;
                }
            }
        }

        const oscuros = this.modulos.reduce((suma, fila) => suma + fila.filter(Boolean).length, 0);
        const modulos = this.lado * this.lado;
        total += (Math.ceil(Math.abs(oscuros * 20 - modulos * 10) / modulos) - 1) * 10;
        return total;
    }

    private contarBuscadores(historia: readonly number[]): number {
        const n = historia[1]!;
        const centro = n > 0 && historia[2] === n && historia[3] === n * 3 && historia[4] === n && historia[5] === n;
        return (centro && historia[0]! >= n * 4 && historia[6]! >= n ? 1 : 0) + (centro && historia[6]! >= n * 4 && historia[0]! >= n ? 1 : 0);
    }

    private terminarYContar(color: boolean, largo: number, historia: number[]): number {
        let corrida = largo;
        if (color) {
            this.agregarHistoria(corrida, historia);
            corrida = 0;
        }
        corrida += this.lado;
        this.agregarHistoria(corrida, historia);
        return this.contarBuscadores(historia);
    }

    private agregarHistoria(largo: number, historia: number[]): void {
        const corrida = historia[0] === 0 ? largo + this.lado : largo;
        historia.pop();
        historia.unshift(corrida);
    }
}
