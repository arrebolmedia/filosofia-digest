# Digest — Una Vida Examinada

## Servidor
- Host: `root@data.arrebolweddings.com`
- App: `/opt/digest/app`
- PDFs: `/opt/digest/pdfs` (M1–M22)
- Público: `/opt/digest/public`
- Docker: `/opt/digest/docker/docker-compose.yml`
- Logs: `/var/log/digest.log`
- Cron: `0 9 * * 1-5` (9am México, lunes–viernes)

## Archivos de estado (servidor)
- `issue-counter.json` — `{ "issue": N }` — número de edición actual
- `module-state.json` — `{ "moduleIndex": N, "partIndex": N }` — progreso actual
- `subscribers.json` — suscriptores (temporal, migrar a Baserow)

## Configuración clave (.env servidor)
- `SKIP_MODULES=5,11,17` — M5 Griego Antiguo, M11 Griego Antiguo II, M17 Latín I
- `SUBSCRIBE_PORT=3001`
- `maxPdfItems=3` — temas por correo

## Baserow — Suscriptores digest
- Workspace: 194 (`Anthony Cazares - Filosofía`)
- Database: 260 (`Suscriptores digest`)
- Tabla: 839 (`Suscriptores`)
- User email: `anthony@arrebolweddings.com`

### Campos tabla 839
| ID     | Nombre        | Tipo          | Notas                        |
|--------|---------------|---------------|------------------------------|
| 7612   | Email         | text          | Primary                      |
| 7615   | moduleIndex   | number        | Módulo actual del suscriptor |
| 7616   | partIndex     | number        | Parte actual del módulo      |
| 7617   | active        | boolean       | Suscripción activa           |
| 7618   | subscribedAt  | date          | Fecha de suscripción         |

### Acceso API
- Database token: en `.env` como `BASEROW_DB_TOKEN` — solo para CRUD de filas
- URL pública: `https://data.arrebolweddings.com/api/` — usar desde digest-subscribe (no IP interna)

## Docker
- `digest-web` — nginx sirviendo `/opt/digest/public`
- `digest-subscribe` — Node servidor de suscripciones puerto 3001

## Lógica de partes
- Cada módulo se divide en partes de 3 temas (`maxPdfItems=3`)
- Si módulo tiene 1 parte: título sin numeración ("Filosofía Política")
- Si tiene varias: "Filosofía Política · Parte I", "Parte II", etc.
- Estado persiste en `module-state.json`; avanza tras envío exitoso

## Próximo paso
Personalizar envío del digest por suscriptor (cada quien recibe su propio módulo/parte desde Baserow)
