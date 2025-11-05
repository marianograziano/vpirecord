# 📹 Grabador de Ejercicios

Una aplicación web minimalista para grabar voz y video de tus ejercicios físicos, con soporte para múltiples cámaras y registro completo de sesiones.

## 🌟 Características

- ✅ **Selección de Cámara**: Elige entre la cámara integrada de tu notebook o cualquier cámara USB conectada
- 🎥 **Grabación de Video y Audio**: Captura video en alta calidad con audio sincronizado
- ⏱️ **Temporizador en Tiempo Real**: Visualiza la duración de tu grabación mientras entrenas
- 💾 **Almacenamiento Local**: Todos tus videos se guardan localmente en tu navegador (sin enviar datos a servidores externos)
- 📋 **Historial de Ejercicios**: Revisa, reproduce y descarga tus sesiones anteriores
- 📱 **Diseño Responsivo**: Funciona en computadoras de escritorio, laptops y tablets
- 🎨 **Interfaz Minimalista**: Diseño limpio y fácil de usar

## 🚀 Cómo Usar

### Requisitos

- Navegador web moderno (Chrome, Firefox, Edge, Safari)
- Cámara y micrófono (integrados o externos)
- Conexión de cámara USB (opcional, si quieres usar una cámara externa)

### Instalación

1. **Descarga los archivos** o clona este repositorio
2. **Abre el archivo `index.html`** en tu navegador web
3. **Permite el acceso** a la cámara y micrófono cuando el navegador lo solicite

### Uso Básico

1. **Seleccionar Cámara**:
   - En el menú desplegable superior, elige la cámara que deseas usar
   - El video preview se actualizará automáticamente

2. **Grabar un Ejercicio**:
   - Escribe el nombre del ejercicio (ej: "Sentadillas", "Flexiones", "Yoga")
   - Haz clic en "Iniciar Grabación"
   - Realiza tu ejercicio frente a la cámara
   - Observa el temporizador para controlar la duración
   - Haz clic en "Detener" cuando termines

3. **Guardar o Descartar**:
   - Después de detener, puedes ver el video grabado
   - Haz clic en "Guardar Ejercicio" para guardarlo en tu historial
   - O haz clic en "Descartar" si quieres volver a grabar

4. **Gestionar tu Historial**:
   - Todos los ejercicios guardados aparecen en la sección "Historial de Ejercicios"
   - **Ver**: Reproduce el video del ejercicio
   - **Descargar**: Descarga el video a tu computadora
   - **Eliminar**: Borra el ejercicio del historial
   - **Limpiar Historial**: Elimina todos los ejercicios (con confirmación)

## 🔧 Tecnologías Utilizadas

- **HTML5**: Estructura de la página
- **CSS3**: Estilos y diseño responsivo
- **JavaScript (Vanilla)**: Lógica de la aplicación
- **MediaRecorder API**: Grabación de video y audio
- **getUserMedia API**: Acceso a cámaras y micrófonos
- **localStorage**: Almacenamiento persistente de datos

## 📝 Notas Importantes

### Privacidad y Almacenamiento

- Todos los videos se almacenan **localmente en tu navegador** usando localStorage
- **No se envían datos a ningún servidor externo**
- Los videos permanecen en tu dispositivo hasta que los elimines
- El espacio de almacenamiento depende de tu navegador (típicamente 5-10 MB)

### Limitaciones de Tamaño

- Los videos muy largos pueden exceder el límite de localStorage
- Se recomienda mantener las grabaciones entre 30 segundos y 3 minutos
- Si recibes un error al guardar, intenta con videos más cortos

### Compatibilidad de Navegadores

| Navegador | Soporte | Notas |
|-----------|---------|-------|
| Chrome/Chromium | ✅ Completo | Recomendado |
| Firefox | ✅ Completo | Funciona perfectamente |
| Edge | ✅ Completo | Basado en Chromium |
| Safari | ⚠️ Parcial | Puede requerir permisos adicionales |
| Opera | ✅ Completo | Basado en Chromium |

### Formato de Video

- Los videos se graban en formato **WebM** con códec VP9 y Opus
- Compatible con la mayoría de reproductores modernos
- Puedes convertir a MP4 usando herramientas como VLC o FFmpeg si lo necesitas

## 🎯 Casos de Uso

- **Registro de entrenamientos**: Documenta tu progreso en ejercicios
- **Corrección de forma**: Revisa tu técnica en diferentes ejercicios
- **Clases en línea**: Graba tus sesiones de entrenamiento personal
- **Fisioterapia**: Registra ejercicios de rehabilitación
- **Yoga y meditación**: Documenta tus prácticas
- **Deportes**: Analiza tu técnica en diferentes disciplinas

## 🐛 Solución de Problemas

### No puedo ver la cámara
- Verifica que hayas permitido el acceso a la cámara en tu navegador
- Comprueba que la cámara no esté siendo usada por otra aplicación
- Actualiza los permisos en la configuración de tu navegador

### El video no se reproduce
- Asegúrate de que tu navegador soporte el formato WebM
- Intenta descargar el video y reproducirlo en un reproductor externo como VLC

### Error al guardar
- El video puede ser demasiado grande para localStorage
- Intenta grabar videos más cortos
- Limpia el historial para liberar espacio

### La cámara USB no aparece
- Conecta la cámara antes de abrir la aplicación
- Recarga la página después de conectar la cámara
- Verifica que la cámara funcione en otras aplicaciones

## 📄 Licencia

Este proyecto es de código abierto y está disponible para uso personal y comercial.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Si encuentras algún error o tienes sugerencias de mejora, no dudes en:

1. Reportar issues
2. Enviar pull requests
3. Compartir ideas de nuevas características

## 📧 Contacto

Si tienes preguntas o necesitas ayuda, puedes:
- Abrir un issue en el repositorio
- Consultar la documentación de las APIs web utilizadas

---

**¡Disfruta grabando tus ejercicios!** 💪🎥
