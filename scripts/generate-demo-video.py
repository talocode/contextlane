from PIL import Image, ImageDraw, ImageFont
import os, subprocess, shutil

W, H = 1024, 640
FPS = 15
FRAME_DIR = "/tmp/ctxlane_frames"
OUTPUT_GIF = "/workspace/projects/contextlane/demo.gif"
OUTPUT_MP4 = "/workspace/projects/contextlane/demo.mp4"

shutil.rmtree(FRAME_DIR, ignore_errors=True)
os.makedirs(FRAME_DIR, exist_ok=True)

font_paths = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf",
]
FONT = None
for p in font_paths:
    if os.path.exists(p):
        FONT = ImageFont.truetype(p, 16)
        FONT_BOLD = ImageFont.truetype(p, 18)
        break
if not FONT:
    FONT = ImageFont.load_default()
    FONT_BOLD = FONT

BG = (16, 16, 35)
TEXT_COLOR = (0, 255, 100)
PROMPT_COLOR = (80, 200, 255)
CMD_COLOR = (255, 255, 255)
OUTPUT_COLOR = (200, 200, 200)
ACCENT = (255, 200, 60)
TITLE_COLOR = (255, 255, 255)

def draw_frame(lines, frame_num, total_frames):
    img = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)
    draw.rectangle([0, 0, W-1, H-1], outline=(40, 40, 80), width=2)
    draw.rectangle([2, 2, W-3, 22], fill=(30, 30, 60))
    draw.text((8, 4), "  ContextLane — Context Ingestion Pipeline", font=FONT_BOLD, fill=(150, 150, 180))
    prog = frame_num / max(total_frames - 1, 1)
    bar_w = 200
    draw.rectangle([W-bar_w-10, 6, W-10, 16], fill=(30, 30, 60))
    draw.rectangle([W-bar_w-10, 6, W-bar_w-10+int(bar_w*prog), 16], fill=(0, 200, 100))
    draw.text((W-bar_w-10+bar_w+5, 4), f"{int(prog*100)}%", font=FONT, fill=(150, 150, 180))
    y = 32
    for style, text in lines:
        if style == "title":
            draw.text((20, y), text, font=FONT_BOLD, fill=TITLE_COLOR)
            y += 28
        elif style == "prompt":
            draw.text((20, y), "$ ", font=FONT, fill=PROMPT_COLOR)
            draw.text((38, y), text, font=FONT, fill=CMD_COLOR)
            y += 22
        elif style == "output":
            draw.text((38, y), text, font=FONT, fill=OUTPUT_COLOR)
            y += 22
        elif style == "empty":
            y += 22
        elif style == "comment":
            draw.text((20, y), text, font=FONT, fill=(100, 100, 140))
            y += 22
        elif style == "accent":
            draw.text((20, y), text, font=FONT, fill=ACCENT)
            y += 22
        elif style == "header":
            draw.rectangle([10, y-2, W-10, y+20], fill=(30, 30, 60))
            draw.text((20, y), text, font=FONT_BOLD, fill=ACCENT)
            y += 28
    img.save(f"{FRAME_DIR}/frame_{frame_num:05d}.png")

scenes = []

# Title
for i in range(FPS * 3):
    scenes.append([
        ("title", "ContextLane v0.1.0"),
        ("empty", ""),
        ("accent", "  Open-source context ingestion for AI agents"),
        ("empty", ""),
        ("comment", "# Turn files, folders, URLs & repos into structured memory"),
        ("empty", ""),
        ("accent", "  npm i @talocode/contextlane"),
    ])

# Demo
demo_lines = [
    ("header", "  contextlane demo"),
    ("empty", ""),
    ("comment", "# Ingests sample text and extracts structured knowledge"),
    ("prompt", "contextlane demo"),
    ("output", "Ingesting demo content..."),
    ("output", "Run ID: ctx_mrgwqeuc_pzln"),
    ("output", "Sources: 1  |  Chunks: 1"),
    ("output", 'Summary: Sample Project Context'),
    ("output", "Facts: 8  |  Decisions: 1  |  Actions: 2  |  Entities: 2"),
    ("output", "Tags: project, context, ingestion, demonstration, authentication"),
    ("output", "Memory records: 10"),
]
for i in range(FPS * 4):
    scenes.append(demo_lines)

# Ingest
ingest_lines = [
    ("header", "  Ingest Sources"),
    ("empty", ""),
    ("comment", "# File"),
    ("prompt", "contextlane ingest ./README.md"),
    ("output", "Run ID: ctx_abc123_def456  |  Sources: 1  |  Chunks: 5"),
    ("empty", ""),
    ("comment", "# URL"),
    ("prompt", "contextlane ingest-url https://example.com"),
    ("output", "Run ID: ctx_def789_ghi012  |  Title: Example Domain  |  Chunks: 3"),
    ("empty", ""),
    ("comment", "# GitHub Repo"),
    ("prompt", "contextlane ingest-github https://github.com/talocode/gatelane"),
    ("output", "Run ID: ctx_ghi345_jkl678  |  Files: 12  |  Chunks: 45"),
]
for i in range(FPS * 5):
    scenes.append(ingest_lines)

# Extraction
extract_lines = [
    ("header", "  Extracted Knowledge"),
    ("empty", ""),
    ("output", "Facts:  The project uses TypeScript. Uses Node.js. Implements auth."),
    ("empty", ""),
    ("accent", "  Decisions"),
    ("output", "  [active] We chose JWT over sessions"),
    ("empty", ""),
    ("accent", "  Actions"),
    ("output", "  [medium] TODO: Add login page"),
    ("output", "  [high]   FIXME: Fix password hashing"),
    ("empty", ""),
    ("accent", "  Entities"),
    ("output", "  https://example.com  (url, 3 mentions)"),
    ("output", "  @talocode/contextlane  (project, 2 mentions)"),
]
for i in range(FPS * 5):
    scenes.append(extract_lines)

# Recall
recall_lines = [
    ("header", "  Recall & Search"),
    ("empty", ""),
    ("prompt", "contextlane recall \"What is this project about?\""),
    ("output", "[ctx_abc123_def456] ContextLane ingests files, folders, URLs..."),
    ("output", "  [README.md:1]"),
    ("empty", ""),
    ("prompt", "contextlane search \"JWT\""),
    ("output", "[ctx_abc123_def456] (score: 2)"),
    ("output", "  Decision: We chose JWT over sessions."),
    ("output", "  [README.md:5]"),
]
for i in range(FPS * 4):
    scenes.append(recall_lines)

# MemoryLane
mem_lines = [
    ("header", "  MemoryLane Sync"),
    ("empty", ""),
    ("prompt", "contextlane sync memorylane ctx_abc123_def456"),
    ("output", "Syncing 10 records to MemoryLane..."),
    ("output", "Saved: 10  |  Failed: 0  |  Method: http"),
    ("empty", ""),
    ("accent", "  contextlane recall \"decisions about auth\""),
    ("output", "  [Decision] We chose JWT over sessions.  (importance: 8)"),
]
for i in range(FPS * 4):
    scenes.append(mem_lines)

# Architecture
arch_lines = [
    ("header", "  Architecture"),
    ("empty", ""),
    ("accent", "  source → load → normalize → chunk → extract → cite → save"),
    ("empty", ""),
    ("output", "  4 Interfaces:"),
    ("output", "    CLI    — 15+ commands"),
    ("output", "    API    — 16 REST endpoints on port 3060"),
    ("output", "    SDK    — ContextLaneClient"),
    ("output", "    MCP    — 10 tools for AI agents"),
    ("empty", ""),
    ("comment", "# Local-first. Open-source. No API key required."),
]
for i in range(FPS * 4):
    scenes.append(arch_lines)

# Close
close_lines = [
    ("title", "  github.com/talocode/contextlane"),
    ("empty", ""),
    ("accent", "  npm i @talocode/contextlane"),
    ("empty", ""),
    ("title", "  contextlane demo"),
    ("empty", ""),
    ("comment", "# ContextLane — give your agents something worth remembering"),
]
for i in range(FPS * 3):
    scenes.append(close_lines)

total = len(scenes)
print(f"Generating {total} frames...")
import time
start = time.time()
for i, lines in enumerate(scenes):
    draw_frame(lines, i, total)
    if (i + 1) % 100 == 0:
        elapsed = time.time() - start
        fps = (i + 1) / elapsed
        print(f"  {i+1}/{total} ({fps:.1f} fps)")
elapsed = time.time() - start
print(f"Generated {total} frames in {elapsed:.1f}s")

print("Creating GIF...")
subprocess.run([
    "ffmpeg", "-y", "-framerate", str(FPS),
    "-i", f"{FRAME_DIR}/frame_%05d.png",
    "-vf", "fps=15,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer",
    "-loop", "0", OUTPUT_GIF
], capture_output=True)

print("Creating MP4...")
subprocess.run([
    "ffmpeg", "-y", "-framerate", str(FPS),
    "-i", f"{FRAME_DIR}/frame_%05d.png",
    "-c:v", "libx264", "-pix_fmt", "yuv420p",
    "-preset", "fast", "-crf", "23", OUTPUT_MP4
], capture_output=True)

size_gif = os.path.getsize(OUTPUT_GIF)
size_mp4 = os.path.getsize(OUTPUT_MP4)
print(f"Done! GIF: {size_gif/1024:.0f}KB  MP4: {size_mp4/1024:.0f}KB")
shutil.rmtree(FRAME_DIR, ignore_errors=True)
