# Benchmark competitivo: Hotelinking vs Fideltour

**Fecha:** 15 de septiembre de 2026
**Alcance:** producto, módulos, integraciones, señales de roadmap y posicionamiento de Hotelinking, contrastado con el estado de Fideltour según el changelog de junio 2026 de este repo.
**Fuentes:** exclusivamente públicas (web y blog de Hotelinking, Hotel Tech Report, Capterra, LinkedIn, Tracxn, Crunchbase, Sojern). Cada afirmación lleva su fuente. Lo que no está en una fuente se marca como **no verificado**.

> **Aviso metodológico.** Hotelinking **no publica un roadmap formal** ni un changelog de producto. Su sección de novedades tiene 6 entradas, la más reciente sobre una ayuda FEDER 2025. La única forma de inferir dirección es leer lo que anuncian como "ya disponible" en el blog de 2026, que es donde de facto publican los lanzamientos. Ese es el enfoque de la sección 4.

---

## 1. Ficha de empresa

| Dato | Valor | Fuente |
|---|---|---|
| Sede | Palma, Parc Bit (Islas Baleares) | LinkedIn |
| Fundación | 2014 (Tracxn) / 2016 (LinkedIn). Discrepancia entre fuentes | Tracxn, LinkedIn |
| Fundadores | Xisco Lladó, Ignacio Isa Martín | Tracxn |
| Plantilla | 11-50 (29 perfiles en LinkedIn) | LinkedIn |
| Financiación | 1 inversor, sin rondas públicas 2025-2026. Ayuda FEDER 20.000 € para internacionalización 2025 | Tracxn, blog Hotelinking |
| Adquisiciones | Ninguna | Tracxn |
| Clientes declarados | +1.000 hoteles y cadenas; 60% de penetración en cadenas hoteleras españolas | Web Hotelinking (autodeclarado, no auditable) |
| Métricas declaradas | +10M huéspedes registrados; +30M € comisiones ahorradas; +100M € ventas directas generadas; +120 integraciones activas | Web y LinkedIn (autodeclarado) |
| Partnerships públicos | Sojern (abril 2024), Impala (integraciones PMS), Stay App, RoomCloud, SIHOT | Blog Hotelinking, Sojern |
| Reconocimientos | Travel Innovation Summit Deloitte (2025), Top 100 APTE (2023) | Sala de prensa Hotelinking |

**Lectura:** empresa pequeña, sin capital riesgo significativo, con fuerte cuota en cadenas españolas y un ADN de origen en WiFi/redes (cursos MikroTik, certificación MikroTik del CTO). Ha pivotado el mensaje hacia "CRM agéntico" pero su base instalada procede del portal cautivo.

---

## 2. Arquitectura de producto

Tres líneas de producto independientes con marca propia:

### 2.1 GuestMaker — "CRM hotelero agéntico y multicanal"
Competidor directo de Fideltour. Submódulos publicados:

| Submódulo | Capacidades declaradas | Fuente |
|---|---|---|
| CRM y marketing automation | Email builder drag-and-drop con IA generativa (asuntos, copys, imágenes). Journeys pre/durante/post estancia. Triggers: reserva creada/editada/cancelada, check-in/out, login WiFi, encuesta, cambio de nivel, umbral de gasto. Segmentación AND/OR multietapa con atributos de huésped, reserva, comportamiento y revenue (LTV, gasto, extras). Dominios de envío y reply-to por marca. Consentimientos RGPD con fecha, origen y propósito | /guestmaker/crm-hotelero/ |
| CDP ("Golden Record") | Unificación multi-PMS y multi-canal en un perfil único. Matching "desde coincidencias exactas hasta modelos de IA". Regla: si el Golden Record tiene dato de contacto se envía al CRM, si no queda en pausa. Importa histórico. Declarado "funcional y varios clientes lo usan en producción" | Blog 09/07/2026 |
| Web Visitors | Script de tracking en la web de la cadena. IA categoriza comportamiento de sesiones anónimas por interés. Al identificarse el visitante (formulario, portal cautivo, reserva) el historial se fusiona en el perfil CRM | Blog 06/08/2026 |
| WhatsApp + Conserje IA | Journeys automatizados por etapa. Conserje 24/7, +50 idiomas, "acceso a más de 60 LLM". Librería de plantillas Meta con aprobación en tiempo real, variantes multilingües. Triaje y escalado a humano (protocolo no detallado). Objetos olvidados. Métricas de resolución, tiempo de respuesta y nivel de automatización | /guestmaker/gestion-experiencia-huesped-por-whatsapp-y-conserje-ia/ |
| Loyalty | Niveles con reglas propias, economía de puntos opcional, portal de miembros con histórico, Apple Wallet (Google Wallet "de momento no disponible"), referidos con puntos para ambas partes, sync bidireccional con CRM, alta desde login WiFi | Blog 17/08/2026, /guestmaker/consigue-suscriptores-en-programas-fidelizacion/ |
| Portal cautivo WiFi | Captura del 70%+ de huéspedes incluidos acompañantes, verificación de email (99% entregabilidad declarada), sync PMS en tiempo real, encuestas en estancia, reconocimiento de miembros loyalty. Hardware: MikroTik, Cisco Meraki, Ruckus, Ubiquiti, Aruba | /guestmaker/portal-cautivo-wifi/, Hotel Tech Report |
| API y webhooks | REST lectura/escritura de huéspedes, bookings, reservas. Webhooks salientes: booking, check-in/out, encuesta, gasto. Multi-propiedad "ilimitados hoteles, marcas y usuarios" | /en/guestmaker/hotel-crm/ |
| Analytics | Entregabilidad, apertura, clics, conversión, spam, rebote, clics por URL, dispositivo, demografía. Export CSV/PDF | /guestmaker/crm-hotelero/ |

**Canales mencionados solo en blog, sin página de producto:** "Meta Socials" y "AI Call Centre" (artículo de automatización 2026). **No verificado** que sean módulos comercializados. **SMS: no aparece** en ninguna página de producto.

### 2.2 DeskForce — check-in digital y recepción
Pre check-in online, check-in con escaneo de documento y firma digital, check-out autónomo con liquidación de cargos, pagos digitales (Adyen, Stripe, Apple Pay, Bizum, Alipay), modo híbrido asistido, envío de partes a autoridades (España). PMS: Mews, Oracle, SIHOT y otros.
**Relevancia para Fideltour:** es un punto de captura de datos de primera parte (documento, teléfono, email) que alimenta su CDP. Fideltour lo cubre vía integraciones de pre check-in de terceros (source 9/29 en HDH), no con producto propio.

### 2.3 WiFiBot — operación y seguridad de redes
Monitorización 24/7, GPON, WAN, control centralizado, resolución autónoma de incidencias. Fuera del scope competitivo de Fideltour, pero es su gancho de entrada en IT de cadenas y les da presencia en el hotel a nivel de infraestructura.

---

## 3. Integraciones

| Categoría | Nombres verificados | Fuente |
|---|---|---|
| PMS | Opera Cloud, Avalon, SIHOT, Timón, Winhotel, Prestige, Mews, Cloudbeds, ACIHOTEL, SiteMinder, Oracle Hospitality. Declaran "+50 PMS" | Web, Hotel Tech Report |
| Motor de reservas | BookingCore, Paraty Tech, Neobookings, Net Affinity, RoomCloud | Web, Hotel Tech Report, blog |
| CRM de terceros | **Fideltour**, Cendyn, Salesforce, HubSpot | /en/guestmaker/supercharge-your-crm/ |
| Chatbots (fuente CDP) | Quicktext, HiJiffy, Asksuite | /guestmaker/crm-hotelero/ |
| Reputación (fuente CDP) | ReviewPro, TrustYou, Revinate | /guestmaker/crm-hotelero/ |
| Guest apps | Stay App | Blog |
| Red | MikroTik, Cisco Meraki, Ruckus, Ubiquiti, Aruba | Web, Hotel Tech Report |
| Pagos | Adyen, Stripe, Apple Pay, Google Pay, Bizum, Alipay | Web, Capterra |
| Agregadores | Impala | Blog |
| Ads/media | Sojern | Sojern press release |

**Dato clave:** Hotelinking sigue listando a Fideltour como CRM destino de su portal WiFi. Son a la vez partner (canal WiFi hacia Fideltour) y competidor (GuestMaker CRM+CDP). El catálogo público tiene 10 páginas de integraciones que no he recorrido enteras; el conteo "+120" no lo he podido verificar.

---

## 4. Señales de roadmap (inferidas de publicaciones 2026)

No existe roadmap público. Cronología de lo que han anunciado como disponible en 2026, ordenado por fecha de publicación:

| Fecha | Señal | Interpretación |
|---|---|---|
| May 2026 | White paper "IA aplicada a hoteles" | Posicionamiento de thought leadership previo a lanzamientos de IA |
| 19/06/2026 | Artículo "El paso previo a la IA": estructurar conocimiento interno antes de adoptar IA | Preparación del mercado para el conserje IA basado en knowledge base |
| 26/06/2026 | Tendencias marketing 2026: first-party data, automatización ciclo completo, directo vs OTA, IA, eficiencia de adquisición | Marco narrativo; sin producto nuevo |
| 09/07/2026 | **CDP / Golden Record en producción** con "varios clientes" | Lanzamiento real. Compite frontalmente con el posicionamiento "Del CRM al CDP" de Fideltour |
| 06/08/2026 | **Módulo Web Visitors** (tracking anónimo + IA + merge al perfil) | Lanzamiento real. Fideltour no tiene equivalente en el changelog de junio |
| 17/08/2026 | **Loyalty ampliado**: puntos, portal de miembros, Apple Wallet, referidos. Google Wallet pendiente | Lanzamiento o ampliación. Google Wallet es el único ítem explícitamente futuro que publican |
| 2026 (sin fecha) | Mención a "AI Call Centre", "Meta Socials", "Channel Manager" y "Data Lake" como fuentes/canales de GuestMaker | **No verificado.** O bien módulos en desarrollo que el marketing adelanta, o bien capacidades vía integración. No hay página de producto |
| 2025-2026 | Integración SIHOT mejorada (check-in personalizado, envío de documentos) | Profundidad en PMS con alta cuota en España |

**Dirección inferida:** de portal WiFi a plataforma de datos (CDP) con activación por WhatsApp e IA conversacional. Los tres lanzamientos verificados de verano 2026 (CDP, Web Visitors, Loyalty) van todos en la misma línea: ser el sistema de registro del huésped, no solo el captador.

**Ritmo:** tres lanzamientos de módulo en ~6 semanas comunicados vía blog. Con una plantilla de ~29 personas repartida en tres productos, es razonable dudar de la profundidad de cada módulo, pero no tengo datos para confirmarlo.

---

## 5. Comparativa funcional vs Fideltour (estado junio 2026)

Base Fideltour: changelog junio 2026 de este repo. Solo comparo lo que hay evidencia en ambos lados.

| Capacidad | Hotelinking (GuestMaker) | Fideltour | Lectura |
|---|---|---|---|
| CDP / perfil unificado multi-PMS | Golden Record en producción (jul 2026), matching con IA, importa histórico | Posicionamiento "Del CRM al CDP" en web; HDH como capa de ingesta con ~988 hoteles y 143M eventos históricos | Paridad de mensaje. Fideltour tiene la infraestructura de ingesta más madura y medible (DTU, BigQuery); Hotelinking tiene una narrativa de identidad más explícita (Golden Record) |
| WhatsApp | Journeys por etapa, plantillas Meta con aprobación en tiempo real, conserje IA 24/7, +50 idiomas | Multi-WABA, plantillas Marketing y Utility, BSUID/usernames, botón nativo de captura de teléfono, escalado humano configurable, chat web propio | **Ventaja Fideltour en profundidad técnica** (multi-WABA, BSUID). Hotelinking no menciona multi-WABA ni preparación para usernames |
| IA conversacional | "60+ LLM", triaje, escalado. Sin detalle de arquitectura | Unified-brain fase 1: idempotencia, telemetría y coste por mensaje, knowledge base con PDFs | Paridad funcional aparente. Fideltour tiene más evidencia de ingeniería; Hotelinking más evidencia de marketing |
| Web tracking anónimo | Módulo Web Visitors (ago 2026) | **Sin equivalente en changelog de junio** | **Gap de Fideltour** si no existe en otro módulo |
| Loyalty | Niveles, puntos, portal de miembros, Apple Wallet, referidos | Niveles (CONTACT_LEVEL_UPDATED, LOYALTY_DATA_UPDATED), Loyalty BE, créditos | No puedo comparar profundidad sin la ficha de loyalty de Fideltour. Wallet y referidos no aparecen en el changelog |
| Audiencias publicitarias | Partnership Sojern (2024). Sin Customer Match propio verificado | Google Ads Customer Match con OAuth y sync continuo (jun 2026) | **Ventaja Fideltour** |
| SMS | No aparece | SMS batch, HLR, E.164 | **Ventaja Fideltour** |
| Email | Builder con IA generativa | Campañas con analytics en tres bloques y lectura automática | Hotelinking tiene IA generativa en el editor; Fideltour tiene interpretación automática de resultados. Distinta apuesta |
| Portal cautivo WiFi | Producto propio, core histórico, hardware multi-vendor | Integración de terceros (source 1/3 en HDH), incluido el propio Hotelinking | **Ventaja Hotelinking**. Es su fuente de datos propietaria |
| Check-in digital | DeskForce propio, con pagos | Integraciones de terceros | **Ventaja Hotelinking** en control de la captura |
| Experiences / upselling | Ofertas contextuales vía WhatsApp | App Experiences nueva (tour2b) | Fideltour construye catálogo; Hotelinking hace recomendación en conversación |
| API / webhooks | REST + webhooks salientes (booking, check-in/out, survey, spend) | 15 tipos de webhook, external triggers en automation | Paridad |
| Analytics de integraciones / consumo | No publicado | Connect: DTU por cadena, PMS, tipo de integración | **Ventaja Fideltour** (interna, pero da base para pricing por consumo) |
| Multi-propiedad | "Ilimitados hoteles, marcas y usuarios" | Multi-tenant por hotel_chain | Paridad |

---

## 6. Posicionamiento y percepción de mercado

- **Hotel Tech Report:** 4,0/5 con solo 3 reseñas, categoría "Direct Booking Tools / WiFi Captive Portal", no CRM. Crítica de usuario: filtros GDPR en exportación mejorables; utilidad del WiFi reducida por planes de datos ilimitados.
- **Capterra:** 0 reseñas, categorizado como "cloud-based reservations solution for small businesses". Categorización errónea, indica poco esfuerzo en marketplaces.
- **Fideltour en Hotel Tech Report:** listado como "Fideltour CDP" en categoría Hotel CRM. Alternativas citadas: Smart Host, Profitroom, Bookboost, dailypoint, Cendyn. **Hotelinking no aparece como alternativa a Fideltour** en ese listado.

**Lectura:** el mercado todavía clasifica a Hotelinking como herramienta WiFi. Su reposicionamiento a CRM/CDP es reciente (2026) y no está reflejado en terceros. Ventana para Fideltour de defender la categoría CRM/CDP antes de que la percepción cambie.

---

## 7. Riesgos y oportunidades para Fideltour

**Riesgos**
1. Hotelinking controla dos puntos de captura físicos (WiFi y check-in) que Fideltour solo integra. Si cierran el dato dentro de su CDP, el flujo WiFi→Fideltour (source 1) puede degradarse en cuentas compartidas.
2. Base instalada en el 60% de cadenas españolas (autodeclarado). Upsell de GuestMaker CRM a clientes que ya usan Fideltour como destino.
3. Web Visitors: funcionalidad que Fideltour no muestra tener y que enlaza con su Google Ads Customer Match de forma natural.

**Oportunidades**
1. Profundidad WhatsApp (multi-WABA, BSUID, Utility) es diferencial técnico demostrable frente a un competidor que no lo menciona.
2. Connect/DTU permite pricing transparente por consumo. Hotelinking no publica pricing.
3. SMS y Google Ads Customer Match: dos canales que Hotelinking no cubre.
4. Percepción de mercado: consolidar la categoría CDP en Hotel Tech Report y analistas mientras Hotelinking sigue en "WiFi Captive Portal".

---

## 8. Lo que no he podido verificar

- Roadmap formal: no existe públicamente.
- Pricing de Hotelinking: "contactar con vendedor" en todas las fuentes.
- "AI Call Centre", "Meta Socials", "Data Lake", "Channel Manager" como módulos reales.
- Clientes concretos del CDP en producción.
- Catálogo completo de las +120 integraciones (10 páginas, revisada solo la primera).
- Estado de loyalty, web tracking y pre check-in en Fideltour fuera del changelog de junio 2026. Si existen, la sección 5 debe corregirse.
- Fechas de publicación exactas de varios artículos del blog (solo algunos las muestran).

---

## Fuentes

- https://www.hotelinking.com/
- https://www.hotelinking.com/en/guestmaker/
- https://www.hotelinking.com/guestmaker/crm-hotelero/
- https://www.hotelinking.com/en/guestmaker/hotel-crm/
- https://www.hotelinking.com/guestmaker/gestion-experiencia-huesped-por-whatsapp-y-conserje-ia/
- https://www.hotelinking.com/guestmaker/portal-cautivo-wifi/
- https://www.hotelinking.com/guestmaker/consigue-suscriptores-en-programas-fidelizacion/
- https://www.hotelinking.com/en/guestmaker/supercharge-your-crm/
- https://www.hotelinking.com/deskforce/
- https://www.hotelinking.com/integraciones/
- https://www.hotelinking.com/blog/guestmaker/que-es-un-cdp-hotelero/ (09/07/2026)
- https://www.hotelinking.com/blog/guestmaker/visitantes-anonimos-web/ (06/08/2026)
- https://www.hotelinking.com/blog/guestmaker/de-donde-nace-programa-fidelizacion-hotel/ (17/08/2026)
- https://www.hotelinking.com/blog/tecnologia-hotelera/paso-previo-uso-ia-para-hoteles/ (19/06/2026)
- https://www.hotelinking.com/en/blog/hotel-marketing/hotel-marketing-trends/ (26/06/2026)
- https://www.hotelinking.com/en/blog/hotel-technology/hotel-automation-benefits/
- https://www.hotelinking.com/en/category/updates/
- https://www.hotelinking.com/en/press/
- https://hoteltechreport.com/marketing/direct-booking-tools/hotelinking
- https://hoteltechreport.com/es/marketing/hotel-crm/fideltour-cdp
- https://hoteltechreport.com/fideltour/alternatives
- https://www.capterra.com/p/10004602/Hotelinking/
- https://www.linkedin.com/company/hotelinking/
- https://tracxn.com/d/companies/hotelinking/__cA6A48GcCWLUW8AyMGo8UJhG5RVcpNpe9mGnuH6Q2ro
- https://www.sojern.com/press-release/hotelinking-and-sojern-partner-to-help-hoteliers-enhance-direct-guest-communications-and-digital-campaigns
- changelog-junio-2026.md (este repo)
