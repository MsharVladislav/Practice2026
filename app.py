import uuid
import shutil
from pathlib import Path
from fastapi import FastAPI, File, UploadFile, HTTPException, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import uvicorn

from audio_processor import analyze_audio_file

app = FastAPI(
    title="Audio Visualizer",
    description="API для анализа и визуализации аудиоданных",
    version="1.0.0",
)

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
TEMPLATES_DIR = BASE_DIR / "templates"
UPLOAD_DIR = STATIC_DIR / "uploads"

STATIC_DIR.mkdir(parents=True, exist_ok=True)
(STATIC_DIR / "css").mkdir(parents=True, exist_ok=True)
(STATIC_DIR / "js").mkdir(parents=True, exist_ok=True)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
TEMPLATES_DIR.mkdir(parents=True, exist_ok=True)

app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

templates = Jinja2Templates(directory=str(TEMPLATES_DIR))

ALLOWED_EXTENSIONS = {".wav", ".mp3", ".ogg", ".flac"}


def is_allowed_file(filename: str) -> bool:
    ext = Path(filename).suffix.lower()
    return ext in ALLOWED_EXTENSIONS


@app.get("/", response_class=HTMLResponse)
async def serve_frontend(request: Request):
    return templates.TemplateResponse(request=request, name="index.html")


@app.post("/api/upload")
async def upload_and_analyze(file: UploadFile = File(...)):
    if not is_allowed_file(file.filename):
        raise HTTPException(
            status_code=400,
            detail=f"Неподдерживаемый формат. Разрешены: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    file_ext = Path(file.filename).suffix.lower()
    unique_filename = f"{uuid.uuid4().hex}{file_ext}"
    file_path = UPLOAD_DIR / unique_filename

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Ошибка при сохранении файла: {str(e)}"
        )
    finally:
        file.file.close()

    try:
        result_data = analyze_audio_file(str(file_path))

        return JSONResponse(content=result_data)

    except Exception as e:
        if file_path.exists():
            file_path.unlink()
        raise HTTPException(
            status_code=500, detail=f"Ошибка при анализе аудио: {str(e)}"
        )


if __name__ == "__main__":
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
