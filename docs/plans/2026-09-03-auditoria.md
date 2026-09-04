# Auditoría Centro Libanés — 3 de septiembre de 2026

Revisión de código, seguridad, UX y operación de la app en vivo (`centro-libanes-frontend.vercel.app` + API en Railway) hecha al retomar el proyecto. Lo marcado ✅ ya está corregido en la rama `feat/club-os-v3`.

## Hallazgos críticos (seguridad)

| # | Hallazgo | Riesgo | Estado |
|---|---|---|---|
| 1 | **Todo `/api/admin/*` era público**: cualquiera con la URL podía leer finanzas, comisiones, nómina de staff y dar de alta/baja empleados sin sesión. | Alto | ✅ `requireStaffAuth` en todo el back-office + `requireAdminRole` en personal, finanzas, comisiones, lockers y catálogo |
| 2 | **CMS del inicio editable por cualquiera**: crear/editar/borrar destacados, "Explorar" y banners sin token. | Alto | ✅ Mutaciones solo con sesión de staff |
| 3 | **Contraseña universal `1234`** para cualquier socio, PIN de menores y staff (dejada para demo, sin forma de apagarla). | Alto en producción real | ✅ Sigue activa para la demo; se apaga con `DISABLE_DEV_LOGIN=true` en Railway cuando el club entre en serio |
| 4 | Sin límite de intentos de login. | Medio | ✅ 120 intentos por IP cada 10 min (no estorba al Wi-Fi compartido del club) |
| 5 | El QR de la credencial digital (`CL-MEMBER:{id}`) **no era válido en Recepción**, que solo entendía `CL-0001`. La credencial no servía para lo que se hizo. | Alto (funcional) | ✅ Recepción acepta ambos formatos |

## Hallazgos de experiencia

| # | Hallazgo | Estado |
|---|---|---|
| 6 | Los círculos decorativos del login tapaban el botón "Soy Empleado" en pantallas de celular (no se podía tocar). | ✅ `pointer-events: none` |
| 7 | Recepción y vestidores tenían que **teclear** los códigos: no había lector de QR. | ✅ Escáner con la cámara del teléfono (jsQR), sin apps externas; lee credencial de socio y pases de invitado |
| 8 | El servidor de Railway tarda ~15 s en despertar y la app se veía "colgada" sin explicación. | ✅ Aviso "Conectando con el club… el servidor está despertando" a los 2.5 s; aviso rojo si no hay conexión |
| 9 | Panel de administración ilegible en modo claro (títulos oscuros sobre fondo oscuro). | ✅ El back-office fija su paleta oscura |
| 10 | Textos sin acentos en Recepción y Perfil ("Codigo invalido", "Membresia"). | ✅ Corregidos |
| 11 | El inicio del socio no reflejaba nada de la operación diaria del club. | ✅ Tarjeta "N toallas en tu poder" con hora límite / alerta de vencidas |
| 12 | Muchas vistas fallan en silencio (`catch {}`): si la API falla, el socio ve vacío sin saber por qué. | Parcial: cubierto por el aviso de conexión; falta toast por vista |

## Lo que sigue (recomendado, por impacto)

1. **Apagar la contraseña universal** en Railway (`DISABLE_DEV_LOGIN=true`) y dar de alta contraseñas reales de socios y staff antes de abrir a todos.
2. **Pagos reales**: Stripe está en modo simulado. Conectar llaves reales o, mejor para el club, **caja/kiosco** desde la app (las señoras de caja confirman efectivo/terminal y hacen corte diario).
3. **Push notifications** (Capacitor + APNs/FCM): hoy las notificaciones solo se ven dentro de la app.
4. **Railway sin cold start**: pasar el servicio a un plan que no duerma; es lo único que hoy se siente lento.
5. **Módulos Club OS** siguientes (reutilizan el motor de toallas): préstamo de equipo, incidencias con foto, objetos perdidos, estacionamiento, pase de lista en clases.
6. Pruebas automatizadas mínimas (login, reserva, toallas) para que cada deploy se verifique solo.
