// Prevents additional console window on Windows in release, DO NOT REMOVE!!
// #![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use tauri::{command, Window, Emitter};
use tokio::process::Command;
use tokio::io::{AsyncBufReadExt, BufReader};
use regex::Regex;

#[command]
async fn run_ytdlp(
    window: Window,
    url: String,
    output: String,
    format: String,
    quality: String,
) -> Result<String, String> {
    let mut command = Command::new("yt-dlp");
    command.arg("-o").arg(&output);
    match format.as_str() {
        "mp3" => {
            command.args(["-x", "--audio-format", "mp3"]);
        }
        "mp4" => {
            if quality != "best" && quality != "audio" {
                command.args([
                    "-f",
                    &format!(
                        "bestvideo[ext=mp4][height<={}] + bestaudio[ext=m4a]/best[ext=mp4][height<={}]",
                        quality, quality
                    ),
                    "--recode-video", "mp4"
                ]);
            } else if quality == "audio" {
                command.args(["-x", "--audio-format", "m4a"]);
            } else {
                command.args([
                    "-f",
                    "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]",
                    "--recode-video",
                    "mp4",
                ]);
            }
        }
        "webm" => {
            if quality != "best" && quality != "audio" {
                command.args([
                    "-f",
                    &format!(
                        "bestvideo[ext=webm][height<={}] + bestaudio[ext=webm]/best[ext=webm][height<={}]",
                        quality, quality
                    ),
                ]);
            } else if quality == "audio" {
                command.args(["-x", "--audio-format", "webm"]);
            } else {
                command.args([
                    "-f",
                    "bestvideo[ext=webm]+bestaudio[ext=webm]/best[ext=webm]",
                ]);
            }
        }
        "best" => {
            if quality != "best" && quality != "audio" {
                command.args([
                    "-f",
                    &format!(
                        "bestvideo[height<={}] + bestaudio/best[height<={}]",
                        quality, quality
                    ),
                ]);
            } else if quality == "audio" {
                command.args(["-x", "--audio-format", "best"]);
            } else {
                command.args(["-f", "best"]);
            }
        }
        _ => {
            command.args(["-f", &format]);
        }
    }
    command.arg(&url);
    command.stdout(std::process::Stdio::piped());

    let mut child = command.spawn().map_err(|e| e.to_string())?;
    let stdout = child.stdout.take().unwrap();
    let reader = BufReader::new(stdout);
    let mut lines = reader.lines();

    let percent_re = Regex::new(r"\[download\]\s+(\d+(?:\.\d+)?)%").unwrap();

    let mut all_log = String::new();

    while let Some(line) = lines.next_line().await.unwrap_or(None) {
        all_log.push_str(&line);
        all_log.push('\n');

        // Emit log to frontend
        let _ = window.emit("download-log", &line);

        // Detect and emit progress + status
        if let Some(caps) = percent_re.captures(&line) {
            if let Ok(percent) = caps.get(1).unwrap().as_str().parse::<f32>() {
                let _ = window.emit("download-progress", percent);
                let _ = window.emit("download-status", "downloading");
            }
        } else if line.contains("[ExtractAudio]") {
            let _ = window.emit("download-status", "extracting");
        } else if line.contains("[Merger]") || line.contains("[ffmpeg]") {
            let _ = window.emit("download-status", "merging");
        }
    }

    let status = child.wait().await.map_err(|e| e.to_string())?;
    if status.success() {
        Ok(all_log)
    } else {
        Err(all_log)
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![run_ytdlp])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
