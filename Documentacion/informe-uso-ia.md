# Informe de uso de Inteligencia Artificial

## Proyecto Integrador M4 — MateCode Tasks

**Estudiante:** Agustina Pedernera  
**Institución:** Soy Henry  
**Proyecto:** MateCode Tasks

## 1. Introducción

Durante el desarrollo de MateCode Tasks utilicé ChatGPT como herramienta de acompañamiento para comprender conceptos, planificar funcionalidades, resolver errores, revisar código y preparar pruebas automatizadas.

La IA se utilizó como apoyo durante el proceso de aprendizaje y desarrollo. Las implementaciones se trabajaron en Visual Studio Code y se comprobaron mediante pruebas en el navegador, la terminal y los servicios utilizados por la aplicación.

Este informe organiza las principales consultas y decisiones por etapas. Las consultas incluidas son descripciones representativas de las conversaciones mantenidas, no transcripciones literales de todos los prompts.

## 2. Planificación y estructura del proyecto

**Consultas realizadas**

Solicité orientación para organizar una aplicación de gestión de tareas utilizando React, TypeScript, Firebase y Vercel, teniendo en cuenta los requisitos del Proyecto Integrador.

**Trabajo realizado**

Se organizó una aplicación con componentes y páginas de React, servicios para interactuar con Firebase, manejo de autenticación y una función del servidor para el envío de correos.

Se trabajó con una separación entre la interfaz de usuario, la lógica de acceso a datos y la funcionalidad del backend.

## 3. Autenticación con Firebase

**Consultas realizadas**

Se solicitó ayuda para implementar el registro, el inicio y cierre de sesión, la verificación de correo electrónico y la protección de rutas.

**Trabajo realizado**

Se implementó Firebase Authentication y se incorporaron controles para gestionar el acceso de los usuarios.

Durante las pruebas se revisó el comportamiento de la verificación de correo electrónico hasta comprobar que funcionaba correctamente.

**Aprendizaje**

Esta etapa permitió trabajar con autenticación, estados de usuario y restricciones de acceso a páginas privadas.

## 4. Gestión de tareas con Firestore

**Consultas realizadas**

Se solicitó acompañamiento para implementar las operaciones CRUD y relacionar cada tarea con el usuario autenticado.

**Trabajo realizado**

Se desarrollaron funciones para crear, consultar, actualizar y eliminar tareas utilizando Cloud Firestore.

Las tareas se organizaron dentro de colecciones correspondientes a cada usuario.

También se implementaron controles de formulario, confirmaciones de eliminación y mensajes de carga, éxito y error.

**Aprendizaje**

Se reforzó el uso de funciones asíncronas, estados de React, eventos y operaciones sobre una base de datos.

## 5. Envío de resúmenes con AWS SES

**Consultas realizadas**

Se solicitó orientación para implementar el requisito de enviar por correo electrónico un resumen de las tareas, utilizando AWS SES y evitando exponer credenciales en el frontend.

**Trabajo realizado**

Se implementó una función serverless en Vercel para procesar las solicitudes de envío.

La función valida la autenticación del usuario, obtiene sus tareas y genera un resumen para enviar mediante AWS SES.

Durante las pruebas se identificó la limitación del modo Sandbox de AWS SES, que restringe los destinatarios a direcciones verificadas.

Se realizó una prueba exitosa de recepción del resumen por correo electrónico utilizando una dirección verificada.

**Decisión técnica**

Se mantuvo AWS SES en modo Sandbox para la entrega, documentando esta limitación en lugar de solicitar acceso a producción.

## 6. Testing con Vitest

**Consultas realizadas**

Se solicitó ayuda para configurar Vitest, React Testing Library y mocks, así como para interpretar errores de TypeScript y resultados de ejecución.

**Trabajo realizado**

Se configuró el entorno de pruebas y se implementaron seis tests de componentes para el Dashboard.

Las pruebas verifican la visualización del formulario, creación, actualización de estado, edición, eliminación y validación de tareas.

También se implementó un test unitario del servicio de creación de tareas, utilizando mocks de Firebase.

Durante el proceso se corrigieron problemas relacionados con tipos de datos y valores devueltos por funciones simuladas.

**Resultado**

Se ejecutó `npx vitest run` y se obtuvo un resultado de siete tests aprobados, distribuidos en dos archivos.

## 7. Compilación y despliegue

**Consultas realizadas**

Se solicitó orientación para interpretar los resultados de compilación, utilizar Git y GitHub y publicar la aplicación en Vercel.

**Trabajo realizado**

Se ejecutó `npm run build` y se comprobó que la compilación finalizaba correctamente.

Se utilizaron comandos Git para registrar y publicar los cambios.

Durante el proceso apareció un problema de limpieza de carpetas internas de Git en un directorio sincronizado con OneDrive. Se comprobó el estado del repositorio y se verificó que los commits se habían guardado correctamente.

Finalmente, se publicaron los cambios en GitHub y se verificó el estado `Ready` del despliegue de producción en Vercel.

## 8. Documentación y seguridad

**Consultas realizadas**

Se solicitó ayuda para redactar el README, documentar las variables de entorno y preparar los archivos de entrega.

**Trabajo realizado**

Se reemplazó el README inicial de Vite por una descripción específica de MateCode Tasks.

Se creó `.env.example` con nombres de variables y valores de ejemplo, sin incluir credenciales privadas.

También se comprobó que `.env.local` estuviera excluido del seguimiento de Git mediante `.gitignore`.

## 9. Evaluación del uso de IA

ChatGPT resultó útil para dividir problemas complejos en pasos más pequeños, comprender mensajes de error y relacionar los conceptos aprendidos con su aplicación práctica.

Las respuestas de la IA no se consideraron automáticamente correctas: fue necesario ejecutar el código, comprobar los resultados y realizar correcciones cuando el comportamiento no coincidía con lo esperado.

El proceso permitió profundizar conocimientos sobre React, TypeScript, Firebase, servicios serverless, AWS SES, testing y despliegue.

## 10. Conclusión

La inteligencia artificial se utilizó como herramienta de asistencia técnica y aprendizaje durante el desarrollo de MateCode Tasks.

Su participación incluyó explicaciones, propuestas de implementación, generación y revisión de código, depuración y apoyo en la documentación.

La validación del funcionamiento se realizó mediante pruebas prácticas, tests automatizados y verificaciones del despliegue.

El proyecto final integra autenticación, persistencia de datos, gestión de tareas, envío de correos y pruebas automatizadas.