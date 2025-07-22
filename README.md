# 🧱 Minecraft Block Renderer

A dynamic web-based Minecraft block renderer that replicates how blocks look in the in-game inventory.  
Built with **React** and **React Three Fiber**, it allows you to load official Minecraft assets from a remote server, render them interactively, and export them as isometric images (individually or spritemap).

## 🚀 Features

### **Remote Asset Fetching**

- Downloads block models (`.json`) and item textures (`.png`) dynamically from a [configurable server](https://github.com/KimBlazter/minecraft-assets-server).
- Easy to update assets without rebuilding the app.

### **Dynamic Model Rendering**

- Uses [React Three Fiber](https://github.com/pmndrs/react-three-fiber) to render Minecraft `.json` models in a real-time 3D canvas.
- Renders blocks exactly as they appear in the game inventory, with correct lighting and materials.

### **Animated Textures Support**

- Handles animated item/block textures using frame-based rendering logic (if your assets include `.mcmeta` animation definitions).
- **⚠️ IT DOESN'T EXPORT ANIMATED TEXTURE YET**

### **Flexible Export System**

- Export each block as an **isometric PNG** (just like in Minecraft).
- Export all blocks and items as a **single spritemap** with a JSON metadata file for easy game dev integration.

---

## 📦 Getting Started

### **0. 🛠️ Setup assets server**

Instructions can be found [here](https://github.com/KimBlazter/minecraft-assets-server)

### **1. Clone the repository**

```bash
git clone https://github.com/KimBlazter/minecraft-block-renderer
```

### **2. Install depedencies**

```bash
pnpm install     # or: npm install
```

### **3. Run the web application**

```bash
pnpm dev    # or: npm run dev
```
