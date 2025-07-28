# Tauri + React + Typescript

This template should help get you started developing with Tauri, React and Typescript in Vite.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

# yt-dlp Pro Downloader

A modern, cross-platform GUI app for downloading videos and audios with [yt-dlp](https://github.com/yt-dlp/yt-dlp), built with [Tauri](https://tauri.app/), React, [chadcn/ui](https://ui.shadcn.com/), and Tailwind CSS.

## Features

- 🎬 **Download videos or audios** from URLs with various format/quality (mp4, webm, mp3, best)
- ⚡ **Modern responsive UI** built with chadcn/ui and Tailwind CSS
- 🌑 **Dark/Light theme** with instant toggle (Sun/Moon icon)
- 🗂️ **Default save to Downloads folder** of current user (cross-platform)
- 📁 **Choose custom output folder** and customize output filename template
- 📈 **Show download progress and log output**
- 🖥️ Works on **Windows, macOS, and Linux** (via Tauri)

## Getting Started

### Prerequisites

- Node.js (LTS)
- [Rust](https://rustup.rs/)
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) (must be installed and accessible in PATH)
- (Recommended) [ffmpeg](https://ffmpeg.org/) in PATH

### Installation

```sh
git clone https://github.com/Eclipse-Walker/yt-downloader
cd yt-downloader
npm install
npm run tauri dev

