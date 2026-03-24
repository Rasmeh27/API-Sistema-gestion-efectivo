// modules/recommendations/recommendations.llm-service.ts
//
// Wrapper para HuggingFace Inference API.
// Si mañana se cambia de proveedor (OpenAI, Anthropic, etc.),
// solo se modifica este archivo.

import { InferenceClient } from "@huggingface/inference";
import { env } from "../../src/config/env";
import { RecommendationError } from "./recommendations.errors";

export class LlmService {
  private client: InferenceClient | null = null;

  private getClient(): InferenceClient {
    if (!env.hfToken) {
      throw RecommendationError.missingToken();
    }
    if (!this.client) {
      this.client = new InferenceClient(env.hfToken);
    }
    return this.client;
  }

  /**
   * Envía un prompt al LLM y devuelve la respuesta como texto.
   */
  async complete(systemPrompt: string, userMessage: string): Promise<string> {
    try {
      const client = this.getClient();

      const response = await client.chatCompletion({
        model: env.hfModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        max_tokens: 2048,
        temperature: 0.7,
      });

      const content = response.choices?.[0]?.message?.content;

      if (!content) {
        throw RecommendationError.llmError("Respuesta vacía del modelo");
      }

      return content.trim();
    } catch (error) {
      if (error instanceof RecommendationError) throw error;

      const message = error instanceof Error ? error.message : String(error);

      if (message.includes("401") || message.includes("unauthorized")) {
        throw RecommendationError.llmError("Token de HuggingFace inválido");
      }

      if (message.includes("503") || message.includes("loading")) {
        throw RecommendationError.llmUnavailable();
      }

      throw RecommendationError.llmError(message);
    }
  }
}
