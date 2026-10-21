import io

import pytest

import app as voice


@pytest.fixture
def client(monkeypatch):
    calls = []

    def fake_transcribe(path):
        calls.append(path)
        return "cho hai phở tái"

    monkeypatch.setattr(voice, "transcribe_file", fake_transcribe)
    voice.app.config["TESTING"] = True
    with voice.app.test_client() as c:
        c.calls = calls
        yield c


def post_audio(client, data, filename="voice.webm"):
    return client.post("/transcribe", data={"audio": (io.BytesIO(data), filename)},
                       content_type="multipart/form-data")


def test_health(client):
    assert client.get("/").get_json()["status"] == "ok"


def test_transcribe_returns_text_and_keeps_extension(client):
    res = post_audio(client, b"\x1a\x45\xdf\xa3", "clip.mp4")
    assert res.status_code == 200
    assert res.get_json() == {"text": "cho hai phở tái"}
    assert client.calls[0].endswith(".mp4")


def test_missing_audio_is_400(client):
    assert client.post("/transcribe", data={}, content_type="multipart/form-data").status_code == 400


def test_empty_audio_is_400(client):
    assert post_audio(client, b"").status_code == 400


def test_oversized_audio_is_413(client):
    assert post_audio(client, b"0" * (voice.MAX_AUDIO_BYTES + 1)).status_code == 413


def test_undecodable_audio_is_400(client, monkeypatch):
    def broken(path):
        raise ValueError("Soundfile is either not in the correct format or is malformed")

    monkeypatch.setattr(voice, "transcribe_file", broken)
    assert post_audio(client, b"garbage").status_code == 400
