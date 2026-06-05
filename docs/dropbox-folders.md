# Estructura de Dropbox

Las evidencias y documentos no deben vivir en SQL. La base solo guarda metadata y rutas.

## Raíz

`/EquipApp`

## Por empresa

`/EquipApp/{empresa}`

## Por equipo

`/EquipApp/{empresa}/equipos/{codigo_equipo}`

## Subcarpetas recomendadas

- `/documentos`
- `/fotos`
- `/mantenimientos`
- `/colaboradores`

## Convención de nombres

- Evitar caracteres especiales en nombres de carpeta.
- Usar el código interno del equipo como identificador principal.
- Guardar en SQL el `dropbox_path`, `dropbox_id` y el `mime_type`.
