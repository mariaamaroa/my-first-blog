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

#### Referencia técnica — BigQuery HDH (`hdh_events_raw`)

**¿Qué es y para qué sirve?**

BigQuery HDH registra cada evento de creación o actualización de contacto o entrada que HDH envía a Fideltour. Es la fuente de datos histórica para:
- Análisis de consumo por cliente, hotel, PMS o tipo de integración (DTU/habitación/mes)
- Auditoría de la actividad de cada integración conectada
- Pricing y facturación basada en eventos reales generados
- Monitorización de integraciones con comportamiento anómalo (picos de actualizaciones, ratios inusuales)

> **Privacidad:** BigQuery no contiene datos personales de huéspedes ni información de reservas. Solo almacena metadatos del evento: quién lo generó, cuándo y sobre qué tipo de entidad.

**DTU (Data Transfer Unit):** unidad que mide cada operación `create` o `update` que HDH envía a Fideltour. Es la métrica base de consumo y facturación por integración.

**Conexión**

| Parámetro | Valor |
|---|---|
| Proyecto GCP | `hoteldatahub` |
| Dataset | `hdh_events_raw` |
| Fichero credenciales | `hoteldatahub-d50a7f4c7325.json` (raíz del proyecto) |
| Client email | `hdh-558@hoteldatahub.iam.gserviceaccount.com` |

**Estructura del dataset — 5 tablas**

| Tabla | Tipo | Descripción |
|---|---|---|
| `event` | Hechos | Cada operación create/update enviada a Fideltour. Tabla principal para análisis DTU |
| `webhook_event` | Hechos | Cada llamada POST entrante a `/api/v1/webhooks/` |
| `hotel` | Referencia | Places activos con `fideltour_id` (~988 hoteles) |
| `company` | Referencia | Todas las Companies HDH (PMS, BE, WiFi, etc.) |
| `customer` | Referencia | Cadenas hoteleras con `fideltour_id` |

**Tabla `event` — campos principales**

| Campo | Tipo | Descripción |
|---|---|---|
| `entity` | STRING | `"contact"` (perfil de huésped) o `"entry"` (reserva/estancia) |
| `action` | STRING | `"create"` (alta nueva) o `"update"` (modificación) |
| `hotel_chain_id` | INTEGER | `fideltour_id` de la cadena hotelera. Clave principal de agrupación |
| `hotel_id` | INTEGER | `fideltour_id` del hotel concreto. Nulo en ~35% de los eventos |
| `timestamp` | TIMESTAMP | Momento exacto en UTC del envío a Fideltour (no la fecha de la reserva) |
| `contact_source` | INTEGER | Código del tipo de integración cuando `entity='contact'` |
| `entry_source` | INTEGER | Código del tipo de integración cuando `entity='entry'` |
| `entry_type` | INTEGER | `0`=reserva (booking), `1`=estancia (stay) |
| `company_id` | INTEGER | ID de la Company HDH que originó el evento. Join con `company.id` |

**Mapeo de fuentes (`contact_source` / `entry_source`)**

| Tipo de integración | `contact_source` | `entry_source` |
|---|---|---|
| PMS | 0 | 4 |
| Booking Engine | 3 | 7 |
| WiFi | 1 | 3 |
| Chatbot | 10 | 9 |
| Guest Portal | 11 | 8 |
| Pre check-in | 9 | 29 |
| PMS Spa | 17 | 15 |
| PMS Restaurante | 16 | 14 |
| Web Form | 7 | — |
| Loyalty BE | 3 | 7 |

> Loyalty BE y Booking Engine comparten los mismos códigos. Para distinguirlos, usar `company_id` con join a la tabla `company`.

**Tabla `webhook_event` — tipos de evento (`webhook_type`)**

`CONTACT_CREATED`, `CONTACT_UPDATED`, `CONTACT_UNSUBSCRIBED`, `CONTACT_LEVEL_UPDATED`, `ENTRY_CREATED`, `ENTRY_UPDATED`, `EMAIL_LINK_CLICKED`, `EMAIL_OPENED`, `EMAIL_SENT`, `EMAIL_BOUNCED`, `LOYALTY_DATA_UPDATED`, `EMAIL_STATUS_UPDATED`, `EMAIL_SENT_TAGGED_CAMPAIGN`, `SEGMENT`, `GOOGLE_ADS`

**Cuándo y cómo se actualiza**

Los eventos se insertan de forma asíncrona mediante una tarea Celery (cola `bigquery`) inmediatamente después de que HDH envía la operación a Fideltour. Si el worker Celery no está disponible, el evento se pierde (sin reintentos). Solo se insertan eventos con `hotel_chain_id` identificado.

Las tablas de referencia se actualizan manualmente:
```
python manage.py synchronize_fideltour_hotels    # recarga tabla hotel
python manage.py synchronize_bigquery_companies  # recarga tabla company
python manage.py synchronize_bigquery_customers  # recarga tabla customer
```

> ⚠️ Estas sincronizaciones reemplazan la tabla completa (WRITE_TRUNCATE). Si el comando falla a mitad, la tabla queda vacía hasta la siguiente ejecución.

**Consultas de ejemplo**

DTU total por cadena en un mes:
```sql
SELECT
    hotel_chain_id,
    COUNT(*) AS total_dtu,
    COUNTIF(action = 'create') AS creates,
    COUNTIF(action = 'update') AS updates
FROM `hoteldatahub.hdh_events_raw.event`
WHERE timestamp >= '2026-05-01'
  AND timestamp < '2026-06-01'
GROUP BY hotel_chain_id
ORDER BY total_dtu DESC
```

DTU desglosado por tipo de integración:
```sql
SELECT
    hotel_chain_id,
    COUNTIF(entity='contact' AND contact_source=0) AS c_pms,
    COUNTIF(entity='contact' AND contact_source=3) AS c_be,
    COUNTIF(entity='contact' AND contact_source=1) AS c_wifi,
    COUNTIF(entity='entry'   AND entry_source=4)   AS e_pms,
    COUNTIF(entity='entry'   AND entry_source=7)   AS e_be,
    COUNT(*) AS total
FROM `hoteldatahub.hdh_events_raw.event`
WHERE timestamp >= '2026-05-01'
  AND timestamp < '2026-06-01'
GROUP BY hotel_chain_id
```

**Volumen actual (datos a mayo 2026)**

| Métrica | Valor |
|---|---|
| Total eventos históricos | ~143 millones |
| Rango temporal | junio 2025 → presente |
| Cadenas con datos | ~314 |
| Hoteles con datos | ~1.155 |
| Eventos mayo 2026 | ~15 millones |
| Cadenas activas mayo 2026 | 278 |

Distribución histórica: `contact update` 68,6 M · `entry update` 52,1 M · `entry create` 12,9 M · `contact create` 9,5 M

**DTU/habitación/mes por tipo de integración (mayo 2026)**

| Tipo | DTU/hab/mes mediano (C+U) | DTU/hab/mes mediano (solo Creates) |
|---|---|---|
| PMS | ~85 | ~13 |
| Booking Engine | ~4 | ~2 |
| WiFi | ~4 | ~4 |
| Chatbot | ~1 | ~0,3 |

> PMSs con consumo estructuralmente elevado (>300 DTU/hab C+U): **Sihot** (582), **Front Hotel** (534). Engisoft registra 1.159, posible anomalía técnica pendiente de revisión.

**Limitaciones conocidas**
- Sin particionado: todas las queries hacen full scan de `event`
- Sin deduplicación: un reintento por error transitorio puede generar filas duplicadas
- `hotel_id` nulo en ~35% de los eventos
- Loyalty BE y Booking Engine comparten los mismos códigos de `source`
- Tablas de referencia (`hotel`, `company`, `customer`) no se auto-sincronizan

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
