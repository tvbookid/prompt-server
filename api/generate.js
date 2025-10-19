export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    // 🔹 Baca body request
    const body = await new Promise(resolve => {
      let data = "";
      req.on("data", chunk => (data += chunk));
      req.on("end", () => resolve(JSON.parse(data)));
    });

    const { tujuan, kategori, audien, gaya, format, batasan } = body;

    const prompt = `
Bertindaklah sebagai Prompt Engineer profesional.
Kategori: ${kategori.join(", ")}
Tujuan: ${tujuan}
Audien: ${audien}
Gaya: ${gaya}
Format: ${format}
Batasan: ${batasan}
Tulis satu prompt final paling efektif.
`;

    // ⚡ Fungsi helper untuk kirim request ke OpenAI
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

    let hasil;
    try {
      // ✅ Coba pakai model paling murah dulu
      hasil = await callOpenAI("gpt-4o-mini");
    } catch (e) {
      console.warn("⚠️ gpt-4o-mini gagal, fallback ke gpt-3.5-turbo:", e.message);
      // 🔁 Kalau error, coba model cadangan
      hasil = await callOpenAI("gpt-3.5-turbo");
    }

    res.status(200).json({ ok: true, result: hasil });

  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
}

