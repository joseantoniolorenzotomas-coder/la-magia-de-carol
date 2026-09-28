const configuracionSupabase = window.LA_MAGIA_SUPABASE_CONFIG || {};
const urlSupabase = (configuracionSupabase.urlProyecto || '').replace(/\/$/, '');
const claveSupabase = configuracionSupabase.claveAnonima || '';
const estadoHistorias = document.querySelector('[data-estado-historias]');
const listaHistorias = document.querySelector('[data-historias-publicadas]');
const formularioAcceso = document.querySelector('[data-formulario-acceso]');
const formularioHistoria = document.querySelector('[data-formulario-historia]');
const botonCerrarSesion = document.querySelector('[data-cerrar-sesion]');
const estadoAdministracion = document.querySelector('[data-estado-administracion]');
const claveSesion = 'laMagiaCarolSesionAdmin';
let sesionAdministradora = null;

/** Convierte una respuesta HTTP de Supabase en datos o un error legible. */
async function leerRespuesta(respuesta) {
    const datos = await respuesta.json().catch(() => null);
    if (!respuesta.ok) {
        throw new Error(datos?.msg || datos?.message || datos?.error_description || 'No se pudo completar la operación.');
    }
    return datos;
}

/** Realiza solicitudes autenticadas a la API de Supabase. */
async function solicitarSupabase(ruta, opciones = {}) {
    const cabeceras = {
        apikey: claveSupabase,
        Authorization: `Bearer ${opciones.token || claveSupabase}`,
        ...opciones.cabeceras
    };
    if (opciones.cuerpo && !(opciones.cuerpo instanceof File)) {
        cabeceras['Content-Type'] = 'application/json';
    }

    const respuesta = await fetch(`${urlSupabase}${ruta}`, {
        method: opciones.metodo || 'GET',
        headers: cabeceras,
        body: opciones.cuerpo instanceof File ? opciones.cuerpo : opciones.cuerpo ? JSON.stringify(opciones.cuerpo) : undefined
    });
    return leerRespuesta(respuesta);
}

/** Guarda los tokens de acceso solo durante la sesión actual del navegador. */
function guardarSesion(datos) {
    sesionAdministradora = {
        accessToken: datos.access_token,
        refreshToken: datos.refresh_token,
        expiresAt: Date.now() + (datos.expires_in || 3600) * 1000,
        userId: datos.user?.id || sesionAdministradora?.userId
    };
    sessionStorage.setItem(claveSesion, JSON.stringify(sesionAdministradora));
}

/** Renueva el token de Carol cuando está cerca de caducar. */
async function obtenerTokenAdministradora() {
    if (!sesionAdministradora) return null;
    if (sesionAdministradora.expiresAt > Date.now() + 60000) return sesionAdministradora.accessToken;
    if (!sesionAdministradora.refreshToken) return null;

    const respuesta = await fetch(`${urlSupabase}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: { apikey: claveSupabase, 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: sesionAdministradora.refreshToken })
    });
    const datos = await leerRespuesta(respuesta);
    guardarSesion(datos);
    return sesionAdministradora.accessToken;
}

/** Confirma que la cuenta autenticada está autorizada como administradora. */
async function esAdministradora(token, userId) {
    const filas = await solicitarSupabase(`/rest/v1/administradoras?select=user_id&user_id=eq.${encodeURIComponent(userId)}&limit=1`, { token });
    return filas.length > 0;
}

/** Muestra el estado de acceso correspondiente a Carol autenticada. */
function mostrarPanelAdministracion(autenticada) {
    formularioAcceso.hidden = autenticada;
    formularioHistoria.hidden = !autenticada;
    botonCerrarSesion.hidden = !autenticada;
    estadoAdministracion.textContent = autenticada ? 'Sesión iniciada.' : '';
}

/** Devuelve una URL pública para una imagen del bucket de historias. */
function obtenerUrlImagen(ruta) {
    const rutaCodificada = ruta.split('/').map(encodeURIComponent).join('/');
    return `${urlSupabase}/storage/v1/object/public/historias/${rutaCodificada}`;
}

/** Añade las historias recibidas como texto seguro al feed público. */
function mostrarHistorias(historias) {
    listaHistorias.replaceChildren();
    historias
        .sort((historiaA, historiaB) => Date.parse(historiaB.creado_en) - Date.parse(historiaA.creado_en))
        .forEach((historia) => {
            const tarjeta = document.createElement('article');
            const imagen = document.createElement('img');
            const contenido = document.createElement('div');
            const fecha = document.createElement('time');
            const titulo = document.createElement('h3');
            const texto = document.createElement('p');

            tarjeta.className = 'historia-publicada';
            imagen.src = obtenerUrlImagen(historia.imagen_path);
            imagen.alt = historia.titulo;
            imagen.loading = 'lazy';
            fecha.dateTime = historia.creado_en;
            fecha.textContent = new Date(historia.creado_en).toLocaleDateString('es-ES', { dateStyle: 'long' });
            titulo.textContent = historia.titulo;
            texto.textContent = historia.texto;
            contenido.className = 'historia-contenido';
            contenido.append(fecha, titulo, texto);
            tarjeta.append(imagen, contenido);

            if (sesionAdministradora) {
                const botonEliminar = document.createElement('button');
                botonEliminar.type = 'button';
                botonEliminar.className = 'historia-eliminar';
                botonEliminar.textContent = 'Eliminar historia';
                botonEliminar.addEventListener('click', () => eliminarHistoria(historia));
                contenido.appendChild(botonEliminar);
            }

            listaHistorias.appendChild(tarjeta);
        });
}

/** Consulta historias públicas y las presenta desde la más reciente. */
async function cargarHistorias() {
    if (!urlSupabase || !claveSupabase) {
        estadoHistorias.textContent = 'Las historias publicadas aparecerán aquí cuando se conecte el servicio de publicaciones.';
        return;
    }

    estadoHistorias.textContent = 'Cargando historias...';
    try {
        const historias = await solicitarSupabase('/rest/v1/historias?select=id,titulo,texto,imagen_path,creado_en&order=creado_en.desc');
        mostrarHistorias(historias);
        estadoHistorias.textContent = historias.length ? '' : 'Todavía no hay historias publicadas.';
    } catch (error) {
        estadoHistorias.textContent = 'No se pudieron cargar las historias. Inténtalo de nuevo más tarde.';
    }
}

/** Inicia sesión y comprueba que la cuenta pertenece a Carol. */
async function iniciarSesion(evento) {
    evento.preventDefault();
    if (!urlSupabase || !claveSupabase) {
        estadoAdministracion.textContent = 'Configura primero la conexión con Supabase.';
        return;
    }

    const datosFormulario = new FormData(formularioAcceso);
    estadoAdministracion.textContent = 'Comprobando acceso...';
    try {
        const respuesta = await fetch(`${urlSupabase}/auth/v1/token?grant_type=password`, {
            method: 'POST',
            headers: { apikey: claveSupabase, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: datosFormulario.get('correo'),
                password: datosFormulario.get('contrasena')
            })
        });
        const datos = await leerRespuesta(respuesta);
        guardarSesion(datos);
        const token = sesionAdministradora.accessToken;
        if (!await esAdministradora(token, sesionAdministradora.userId)) {
            throw new Error('Esta cuenta no tiene permisos de publicación.');
        }
        mostrarPanelAdministracion(true);
        await cargarHistorias();
    } catch (error) {
        sesionAdministradora = null;
        sessionStorage.removeItem(claveSesion);
        estadoAdministracion.textContent = error.message || 'No se pudo iniciar sesión.';
    }
}

/** Publica la imagen y el texto después de validar formato y tamaño. */
async function publicarHistoria(evento) {
    evento.preventDefault();
    const datosFormulario = new FormData(formularioHistoria);
    const archivo = datosFormulario.get('imagen');
    const extensionesPermitidas = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

    if (!archivo || !extensionesPermitidas[archivo.type] || archivo.size > 8 * 1024 * 1024) {
        estadoAdministracion.textContent = 'Elige una imagen JPG, PNG o WebP de hasta 8 MB.';
        return;
    }

    try {
        const token = await obtenerTokenAdministradora();
        if (!token) throw new Error('Tu sesión ha caducado. Inicia sesión de nuevo.');

        const rutaImagen = `${crypto.randomUUID()}.${extensionesPermitidas[archivo.type]}`;
        estadoAdministracion.textContent = 'Publicando historia...';
        await solicitarSupabase(`/storage/v1/object/historias/${rutaImagen}`, {
            metodo: 'POST',
            token,
            cuerpo: archivo,
            cabeceras: { 'Content-Type': archivo.type, 'x-upsert': 'false' }
        });

        try {
            await solicitarSupabase('/rest/v1/historias', {
                metodo: 'POST',
                token,
                cuerpo: {
                    titulo: datosFormulario.get('titulo').trim(),
                    texto: datosFormulario.get('texto').trim(),
                    imagen_path: rutaImagen
                },
                cabeceras: { Prefer: 'return=minimal' }
            });
        } catch (error) {
            await solicitarSupabase('/storage/v1/object/historias', {
                metodo: 'DELETE',
                token,
                cuerpo: { prefixes: [rutaImagen] }
            }).catch(() => null);
            throw error;
        }

        formularioHistoria.reset();
        estadoAdministracion.textContent = 'Historia publicada.';
        await cargarHistorias();
    } catch (error) {
        estadoAdministracion.textContent = error.message || 'No se pudo publicar la historia.';
    }
}

/** Elimina una historia y su imagen si Carol confirma la acción. */
async function eliminarHistoria(historia) {
    if (!window.confirm(`¿Quieres eliminar «${historia.titulo}»?`)) return;

    try {
        const token = await obtenerTokenAdministradora();
        if (!token) throw new Error('Tu sesión ha caducado. Inicia sesión de nuevo.');
        await solicitarSupabase(`/rest/v1/historias?id=eq.${encodeURIComponent(historia.id)}`, { metodo: 'DELETE', token });
        await solicitarSupabase('/storage/v1/object/historias', {
            metodo: 'DELETE',
            token,
            cuerpo: { prefixes: [historia.imagen_path] }
        });
        estadoAdministracion.textContent = 'Historia eliminada.';
        await cargarHistorias();
    } catch (error) {
        estadoAdministracion.textContent = error.message || 'No se pudo eliminar la historia.';
    }
}

/** Restaura la sesión activa sin persistirla más allá de esta pestaña. */
async function restaurarSesion() {
    if (!urlSupabase || !claveSupabase) return;

    try {
        sesionAdministradora = JSON.parse(sessionStorage.getItem(claveSesion));
        if (!sesionAdministradora) return;
        const token = await obtenerTokenAdministradora();
        if (!token || !await esAdministradora(token, sesionAdministradora.userId)) {
            throw new Error('Sesión no autorizada.');
        }
        mostrarPanelAdministracion(true);
        await cargarHistorias();
    } catch (error) {
        sesionAdministradora = null;
        sessionStorage.removeItem(claveSesion);
    }
}

/** Cierra la sesión de administración actual. */
async function cerrarSesion() {
    try {
        const token = await obtenerTokenAdministradora();
        if (token) await solicitarSupabase('/auth/v1/logout', { metodo: 'POST', token });
    } catch (error) {
        estadoAdministracion.textContent = 'La sesión local se cerró; no se pudo confirmar el cierre remoto.';
    }
    sesionAdministradora = null;
    sessionStorage.removeItem(claveSesion);
    mostrarPanelAdministracion(false);
    await cargarHistorias();
}

if (estadoHistorias && listaHistorias && formularioAcceso && formularioHistoria && botonCerrarSesion) {
    formularioAcceso.addEventListener('submit', iniciarSesion);
    formularioHistoria.addEventListener('submit', publicarHistoria);
    botonCerrarSesion.addEventListener('click', cerrarSesion);
    cargarHistorias();
    restaurarSesion();
}