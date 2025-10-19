export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    // Ambil data dari front-end
    const body = await new Promise(resolve => {
      let data = "";
      req.on("data", chunk => (data += chunk));
      req.on("end", () => resolve(JSON.parse(data)));
    });

    const { tujuan, kategori, audien, gaya, format, batasan } = body;

    // Buat prompt induk lebih kuat & tajam
    const prompt = `
Anda adalah **Prompt Engineer profesional dengan pengalaman 20 tahun**, ahli dalam menyusun prompt AI berkualitas tinggi.

Tugas Anda adalah membuat SATU prompt akhir yang siap dipakai oleh AI lain, dengan:
- Role AI yang jelas & kuat di awal
- Objective dan instruksi terstruktur
- Gaya bahasa sesuai audiens
- Format output yang ketat & konsisten

🧭 Kategori: ${kategori.join(", ")}
🎯 Tujuan: ${tujuan}
👥 Target Audiens: ${audien || "-"}
✨ Gaya Jawaban: ${gaya || "-"}
🧾 Format Output: ${format || "-"}
⚡ Batasan/Aturan: ${batasan || "-"}

📌 Instruksi:
1. Tentukan role AI yang paling relevan berdasarkan kategori dan tujuan, lalu TULIS role tersebut di awal prompt final. Buat deskriptif (contoh: “Bertindaklah sebagai Penulis Skrip Kreatif profesional…”).
2. Buat objective yang jelas & tajam sesuai tujuan pengguna.
3. Buat instruksi langkah demi langkah agar AI dapat menghasilkan output optimal.
4. Sertakan gaya bahasa, audiens, dan format output sesuai input.
5. Tambahkan batasan jika ada.
6. Buat prompt final dalam bahasa Indonesia.
7. ❌ Jangan sertakan catatan atau penjelasan tambahan. Hanya prompt final.

🧠 Berpikir langkah demi langkah, lalu berikan jawaban akhir dalam struktur berikut:

========================
[ROLE AI]

[OBJECTIVE & INSTRUKSI UTAMA]

[FORMAT OUTPUT & BATASAN]
========================
`;

    async function callOpenAI(modelName) {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: modelName,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 800
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "Gagal pada model " + modelName);
      return data.choices[0].message.content;
    }

    let hasil;
    try {
      hasil = await callOpenAI("gpt-4o-mini"); // 🟢 model utama hemat
    } catch (e) {
      console.warn("⚠️ gpt-4o-mini gagal, fallback ke gpt-3.5-turbo:", e.message);
      hasil = await callOpenAI("gpt-3.5-turbo"); // 🟡 model cadangan
    }

    res.status(200).json({ ok: true, result: hasil });

  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
}
