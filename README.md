# MateCode Tasks

Aplicación web para la gestión de tareas personales, desarrollada como Proyecto Integrador del Módulo 4 de Soy Henry.

Permite registrarse, iniciar sesión y administrar tareas de forma individual y segura, utilizando Firebase Authentication y Cloud Firestore. También incorpora el envío de un resumen de tareas por correo electrónico mediante AWS Simple Email Service (SES).

## Demo y repositorio

- **Aplicación desplegada:** https://mate-code-tasks.vercel.app
- **Repositorio:** https://github.com/AgustinaPedernera/MateCode-Tasks

## Funcionalidades

### Autenticación

- Registro de usuarios mediante correo electrónico y contraseña.
- Inicio y cierre de sesión.
- Verificación de correo electrónico.
- Rutas protegidas para usuarios autenticados.
- Acceso individual a las tareas de cada usuario.

### Gestión de tareas

- Crear tareas con título y descripción.
- Visualizar las tareas guardadas.
- Editar tareas existentes.
- Marcar tareas como completadas o pendientes.
- Eliminar tareas con confirmación previa.
- Validar que las tareas tengan un título.
- Mostrar mensajes de confirmación, carga y error.

Las tareas se almacenan en Cloud Firestore y se organizan por usuario.

### Resumen por correo electrónico

La aplicación incluye un botón que permite solicitar un resumen de las tareas del usuario por correo electrónico.

El envío se realiza mediante una función del servidor desplegada en Vercel, utilizando AWS SES.

El servidor valida el token de autenticación de Firebase, obtiene las tareas correspondientes al usuario y prepara el resumen.

**Limitación actual:** AWS SES se encuentra en modo Sandbox. Por lo tanto, los correos destinatarios deben estar verificados previamente en AWS SES. El envío fue probado exitosamente con una dirección verificada.

## Tecnologías utilizadas

**Frontend**
- React
- TypeScript
- Vite
- CSS

**Autenticación y base de datos**
- Firebase Authentication
- Cloud Firestore

**Backend y correo electrónico**
- Vercel Serverless Functions
- Firebase Admin SDK
- AWS SDK
- Amazon Simple Email Service (SES)

**Testing**
- Vitest
- React Testing Library
- jest-dom
- jsdom

**Despliegue y control de versiones**
- Vercel
- Git
- GitHub

## Instalación y ejecución local

### Requisitos previos

- Node.js y npm.
- Un proyecto de Firebase configurado.
- Variables de entorno correspondientes a Firebase y AWS para utilizar las funcionalidades que las requieren.

### Pasos

1. Clonar el repositorio:

   ```bash
   git clone https://github.com/AgustinaPedernera/MateCode-Tasks.git
   ```

2. Entrar a la carpeta:

   ```bash
   cd MateCode-Tasks
   ```

3. Instalar las dependencias:

   ```bash
   npm install
   ```

4. Configurar las variables de entorno necesarias.

5. Iniciar el servidor de desarrollo:

   ```bash
   npm run dev
   ```

6. Abrir en el navegador la dirección local indicada por Vite.

**Nota:** El frontend puede ejecutarse localmente con Vite. La función de envío de correo ubicada en `api/send-email.ts` requiere un entorno compatible con las funciones de Vercel y las credenciales del servidor.

## Variables de entorno

El proyecto utiliza variables de entorno para evitar incluir credenciales directamente en el código.

Las variables del frontend relacionadas con Firebase utilizan el prefijo `VITE_`.

La función de envío de correos requiere las siguientes variables del servidor:

```env
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
SES_FROM_EMAIL=

FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

Las credenciales privadas deben configurarse en el entorno correspondiente y nunca publicarse en GitHub.

## Tests

Se implementaron pruebas automatizadas con Vitest y React Testing Library, utilizando mocks para simular los servicios externos sin modificar información real en Firestore.

Las pruebas del Dashboard verifican:

- Visualización del formulario de creación de tareas.
- Creación de tareas.
- Cambio de estado de pendiente a completada.
- Edición de título y descripción.
- Eliminación de tareas.
- Validación de títulos vacíos.

Para ejecutar los tests:

```bash
npx vitest run
```

Para verificar la compilación de producción:

```bash
npm run build