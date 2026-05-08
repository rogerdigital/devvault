import { execFileSync } from "node:child_process";

export type RunCommandOptions = {
  cwd?: string;
  encoding?: BufferEncoding;
  stdio?: "ignore" | "pipe";
  failureMessage: string;
  nextStep?: string;
};

export function runCommand(command: string, args: string[], options: RunCommandOptions): string {
  try {
    return execFileSync(command, args, {
      cwd: options.cwd,
      encoding: options.encoding ?? "utf8",
      stdio: options.stdio === "ignore" ? "ignore" : ["ignore", "pipe", "pipe"]
    }) as string;
  } catch (error) {
    throw new CommandExecutionError(buildCommandErrorMessage(error, options), { cause: error });
  }
}

export class CommandExecutionError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "CommandExecutionError";
  }
}

function buildCommandErrorMessage(error: unknown, options: RunCommandOptions): string {
  const details = extractCommandDetails(error);
  const lines = [options.failureMessage];

  if (details) {
    lines.push(`Reason: ${details}`);
  }

  if (options.nextStep) {
    lines.push(`Next: ${options.nextStep}`);
  }

  return lines.join("\n");
}

function extractCommandDetails(error: unknown): string | undefined {
  if (!isExecError(error)) {
    return error instanceof Error && error.message ? error.message : undefined;
  }

  const stderr = bufferToString(error.stderr).trim();
  if (stderr) {
    return stderr;
  }

  const stdout = bufferToString(error.stdout).trim();
  if (stdout) {
    return stdout;
  }

  return error.message;
}

function isExecError(error: unknown): error is Error & { stderr?: Buffer | string; stdout?: Buffer | string } {
  return error instanceof Error;
}

function bufferToString(value: Buffer | string | undefined): string {
  if (!value) {
    return "";
  }

  return typeof value === "string" ? value : value.toString("utf8");
}
