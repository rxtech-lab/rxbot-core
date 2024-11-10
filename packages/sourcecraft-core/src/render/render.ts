import * as nunjucks from "nunjucks";
import * as prettier from "prettier";
import { parse } from "yaml";
import { QuestionEngine } from "../ask/engine";
import { Hooks, HooksKey, TemplateFile, TemplateFileSchema } from "./types";

// Define filesystem interface
export interface FileSystem {
  readFileSync(path: string, encoding: string): string;
  writeFileSync(path: string, content: string): void;
  mkdirSync(path: string, options?: { recursive?: boolean }): void;
  existsSync(path: string): boolean;
}

export interface HookExecutor {
  executeShell(command: string, cwd: string): void;
}

// Define path operations interface
export interface PathOperations {
  join(...paths: string[]): string;
  dirname(path: string): string;
  extname(path: string): string;
}

export interface Options {
  userValues: Record<string, any>;
  templateFileName?: string;
  fs: FileSystem;
  path: PathOperations;
  questionEngine: QuestionEngine;
  hookExecutor: HookExecutor;
  getTemplateFolder: () => string;
  getOutputFolder: () => string;
}

const DEFAULT_TEMPLATE_FILE_NAME = "templates.yaml.tmpl";

export class TemplateGenerator {
  private readonly userValues: Record<string, any>;
  private readonly questionEngine: QuestionEngine;
  private readonly fs: FileSystem;
  private readonly path: PathOperations;
  private readonly hookExecutor: HookExecutor;
  private readonly templateFileName: string;
  private readonly templateFolder: string;
  private readonly outputFolder: string;
  constructor(opts: Options) {
    if (!opts.userValues.projectName) {
      throw new Error("projectName is required");
    }

    this.fs = opts.fs;
    this.path = opts.path;
    this.templateFolder = opts.getTemplateFolder();
    this.userValues = opts.userValues;
    this.questionEngine = opts.questionEngine;
    this.hookExecutor = opts.hookExecutor;
    this.outputFolder = opts.getOutputFolder();
    this.templateFileName = opts.templateFileName ?? DEFAULT_TEMPLATE_FILE_NAME;
  }

  private async generateTemplateContent(
    content: string,
    filePath: string,
  ): Promise<string> {
    const ext = this.path.extname(filePath);
    const extMap = {
      ".ts": "typescript",
      ".tsx": "typescript",
      ".js": "javascript",
      ".json": "json",
      ".yaml": "yaml",
      ".yml": "yaml",
    };

    try {
      const renderedContent = nunjucks.renderString(content, this.userValues);
      if (!extMap[ext]) {
        return renderedContent;
      }
      return await prettier.format(renderedContent, { parser: extMap[ext] });
    } catch (error) {
      throw new Error(`Error generating template content: ${error}`);
    }
  }

  private getTemplatePath(templateName: string): string {
    return this.path.join(this.templateFolder, templateName);
  }

  private async getGeneratedTemplates(): Promise<TemplateFile> {
    try {
      const templateFilePath = this.getTemplatePath(this.templateFileName);
      const templateTmpl = this.fs.readFileSync(templateFilePath, "utf-8");
      const renderedTemplate = nunjucks.renderString(
        templateTmpl,
        this.userValues,
      );
      return TemplateFileSchema.parse(parse(renderedTemplate));
    } catch (error) {
      throw new Error(`Error getting generated templates: ${error}`);
    }
  }

  private async executeShell(command: string, cwd: string) {
    try {
      await this.questionEngine.showLoading(
        `Executing shell command: ${command}`,
      );
      this.hookExecutor.executeShell(command, cwd);
    } catch (error) {
      await this.questionEngine.error(
        `Error executing shell command: ${error}`,
      );
    }
  }

  private async executeHooks(key: HooksKey, hooks: Hooks, cwd: string) {
    if (!hooks) return;
    if (hooks[key]) {
      switch (hooks[key].type) {
        case "shell":
          await this.executeShell(hooks[key].command, cwd);
          break;
        default:
          throw new Error(`Unsupported hook type: ${hooks[key].type}`);
      }
    }
  }

  private async writeToFile(outPath: string, content: string): Promise<void> {
    try {
      const dir = this.path.dirname(outPath);
      if (!this.fs.existsSync(dir)) {
        this.fs.mkdirSync(dir, { recursive: true });
      }
      this.fs.writeFileSync(outPath, content);
    } catch (error) {
      throw new Error(`Error writing to file: ${error}`);
    }
  }

  public async render(): Promise<TemplateFile> {
    await this.questionEngine.showLoading(
      `Creating project at: ${this.outputFolder}`,
    );
    // make directories if they don't exist
    if (!this.fs.existsSync(this.outputFolder)) {
      await this.questionEngine.showLoading(
        `Making project directory: ${this.outputFolder}`,
      );
      this.fs.mkdirSync(this.outputFolder, { recursive: true });
    }

    const templateFile = await this.getGeneratedTemplates();

    await this.questionEngine.showLoading("Generating files");
    // Process each file
    for (const file of templateFile.files) {
      const content = this.fs.readFileSync(
        this.getTemplatePath(file.path),
        "utf-8",
      );
      const renderedContent = await this.generateTemplateContent(
        content,
        file.output,
      );

      await this.writeToFile(
        this.path.join(this.outputFolder, file.output),
        renderedContent,
      );

      await this.executeHooks("afterEmit", file.hooks, this.outputFolder);
    }

    // Execute afterAllEmit hooks
    for (const file of templateFile.files) {
      await this.executeHooks("afterAllEmit", file.hooks, this.outputFolder);
    }

    await this.questionEngine.hideLoading();
    return templateFile;
  }

  getOutputFolder(): string {
    return this.outputFolder;
  }
}
