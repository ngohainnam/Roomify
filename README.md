# Roomify 🏠

**Roomify** is an AI-powered web application that transforms 2D architectural floor plans into stunning, photorealistic orthographic 3D renders — instantly. Upload a floor plan image, let Google Gemini's vision model do the heavy lifting, and get a top-down 3D render in seconds.

---

## ✨ Features

### 🤖 AI-Powered Rendering
- Converts any 2D floor plan image into a photorealistic, top-down 3D architectural render using **Google Gemini 2.5 Flash Image** via Puter AI.
- Strictly preserves the original layout — walls, rooms, doors, and windows are reproduced with exact geometry.

### 📁 Project Management
- Each uploaded floor plan is saved as a private project tied to your Puter account.
- View, revisit, and re-render any of your past projects from the home dashboard.
- Paginated grid view for easy browsing of your project history.

### 🌍 Community Gallery
- Share your renders publicly to the community gallery with one click.
- Browse renders shared by other users for inspiration.
- Unshare at any time to make a project private again.

### 🎨 Customizable AI Settings
Fine-tune the AI render output with personal style preferences:

| Setting | Options (Presets Available) |
|---|---|
| **Design Style** | Scandinavian, Japandi, Mid-Century Modern, Industrial, Minimalist, Bohemian, Contemporary, Art Deco, Coastal, Rustic |
| **Color Palette** | Free-text description of preferred tones and materials |
| **Lighting Mood** | Bright neutral daylight, Warm golden hour, Cool overcast, Dramatic side lighting, Soft diffused, Night with artificial lighting |
| **Furniture Style** | Modern & sleek, Vintage & retro, Rustic & reclaimed wood, Luxury & high-end, Minimalist & sparse, Maximalist & eclectic |
| **Extra Instructions** | Any additional free-text prompt enhancement |

### 🖼️ Before / After Comparison
- A built-in interactive **comparison slider** lets you drag between the original 2D plan and the AI-generated 3D render side-by-side.

### 💾 Export & Download
- Download any rendered image as a PNG file directly from the visualizer.

### 🔐 Authentication via Puter
- Sign in with your free [Puter](https://puter.com) account — no separate sign-up required.
- All projects and settings are stored in your personal Puter cloud storage (KV store + hosted files).

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | [React Router v7](https://reactrouter.com/) (SSR) |
| UI | React 19, TailwindCSS v4 |
| Language | TypeScript |
| AI Model | Google Gemini 2.5 Flash Image (via Puter AI) |
| Auth & Storage | [Puter.js](https://docs.puter.com/) |
| Build Tool | Vite |
| Comparison Slider | [react-compare-slider](https://github.com/nerdyman/react-compare-slider) |
| Icons | [Lucide React](https://lucide.dev/) |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+
- A free [Puter](https://puter.com) account
- A deployed [Puter Worker](https://docs.puter.com/hosting) for image hosting

### Environment Variables

Create a `.env.local` file in the project root:

```bash
cp .env.example .env.local
```

Then fill in your values:

| Variable | Description |
|---|---|
| `VITE_PUTER_WORKER_URL` | URL of your deployed Puter worker (e.g. `https://your-worker.puter.work`) |

> **`.env.local` is git-ignored** — never commit secrets to the repository.

### Installation

```bash
npm install
```

### Development

Start the development server with HMR:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

### Production Build

```bash
npm run build
npm run start
```

---

## 📖 How to Use

### 1. Sign In
Click **Sign In** in the navbar and authenticate with your Puter account. This is required to upload and save projects.

### 2. Upload a Floor Plan
On the home page, drag and drop a floor plan image (PNG, JPG, etc.) into the upload area, or click to browse your files. The app will create a new project and take you straight to the visualizer.

### 3. Generate a 3D Render
Inside the visualizer, click **Render** (or wait for the auto-render on first load). The AI will process your floor plan and display the photorealistic 3D result alongside the original using an interactive comparison slider.

### 4. Customize the Output
Navigate to **Settings** to set your preferred design style, lighting mood, furniture style, color palette, and any extra instructions. These preferences are saved to your account and applied to every future render automatically.

### 5. Share or Export
- Click **Share** to publish your render to the community gallery.
- Click **Export** to download the rendered image as a PNG.
- Click the trash icon to permanently delete a project.

---

## 🐳 Docker

A `Dockerfile` is included for containerized deployments:

```bash
docker build -t roomify .
docker run -p 3000:3000 --env VITE_PUTER_WORKER_URL=https://your-worker.puter.work roomify
```

---

## 📄 License

This project is private. All rights reserved.

## Building for Production

Create a production build:

```bash
npm run build
```

## Deployment

### Docker Deployment

To build and run using Docker:

```bash
docker build -t my-app .

# Run the container
docker run -p 3000:3000 my-app
```

The containerized application can be deployed to any platform that supports Docker, including:

- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

### DIY Deployment

If you're familiar with deploying Node applications, the built-in app server is production-ready.

Make sure to deploy the output of `npm run build`

```
├── package.json
├── package-lock.json (or pnpm-lock.yaml, or bun.lockb)
├── build/
│   ├── client/    # Static assets
│   └── server/    # Server-side code
```

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever CSS framework you prefer.

---

Built with ❤️ using React Router.
