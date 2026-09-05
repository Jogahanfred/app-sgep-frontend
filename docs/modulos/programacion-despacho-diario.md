# Programación y despacho diario de misiones

Pantalla operativa del día de vuelo: consulta los slots individuales programados, despacha a cabina (pasa la ejecución a en curso) y deriva a la rúbrica o al legajo.

Ruta: `/catalogo/despacho-diario`.

## Historias de usuario

1. Como jefe de instrucción u operaciones, quiero ver las misiones del día en el contexto de unidad y escuadrón del encabezado para saber qué está programado, en vuelo o cerrado.
2. Como instructor o jefe de instrucción, quiero iniciar una misión lista para despachar y habilitar la hoja de calificación en el workspace, sin volver a elegir unidad o escuadrón.
3. Como instructor o evaluador, quiero abrir la rúbrica de una misión en ejecución y consultar el legajo de una misión ya calificada.
4. Como jefe de operaciones, quiero reprogramar, cambiar recursos o cancelar un slot antes del despacho si hay una incidencia de rampa.

## Flujo

1. El usuario entra con contexto operativo ya confirmado (unidad y, si aplica, escuadrón).
2. El tablero carga asignaciones individuales de la fecha seleccionada, visibles según el mismo criterio de alumnos que el resto de instrucción. En mock hay 14 slots del día (8 cerrados, 3 en vuelo, 1 listo para despachar y 2 programados).
3. Las tarjetas resumen totales del día: programadas, en ejecución, cerradas y listas para iniciar.
4. El primer slot programado con instructor y alumno, y programa no culminado, se marca como **listo para despachar**.
5. **Iniciar misión y despachar a cabina** actualiza la ejecución a en curso y deja la rúbrica en `/catalogo/ejecucion-misiones/:id`.
6. Un slot en vuelo abre el workspace; uno cerrado abre el avance académico del alumno.
7. Reprogramar o cambiar aeronave/instructor navega al formulario de asignación individual. Cancelar pide confirmación y deja el slot en estado cancelado.

## Requisitos

- El contexto operativo vive en el encabezado; la pantalla no duplica selectores de unidad o escuadrón.
- Solo se despachan ejecuciones en estado programado, con instructor y con programa abierto (no culminado).
- Roles que despachan: ADSYS, ADPER, COMDO, JESQD, JOPER, JINST, INSTR. EVALU puede abrir la hoja en vivo. PILOT y AUDIT no despachan.
- Los textos salen de constantes de la feature. La capacidad diaria de slots es una constante de dominio de ocupación (`DISPATCH_DAILY_SLOT_CAPACITY`), no un dato meteorológico ni de un sistema externo.
- La capa de presentación llama a casos de uso; no a repositorios.

## Restricciones

- No se inventan telemetría ADS-B, METAR, DEFCON, frecuencias de torre, peso y centrado, planes CORPAC ni identificadores FAP que no existan en el dominio.
- Un programa culminado no se despacha ni se reescribe desde esta pantalla.
- El manifiesto PDF y la exportación SIGA/SIGEEP no se simulan: el usuario recibe aviso de que no están disponibles.
- Los slots grupales se programan en Programación de misiones; este tablero cubre asignaciones individuales del día.
- Las calificaciones se registran en el workspace de misión, no en el tablero de despacho.
