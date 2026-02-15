import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function extractOpportunity(job:any) {

const prompt = `
Extrae la información de esta convocatoria pública.

Devuelve SOLO JSON válido.

Campos:

- title
- organism
- specialty
- position_type
- access_type (libre / concurso / oposicion)
- disability_quota (true/false)
- disability_percentage
- education_level
- application_deadline (YYYY-MM-DD si aparece)
- exam_date (YYYY-MM-DD si aparece)
- syllabus_url (si existe)
- province
- autonomous_region
- ai_score (0-100 según oficialidad)

Contenido:
${job.snippet}
${job.url}
`;

const completion = await openai.chat.completions.create({

  model: "gpt-4.1-mini",
  temperature: 0.2,

  messages: [
    {
      role: "user",
      content: prompt
    }
  ]
});

try {

  return JSON.parse(completion.choices[0].message.content!);

} catch {

  return null;
}

}
