type LogLevel = "info" | "warn" | "error" | "debug";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: unknown;
}

function log(level: LogLevel, message: string, data?: unknown): void {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(data !== undefined && { data }),
  };

  if (process.env.NODE_ENV === "production") {
    // In production, output structured JSON for log aggregators
    process.stdout.write(JSON.stringify(entry) + "\n");
  } else {
    const color = { info: "\x1b[36m", warn: "\x1b[33m", error: "\x1b[31m", debug: "\x1b[90m" }[level];
    console[level === "debug" ? "log" : level](
      `${color}[${level.toUpperCase()}]\x1b[0m ${message}`,
      data ?? ""
    );
  }
}

export const logger = {
  info: (message: string, data?: unknown) => log("info", message, data),
  warn: (message: string, data?: unknown) => log("warn", message, data),
  error: (message: string, data?: unknown) => log("error", message, data),
  debug: (message: string, data?: unknown) => log("debug", message, data),
};
