# rent-tools-web 🛠️

Plataforma orientada a la gestión de inventario y administración desde el navegador.

## 📝 Descripción
Interfaz web reactiva diseñada para que los **Dueños** publiquen sus activos técnicos y los **Administradores** supervisen las transacciones y disputas legales. El proyecto está enfocado en la usabilidad y la transparencia del mercado de alquileres en Panamá.

---

## 🚀 Tecnologías Utilizadas
*   **Framework:** React.js
*   **Estilos:** CSS3 / Tailwind (según diseño de UI/UX)
*   **Consumo de API:** Axios para comunicación con `rent-tools-back`

---

## 🛠️ Cómo Ejecutar el Proyecto
Sigue estos pasos para levantar el entorno de desarrollo local:

1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/DiegoT21/rent-tools-web.git
    cd rent-tools-web
    ```
2.  **Instalar dependencias:**
    ```bash
    npm install
    ```
3.  **Configurar variables de entorno:**
    ```bash
    cp .env.example .env
    ```
    Para usar el backend en **Railway** (recomendado para el equipo):
    ```env
    VITE_API_URL=https://rent-tools-back-production.up.railway.app/api
    ```
    Ver guía completa: [docs/CONEXION-RAILWAY.md](docs/CONEXION-RAILWAY.md)
4.  **Iniciar la aplicación:**
    ```bash
    npm run dev
    ```
    Abre `http://localhost:5173`

---

## ☁️ Conexión a Railway

El backend y MongoDB están en Railway. La web solo necesita `VITE_API_URL` en `.env`.

- **API:** `https://rent-tools-back-production.up.railway.app/api`
- **Documentación:** [docs/CONEXION-RAILWAY.md](docs/CONEXION-RAILWAY.md)


## 👥 Integrantes (Grupo 1GS141)
*   Samir Caballero
*   Laura Saucedo
*   Orianis Castro
*   Diego Torres
*   Javier Valdés

---

## 📊 Estado Actual
**Fase de Desarrollo:**
*   Diseño y desarrollo de interfaces.
*   Maquetación de perfiles multi-rol.
*   Dashboard de inventario.
