const btnVarita = document.getElementById('btnVarita');
const chatbot = document.getElementById('chatbot');
const btnCloseChat = document.getElementById('btnCloseChat');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const chatMessages = document.getElementById('chatMessages');
const varitaWrapper = document.querySelector('.varita-chat-wrapper');
const varitaIcon = document.getElementById('varitaIcon');
const varitaBocadillo = document.getElementById('varitaBocadillo');
let movimientoInterval = null;
let animacionTimeout = null;

/** Centra la varita cuando se abre el chat. */
function centrarVarita() {
    if (!varitaWrapper) return;

    varitaWrapper.style.transition = 'left 0.8s ease-out, top 0.8s ease-out';
    varitaWrapper.style.left = `${Math.round((window.innerWidth - varitaWrapper.offsetWidth) / 2)}px`;
    varitaWrapper.style.top = `${Math.round((window.innerHeight - varitaWrapper.offsetHeight) / 2)}px`;
}

/** Abre o cierra el chat y pausa o reanuda la animación. */
function toggleChat(show) {
    if (!chatbot) return;

    const isVisible = show ?? !chatbot.classList.contains('visible');
    chatbot.classList.toggle('visible', isVisible);
    chatbot.setAttribute('aria-hidden', String(!isVisible));
    if (isVisible) {
        detenerMovimiento();
        centrarVarita();
        chatInput?.focus();
    } else {
        iniciarMovimientoAleatorio();
    }
}

/** Cambia temporalmente la imagen de la varita. */
function cambiarIconoTemporal(ruta, duracion) {
    if (!varitaIcon) return;

    clearTimeout(animacionTimeout);
    varitaIcon.src = ruta;
    animacionTimeout = setTimeout(() => {
        varitaIcon.src = 'img/img/varita1.png';
    }, duracion);
}

/** Mueve la varita a una posición aleatoria visible. */
function moverVarita() {
    if (!varitaWrapper) return;

    const ancho = varitaWrapper.offsetWidth || 80;
    const alto = varitaWrapper.offsetHeight || 80;
    const x = Math.random() * Math.max(0, window.innerWidth - ancho - 20) + 10;
    const y = Math.random() * Math.max(0, window.innerHeight - alto - 20) + 10;
    varitaWrapper.style.left = `${Math.round(x)}px`;
    varitaWrapper.style.top = `${Math.round(y)}px`;
    if (Math.random() > 0.5) cambiarIconoTemporal('img/img/varita2.png', 2000);
}

/** Inicia el movimiento periódico de la varita si está disponible. */
function iniciarMovimientoAleatorio() {
    if (!varitaWrapper || movimientoInterval) return;

    varitaWrapper.style.transition = 'left 8s linear, top 8s linear';
    moverVarita();
    movimientoInterval = setInterval(moverVarita, 8000);
}

/** Detiene los temporizadores de movimiento e imagen. */
function detenerMovimiento() {
    clearInterval(movimientoInterval);
    clearTimeout(animacionTimeout);
    movimientoInterval = null;
    animacionTimeout = null;
}

btnVarita?.addEventListener('click', () => toggleChat(true));
btnCloseChat?.addEventListener('click', () => {
    toggleChat(false);
    btnVarita?.focus();
});
varitaWrapper?.addEventListener('mouseenter', () => {
    varitaBocadillo?.classList.add('visible');
    if (varitaIcon) varitaIcon.src = 'img/img/varita3.png';
});
varitaWrapper?.addEventListener('mouseleave', () => {
    varitaBocadillo?.classList.remove('visible');
    if (varitaIcon) varitaIcon.src = 'img/img/varita1.png';
});
iniciarMovimientoAleatorio();
window.addEventListener('beforeunload', detenerMovimiento);

const enlaceGaleria = { texto: 'Ver galería de mesas dulces', url: 'galeria.html' };
const enlaceWhatsApp = {
    texto: 'Escribir por WhatsApp',
    url: 'https://wa.me/34654160403?text=' + encodeURIComponent('Hola, quiero información sobre una mesa dulce para mi evento.'),
    externo: true
};

/** Normaliza una consulta para reconocer palabras con o sin tilde. */
function normalizarTexto(texto) {
    return texto.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/** Devuelve una respuesta con acciones según la consulta del visitante. */
function obtenerRespuesta(mensajeUsuario) {
    const texto = normalizarTexto(mensajeUsuario);
    const contiene = (...palabras) => palabras.some((palabra) => texto.includes(palabra));

    if (contiene('whatsapp', 'wasap', 'watsap', 'whasap', 'contacto', 'telefono', 'reservar', 'presupuesto', 'contratar')) {
        return { texto: 'Claro. Puedes consultar tu idea o pedir información directamente a La Magia de Carol por WhatsApp.', acciones: [enlaceWhatsApp] };
    }
    if (contiene('galeria', 'foto', 'fotos', 'imagen', 'imagenes', 'ejemplo', 'ejemplos', 'trabajos')) {
        return { texto: 'Aquí puedes ver ejemplos de las mesas dulces temáticas de La Magia de Carol.', acciones: [enlaceGaleria] };
    }
    if (contiene('precio', 'precios', 'cuesta', 'coste', 'costo', 'vale', 'tarifa', 'cuanto')) {
        return { texto: 'Los precios no están publicados en la web. Escríbenos por WhatsApp para consultar un presupuesto para tu evento.', acciones: [enlaceWhatsApp] };
    }
    if (contiene('gluten', 'alergia', 'alergico', 'alergica', 'intolerancia', 'vegano', 'vegana')) {
        return { texto: 'Para confirmar opciones de ingredientes o atender una alergia, consulta directamente con La Magia de Carol por WhatsApp.', acciones: [enlaceWhatsApp] };
    }
    if (contiene('boda', 'cumpleanos', 'comunion', 'celebracion', 'evento', 'fiesta', 'mesa dulce', 'mesas dulces')) {
        return { texto: 'La Magia de Carol crea mesas dulces temáticas para bodas, cumpleaños, comuniones y otras celebraciones. Puedes ver ejemplos o consultar tu idea por WhatsApp.', acciones: [enlaceGaleria, enlaceWhatsApp] };
    }
    if (contiene('hola', 'buenas', 'buenos dias', 'buenas tardes', 'buenas noches')) {
        return { texto: '¡Hola! Puedo enseñarte ejemplos de mesas dulces o ayudarte a contactar con La Magia de Carol. ¿Qué celebración estás preparando?', acciones: [enlaceGaleria, enlaceWhatsApp] };
    }
    if (contiene('gracias')) {
        return { texto: '¡De nada! Aquí tienes la galería y el contacto por WhatsApp para seguir con tu idea.', acciones: [enlaceGaleria, enlaceWhatsApp] };
    }
    if (contiene('adios', 'hasta luego')) {
        return { texto: '¡Hasta pronto! Cuando quieras, puedes ver la galería o escribirnos por WhatsApp.', acciones: [enlaceGaleria, enlaceWhatsApp] };
    }

    return {
        texto: 'No tengo ese dato confirmado. Puedo enseñarte ejemplos de mesas dulces o ponerte en contacto con La Magia de Carol.',
        acciones: [enlaceGaleria, enlaceWhatsApp]
    };
}

/** Añade al chat un mensaje de texto y, para el bot, sus enlaces de acción. */
function agregarMensajePantalla(contenedor, texto, remitente) {
    const mensaje = document.createElement('div');
    mensaje.className = `chatbot-message ${remitente}`;
    mensaje.textContent = typeof texto === 'string' ? texto : texto.texto;

    if (typeof texto !== 'string') {
        texto.acciones.forEach((accion) => {
            const enlace = document.createElement('a');
            enlace.className = 'chatbot-action';
            enlace.href = accion.url;
            enlace.textContent = accion.texto;
            if (accion.externo) {
                enlace.target = '_blank';
                enlace.rel = 'noopener noreferrer';
            }
            mensaje.appendChild(enlace);
        });
    }

    contenedor.appendChild(mensaje);
    contenedor.scrollTop = contenedor.scrollHeight;
}

chatForm?.addEventListener('submit', (evento) => {
    evento.preventDefault();
    const consulta = chatInput?.value.trim();
    if (!consulta || !chatMessages || !chatInput) return;

    agregarMensajePantalla(chatMessages, consulta, 'user');
    chatInput.value = '';
    agregarMensajePantalla(chatMessages, obtenerRespuesta(consulta), 'bot');
});

chatInput?.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape') {
        toggleChat(false);
        btnVarita?.focus();
    }
});

const rutasImagenesMesas = [
    '3b4c2156-6299-44f0-b15a-e5df95850600.jpg',
    '4cafc98f-f5c4-4a62-a7c8-e4d310149d1f.jpg',
    '548f8c97-2833-4c2c-aace-ac4c62c01bc0.jpg',
    '5d27b5d6-b61b-47dc-b384-daf71aef5ce0.jpg',
    '65d6006a-6b1f-464b-fddf-fb230d783795.jpg',
    'Captura de pantalla 2026-09-28 a las 17.27.46.png',
    'Captura de pantalla 2026-09-28 a las 17.28.02.png',
    'WhatsApp Image 2026-09-28 at 16.32.36.jpeg',
    'WhatsApp Image 2026-09-28 at 16.37.18.jpeg',
    'WhatsApp Image 2026-09-28 at 16.49.03 (1).jpeg',
    'WhatsApp Image 2026-09-28 at 16.49.03.jpeg',
    'WhatsApp Image 2026-09-28 at 16.49.04 (1).jpeg',
    'WhatsApp Image 2026-09-28 at 16.49.04.jpeg',
    'WhatsApp Image 2026-09-28 at 16.49.05 (1).jpeg',
    'WhatsApp Image 2026-09-28 at 16.49.05.jpeg',
    'bd34df9b-a672-48a2-ac97-aad7602ac0b7.jpg',
    'mesa1.jpg',
    'mesa2.jpg',
    'mesa3.jpg',
    'mesa4.jpg',
    'mesa5.jpg',
    'mesa6.jpg',
    'mesa7.jpg',
    'mesa8.jpg'
].map((archivo, indice) => ({
    ruta: archivo === '65d6006a-6b1f-464b-fddf-fb230d783795.jpg'
        ? 'img/mesa-65d6006a.jpg'
        : `img/imgMesas/${archivo}`,
    descripcion: `Mesa dulce ${indice + 1}`
}));

/** Abre una imagen en el diálogo ampliado. */
function abrirVisorImagen(visor, imagen) {
    if (!visor) return;

    const imagenAmpliada = visor.querySelector('img');
    imagenAmpliada.src = encodeURI(imagen.ruta);
    imagenAmpliada.alt = imagen.descripcion;
    visor.showModal();
}

/** Inicializa la cuadrícula con todas las fotografías disponibles. */
function inicializarGaleriaImagenes() {
    const galeria = document.querySelector('[data-galeria-imagenes]');
    if (!galeria) return;

    const visor = document.querySelector('.visor-imagen');
    rutasImagenesMesas.forEach((imagen) => {
        const boton = document.createElement('button');
        const foto = document.createElement('img');
        boton.type = 'button';
        boton.setAttribute('aria-label', `Ampliar ${imagen.descripcion}`);
        foto.src = encodeURI(imagen.ruta);
        foto.alt = imagen.descripcion;
        foto.loading = 'lazy';
        foto.decoding = 'async';
        boton.appendChild(foto);
        boton.addEventListener('click', () => abrirVisorImagen(visor, imagen));
        galeria.appendChild(boton);
    });
}

/** Configura la navegación y el avance automático de cada carrusel. */
function inicializarCarruseles() {
    document.querySelectorAll('[data-carrusel]').forEach((carrusel) => {
        const imagen = carrusel.querySelector('.carrusel-foto img');
        const contador = carrusel.querySelector('.carrusel-contador');
        const visor = document.querySelector('.visor-imagen');
        let indiceActual = 0;
        let intervalo = null;

        /** Actualiza la fotografía visible y el contador. */
        function mostrarImagen(indice) {
            indiceActual = (indice + rutasImagenesMesas.length) % rutasImagenesMesas.length;
            const fotoActual = rutasImagenesMesas[indiceActual];
            imagen.src = encodeURI(fotoActual.ruta);
            imagen.alt = fotoActual.descripcion;
            contador.textContent = `${indiceActual + 1} / ${rutasImagenesMesas.length}`;
        }

        /** Reanuda el avance automático si el movimiento está permitido. */
        function iniciarAvance() {
            if (intervalo || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            intervalo = setInterval(() => mostrarImagen(indiceActual + 1), 5000);
        }

        /** Pausa el avance automático mientras la persona interactúa. */
        function pausarAvance() {
            clearInterval(intervalo);
            intervalo = null;
        }

        carrusel.querySelector('[data-anterior]').addEventListener('click', () => mostrarImagen(indiceActual - 1));
        carrusel.querySelector('[data-siguiente]').addEventListener('click', () => mostrarImagen(indiceActual + 1));
        carrusel.querySelector('[data-ampliar-imagen]').addEventListener('click', () => {
            abrirVisorImagen(visor, rutasImagenesMesas[indiceActual]);
        });
        carrusel.addEventListener('mouseenter', pausarAvance);
        carrusel.addEventListener('mouseleave', iniciarAvance);
        carrusel.addEventListener('focusin', pausarAvance);
        carrusel.addEventListener('focusout', (evento) => {
            if (!carrusel.contains(evento.relatedTarget)) iniciarAvance();
        });
        mostrarImagen(indiceActual);
        iniciarAvance();
    });
}

/** Conecta el botón y el fondo del diálogo ampliado. */
function inicializarVisorImagen() {
    document.querySelectorAll('.visor-imagen').forEach((visor) => {
        visor.querySelector('[data-cerrar-visor]').addEventListener('click', () => visor.close());
        visor.addEventListener('click', (evento) => {
            if (evento.target === visor) visor.close();
        });
    });
}

inicializarGaleriaImagenes();
inicializarCarruseles();
inicializarVisorImagen();

/** Muestra una invitación al Instagram de Carol una sola vez por sesión. */
function inicializarAvisoInstagram() {
    const claveAviso = 'laMagiaCarolAvisoInstagramVisto';
    try {
        if (sessionStorage.getItem(claveAviso)) return;
        sessionStorage.setItem(claveAviso, 'true');
    } catch (error) {
        // Continúa mostrando el aviso si el navegador bloquea el almacenamiento de sesión.
    }

    const dialogo = document.createElement('dialog');
    const titulo = document.createElement('h2');
    const cerrar = document.createElement('button');
    const enlace = document.createElement('a');
    const qr = document.createElement('img');
    const usuario = document.createElement('span');

    dialogo.className = 'aviso-instagram';
    dialogo.setAttribute('aria-labelledby', 'titulo-aviso-instagram');
    titulo.id = 'titulo-aviso-instagram';
    titulo.textContent = 'Síguenos en Instagram';
    cerrar.className = 'aviso-instagram-cerrar';
    cerrar.type = 'button';
    cerrar.setAttribute('aria-label', 'Cerrar aviso de Instagram');
    cerrar.textContent = '×';
    enlace.href = 'https://www.instagram.com/la_magia_de_carol/';
    enlace.target = '_blank';
    enlace.rel = 'noopener noreferrer';
    enlace.setAttribute('aria-label', 'Abrir Instagram de La Magia de Carol');
    qr.src = 'img/Captura de pantalla 2026-09-28 a las 18.10.23.png';
    qr.alt = 'Código QR para visitar el Instagram de La Magia de Carol';
    usuario.textContent = '@LA_MAGIA_DE_CAROL';
    enlace.append(qr, usuario);
    dialogo.append(cerrar, titulo, enlace);
    document.body.appendChild(dialogo);

    cerrar.addEventListener('click', () => dialogo.close());
    enlace.addEventListener('click', () => dialogo.close());
    dialogo.addEventListener('keydown', (evento) => {
        if (evento.key === 'Escape') {
            evento.preventDefault();
            dialogo.close();
        }
    });
    dialogo.addEventListener('click', (evento) => {
        if (evento.target === dialogo) dialogo.close();
    });
    dialogo.showModal();
}

inicializarAvisoInstagram();
