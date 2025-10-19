export default async function handler(req, res) {
  // 🛡️ Izinkan akses dari Blogspot
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    // 📥 Ambil body request dari front-end
    const body = await new Promise(resolve => {
      let data = "";
      req.on("data", chunk => (data += chunk));
      req.on("end", () => resolve(JSON.parse(data)));
    });

    const { tujuan, kategori, audien, gaya, format, batasan } = body;

    // 🧠 Buat prompt induk untuk AI
    const prompt = `
Bertindaklah sebagai **Prompt Engineer profesional dengan pengalaman 20 tahun**.
Tugasmu adalah membuat SATU prompt AI final yang siap dipakai, dengan menyebutkan role AI yang paling relevan di awal prompt.

Berikut detail dari pengguna:
🧭 Kategori: ${kategori.join(", ")}
🎯 Tujuan: ${tujuan}
👥 Audien: ${audien || "-"}
✨ Gaya Jawaban: ${gaya || "-"}
🧾 Format Output: ${format || "-"}
⚡ Batasan/Aturan: ${batasan || "-"}

Instruksi untuk AI:
1. Tentukan peran AI yang paling relevan berdasarkan kategori dan tujuan (misalnya: “Bertindaklah sebagai ahli marketing digital…”).
2. Tulis peran tersebut di awal prompt final.
3. Buat objective dan instruksi langkah-langkah dengan sangat jelas.
4. Sertakan gaya jawaban dan format output sesuai pilihan pengguna.
5. Gunakan batasan/aturan jika ada.
6. Keluarkan HANYA 1 prompt final siap pakai — dalam bahasa Indonesia.
`;

    // 🚀 Kirim ke OpenAI pakai model hemat
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
          max_tokens: 600
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "Gagal pada model " + modelName);
      return data.choices[0].message.content;
    }

    // ✨ Pakai model utama (gpt-4o-mini), fallback ke gpt-3.5-turbo kalau error
    let hasil;
    try {
      hasil = await callOpenAI("gpt-4o-mini");
    } catch (e) {
      console.warn("⚠️ gpt-4o-mini gagal, fallback ke gpt-3.5-turbo:", e.message);
      hasil = await callOpenAI("gpt-3.5-turbo");
    }

    // 📤 Kirim hasil ke front-end
    res.status(200).json({
      ok: true,
      result: hasil
    });

  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
}
