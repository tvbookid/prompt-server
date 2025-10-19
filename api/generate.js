export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const body = await new Promise(resolve => {
      let data = "";
      req.on("data", chunk => data += chunk);
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

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 600
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Gagal");

    res.status(200).json({
      ok: true,
      result: data.choices[0].message.content
    });

  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
}
