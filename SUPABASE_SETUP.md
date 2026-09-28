# Configurar historias de Mis trabajos

El feed necesita un proyecto de Supabase. Sin configurar el proyecto, la galería y los carruseles funcionan, pero las historias no se guardan ni se comparten.

## Crear el proyecto

1. Crea un proyecto en Supabase.
2. En **Authentication**, desactiva el registro público y crea el usuario `dichuchis@gmail.com`.
3. Establece una contraseña nueva y única desde Supabase; no reutilices la que compartiste en el chat.
4. Después de crear el usuario, ejecuta en **SQL Editor** el contenido de `supabase-historias.sql`. El script autoriza exclusivamente ese correo para publicar y borrar historias.

## Conectar la web

En `supabase-config.js`, configura la URL del proyecto y la clave pública **anon/publishable**:

```js
window.LA_MAGIA_SUPABASE_CONFIG = Object.freeze({
    urlProyecto: 'https://ID-DEL-PROYECTO.supabase.co',
    claveAnonima: 'CLAVE-PUBLICA-DEL-PROYECTO'
});
```

No pongas nunca la clave `service_role` en la web. `supabase-config.js` está excluido de Git para no publicar la configuración local.

## Publicar historias

Accede a **Mis trabajos > Acceso de Carol**, inicia sesión y publica título, texto e imagen. Se aceptan JPG, PNG y WebP de hasta 8 MB. Las historias aparecen para todas las visitantes y se ordenan automáticamente de la más reciente a la más antigua.

Prueba el inicio de sesión desde la web desplegada en HTTPS o desde un servidor local; abrir el HTML directamente con `file://` no es válido para configurar el acceso de Supabase.