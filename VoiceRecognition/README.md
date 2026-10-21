---
title: Voice Ordering STT
emoji: 🎙️
colorFrom: yellow
colorTo: red
sdk: docker
app_port: 7860
pinned: false
---

# Voice Ordering – Speech to Text

Dịch vụ chuyển giọng nói tiếng Việt thành chữ cho tính năng **gọi món bằng giọng nói**.
Dùng model [`vinai/PhoWhisper-small`](https://huggingface.co/vinai/PhoWhisper-small), chạy CPU.

Đoạn front matter ở đầu file là cấu hình bắt buộc của Hugging Face Spaces; giữ nguyên khi đưa lên Space.

## API

| Method | Path | Mô tả |
|---|---|---|
| `GET` | `/` | Kiểm tra service sống |
| `POST` | `/transcribe` | multipart, trường `audio` (webm/ogg/mp4/wav, tối đa 2MB) → `{"text": "..."}` |

Lỗi: `400` thiếu file / file rỗng / không giải mã được, `413` file quá lớn, `500` lỗi model.

## Đưa lên Hugging Face Spaces (miễn phí)

1. Tạo Space mới trên huggingface.co: **SDK = Docker**, phần cứng **CPU basic (free)**.
2. Đẩy 4 file trong thư mục này (`README.md`, `Dockerfile`, `requirements.txt`, `app.py`) lên repo của Space:
   ```bash
   git clone https://huggingface.co/spaces/<user>/<space>
   cp VoiceRecognition/{README.md,Dockerfile,requirements.txt,app.py} <space>/
   cd <space> && git add . && git commit -m "Voice ordering STT" && git push
   ```
3. Chờ build xong (lần đầu ~10 phút vì tải model), mở `https://<user>-<space>.hf.space/` thấy `{"status":"ok"}`.
4. Trên Render (service backend), đặt biến `VOICE_STT_URL=https://<user>-<space>.hf.space/transcribe`.

Space miễn phí sẽ ngủ sau một thời gian không dùng; lần gọi đầu tiên sau đó mất thêm thời gian để khởi động lại.

Đổi model (ví dụ `vinai/PhoWhisper-base` cho nhanh hơn): đặt biến `ASR_MODEL` trong Settings của Space rồi build lại.

## Chạy và test ở máy

```bash
pip install -r requirements.txt
python app.py            # http://localhost:7860

pip install flask pytest
pytest                   # test không cần tải model
```
