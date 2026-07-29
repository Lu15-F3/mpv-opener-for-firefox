#!/usr/bin/env python3
# ============================================================
# mpv_wrapper.py - MPV Opener for Firefox v7.0
# Native Messaging Host Wrapper with Queue Support
# ============================================================

import sys
import json
import struct
import subprocess
import os
import socket
import time
import threading

# ============================================================
# Constants
# ============================================================
IPC_SOCKET = "/tmp/mpv-socket"
QUEUE_CHECK_INTERVAL = 2.0
mpv_process = None

# ============================================================
# Communication Functions
# ============================================================
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

# ============================================================
# IPC Functions
# ============================================================
def send_to_ipc_queue(url, play_immediately=False):
    """Send URL to mpv queue via IPC socket"""
    if not os.path.exists(IPC_SOCKET):
        return False
    
    try:
        client = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        client.settimeout(2.0)
        client.connect(IPC_SOCKET)
        
        if play_immediately:
            command = {"command": ["loadfile", url, "replace"]}
        else:
            command = {"command": ["loadfile", url, "append"]}
        
        client.sendall((json.dumps(command) + "\n").encode('utf-8'))
        client.close()
        return True
    except Exception as e:
        print("IPC error: " + str(e), file=sys.stderr)
        return False

def check_mpv_running():
    """Check if mpv is running via IPC"""
    if not os.path.exists(IPC_SOCKET):
        return False
    
    try:
        client = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        client.settimeout(0.5)
        client.connect(IPC_SOCKET)
        client.close()
        return True
    except Exception:
        return False

def get_mpv_status():
    """Get current mpv status via IPC"""
    if not os.path.exists(IPC_SOCKET):
        return None
    
    try:
        client = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        client.settimeout(1.0)
        client.connect(IPC_SOCKET)
        
        # Propriedades a serem consultadas
        properties = [
            "pause",
            "time-pos",
            "duration",
            "filename",
            "media-title",
            "volume"
        ]
        
        result = {}
        
        for prop in properties:
            command = {"command": ["get_property", prop]}
            client.sendall((json.dumps(command) + "\n").encode('utf-8'))
            
            # Ler a resposta com segurança (tratando fragmentação de buffer e quebra de linha)
            response_data = b""
            while True:
                chunk = client.recv(4096)
                if not chunk:
                    break
                response_data += chunk
                if b"\n" in chunk:
                    break
            
            try:
                response = json.loads(response_data.decode('utf-8'))
                if "data" in response:
                    result[prop] = response["data"]
                elif "error" in response:
                    result[prop] = None
            except:
                result[prop] = None
        
        client.close()
        
        # Verificar se pelo menos obtivemos algumas propriedades válidas
        if result.get("duration") is not None and result.get("duration") > 0:
            return result
        
        # Se não tiver duração, mas estiver rodando, retorna status parcial
        if result.get("pause") is not None:
            return result
            
        return None
        
    except Exception as e:
        print("Status error: " + str(e), file=sys.stderr)
        return None

def send_player_command(command, params):
    """Send a command to mpv via IPC"""
    if not os.path.exists(IPC_SOCKET):
        return False
    
    try:
        client = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        client.settimeout(2.0)
        client.connect(IPC_SOCKET)
        
        cmd = {"command": [command] + params}
        client.sendall((json.dumps(cmd) + "\n").encode('utf-8'))
        client.close()
        return True
    except Exception:
        return False

# ============================================================
# Build mpv Command
# ============================================================
def build_mpv_command(msg):
    url = msg.get("url")
    if not url:
        return None
    
    cmd = ["mpv"]
    
    # IPC server
    cmd.append("--input-ipc-server=" + IPC_SOCKET)
    
    # MPRIS plugin
    if os.path.exists("/usr/lib64/mpv/mpris.so"):
        cmd.append("--script=/usr/lib64/mpv/mpris.so")
    elif os.path.exists("/usr/lib/mpv/mpris.so"):
        cmd.append("--script=/usr/lib/mpv/mpris.so")
    
    # Playlist support
    if "list=" in url:
        cmd.append("--ytdl-raw-options=yes-playlist=")
    else:
        cmd.append("--ytdl-raw-options=no-playlist=")
    
    cmd.append("--keep-open=yes")
    
    # Audio only
    if msg.get("audioOnly", False):
        cmd.append("--no-video")
        cmd.append("--force-window=no")
    else:
        # Display mode
        if msg.get("fullscreen", False):
            cmd.append("--fullscreen")
        elif msg.get("pip", False):
            cmd.append("--autofit=30%x30%")
            cmd.append("--geometry=100%:100%")
        
        # Always on top
        if msg.get("alwaysOnTop", False) or msg.get("pip", False):
            cmd.append("--ontop")
    
    # Paused
    if msg.get("paused", False):
        cmd.append("--pause=yes")
    
    # Audio device
    audio_device = msg.get("audioDevice", "")
    if audio_device:
        cmd.append("--audio-device=" + audio_device)
    
    # Inhibit sleep
    if msg.get("inhibitSleep", True):
        cmd.append("--stop-screensaver=yes")
    
    # Aggressive cache
    if msg.get("aggressiveCache", False):
        cmd.append("--cache=yes")
        cmd.append("--demuxer-max-bytes=500MiB")
        cmd.append("--demuxer-max-back-bytes=100MiB")
    
    # Max resolution
    if not msg.get("audioOnly", False):
        max_res = msg.get("maxResolution", "best")
        if max_res != "best":
            ytdl_format = "bestvideo[height<=" + max_res + "]+bestaudio/best"
            cmd.append("--ytdl-format=" + ytdl_format)
    
    # Subtitles
    if msg.get("autoSubtitles", False):
        cmd.append("--ytdl-raw-options-append=write-subs=,write-auto-subs=")
        cmd.append("--sub-auto=all")
    
    cmd.append(url)
    return cmd

# ============================================================
# Main
# ============================================================
def main():
    global mpv_process
    
    try:
        msg = get_message()
        url = msg.get("url")
        
        # Status check
        if url == "":
            send_message({"status": "success", "message": "Native Host is working"})
            return
        
        # Player command
        if msg.get("command") == "player":
            command = msg.get("playerCommand")
            params = msg.get("params", [])
            if command:
                result = send_player_command(command, params)
                send_message({"status": "success" if result else "error"})
            return
        
        # Status request
        if msg.get("command") == "status":
            status = get_mpv_status()
            if status:
                send_message({"status": "success", "data": status})
            else:
                send_message({"status": "error", "message": "MPV not running or no media"})
            return
        
        # Video playback
        from_queue = msg.get("fromQueue", False)
        mpv_running = check_mpv_running()
        
        # If mpv is running and this is from queue, append to queue
        if mpv_running and from_queue:
            if send_to_ipc_queue(url, play_immediately=False):
                send_message({
                    "status": "success",
                    "message": "Video added to mpv queue"
                })
                return
        
        # Build and start mpv command
        cmd = build_mpv_command(msg)
        if not cmd:
            send_message({"status": "error", "message": "Failed to build command"})
            return
        
        print("Starting mpv: " + " ".join(cmd), file=sys.stderr)
        
        subprocess.Popen(
            cmd,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            stdin=subprocess.DEVNULL,
            start_new_session=True
        )
        
        time.sleep(0.5)
        
        send_message({
            "status": "success",
            "message": "mpv started with queue support"
        })
        
    except Exception as e:
        send_message({"status": "error", "message": str(e)})
        print("Error: " + str(e), file=sys.stderr)

if __name__ == "__main__":
    main()