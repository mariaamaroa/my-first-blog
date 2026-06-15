# Release junio 2026

### WhatsApp

- **Soporte multi-WABA** — las cadenas con múltiples cuentas de negocio de WhatsApp (WABAs) pueden gestionarlas desde Fideltour. Cada WABA agrupa sus propios números y plantillas. Al crear una campaña desde automation se selecciona WABA → número → plantilla, garantizando coherencia. El sistema impide usar plantillas de una WABA distinta al número emisor

- **Plantillas de tipo Utility** — además de plantillas de Marketing, ahora se pueden crear, validar y enviar plantillas de tipo Utility (confirmaciones de reserva, recordatorios, actualizaciones de estado)

- **BSUID — Business-Scoped User ID** — Meta está introduciendo usernames en WhatsApp en 2026. Cuando un usuario adopta un username, su número puede dejar de aparecer en los webhooks y se envía en su lugar un BSUID. El sistema ya captura y persiste este identificador para no perder conversaciones de usuarios sin número de teléfono

- **WhatsApp Usernames** — preparación del sistema para seguir funcionando cuando los contactos lleguen sin número de teléfono

- **Captura de número de teléfono mediante botón nativo de Meta (request info)** — botón nativo de Meta que solicita al usuario que comparta su número. Cuando el usuario lo pulsa, el número se almacena en el contacto. El botón se envía en todos los mensajes hasta que el usuario lo pulsa — una vez identificado, no se vuelve a enviar

- **Escalado humano — configurar managers** — nueva vista para configurar qué managers reciben las notificaciones cuando una conversación de WhatsApp es escalada del bot a humano

- *Fix:* La etiqueta dinámica se insertaba siempre al final del cuerpo del mensaje, independientemente de la posición del cursor. Ahora se inserta en el punto exacto donde está el cursor

- *Fix:* Texto largo sin espacios (como una URL) desaparecía del visualizador al crear plantillas. El contenido se mostrará correctamente

---

### Campañas

- **SMS batch** — envío masivo de SMS

- **Mejoras en la configuración de campaña:**
  - Campos de segmentos reorganizados en columna con espacio suficiente para múltiples tags, títulos alineados y etiquetas consistentes entre ambos campos
  - Email del remitente muestra por defecto el configurado en Configuración → Remitentes. Nombre del remitente aparece en blanco para que el usuario lo rellene
  - Asunto y texto de previsualización en columna para mayor comodidad al escribir
  - Contador de caracteres en el campo asunto
  - 'Contenido vinculado' renombrado a una etiqueta más clara

- **Limitar envíos duplicados** — un contacto con múltiples movimientos en el mismo día solo recibe una comunicación por campaña, independientemente del número de movimientos asociados

- *Fix:* El selector de hora permitía elegir horas pasadas cuando el día seleccionado era hoy, provocando envíos inmediatos no esperados. Además, la hora programada no respetaba la zona horaria del cliente — corregido para que los envíos se realicen en el horario configurado según la zona horaria local del usuario

---

### Analytics campañas

- **Corrección del campo "Última actividad"** — ahora refleja el timestamp del evento más reciente entre apertura, click, rebote, baja y conversión

- **Valores absolutos junto a porcentajes** — Open Rate, CTR y CTOR muestran también el volumen absoluto (nº de aperturas, clicks, etc.) como texto secundario bajo el porcentaje

- **Separación en tres bloques** — las métricas se agrupan visualmente en: Salud del envío (alcance, enviados, entregados, rebotes), Engagement (aperturas, open rate, clicks, CTR, CTOR) y Conversión (reservas, revenue, tasa de conversión)

- **Lectura rápida automática** — interpretación automática en lenguaje natural del resultado de la campaña basada en umbrales definidos por bloque. Útil para soporte, KAM y cliente final sin necesidad de interpretar los números manualmente

---

### CRM

- **Filtros de contactos** — recuperados los filtros de Landing y Campos personalizados que faltaban en la nueva plataforma. Los filtros de campos personalizados de tipo texto muestran un desplegable con los valores existentes en lugar de un campo libre

- **Segmentos — conteo de alcance por canal corregido** — el conteo de contactos por canal en los segmentos mostraba números incorrectos

- **Segmentos — todos los canales disponibles** — el listado de canales al configurar segmentos ahora muestra todos los canales disponibles

- *Fix:* La métrica "Contact repetition by hotel chain" en analytics de movimientos mostraba siempre el mismo valor independientemente del rango de fechas seleccionado

---

### Connect

- **Dashboard de analytics — nuevos filtros** — el dashboard de analytics de Connect en Metabase incorpora filtros por integración, uso de API y tipo de webhook

---

### Identity

- **Google Ads Customer Match** — los managers autorizados pueden conectar la cuenta de Google Ads de la cadena mediante OAuth y sincronizar segmentos CRM como audiencias. Una vez sincronizado un segmento, los cambios posteriores (altas, bajas, modificaciones de nombre) se mantienen sincronizados automáticamente

---

### Chatbot

- **Chat web** — primera versión de chat web propio como canal externo alternativo a WhatsApp para conversaciones con huéspedes

- El nombre del asistente se ha eliminado del mensaje de bienvenida

- *Fix:* El chatbot no procesaba correctamente los PDFs subidos a la base de conocimiento. Ahora lee el contenido de los PDFs correctamente

---

### Landing

- Migración completa del módulo Landing a la nueva plataforma: Dashboard, Analytics, Landings, Formularios y Configuración

---

### Management

- *Fix:* El label del tipo de crédito "Servicios adicionales" aparecía vacío al añadir o quitar créditos de ese tipo
