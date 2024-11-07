import { execSync } from "child_process";
import { existsSync } from "node:fs";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { Logger } from "@rx-lab/common";
import * as nunjucks from "nunjucks";
import * as prettier from "prettier";
import { parse } from "yaml";
import { Hooks, HooksKey, TemplateFile, TemplateFileSchema } from "./types";

const TEMPLATE_DIR = "templates";
const TEMPLATE_FILE_NAME = "templates.yaml.tmpl";

async function generateTemplateContent(
  content: string,
  filePath: string,
  userOptions: Record<string, any>,
) {
  const ext = path.extname(filePath);
  const extMap = {
    ".ts": "typescript",
    ".tsx": "typescript",
    ".js": "javascript",
    ".json": "json",
    ".yaml": "yaml",
    ".yml": "yaml",
  };
  const renderedContent = nunjucks.renderString(content, userOptions);
  if (!extMap[ext]) {
    return renderedContent;
  }
  return await prettier.format(renderedContent, { parser: extMap[ext] });
}

function getTemplatePath(templateName: string): string {
  return path.join(__dirname, TEMPLATE_DIR, templateName);
}

async function getGeneratedTemplates(
  userOptions: Record<string, any>,
): Promise<TemplateFile> {
  const templateFilePath = getTemplatePath(TEMPLATE_FILE_NAME);
  const templateTmpl = await fs.readFile(templateFilePath, "utf-8");
  const renderedTemplate = nunjucks.renderString(templateTmpl, userOptions);
  return TemplateFileSchema.parse(parse(renderedTemplate));
}

function executeShell(command: string, cwd: string, isDry: boolean) {
  if (isDry) {
    Logger.info(`Executing shell command: ${command}`, "blue");
    return;
  }
  execSync(command, { stdio: "inherit", cwd });
}

function executeHooks(
  key: HooksKey,
  hooks: Hooks,
  cwd: string,
  isDry: boolean,
) {
  if (!hooks) return;
  if (hooks[key]) {
    Logger.info(`Executing ${hooks[key]}`, "blue");
    if (!isDry) {
      switch (hooks[key].type) {
        case "shell":
          executeShell(hooks[key].command, cwd, isDry);
          break;
        default:
          throw new Error(`Unsupported hook type: ${hooks[key].type}`);
      }
    }
  }
}

async function writeToFile(outPath: string, content: string, isDry: boolean) {
  if (isDry) {
    Logger.info(`Writing to ${outPath}`, "blue");
    Logger.info(content);
  } else {
    const dir = path.dirname(outPath);
    if (!existsSync(dir)) {
      await fs.mkdir(dir, { recursive: true });
    }
    await fs.writeFile(outPath, content);
  }
}

export default async function render(
  isDry: boolean,
  userOptions: Record<string, any>,
) {
  // make directories if they don't exist
  const projectDir = userOptions.projectName;
  const projectPath = path.join(process.cwd(), projectDir);
  if (!existsSync(projectPath)) {
    await fs.mkdir(projectPath);
  }

  const templateFile = await getGeneratedTemplates(userOptions);
  for (const file of templateFile.files) {
    const content = await fs.readFile(getTemplatePath(file.path), "utf-8");
    const renderedContent = await generateTemplateContent(
      content,
      file.output,
      userOptions,
    );
    executeHooks("afterEmit", file.hooks, projectPath, isDry);
    await writeToFile(
      path.join(projectPath, file.output),
      renderedContent,
      isDry,
    );
  }

  return templateFile;
}
