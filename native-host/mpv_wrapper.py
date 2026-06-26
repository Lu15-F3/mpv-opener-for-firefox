#!/usr/bin/env python3
import sys
import json
import struct
import subprocess
import os
import socket

IPC_SOCKET = "/tmp/mpv-socket"

def get_message():
    raw_length = sys.stdin.buffer.read(4)
    if not raw_length:
        sys.exit(0)
    message_length = struct.unpack('@I', raw_length)[0]
    message = sys.stdin.buffer.read(message_length).decode('utf-8')
    return json.loads(message)

def send_message(message):
    content = json.dumps(message).encode('utf-8')
    length = struct.pack('@I', len(content))
    sys.stdout.buffer.write(length)
    sys.stdout.buffer.write(content)
    sys.stdout.buffer.flush()

def send_to_ipc_queue(url):
    """Tenta enviar o vídeo para a fila do mpv ativo via Socket IPC."""
    if os.path.exists(IPC_SOCKET):
        try:
            client = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
            client.connect(IPC_SOCKET)
            # Comando JSON IPC do mpv para adicionar item à playlist atual (fila)
            command = {"command": ["loadfile", url, "append-play"]}
            client.sendall((json.dumps(command) + "\n").encode('utf-8'))
            client.close()
            return True
        except Exception:
            return False
    return False

def main():
    try:
        msg = get_message()
        url = msg.get("url")
        
        fullscreen = msg.get("fullscreen", False)
        pip = msg.get("pip", False)
        paused = msg.get("paused", False)
        always_on_top = msg.get("alwaysOnTop", False)
        audio_only = msg.get("audioOnly", False)
        audio_device = msg.get("audioDevice", "")
        
        aggressive_cache = msg.get("aggressiveCache", False)
        inhibit_sleep = msg.get("inhibitSleep", True)
        max_resolution = msg.get("maxResolution", "best")
        auto_subtitles = msg.get("autoSubtitles", False)

        if url:
            # --- RECURSO V5.0: GERENCIAMENTO DE FILA INTELEGENTE (IPC) ---
            # Se não for uma playlist e o mpv já estiver aberto, anexa o vídeo à fila atual
            if "list=" not in url and send_to_ipc_queue(url):
                send_message({"status": "success", "message": "Video appended to the active mpv queue."})
                return

            cmd = ["mpv"]

            # Habilita o socket IPC para permitir que futuros disparos entrem na fila
            cmd.append(f"--input-ipc-server={IPC_SOCKET}")
            
            # Plugin MPRIS do Fedora
            cmd.append("--script=/usr/lib64/mpv/mpris.so")

            # --- RECURSO V5.0: SUPORTE A PLAYLISTS REAIS ---
            # Se a URL contiver identificador de lista, força o yt-dlp a carregar a playlist inteira
            if "list=" in url:
                cmd.append("--ytdl-raw-options=yes-playlist=")
            else:
                cmd.append("--ytdl-raw-options=no-playlist=")

            if audio_only:
                cmd.append("--no-video")
                cmd.append("--force-window=no")
            else:
                if fullscreen:
                    cmd.append("--fullscreen")
                elif pip:
                    cmd.append("--autofit=30%x30%")
                    cmd.append("--geometry=100%:100%")

                if always_on_top or pip:
                    cmd.append("--ontop")

            if paused:
                cmd.append("--pause=yes")

            if audio_device:
                cmd.append(f"--audio-device={audio_device}")

            if inhibit_sleep:
                cmd.append("--stop-screensaver=yes")

            if aggressive_cache:
                cmd.append("--cache=yes")
                cmd.append("--demuxer-max-bytes=500MiB")
                cmd.append("--demuxer-max-back-bytes=100MiB")

            if not audio_only and max_resolution != "best":
                ytdl_format = f"bestvideo[height<={max_resolution}]+bestaudio/best"
                cmd.append(f"--ytdl-format={ytdl_format}")

            if auto_subtitles:
                cmd.append("--ytdl-raw-options-append=write-subs=,write-auto-subs=")
                cmd.append("--sub-auto=all")

            cmd.append(url)

            subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            send_message({"status": "success", "message": "mpv v5.0 started with active playlist/IPC queue support."})
        else:
            send_message({"status": "error", "message": "No URL provided."})
    except Exception as e:
        send_message({"status": "error", "message": str(e)})

if __name__ == "__main__":
    main()