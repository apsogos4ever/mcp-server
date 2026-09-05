import { McpServer } from "@modelcontextprotocol/server";
import { createMcpHandler } from "agents/mcp/server";
import { z } from "zod";

interface Env {
  TRADING212_API_KEY: string;
  TRADING212_API_SECRET: string;
}

const T212_BASE = "https://live.trading212.com/api/v0";

function createServer(env: Env) {
  const server = new McpServer({
    name: "trading212-mcp",
    version: "1.0.0",
  });

  async function trading212(path: string) {
    const credentials = btoa(
      `${env.TRADING212_API_KEY}:${env.TRADING212_API_SECRET}`
    );

    const response = await fetch(`${T212_BASE}${path}`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${credentials}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const body = await response.text();

      throw new Error(
        `Trading 212 API error ${response.status}: ${body}`
      );
    }

    return response.json();
  }

  server.registerTool(
    "get_account_summary",
    {
      description:
        "Get the current Trading 212 Invest account summary including cash and account values.",
      inputSchema: z.object({}),
    },
    async () => {
      const data = await trading212("/equity/account/summary");

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }
  );

  server.registerTool(
    "get_positions",
    {
      description:
        "Get all current open Trading 212 portfolio positions with quantities, average prices and current market values.",
      inputSchema: z.object({}),
    },
    async () => {
      const data = await trading212("/equity/positions");

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }
  );

  server.registerTool(
    "get_open_orders",
    {
      description:
        "Get all currently pending Trading 212 orders. Read-only.",
      inputSchema: z.object({}),
    },
    async () => {
      const data = await trading212("/equity/orders");

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }
  );

  return server;
}

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return createMcpHandler(
      () => createServer(env),
      {
        route: "/mcp",
      }
    )(request, env, ctx);
  },
};
