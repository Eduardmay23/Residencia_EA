# Especificación de Requerimientos del Sistema de Inventario

## 1. Introducción
El presente documento tiene como finalidad identificar, estructurar y documentar los requerimientos para el desarrollo de un **sistema web de inventario** para la empresa. Este sistema busca facilitar el control de productos, su ciclo de vida dentro del almacén y el registro preciso de todos sus movimientos (entradas y salidas). De esta forma, se busca proporcionar una herramienta centralizada y accesible que permita una toma de decisiones informada y optimice la gestión de recursos de la organización.

## 2. Descripción del problema
Actualmente, la gestión y el control del inventario presentan deficiencias significativas debido a los procesos empleados en la empresa.
*   **¿Cómo se controla actualmente el inventario?** El control se realiza de manera manual o a través de hojas de cálculo descentralizadas y aisladas.
*   **¿Qué problemas existen?** Existe una falta de sincronización en tiempo real sobre las existencias actuales, alta probabilidad de errores humanos al registrar los datos, dificultad para rastrear el historial de movimientos de un producto específico, y pérdida de tiempo al consolidar información de diferentes fuentes para generar reportes.
*   **¿Qué consecuencias tienen esos problemas?** Las consecuencias incluyen discrepancias entre el inventario físico y el teórico (pérdidas no detectadas o stock fantasma), interrupciones en la cadena de suministro por falta de stock (quiebres de stock), exceso de inventario obsoleto, y demoras en la toma de decisiones gerenciales debido a la falta de información rápida y confiable.

## 3. Objetivos del sistema
**Objetivo General:**
Desarrollar e implementar un sistema web de gestión de inventarios que permita automatizar, centralizar y optimizar el control de las existencias y movimientos de productos, garantizando la integridad de la información en tiempo real.

**Objetivos Específicos:**
*   Agilizar el registro de entradas y salidas de mercancía, minimizando el margen de error.
*   Proporcionar un catálogo estructurado y categorizado de todos los productos.
*   Facilitar la generación de reportes y consultas sobre el estado actual de las existencias.
*   Establecer un control de acceso basado en roles para asegurar que solo el personal autorizado pueda modificar datos críticos.
*   Mejorar la trazabilidad de cada artículo desde su ingreso hasta su salida.

## 4. Identificación de usuarios
El sistema estará diseñado para soportar los siguientes perfiles o roles de usuario, cada uno con permisos específicos:
*   **Administrador:** Tiene acceso total al sistema. Puede gestionar usuarios y permisos, crear/editar/eliminar productos y categorías, configurar parámetros globales del sistema y visualizar todos los reportes estratégicos.
*   **Encargado de inventario (Almacenista):** Su función principal es la operación diaria. Puede registrar las entradas (recepción de proveedores) y salidas (despachos), actualizar existencias físicas (ajustes de inventario) y consultar el catálogo de productos. No tiene permisos para alterar la configuración del sistema ni administrar otros usuarios.
*   **Usuario de consulta (Ej. Gerencia o Ventas):** Tiene permisos de solo lectura. Puede visualizar el catálogo de productos, verificar existencias en tiempo real y consultar reportes, pero no puede realizar modificaciones en el inventario ni en el catálogo.

## 5. Requerimientos funcionales
El sistema deberá contar con las siguientes funcionalidades principales:
*   **Inicio de sesión y autenticación:** Validación de credenciales de usuario de forma segura para permitir el acceso al sistema.
*   **Registro, edición y consulta de productos:** Módulo para la creación de nuevos ítems (con código, nombre, descripción, precio, etc.), modificación de sus detalles y visualización.
*   **Administración de categorías:** Capacidad de agrupar productos por familias o categorías para facilitar su clasificación.
*   **Registro de entradas y salidas de productos:** Interfaz dedicada para asentar los movimientos diarios del almacén, requiriendo justificación (ej. compra, merma, venta).
*   **Actualización automática de existencias:** El sistema debe calcular y mostrar el stock actual de manera automática tras cada movimiento registrado.
*   **Gestión de usuarios y permisos:** Módulo exclusivo del administrador para crear cuentas, asignar roles y revocar accesos.
*   **Generación de reportes:** Creación de informes en formatos exportables (PDF, Excel) sobre el valor del inventario, movimientos en un periodo y alertas de stock bajo.
*   **Búsqueda y filtrado de productos:** Buscador avanzado que permita localizar artículos por código, nombre, categoría o estado de existencia.

## 6. Requerimientos no funcionales
Para asegurar la calidad y correcto funcionamiento del sistema, se deben cumplir las siguientes condiciones:
*   **Seguridad de la información:** Contraseñas encriptadas, protección contra ataques comunes (como inyección SQL y XSS) y sesiones seguras.
*   **Facilidad de uso (Usabilidad):** Interfaz gráfica intuitiva, moderna y responsive, que requiera una curva de aprendizaje mínima para el personal.
*   **Rendimiento y tiempos de respuesta:** Las consultas, especialmente las búsquedas y reportes, deben ejecutarse en tiempos menores a 3 segundos bajo una carga normal.
*   **Compatibilidad con navegadores:** El sistema debe funcionar de manera óptima en las versiones recientes de Google Chrome, Mozilla Firefox, Microsoft Edge y Safari.
*   **Disponibilidad del sistema:** Debe estar disponible en todo momento durante el horario operativo de la empresa (o 24/7 si es un despliegue en la nube).
*   **Respaldo y recuperación de datos:** Se deben realizar copias de seguridad de la base de datos de manera periódica (ej. diaria) para prevenir pérdida de información crítica.

## 7. Requerimientos de información y datos
El sistema deberá almacenar y relacionar, como mínimo, las siguientes entidades de datos:
*   **Usuarios:** ID, nombre, correo electrónico, contraseña (hash), rol, estado (activo/inactivo).
*   **Categorías:** ID, nombre, descripción.
*   **Productos:** ID, código (SKU o código de barras), nombre, descripción, ID de categoría, unidad de medida, precio de costo, precio de venta, stock mínimo.
*   **Existencias:** ID del producto, cantidad actual disponible (puede estar integrado en la tabla de productos o en ubicaciones específicas).
*   **Movimientos (Entradas/Salidas):** ID del movimiento, tipo de movimiento (Entrada, Salida, Ajuste), fecha y hora, ID del usuario responsable, ID del producto, cantidad afectada, concepto u observaciones.

## 8. Requerimientos técnicos
El desarrollo e implementación del sistema se basará en el siguiente stack tecnológico:
*   **Frontend e interfaz de usuario:** Framework **Next.js** (React) y **Tailwind CSS** para un diseño moderno, dinámico y responsivo, utilizando componentes UI robustos (como **shadcn/ui**).
*   **Backend y Base de datos:** Se utilizará **Supabase** (basado en PostgreSQL) como Backend-as-a-Service (BaaS). Supabase gestionará la base de datos relacional, la autenticación de usuarios y las políticas de seguridad a nivel de fila (RLS).
*   **Servidor o servicio de alojamiento:** Plataforma en la nube (ej. Vercel) que garantice el rendimiento, la disponibilidad y soporte para entornos de Next.js.
*   **Lenguajes y herramientas:** TypeScript (para tipado estricto en el código), ESLint, Git para el control de versiones.

## 9. Alcance, limitaciones y delimitaciones
**Dentro del alcance:**
*   Control integral de existencias (entradas, salidas y ajustes).
*   Gestión completa del catálogo de productos y categorización.
*   Autenticación de usuarios y perfiles de acceso.
*   Generación de reportes de inventario básico y alertas de stock mínimo.

**Limitaciones (Restricciones del sistema):**
*   No incluirá un módulo de Punto de Venta (POS) o carrito de compras para clientes finales.
*   No generará facturación electrónica ni comprobantes fiscales.
*   No contemplará integración directa e inmediata con software contable de terceros (ERP) en esta primera fase del proyecto.
*   No se incluirá el rastreo por lotes y fechas de caducidad, a menos que se defina posteriormente.

**Delimitaciones (Fronteras del proyecto):**
*   **Usuarios:** El sistema está diseñado exclusivamente para el uso interno del personal de la empresa, no habrá portal para clientes o proveedores externos.
*   **Cobertura física:** La implementación inicial abarcará la gestión de un único almacén principal. El manejo de múltiples sucursales de forma simultánea queda fuera de esta primera versión.
*   **Plataforma:** El sistema funcionará netamente como aplicación web accesible desde navegadores (Google Chrome, Edge, Safari, etc.), por lo que no contempla el desarrollo de aplicaciones móviles nativas (iOS/Android) que requieran instalación en tiendas de apps.

## 10. Validación de requerimientos
Para garantizar que el sistema cumple con todas las necesidades del cliente y funciona de forma correcta, se realizarán las siguientes pruebas de verificación:
*   **Actualización de existencias:** Se comprobará exhaustivamente que al registrar una entrada o salida de productos, la cantidad en el inventario general se actualice matemáticamente de forma inmediata y precisa.
*   **Restricción de inventario negativo:** Se verificará que el sistema impida registrar salidas o ventas si la cantidad solicitada supera las existencias actuales, arrojando una alerta para el usuario.
*   **Control de accesos y seguridad:** Se ejecutarán pruebas de roles para asegurar que un usuario común (ej. Encargado de inventario) no pueda acceder a las configuraciones globales ni eliminar productos o usuarios (acciones exclusivas del administrador).
*   **Trazabilidad de datos:** Se confirmará que en el historial de movimientos quede registrado correctamente el usuario que realizó la operación, la fecha, hora, tipo de movimiento y el motivo justificado.
*   **Pruebas de estrés y consultas:** Se verificará que la carga inicial de los listados de inventario y la generación de reportes se realicen sin interrupciones o bloqueos, incluso cuando existan múltiples registros en la base de datos de Supabase.
