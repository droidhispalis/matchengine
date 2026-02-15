import "dotenv/config";
import { classifyJob } from "./tools/classifyJob";

async function run() {

  const text = `
Convocatoria de 42 plazas de Auxiliar Administrativo 
en la Junta de Andalucía. 
El plazo de solicitud será de 20 días hábiles.
`;

  const result = await classifyJob(text);

  console.log("RESULTADO:", result);
}

run();
