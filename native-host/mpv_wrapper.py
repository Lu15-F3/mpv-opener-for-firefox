#!/usr/bin/env python3
# ============================================================
# mpv_wrapper.py - MPV Opener for Firefox v7.2
# Native Messaging Host Wrapper - Versão Estável Final
# ============================================================

import glob
import json
import os
import re
import socket
import struct
import subprocess
import sys
import time

# ============================================================
# VERSION
# ============================================================
WRAPPER_VERSION = "7.0.2"
MIN_EXTENSION_VERSION = "7.0.2"

# ============================================================
# CONSTANTS
# ============================================================
IPC_SOCKET = "/tmp/mpv-socket"

# ============================================================
# DEBUG
# ============================================================
DEBUG = False

def debug_print(*args):
    if DEBUG:
        print("[DEBUG]", *args, file=sys.stderr)

# ============================================================
# Detecção de Ambiente
# ============================================================
def detect_environment():
    env = {
        "platform": "x11", 
        "vo": "x11", 
        "desktop": "unknown",
        "has_xwayland": False
    }

    if os.environ.get("WAYLAND_DISPLAY"):
        env["platform"] = "wayland"
        try:
            result = subprocess.run(
                ["which", "Xwayland"],
                capture_output=True,
                text=True,
                timeout=1
            )
            if result.returncode == 0:
                env["has_xwayland"] = True
        except:
            pass
    
    desktop = os.environ.get("XDG_CURRENT_DESKTOP", "").lower()
    if "kde" in desktop or os.environ.get("KDE_FULL_SESSION"):
        env["desktop"] = "kde"
    elif "gnome" in desktop:
        env["desktop"] = "gnome"
    elif "sway" in desktop:
        env["desktop"] = "sway"
    elif "hyprland" in desktop:
        env["desktop"] = "hyprland"

    return env

# ============================================================
# Detecção de Resolução
# ============================================================
def get_screen_resolution():
    try:
        # Tentar xrandr primeiro
        result = subprocess.run(["xrandr", "--current"], capture_output=True, text=True, timeout=2)
        if result.returncode == 0:
            for line in result.stdout.split("\n"):
                if "primary" in line or ("*" in line and "connected" in line):
                    match = re.search(r"(\d+)x(\d+)", line)
                    if match:
                        return int(match.group(1)), int(match.group(2))

        # Tentar xdpyinfo
        result = subprocess.run(["xdpyinfo"], capture_output=True, text=True, timeout=2)
        if result.returncode == 0:
            for line in result.stdout.split("\n"):
                if "dimensions:" in line:
                    dims = line.split()[1]
                    w, h = dims.split("x")
                    return int(w), int(h)

        # Tentar wlr-randr (Wayland)
        result = subprocess.run(["wlr-randr"], capture_output=True, text=True, timeout=2)
        if result.returncode == 0:
            match = re.search(r"(\d+)x(\d+)\s+px", result.stdout)
            if match:
                return int(match.group(1)), int(match.group(2))

        return 1920, 1080
    except:
        return 1920, 1080

# ============================================================
# Cálculo de Posição PiP
# ============================================================
def calculate_pip_position(screen_width, screen_height, corner, size_percent=25):
    win_w = max(int(screen_width * (size_percent / 100)), 200)
    win_h = max(int(screen_height * (size_percent / 100)), 150)

    positions = {
        "topLeft": (0, 0),
        "topRight": (screen_width - win_w, 0),
        "bottomLeft": (0, screen_height - win_h),
        "bottomRight": (screen_width - win_w, screen_height - win_h),
    }

    x, y = positions.get(corner, (0, 0))
    return win_w, win_h, x, y

# ============================================================
# Find mpris plugin
# ============================================================
def find_mpris_plugin():
    patterns = [
        "/usr/lib64/mpv/mpris.so",
        "/usr/lib/mpv/mpris.so",
        "/usr/lib/x86_64-linux-gnu/mpv/mpris.so",
        "/usr/lib/aarch64-linux-gnu/mpv/mpris.so",
        "/usr/lib64/mpv-mpris.so",
        "/usr/lib/mpv-mpris.so",
        "/usr/local/lib/mpv/mpris.so",
        "/usr/local/lib64/mpv/mpris.so",
        "/opt/mpv/lib/mpv/mpris.so",
    ]

    for pattern in patterns:
        matches = glob.glob(pattern)
        if matches:
            for match in matches:
                if os.path.isfile(match) and match.endswith(".so"):
                    return match
    return None

def find_mpv_binary():
    for path in os.environ.get("PATH", "").split(":"):
        mpv_path = os.path.join(path, "mpv")
        if os.path.isfile(mpv_path) and os.access(mpv_path, os.X_OK):
            return mpv_path
    
    common_paths = [
        "/usr/bin/mpv",
        "/usr/local/bin/mpv",
        "/opt/mpv/bin/mpv",
        "/snap/bin/mpv",
    ]
    
    for path in common_paths:
        if os.path.isfile(path) and os.access(path, os.X_OK):
            return path
    
    return "mpv"

# ============================================================
# Communication Functions
# ============================================================
def get_message():
    try:
        raw_length = sys.stdin.buffer.read(4)
        if not raw_length:
            sys.exit(0)
        
        if len(raw_length) < 4:
            sys.exit(0)
            
        message_length = struct.unpack("@I", raw_length)[0]
        
        if message_length > 10 * 1024 * 1024:
            sys.exit(0)
        
        message = sys.stdin.buffer.read(message_length)
        if not message:
            sys.exit(0)
            
        return json.loads(message.decode("utf-8"))
    except Exception as e:
        send_message({"status": "error", "message": f"Failed to parse message: {e}"})
        sys.exit(1)

def send_message(message):
    if isinstance(message, dict):
        message["wrapper_version"] = WRAPPER_VERSION
    content = json.dumps(message).encode("utf-8")
    length = struct.pack("@I", len(content))
    sys.stdout.buffer.write(length)
    sys.stdout.buffer.write(content)
    sys.stdout.buffer.flush()

# ============================================================
# IPC Functions
# ============================================================
def check_mpv_running():
    if not os.path.exists(IPC_SOCKET):
        return False
    try:
        client = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        client.settimeout(0.5)
        client.connect(IPC_SOCKET)
        client.close()
        return True
    except:
        return False

def get_mpv_status():
    if not os.path.exists(IPC_SOCKET):
        return None

    try:
        client = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        client.settimeout(1.0)
        client.connect(IPC_SOCKET)

        properties = ["pause", "time-pos", "duration", "filename", "media-title", "volume"]
        result = {}

        for prop in properties:
            command = {"command": ["get_property", prop]}
            client.sendall((json.dumps(command) + "\n").encode("utf-8"))

            response_data = b""
            while True:
                chunk = client.recv(4096)
                if not chunk:
                    break
                response_data += chunk
                if b"\n" in chunk:
                    break

            try:
                response = json.loads(response_data.decode("utf-8"))
                if "data" in response:
                    result[prop] = response["data"]
            except:
                result[prop] = None

        client.close()
        return result if result.get("duration") is not None else None
    except:
        return None

def send_player_command(command, params):
    if not os.path.exists(IPC_SOCKET):
        return False

    try:
        client = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        client.settimeout(2.0)
        client.connect(IPC_SOCKET)

        cmd = {"command": [command] + params}
        client.sendall((json.dumps(cmd) + "\n").encode("utf-8"))
        client.close()
        return True
    except:
        return False

# ============================================================
# Construção do Comando MPV - VERSÃO QUE FUNCIONOU
# ============================================================
def build_mpv_command(msg):
    url = msg.get("url")
    if not url:
        return None, {}

    env = detect_environment()
    env_vars = {}

    # Forçar XCB no Wayland
    if env["platform"] == "wayland":
        env_vars["QT_QPA_PLATFORM"] = "xcb"

    mpv_path = find_mpv_binary()
    cmd = [mpv_path]

    # ============================================================
    # DRIVER DE VÍDEO
    # ============================================================
    cmd.append("--vo=x11")

    # ============================================================
    # IPC SERVER
    # ============================================================
    cmd.append("--input-ipc-server=" + IPC_SOCKET)

    # ============================================================
    # MPRIS PLUGIN
    # ============================================================
    mpris_plugin = find_mpris_plugin()
    if mpris_plugin:
        cmd.append("--script=" + mpris_plugin)

    # ============================================================
    # PLAYLIST
    # ============================================================
    if "list=" in url:
        cmd.append("--ytdl-raw-options=yes-playlist=")
    else:
        cmd.append("--ytdl-raw-options=no-playlist=")

    # ============================================================
    # KEEP OPEN
    # ============================================================
    cmd.append("--keep-open=yes")

    # ============================================================
    # VOLUME
    # ============================================================
    initial_volume = msg.get("initialVolume", 50)
    if initial_volume is not None:
        volume = max(0, min(100, int(initial_volume)))
        if volume == 0:
            cmd.append("--mute=yes")
        else:
            cmd.append(f"--volume={volume}")
            cmd.append("--mute=no")

    # ============================================================
    # PICTURE-IN-PICTURE - CONFIGURAÇÃO QUE FUNCIONOU
    # ============================================================
    if msg.get("pip", False):
        screen_w, screen_h = get_screen_resolution()
        corner = msg.get("pipCorner", "bottomRight")
        size = msg.get("pipSize", 25)

        win_w, win_h, x, y = calculate_pip_position(screen_w, screen_h, corner, size)

        debug_print(f"Screen: {screen_w}x{screen_h}")
        debug_print(f"Window: {win_w}x{win_h}")
        debug_print(f"Position: ({x}, {y})")

        # Geometria
        cmd.append(f"--geometry={win_w}x{win_h}+{x}+{y}")
        
        # Sempre no topo
        cmd.append("--ontop")
        
        # Sem bordas
        cmd.append("--no-border")
        
        # Não minimizar
        cmd.append("--window-minimized=no")
        
        # Configurações específicas para Wayland (funcionaram)
        if env["platform"] == "wayland":
            cmd.append("--x11-netwm=no")
            cmd.append("--keepaspect-window")
            # NOTA: --wid=0 NÃO funciona no seu sistema, então removemos
            # NOTA: --force-window NÃO é necessário

    # ============================================================
    # FULLSCREEN
    # ============================================================
    elif msg.get("fullscreen", False):
        cmd.append("--fullscreen")

    # ============================================================
    # ALWAYS ON TOP
    # ============================================================
    elif msg.get("alwaysOnTop", False):
        cmd.append("--ontop")

    # ============================================================
    # PAUSED
    # ============================================================
    if msg.get("paused", False):
        cmd.append("--pause=yes")

    # ============================================================
    # AUDIO ONLY
    # ============================================================
    if msg.get("audioOnly", False):
        cmd.append("--no-video")
        cmd.append("--force-window=no")

    # ============================================================
    # AUDIO DEVICE
    # ============================================================
    audio_device = msg.get("audioDevice", "")
    if audio_device:
        cmd.append("--audio-device=" + audio_device)

    # ============================================================
    # INHIBIT SLEEP
    # ============================================================
    if msg.get("inhibitSleep", True):
        cmd.append("--stop-screensaver=yes")

    # ============================================================
    # AGGRESSIVE CACHE
    # ============================================================
    if msg.get("aggressiveCache", False):
        cmd.append("--cache=yes")
        cmd.append("--demuxer-max-bytes=500MiB")
        cmd.append("--demuxer-max-back-bytes=100MiB")

    # ============================================================
    # MAX RESOLUTION
    # ============================================================
    if not msg.get("audioOnly", False):
        max_res = msg.get("maxResolution", "best")
        if max_res != "best":
            cmd.append(f"--ytdl-format=bestvideo[height<={max_res}]+bestaudio/best")

    # ============================================================
    # SUBTITLES
    # ============================================================
    if msg.get("autoSubtitles", False):
        cmd.append("--ytdl-raw-options-append=write-subs=,write-auto-subs=")
        cmd.append("--sub-auto=all")

    # ============================================================
    # URL
    # ============================================================
    cmd.append(url)
    
    return cmd, env_vars

# ============================================================
# Execução do MPV
# ============================================================
def run_mpv(cmd, env_vars):
    try:
        env = os.environ.copy()
        env.update(env_vars)

        # Mostrar comando no stderr para debug
        print("MPV COMMAND:", " ".join(cmd), file=sys.stderr)

        subprocess.Popen(
            cmd,
            stdout=None,
            stderr=None,
            stdin=subprocess.DEVNULL,
            start_new_session=True,
            env=env,
        )
        return True
    except Exception as e:
        print(f"Erro ao executar MPV: {e}", file=sys.stderr)
        return False

# ============================================================
# Função Principal
# ============================================================
def main():
    try:
        msg = get_message()
        url = msg.get("url")

        debug_print(f"Mensagem recebida: {json.dumps(msg, indent=2)}")

        # Verificação de compatibilidade
        ext_version = msg.get("extension_version")
        if ext_version:
            try:
                ext_parts = ext_version.split(".")
                min_parts = MIN_EXTENSION_VERSION.split(".")
                ext_ver = tuple(int(p) for p in ext_parts[:3])
                min_ver = tuple(int(p) for p in min_parts[:3])
                if ext_ver < min_ver:
                    send_message({
                        "status": "incompatible",
                        "message": f"Extension v{ext_version} requires wrapper v{MIN_EXTENSION_VERSION} or newer",
                        "wrapper_version": WRAPPER_VERSION,
                        "min_extension_version": MIN_EXTENSION_VERSION,
                        "update_url": "https://github.com/Lu15-F3/mpv-opener-for-firefox/releases",
                    })
                    return
            except:
                pass

        # Ping
        if url == "":
            send_message({
                "status": "success",
                "message": "Native Host is working",
                "wrapper_version": WRAPPER_VERSION,
                "min_extension_version": MIN_EXTENSION_VERSION,
            })
            return

        # Player command
        if msg.get("command") == "player":
            command = msg.get("playerCommand")
            params = msg.get("params", [])
            if command:
                result = send_player_command(command, params)
                send_message({"status": "success" if result else "error"})
            return

        # Status
        if msg.get("command") == "status":
            status = get_mpv_status()
            if status:
                send_message({"status": "success", "data": status})
            else:
                send_message({"status": "error", "message": "MPV not running or no media"})
            return

        # Construir comando
        cmd, env_vars = build_mpv_command(msg)
        if not cmd:
            send_message({"status": "error", "message": "Failed to build command"})
            return

        # Executar
        if run_mpv(cmd, env_vars):
            time.sleep(0.5)
            send_message({"status": "success", "message": "mpv started"})
        else:
            send_message({"status": "error", "message": "Failed to start MPV"})

    except Exception as e:
        send_message({"status": "error", "message": str(e)})

if __name__ == "__main__":
    main()