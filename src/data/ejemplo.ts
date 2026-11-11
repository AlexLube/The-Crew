/**
 * Datos de ejemplo para el prototipo. Los workers son los que aparecen
 * en thecrew.issaline.com; cursos, campañas y noticias son inventados
 * para enseñar el funcionamiento y se sustituirán por el backend.
 */
export type OficioKey = 'herreria' | 'agricultura' | 'ebanisteria' | 'mecanica' | 'maker' | 'marca';

export type Worker = { id: string; nombre: string; handle: string; oficio: string; k: OficioKey };

export const workers: Worker[] = [
  { id: 'paula', nombre: 'Paula Nuévalos', handle: '@agropauli', oficio: 'Agricultura', k: 'agricultura' },
  { id: 'joel', nombre: 'Joel Martínez', handle: '@martinezwoodworking', oficio: 'Ebanistería', k: 'ebanisteria' },
  { id: 'alvaro', nombre: 'Álvaro Indias Salguero', handle: '@arteotroworkshop', oficio: 'Maker', k: 'maker' },
  { id: 'josema', nombre: 'José Manuel Muñoz', handle: '@metalmundo.maker', oficio: 'Herrería', k: 'herreria' },
  { id: 'victor', nombre: 'Víctor Vico', handle: '@vicoprojects', oficio: 'Mecánica', k: 'mecanica' },
  { id: 'riccardo', nombre: 'Riccardo Artuso', handle: '@farmericky', oficio: 'Agricultura', k: 'agricultura' },
];

/** Worker con la sesión iniciada en el prototipo. */
export const yo = {
  ...workers[3],
  nombreCorto: 'José Manuel',
  taller: 'MetalMundo',
  frase: 'Para mí los retos son posibilidades.',
};

export type Curso = {
  id: string;
  titulo: string;
  k: OficioKey;
  minutos: number;
  insignia: string;
  lecciones: string[];
};

export const cursos: Curso[] = [
  {
    id: 'bienvenida',
    titulo: 'Bienvenida a The Crew',
    k: 'marca',
    minutos: 12,
    insignia: 'Crew',
    lecciones: ['Quiénes somos en Issaline', 'Qué es The Crew', 'Lo que esperamos de un worker', 'Cómo usar esta app'],
  },
  {
    id: 'prendas',
    titulo: 'Conoce las prendas',
    k: 'herreria',
    minutos: 18,
    insignia: 'Prendas',
    lecciones: ['Tejidos y resistencias', 'Encontrar tu talla', 'Cuidados y lavado', 'Novedades de temporada'],
  },
  {
    id: 'cuenta',
    titulo: 'Cuenta tu oficio',
    k: 'ebanisteria',
    minutos: 24,
    insignia: 'Historias',
    lecciones: [
      'Foto de taller con el móvil',
      'Vídeo vertical en 30 segundos',
      'Cómo mencionar la marca',
      'Publicidad: lo que hay que indicar',
      'Test final',
    ],
  },
];

/** Lecciones ya vistas al abrir el prototipo, por curso. */
export const progresoInicial: Record<string, boolean[]> = {
  bienvenida: [true, true, true, false],
  prendas: [true, false, false, false],
  cuenta: [false, false, false, false, false],
};

export type Campana = {
  id: string;
  titulo: string;
  fechas: string;
  objetivo: string;
  prendas: string;
  entregas: string;
  hashtags: string;
  maxSubidas: number;
};

export const campanas: Campana[] = [
  {
    id: 'retos-invierno',
    titulo: 'Retos de invierno',
    fechas: '18 nov – 15 dic',
    objetivo: 'Mostrar tu jornada de frío en el taller o en el campo',
    prendas: 'Chaqueta y pantalón de trabajo de la colección de invierno',
    entregas: '3 fotos y 1 vídeo vertical',
    hashtags: '#TheCrew #Issaline',
    maxSubidas: 4,
  },
];

export type Post = { id: string; meta: string; titulo: string; texto: string; campana?: string; evento?: boolean };

export const posts: Post[] = [
  {
    id: 'p1',
    meta: 'Campaña · nueva',
    titulo: 'Arranca «Retos de invierno»',
    texto: 'Os enviamos la nueva equipación de invierno esta semana. Mira el brief y apúntate antes del 18 de noviembre.',
    campana: 'retos-invierno',
  },
  {
    id: 'p2',
    meta: 'Agenda · 28 nov',
    titulo: 'Sesión de fotos en Valencia',
    texto: 'Buscamos cuatro workers para la sesión de la nueva colección. Confirma si puedes venir.',
    evento: true,
  },
  {
    id: 'p3',
    meta: 'Comunidad',
    titulo: 'Tres workers ya tienen la insignia Historias',
    texto: 'Han completado el itinerario «Cuenta tu oficio». Sus vídeos de taller aparecerán en las redes de Issaline.',
  },
  {
    id: 'p4',
    meta: 'Marca',
    titulo: 'The Crew ya está en cuatro idiomas',
    texto: 'La web y la app están en español, inglés, italiano y portugués.',
  },
];

export const equipacion = [
  { prenda: 'Chaqueta de invierno', estado: 'Talla L · en camino, llega el jueves' },
  { prenda: 'Pantalón de trabajo', estado: 'Talla 44 · entregado' },
  { prenda: 'Camiseta The Crew', estado: 'Talla L · entregado' },
];

export type Mensaje = { id: string; mio: boolean; texto: string };

export const mensajesIniciales: Mensaje[] = [
  { id: 'm1', mio: false, texto: '¡Hola José Manuel! Te hemos enviado la chaqueta de invierno. ¿Qué talla usas de pantalón?' },
  { id: 'm2', mio: true, texto: 'Una 44. Gracias, en cuanto llegue la estreno en la forja.' },
  { id: 'm3', mio: false, texto: 'Perfecto. Cuando subas las fotos de la campaña te las revisamos en 48 h.' },
];
