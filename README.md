# Pathverse AR Navigation 🚀

Pathverse AR is a cutting-edge indoor navigation system built with **React Native**, **Expo**, and **Viro AR**. Designed for campus environments, it provides real-time AR guidance using spatial nodes and the A* pathfinding algorithm.

## ✨ Features

- **Augmented Reality Guidance**: High-density neon green arrows ("runway" style) laid perfectly on the floor to guide users.
- **Dynamic Pathfinding**: Uses the **A* Algorithm** to calculate the shortest path between any two campus nodes.
- **Fail-safe Navigation**: Implements a straight-line fallback to ensure AR markers are always visible even if the graph connectivity is interrupted.
- **Modern Glassmorphism UI**: A premium, translucent interface for destination selection and navigation progress.
- **Real-time Proximity Tracking**: Live distance countdown (in meters) and automated "Destination Reached" summary modals.
- **Local Persistence**: Powered by **SQLite** for storing complex node/edge relationships and room data.
- **Silent Re-localization**: Background OCR scanning for ambient room sign recognition to keep the AR session perfectly anchored.

## 🛠 Tech Stack

- **Framework**: React Native / Expo
- **AR Engine**: @reactvision/react-viro
- **Database**: expo-sqlite
- **OCR**: @react-native-ml-kit/text-recognition
- **Icons**: Ionicons (Expo Vector Icons)

## 🏗 Architecture

The system operates on a **Spatial Node Graph**:
1.  **Nodes**: Represent physical locations (Rooms, Lifts, Entrances) with (X, Y, Z) coordinates.
2.  **Edges**: Define the walkable connections and distances between nodes.
3.  **Engine**: The app anchors the AR world to a known node (via manual selection or OCR) and renders the interpolated path segments.

## 🚀 Getting Started

1.  **Install Dependencies**:
    ```bash
    npm install
    ```
2.  **Run Development Server**:
    ```bash
    npx expo start
    ```
3.  **Open on Android/iOS**: Best experienced on physical devices supporting ARCore/ARKit.

## 📽 Demo Path
The current build is calibrated for an **Evaluator Demo**:
- **Source**: IT Main Gate
- **Waypoint**: The Lift (12.5m forward)
- **Destination**: IT Lab 1 (6.5m left turn)

---
Developed with ❤️ for the Pathverse AR project.
