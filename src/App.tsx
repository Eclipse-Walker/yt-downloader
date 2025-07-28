import { Button } from "@tauri-apps/api/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@tauri-apps/api/components/ui/card";
import { Input } from "@tauri-apps/api/components/ui/input";
import { Progress } from "@tauri-apps/api/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@tauri-apps/api/components/ui/select";
import { invoke } from "@tauri-apps/api/core";
import { open } from '@tauri-apps/plugin-dialog';
import { FolderOpen, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { downloadDir } from "@tauri-apps/api/path";
import './App.css';

import { listen } from "@tauri-apps/api/event";

const PRESETS = [
  { label: "Video (MP4 1080p)", value: "video", format: "mp4", quality: "1080" },
  { label: "Audio (MP3)", value: "audio", format: "mp3", quality: "audio" },
  { label: "Video (Best Quality)", value: "best", format: "best", quality: "best" }
];

function getSystemTheme() {
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
  return "light";
}

export default function App() {
  const [url, setUrl] = useState("");
  const [preset, setPreset] = useState(PRESETS[0].value);
  const [format, setFormat] = useState(PRESETS[0].format);
  const [quality, setQuality] = useState(PRESETS[0].quality);
  const [output, setOutput] = useState("");
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("idle");
  const [log, setLog] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const localTheme = localStorage.getItem("theme");
    const themeToSet = localTheme || getSystemTheme();
    setTheme(themeToSet);
    if (themeToSet === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  useEffect(() => {
    async function setDefaultDownloadPath() {
      const downloads = await downloadDir();
      const sep = downloads.endsWith("\\") || downloads.endsWith("/") ? "" : (downloads.includes("\\") ? "\\" : "/");
      setOutput(`${downloads}${sep}%(title)s.%(ext)s`);
    }
    setDefaultDownloadPath();
  }, []);

  function handleThemeToggle() {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }

  function handlePreset(value: string) {
    setPreset(value);
    const p = PRESETS.find(p => p.value === value);
    if (p) {
      setFormat(p.format);
      setQuality(p.quality);
    }
  }

  async function chooseFolder() {
    const selected = await open({ directory: true });
    if (selected) setOutput(`${selected}\\%(title)s.%(ext)s`);
  }

  useEffect(() => {
    let unlistenProgress: any;
    let unlistenLog: any;
    let unlistenStatus: any;

    // listen progress %
    listen("download-progress", e => {
      const percent = typeof e.payload === 'number' ? e.payload : Number(e.payload);
      setProgress(percent);
    }).then(un => { unlistenProgress = un });

    // listen log
    listen("download-log", e => {
      setLog(prev => prev + "\n" + e.payload);
    }).then(un => { unlistenLog = un });

    // listen status
    listen("download-status", e => {
      setStatus(e.payload as string);
    }).then(un => { unlistenStatus = un });

    return () => {
      if (unlistenProgress) unlistenProgress();
      if (unlistenLog) unlistenLog();
      if (unlistenStatus) unlistenStatus();
    }
  }, []);

  async function download() {
    setDownloading(true);
    setStatus("downloading");
    setLog("Preparing download...");
    setProgress(0);
    try {
      const result = await invoke("run_ytdlp", { url, output, format, quality });
      setProgress(100);
      setStatus("success");
      setLog(result as string);
    } catch (e) {
      setLog(`Error: ${e}`);
      setStatus("error");
    }
    setDownloading(false);
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-tr from-slate-100 to-slate-300 dark:from-slate-900 dark:to-slate-950 flex items-center justify-center transition-colors">
      <Card className="w-full max-w-lg rounded-2xl shadow-2xl p-4 md:p-8 bg-white/90 dark:bg-slate-900/90 backdrop-blur">
        <CardHeader className="flex flex-row justify-between items-center mb-2">
          <CardTitle className="text-2xl font-bold tracking-tight">yt-dlp Pro Downloader</CardTitle>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleThemeToggle}
            className="ml-2"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <Input
              placeholder="Paste video URL here"
              value={url}
              onChange={e => setUrl(e.target.value)}
              className="text-base"
              autoFocus
            />
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={preset} onValueChange={handlePreset}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Preset" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl">
                  {PRESETS.map(p => (
                    <SelectItem value={p.value} key={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger className="w-1/2">
                  <SelectValue placeholder="File Format" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl">
                  <SelectItem value="mp4">MP4</SelectItem>
                  <SelectItem value="mp3">MP3</SelectItem>
                  <SelectItem value="webm">WEBM</SelectItem>
                  <SelectItem value="best">Best</SelectItem>
                </SelectContent>
              </Select>
              <Select value={quality} onValueChange={setQuality}>
                <SelectTrigger className="w-1/2">
                  <SelectValue placeholder="Quality" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl">
                  <SelectItem value="best">Best</SelectItem>
                  <SelectItem value="1080">1080p</SelectItem>
                  <SelectItem value="720">720p</SelectItem>
                  <SelectItem value="480">480p</SelectItem>
                  <SelectItem value="audio">Audio Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Input
                value={output}
                onChange={e => setOutput(e.target.value)}
                placeholder="Output path (use %(title)s.%(ext)s)"
              />
              <Button type="button" variant="outline" onClick={chooseFolder} className="shrink-0">
                <FolderOpen className="w-5 h-5" />
              </Button>
            </div>
            <Button className="w-full mt-2" onClick={download} disabled={downloading || !url}>
              {downloading ? "Downloading..." : "Download"}
            </Button>

            {/* Progress, show different state */}
            {downloading && status === "downloading" && (
              <>
                <Progress value={progress} className="mt-2" />
                <div className="text-right text-xs text-gray-500">{progress.toFixed(1)}%</div>
              </>
            )}
            {downloading && status === "extracting" && (
              <div className="mt-2 text-xs text-blue-600">Extracting audio...</div>
            )}
            {downloading && status === "merging" && (
              <div className="mt-2 text-xs text-purple-600">Merging video/audio...</div>
            )}
            {status === "success" && (
              <div className="mt-2 text-xs text-green-600">Download completed!</div>
            )}
            {status === "error" && (
              <div className="mt-2 text-xs text-red-600">Download failed! Check log.</div>
            )}

            <pre className="bg-gray-100 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 p-2 mt-4 rounded-xl max-h-40 overflow-auto border border-slate-200 dark:border-slate-700 transition-colors">
              {log}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
