export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    // 📥 Ambil data dari frontend Blogspot
    const body = await new Promise(resolve => {
      let data = "";
      req.on("data", chunk => (data += chunk));
      req.on("end", () => resolve(JSON.parse(data)));
    });

    const { tujuan, kategori, audien, gaya, format, batasan } = body;

    // 🧠 Template prompt otomatis
    const prompt = `
[ROLE / PERAN AI]
Bertindaklah sebagai ${kategori.join(", ")} dengan pengalaman 20 tahun. 
Ambil peran yang paling relevan dari kategori di atas dan tulis dengan gaya profesional.

[OBJECTIVE]
${tujuan}

[INSTRUKSI LANGKAH-LANGKAH]
1. Tentukan dan tulis peran AI secara eksplisit di awal prompt (contoh: “Bertindaklah sebagai ...”).
2. Kembangkan objective menjadi instruksi langkah-langkah teknis atau kreatif yang jelas.
3. Gunakan gaya jawaban: ${gaya || "(bebas)"}.
4. Gunakan format output: ${format || "(bebas)"}.
5. Sesuaikan bahasa dengan target audiens: ${audien || "(umum)"}.
6. Buat prompt akhir yang siap dipakai user untuk menghasilkan hasil terbaik.

[FORMAT OUTPUT]
Tuliskan struktur output dengan rapi, jelas, dan profesional.
Sertakan elemen yang relevan (misalnya: outline, daftar isi, poin-poin, instruksi teknis, atau struktur lengkap sesuai kategori).

[KRITERIA EVALUASI HASIL]
- Struktur logis dan progresif.
- Bahasa komunikatif dan mudah dipahami.
- Setiap bagian punya nilai praktis.
- Tidak boleh generik atau mengulang.
- Sesuai batasan di bawah ini.

[BATASAN]
${batasan || "(tidak ada batasan tambahan)"}
`;

    // ⚡ Kirim ke OpenAI
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // 🪙 pakai model termurah dan stabil
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1000
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Gagal memproses.");

    res.status(200).json({
      ok: true,
      result: data.choices[0].message.content
    });

  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
}

