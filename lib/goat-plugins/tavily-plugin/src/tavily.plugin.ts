import { PluginBase, WalletClientBase, createTool } from "@goat-sdk/core";
import { Chain } from "@goat-sdk/core";
import { z } from "zod";

export class TavilyPlugin extends PluginBase<WalletClientBase> {
  private apiKey: string;
  private baseUrl: string = "https://api.tavily.com";

  constructor(apiKey: string) {
    super("tavily", []);
    this.apiKey = apiKey;
  }

  supportsChain = (chain: Chain) => true;

  private async makeApiRequest(
    endpoint: string,
    body: any,
    timeout: number = 30000
  ): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`, 
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === "AbortError") {
        throw new Error("Request timed out after 30 seconds");
      }

      throw error;
    }
  }

  getTools(walletClient: WalletClientBase) {
    return [
      createTool(
        {
          name: "tavily_search",
          description:
            "Search the web for real-time information using Tavily's search API. Gets current news, facts, and web content.",
          parameters: z.object({
            query: z.string().describe("The search query to execute"),
            topic: z
              .enum(["general", "news"])
              .optional()
              .default("general")
              .describe("Search category - general or news"),
            searchDepth: z
              .enum(["basic", "advanced"])
              .optional()
              .default("basic")
              .describe(
                "Search depth - basic (1 credit) or advanced (2 credits)"
              ),
            chunksPerSource: z
              .number()
              .min(1)
              .max(3)
              .optional()
              .default(3)
              .describe("Number of content chunks per source (advanced only)"),
            maxResults: z
              .number()
              .min(0)
              .max(20)
              .optional()
              .default(5)
              .describe("Maximum number of search results"),
            includeAnswer: z
              .boolean()
              .optional()
              .default(true)
              .describe("Include AI-generated answer"),
            includeRawContent: z
              .string()
              .optional()
              .default("markdown")
              .describe("Include raw HTML content"),
            includeImages: z
              .boolean()
              .optional()
              .default(false)
              .describe("Include related images"),
          }),
        },
        async (parameters) => {
          if (!this.apiKey || !this.apiKey.startsWith("tvly-")) {
            return {
              success: false,
              error: "Tavily API Key is not configured correctly.",
              fallbackMessage:
                "Web search is not available due to API configuration issues.",
            };
          }

          try {
            console.log(`Tavily API: Searching for "${parameters.query}"`);

            
            const requestBody = {
              query: parameters.query,
              topic: parameters.topic,
              search_depth: parameters.searchDepth,
              chunks_per_source: parameters.chunksPerSource,
              max_results: parameters.maxResults,
              include_answer: parameters.includeAnswer,
              include_raw_content: parameters.includeRawContent,
              include_images: parameters.includeImages,
              country: null,
            };

            const response = await this.makeApiRequest("/search", requestBody);

            console.log(
              `Tavily API: Search completed in ${response.response_time}s`
            );

            return {
              success: true,
              query: response.query,
              answer: response.answer || "No direct answer found.",
              results: response.results || [],
              images: response.images || [],
              responseTime: response.response_time,
              summary: `Found ${response.results?.length || 0} results for "${
                parameters.query
              }" in ${response.response_time}s`,
            };
          } catch (error: any) {
            console.error("Tavily API search failed:", error);

            let errorMessage = "Web search service is currently unavailable.";
            if (error.message.includes("401")) {
              errorMessage = "Invalid API key.";
            } else if (error.message.includes("429")) {
              errorMessage = "Rate limit exceeded.";
            } else if (error.message.includes("500")) {
              errorMessage = "Tavily server error.";
            }

            return {
              success: false,
              error: errorMessage,
              details: error.message,
              query: parameters.query,
              fallbackMessage: `I'm sorry, I couldn't complete the web search for "${
                parameters.query
              }" because ${errorMessage.toLowerCase()}. Please try again in a few moments.`,
            };
          }
        }
      ),

      createTool(
        {
          name: "tavily_extract",
          description:
            "Extract clean content from specific web URLs using Tavily's extraction API.",
          parameters: z.object({
            urls: z
              .union([
                z.string().url(),
                z.array(z.string().url()).min(1).max(20),
              ])
              .describe("URL or array of URLs to extract content from"),
            includeImages: z
              .boolean()
              .optional()
              .default(false)
              .describe("Include images from the URLs"),
            extractDepth: z
              .enum(["basic", "advanced"])
              .optional()
              .default("basic")
              .describe("Extraction depth"),
            format: z
              .enum(["markdown", "text"])
              .optional()
              .default("markdown")
              .describe("Output format"),
          }),
        },
        async (parameters) => {
          if (!this.apiKey || !this.apiKey.startsWith("tvly-")) {
            return {
              success: false,
              error: "Tavily API Key is not configured correctly.",
              fallbackMessage:
                "Content extraction is not available due to API configuration issues.",
            };
          }

          try {
            const urlsArray = Array.isArray(parameters.urls)
              ? parameters.urls
              : [parameters.urls];
            console.log(
              `Tavily API: Extracting content from ${urlsArray.length} URLs`
            );

            const requestBody = {
              urls: parameters.urls,
              include_images: parameters.includeImages,
              extract_depth: parameters.extractDepth,
              format: parameters.format,
            };

            const response = await this.makeApiRequest("/extract", requestBody);

            return {
              success: true,
              results: response.results || [],
              failedResults: response.failed_results || [],
              responseTime: response.response_time,
              summary: `Successfully extracted content from ${
                response.results?.length || 0
              } URLs`,
            };
          } catch (error: any) {
            console.error("Tavily API extract failed:", error);

            return {
              success: false,
              error: "Content extraction failed.",
              details: error.message,
              fallbackMessage:
                "I'm sorry, I couldn't extract content from the provided URLs due to service issues.",
            };
          }
        }
      ),
    ];
  }
}

export const tavilyPlugin = (options: { apiKey: string }) => {
  return new TavilyPlugin(options.apiKey);
};
