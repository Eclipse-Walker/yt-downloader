// Prevents additional console window on Windows in release, DO NOT REMOVE!!
// #![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::process::Command;

#[tauri::command]
fn run_ytdlp(
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

    let output = command.output().map_err(|e| e.to_string())?;
    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![run_ytdlp])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
