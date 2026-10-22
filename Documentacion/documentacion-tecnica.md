# Documentación técnica — MateCode Tasks

**Proyecto Integrador — Módulo 4**  
**Soy Henry — Full Stack Development**  
**Desarrolladora:** Agustina Pedernera

---

## 1. Descripción general

MateCode Tasks es una aplicación web de gestión de tareas personales desarrollada con React y TypeScript.

La aplicación permite que cada usuario se registre, inicie sesión y administre sus propias tareas. Los datos se almacenan en Cloud Firestore y la autenticación se realiza mediante Firebase Authentication.

También incluye una funcionalidad para solicitar por correo electrónico un resumen de las tareas, utilizando AWS Simple Email Service (SES) a través de una función serverless desplegada en Vercel.

El proyecto fue desarrollado como una aplicación de página única (SPA).

## 2. Tecnologías utilizadas

| Tecnología | Función |
|---|---|
| React | Construcción de la interfaz de usuario |
| TypeScript | Tipado estático y organización del código |
| Vite | Entorno de desarrollo y compilación |
| React Router | Navegación y protección de rutas |
| Firebase Authentication | Registro, inicio de sesión y verificación de correo |
| Cloud Firestore | Almacenamiento de tareas |
| Firebase Admin SDK | Validación de autenticación en el servidor |
| AWS SES | Envío de resúmenes por correo electrónico |
| Vercel | Despliegue del frontend y funciones serverless |
| Vitest | Ejecución de pruebas automatizadas |
| React Testing Library | Pruebas de componentes React |
| Git y GitHub | Control de versiones y alojamiento del repositorio |

## 3. Arquitectura de la aplicación

El proyecto separa la interfaz de usuario, la lógica de acceso a datos y el procesamiento del envío de correos.

**Frontend**

React gestiona las pantallas, los formularios, los estados de las tareas y las interacciones del usuario.

**Servicios de Firebase**

Firebase Authentication administra la identidad de los usuarios. Cloud Firestore almacena las tareas.

**Backend serverless**

La función `api/send-email.ts` procesa las solicitudes de envío de resúmenes. Se ejecuta del lado del servidor, donde se utilizan Firebase Admin y AWS SES.

### Flujo general

1. El usuario accede a la aplicación.
2. Firebase Authentication valida su sesión.
3. El Dashboard consulta las tareas del usuario en Firestore.
4. El usuario puede crear, editar, completar o eliminar tareas.
5. Si solicita un resumen por correo, el frontend obtiene su token de autenticación.
6. El frontend envía una solicitud a `/api/send-email`.
7. El servidor verifica el token mediante Firebase Admin.
8. El servidor consulta las tareas correspondientes al usuario.
9. Se genera un resumen y se solicita su envío mediante AWS SES.
10. La aplicación muestra un mensaje de éxito o error según el resultado.

## 4. Organización del código

Los archivos principales se organizan de acuerdo con sus responsabilidades.

```text
MateCode-Tasks/
├── api/
│   └── send-email.ts
├── src/
│   ├── context/
│   │   └── AuthContext
│   ├── hooks/
│   │   └── useTheme
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   └── VerificarCorreo.tsx
│   ├── services/
│   │   ├── firebase.ts
│   │   └── taskService.ts
│   ├── test/
│   │   ├── Dashboard.test.tsx
│   │   ├── primer.test.ts
│   │   └── setup.ts
│   └── types/
│       └── task.ts
├── Documentacion/
│   ├── documentacion-tecnica.md
│   ├── informe-uso-ia.md
│   └── capturas/
├── README.md
├── .env.example
├── package.json
├── vite.config.ts
└── vercel.json
```

*El esquema muestra los archivos principales