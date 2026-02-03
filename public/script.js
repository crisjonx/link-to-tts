const btn = document.getElementById("go");
const input = document.getElementById("url");
const audio = document.getElementById("audio");
const dl = document.getElementById("dl");

btn.onclick = async () => {
  btn.disabled = true;
  btn.textContent = "Working...";

  const res = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: input.value })
  });

  if (!res.ok) {
    alert("Failed to convert page.");
    btn.disabled = false;
    btn.textContent = "Convert";
    return;
  }

  const blob = await res.blob();
  const audioURL = URL.createObjectURL(blob);

  audio.src = audioURL;
  audio.hidden = false;
  audio.play();

  dl.href = audioURL;
  dl.download = "article.mp3";
  dl.hidden = false;

  btn.disabled = false;
  btn.textContent = "Convert";
};
