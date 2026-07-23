function normalizeDbmsUrl(dbmsUrl) {
  return String(dbmsUrl || "").replace(/\/+$/, "");
}

function createTimeoutSignal(timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(timeoutMs) || 15000);
  return { signal: controller.signal, cancel: () => clearTimeout(timeout) };
}

async function parseGatewayResponse(response) {
  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};

  if (!response.ok) {
    const message = payload.error || payload.message || `DBMS Gateway request failed with ${response.status}`;
    throw new Error(message);
  }

  return payload;
}

function connectProject(siteId, options = {}) {
  const apiKey = options.apiKey;
  const dbmsUrl = normalizeDbmsUrl(options.dbmsUrl);
  const timeoutMs = options.timeoutMs || 15000;

  if (!siteId) {
    throw new Error("SITE_ID is required for DBMS Gateway access");
  }

  if (!apiKey) {
    throw new Error("API_KEY is required for DBMS Gateway access");
  }

  if (!dbmsUrl) {
    throw new Error("DBMS_URL is required for DBMS Gateway access");
  }

  async function request(path, init = {}) {
    const { signal, cancel } = createTimeoutSignal(timeoutMs);

    try {
      const response = await fetch(`${dbmsUrl}${path}`, {
        ...init,
        signal,
        headers: {
          "Content-Type": "application/json",
          "x-site-id": siteId,
          "x-api-key": apiKey,
          ...(init.headers || {})
        }
      });

      return await parseGatewayResponse(response);
    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error(`DBMS Gateway request timed out after ${timeoutMs}ms`);
      }

      throw error;
    } finally {
      cancel();
    }
  }

  async function query(sql, params = []) {
    const payload = await request("/gateway/query", {
      method: "POST",
      body: JSON.stringify({ sql, params })
    });

    return payload.rows || [];
  }

  return {
    query,
    execute: query,
    status() {
      return request("/gateway/status", { method: "GET" });
    }
  };
}

module.exports = { connectProject };
