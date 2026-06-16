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

---

## Análisis técnico backend — develop → master

**Resumen ejecutivo**

- 65 commits (~31 PRs), 195 archivos, +19.308 / -492 líneas, 30 migraciones nuevas en 7 apps
- Rango temporal: 28 may — 15 jun 2026
- El deploy es un fast-forward limpio, sin commits divergentes en master ni conflictos
- **Riesgo global: ALTO** — no por bugs visibles, sino por el volumen de migraciones con backfill/NOT NULL sobre tablas grandes y por nuevas dependencias y variables de entorno que deben estar listas en PRO antes del deploy

**Cambios por área**

| Área | Líneas | Qué entra |
|---|---|---|
| whatsapp | +6924/-246 | Refactor multi-WABA (DEV-84/152/124) — el bloque más grande y arriesgado |
| api | +2898/-73 | Endpoints nuevos (multi-WABA, experiences, connect, filtros notificaciones) |
| ai | +2133/-62 | Unified-brain Fase 1 (DEV-173), destinatarios escalado humano (DEV-67), BSUID |
| experiences | +1121 | App nueva — catálogo de actividades (integración tour2b) |
| sms | +1019/-42 | Validación HLR + campos de contacto (DEV-51, phone E164) |
| connect | +939 | App nueva — dashboard consumo DTU (BigQuery + Google Ads OAuth, DEV-113/208) |
| core | +961/-25 | Phone E164, permisos external triggers, HLR status |
| custom_fields | +728 | Cambio de tipo bloqueado + migración (DEV-42) |
| automation | +611 | External Triggers (DEV-114) |
| docs | +1859 | Reestructura docs/product/, runbooks, doc-gap-review |

**Features destacadas**

1. **WhatsApp Multi-WABA (DEV-84/152/124)** — Split WhatsAppAccount→WhatsAppChannel + nuevo modelo WhatsAppWaba. Habilita "1 WABA con N números" y "N WABAs por cadena". API frontal nueva (`/api/v2/whatsapp/waba/`), soporte BSUID, sync por WABA. 18 migraciones (Ola E1: pre-flight, dedupe, UNIQUE, NOT NULL). La Ola E2 (drops destructivos) queda diferida, no entra
2. **Phone E164 + HLR (DEV-51)** — Normalización de teléfonos a E.164, validación HLR en SMS, campos `last_hlr_status` / `last_hlr_validated_at`
3. **Automation External Triggers (DEV-114)** — Disparadores externos + permiso `execute_external_trigger`. ⚠️ Race condition conocida en `event_id`
4. **Connect / DTU (DEV-113/208)** — App nueva: integración Google Ads OAuth + consultas BigQuery + dashboard de consumo DTU
5. **Experiences (DEV-207/1727)** — App nueva: catálogo de actividades/proveedores (tour2b), multi-tenant por hotel_chain
6. **AI Unified-brain Fase 1 (DEV-173)** — `state_version`, idempotencia, telemetría/coste de mensajes, rename a `persisted_state`. Destinatarios de notificación para escalado humano (DEV-67)
7. **Custom fields (DEV-42)** — Bloqueo + migración controlada al cambiar el tipo de un campo
8. **SES sender automático (DEV-204)** — Se asigna sender SES al crear una hotelchain

---

### ⚠️ Prerrequisitos de deploy (BLOQUEANTES)

**1. Dependencias nuevas**
```
pip install -r requirements.txt
```
- `python-dotenv==1.0.1`, `phonenumbers==8.13.55`, `google-cloud-bigquery==3.25.0`, bump `drf-yasg` 1.21.7→1.21.15

**2. Variables de entorno nuevas en PRO**
```
BIGQUERY_CREDENTIALS_JSON
GOOGLE_ADS_CLIENT_ID
GOOGLE_ADS_CLIENT_SECRET
GOOGLE_ADS_OAUTH_REDIRECT_URI
GOOGLE_ADS_REDIRECT_URL
GOOGLE_ADS_REFRESH_TOKEN_ENCRYPTION_SECRET
```
Sin ellas, Connect/Google Ads no arranca.

**3. WhatsApp — pre-flight OBLIGATORIO antes de migrate**
Las migraciones 0016 (dedupe) y 0018 (NOT NULL) tienen precondición explícita: correr `whatsapp_waba_preflight` (`has_blocking_nulls=False`, colisiones auditadas) + backup/snapshot de tablas `whatsapp_*`. Runbook en `docs/features/whatsapp_multi_waba_phase3.md` (Ola E1).
> ⚠️ El commit DEV-84 f5e416f75 es una "recuperación tras automigrate sin pre-flight" — ya hubo un incidente. No dejar que el deploy auto-migre ciego.

**4. Índice sobre core_contact**
La migración 0006 crea el índice de `phone1_e164` en paso separado a propósito — ejecutar en ventana de bajo tráfico (tabla enorme, multi-tenant).

**5. Backfill de teléfonos (post-deploy, manual)**
```
python manage.py populate_phone1_e164
```
La migración solo añade la columna; el llenado no es automático.

**6. Constance**
Nueva entrada `METABASE_ID_CONNECT_EVENTS` (232).

---

### Notas de migraciones

- En `ai/` hay dos migraciones 0003 paralelas (`ai_notification_recipient` y `conversation_bsuid`) resueltas por `0004_merge` — correcto, no es problema
- Las migraciones WhatsApp con `RunPython` de dedupe/rename son idempotentes pero con reverse no-op documentado (punto de no retorno en datos). El ensayo debe ir contra snapshot
