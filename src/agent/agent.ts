import OpenAI from "openai";
import { getWeather } from "../tools/weather.js";
import "dotenv/config";

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function runAgent(userInput: string) {

    const first = await client.responses.create({
        model: "gpt-4.1-mini",
        input: userInput,
        tool_choice: { type: "function", name: "getWeather" },

        tools: [
            {
                type: "function",
                name: "getWeather",
                description: "Get the weather for a city",
                parameters: {
                    type: "object",
                    properties: {
                        city: {
                            type: "string",
                            description: "Name of the city"
                        }
                    },
                    required: ["city"]
                }
            }
        ]
    });
    console.log("FIRST RESPONSE:");
    console.dir(first, { depth: null });


    // buscar tool call
    const toolCall = first.output.find(o => o.type === "function_call");


    if (!toolCall) {
        return first.output_text ?? "No response.";
    }

    const args = JSON.parse(toolCall.arguments);

    const result = await getWeather(args.city);

    const second = await client.responses.create({
        model: "gpt-4.1-mini",
        previous_response_id: first.id,
        input: [
            {
                type: "function_call_output",
                call_id: toolCall.call_id,
                output: JSON.stringify(result)
            }
        ]
    });


    return second.output_text ?? "No final response.";
}
