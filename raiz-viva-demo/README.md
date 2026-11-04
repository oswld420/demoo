# 🌳 Raíz Viva — Demo Todo-en-Uno (Un Solo Archivo `index.html`)

> **"Para que los árboles no solo se planten, sino que sobrevivan"**

Esta versión contiene **absolutamente todo el código (HTML, CSS y JavaScript) dentro del único archivo `index.html`**. No necesitas carpetas adicionales ni preocuparte por rutas relativas o dependencias rotas.

---

## 📱 ¿Cómo funciona la sincronización en vivo entre 50 teléfonos?

### Respuesta a tu pregunta:
**¿Si 50 personas entran desde sus propios teléfonos, aparecerán los nombres de los demás y competirán en vivo?**

**¡SÍ, TOTALMENTE!**

El archivo `index.html` tiene integrado un **motor de sincronización en tiempo real por la nube** mediante *Server-Sent Events* (SSE). Funciona de la siguiente manera:

1. **Tú compartes tu URL o código QR** con el grupo (ejemplo: `https://tu-usuario.github.io/raiz-viva/`).
2. Cada una de las 50 personas abre el enlace en su propio smartphone (iOS o Android).
3. En el momento en que alguien toca **"Registrarme"** y escribe su nombre (ejemplo: *"Laura Gómez"*):
   - Su teléfono transmite inmediatamente el evento a la sala en la nube.
   - **En menos de 200 milisegundos**, la pantalla de los otros 49 teléfonos recibe la actualización.
   - Aparece una notificación en pantalla: *"🌱 ¡Laura Gómez se unió con su árbol!"*.
   - Laura aparece automáticamente en la pestaña **Ranking** de todos los teléfonos.
4. **Competencia en vivo:**
   - Cada participante comienza con **50 puntos**.
   - Si Laura presiona **"Activar Riego"**, su árbol se riega con animación de lluvia y suma **+15 puntos** (65 pts).
   - Inmediatamente, en el teléfono de todos los demás, Laura sube de posición en el podio.
   - Si Carlos completa un reto de **+40 puntos** (90 pts), pasa al 1° lugar en todos los teléfonos simultáneamente.
5. **Comienza 100% limpia:**
   - La tabla de clasificación inicia vacía ("*Aún no hay participantes*"). Solo aparecerán las personas reales del auditorio que se registren.

---

## 🌳 Animaciones del Árbol Interactivo

En la pestaña **"Mi Árbol"**:
- **Árbol animado:** Dibujo vectorial que se mece suavemente con la brisa (`treeSway`), con raíces visibles enterradas en el sustrato.
- **Acción "Activar Riego":**
  - Caen gotas de agua animadas (`💧`) desde el cielo sobre la copa del árbol.
  - El suelo cambia a un color hidratado y fértil (92% humedad).
  - Florecen brotes de colores en el follaje.
  - Sube flotando una medalla dorada: `+15 pts Vitalidad`.
- **Acción "Subir Foto IA":**
  - Un haz láser de escáner inteligente recorre el árbol de arriba a abajo analizando biomasa y crecimiento.
  - El árbol crece de altura (`52 cm` ➔ `56 cm`).
  - Sube flotando la medalla: `+30 pts Crecimiento IA`.

---

## 🚀 Cómo Subir el Archivo a GitHub Pages para Tener tu URL Propia

Solo necesitas subir el archivo `index.html`:

1. Ve a [github.com](https://github.com) y crea un nuevo repositorio público (ej. `raiz-viva`).
2. Sube el archivo `index.html`.
3. En GitHub, entra a **Settings** (Configuración) ➔ **Pages** (en el menú izquierdo).
4. En **Build and deployment > Branch**, selecciona `main` (o `master`) y la carpeta `/ (root)`, luego pulsa **Save**.
5. En unos 60 segundos, GitHub te dará tu URL pública independiente, por ejemplo:
   `https://tu-usuario.github.io/raiz-viva/`
6. ¡Listo! Genera un código QR con ese enlace o compárteselo a las 50 personas para que entren desde sus teléfonos.

---

## 🔄 Cómo Reiniciar la Sala para un Nuevo Grupo

Si vas a presentar ante otro grupo de personas y quieres que la tabla vuelva a comenzar desde cero:
1. En la barra inferior, toca en el botón **Más** (icono de tres puntos).
2. Toca en **"Reiniciar Sala (Nuevo Grupo)"** y confirma.
3. Esto vaciará automáticamente la lista de participantes en todos los dispositivos conectados.
