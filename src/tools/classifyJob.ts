import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function classifyJob(text: string) {

  const response = await openai.responses.create({
    model: "gpt-4.1-mini",
    input: `
Eres un clasificador extremadamente estricto.

Responde SOLO "SI" o "NO".

Marca "SI" únicamente si el texto parece describir una convocatoria REAL de empleo público 
(oposiciones, proceso selectivo, plazas disponibles, turno libre, acceso a función pública),
aunque el plazo no sea visible en el fragmento.

Marca "NO" si es:

- histórico
- boletín informativo
- noticias
- ayudas o subvenciones
- páginas informativas
- preguntas frecuentes
- documentación sin proceso selectivo claro
- temarios sin convocatoria
- bolsas genéricas sin apertura

Texto:
${text}
`


  });

  return response.output_text.trim();
}
