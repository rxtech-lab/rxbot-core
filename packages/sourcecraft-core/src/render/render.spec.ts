import * as nunjucks from "nunjucks";
import { parse } from "yaml";
import { QuestionEngine } from "../ask/engine";
import {
  FileSystem,
  HookExecutor,
  Options,
  PathOperations,
  TemplateGenerator,
} from "./render";

// Mock dependencies
jest.mock("nunjucks");
jest.mock("prettier");
jest.mock("yaml");

describe("TemplateGenerator", () => {
  let mockFs: jest.Mocked<FileSystem>;
  let mockPath: jest.Mocked<PathOperations>;
  let mockQuestionEngine: jest.Mocked<QuestionEngine>;
  let mockHookExecutor: jest.Mocked<HookExecutor>;
  let options: Options;

  beforeEach(() => {
    // Reset all mocks before each test
    mockFs = {
      readFileSync: jest.fn(),
      writeFileSync: jest.fn(),
      mkdirSync: jest.fn(),
      existsSync: jest.fn(),
    };

    mockPath = {
      //@ts-ignore
      join: (...paths: string[]) => paths.join("/"),
      dirname: jest.fn(),
      extname: jest.fn(),
    };

    mockQuestionEngine = {
      showLoading: jest.fn(),
    } as any;

    mockHookExecutor = {
      executeShell: jest.fn(),
    };

    options = {
      userValues: { projectName: "test-project" },
      fs: mockFs,
      path: mockPath,
      questionEngine: mockQuestionEngine,
      hookExecutor: mockHookExecutor,
      cwd: () => "/test/cwd",
    };
  });

  describe("constructor", () => {
    it("should throw error if projectName is not provided", () => {
      expect(() => {
        new TemplateGenerator({
          ...options,
          userValues: {},
        });
      }).toThrow("projectName is required");
    });

    it("should initialize with valid options", () => {
      const generator = new TemplateGenerator(options);
      expect(generator).toBeDefined();
    });
  });

  describe("render", () => {
    let generator: TemplateGenerator;
    const mockTemplateContent = `
files:
  - path: template1.ts
    output: out1.ts
    hooks:
      afterEmit:
        type: shell
        command: npm install
  - path: template2.ts
    output: out2.ts
`;

    beforeEach(() => {
      generator = new TemplateGenerator(options);
      mockFs.existsSync.mockReturnValue(false);
      // Mock the template file reading
      mockFs.readFileSync.mockReturnValueOnce(mockTemplateContent);
      (parse as jest.Mock).mockReturnValueOnce({
        files: [
          {
            path: "template1.ts",
            output: "out1.ts",
            hooks: {
              afterEmit: {
                type: "shell",
                command: "npm install",
              },
            },
          },
          {
            path: "template2.ts",
            output: "out2.ts",
          },
        ],
      });

      (nunjucks.renderString as jest.Mock).mockImplementation(
        (content) => content,
      );
    });

    it("should create project directory if it does not exist", async () => {
      await generator.render();
      expect(mockFs.mkdirSync).toHaveBeenCalledWith("/test/cwd/test-project");
    });

    it("should process all template files", async () => {
      await generator.render();
      expect(mockFs.readFileSync).toHaveBeenCalledTimes(3); // template.yaml + 2 template files
      expect(mockFs.writeFileSync).toHaveBeenCalledTimes(2); // 2 output files
    });

    it("should execute afterEmit hooks", async () => {
      await generator.render();
      expect(mockHookExecutor.executeShell).toHaveBeenCalledWith(
        "npm install",
        "/test/cwd/test-project",
      );
    });

    it("should show loading messages", async () => {
      await generator.render();
      expect(mockQuestionEngine.showLoading).toHaveBeenCalledWith(
        "Generating files",
      );
    });

    it("should handle errors in file operations", async () => {
      mockFs.readFileSync.mockImplementationOnce(() => {
        throw new Error("File read error");
      });

      await expect(generator.render()).rejects.toThrow("File read error");
    });
  });

  describe("file generation", () => {
    let generator: TemplateGenerator;

    beforeEach(() => {
      generator = new TemplateGenerator(options);
      mockPath.extname.mockReturnValue(".ts");
      mockFs.existsSync.mockReturnValue(true);
    });

    it("should handle different file extensions correctly", async () => {
      mockPath.extname
        .mockReturnValueOnce(".ts")
        .mockReturnValueOnce(".json")
        .mockReturnValueOnce(".yaml");

      const mockTemplate = `
files:
  - path: template.ts
    output: output.ts
  - path: template.json
    output: output.json
  - path: template.yaml
    output: output.yaml
`;

      mockFs.readFileSync.mockReturnValue(mockTemplate);
      (parse as jest.Mock).mockReturnValueOnce({
        files: [
          { path: "template.ts", output: "output.ts" },
          { path: "template.json", output: "output.json" },
          { path: "template.yaml", output: "output.yaml" },
        ],
      });

      await generator.render();

      expect(mockPath.extname).toHaveBeenCalledTimes(3);
    });
  });

  describe("hook execution", () => {
    let generator: TemplateGenerator;

    beforeEach(() => {
      generator = new TemplateGenerator(options);
      mockFs.existsSync.mockReturnValue(true);
    });

    it("should handle invalid hook types", async () => {
      const mockTemplate = `
files:
  - path: template.ts
    output: output.ts
    hooks:
      afterEmit:
        type: invalid
        command: test
`;

      mockFs.readFileSync.mockReturnValue(mockTemplate);
      (parse as jest.Mock).mockReturnValueOnce({
        files: [
          {
            path: "template.ts",
            output: "output.ts",
            hooks: {
              afterEmit: {
                type: "invalid",
                command: "test",
              },
            },
          },
        ],
      });

      await expect(generator.render()).rejects.toThrow();
    });

    it("should execute multiple hooks in correct order", async () => {
      const mockTemplate = `
files:
  - path: template.ts
    output: output.ts
    hooks:
      afterEmit:
        type: shell
        command: command1
      afterAllEmit:
        type: shell
        command: command2
`;

      mockFs.readFileSync.mockReturnValue(mockTemplate);
      (parse as jest.Mock).mockReturnValueOnce({
        files: [
          {
            path: "template.ts",
            output: "output.ts",
            hooks: {
              afterEmit: {
                type: "shell",
                command: "command1",
              },
              afterAllEmit: {
                type: "shell",
                command: "command2",
              },
            },
          },
        ],
      });

      await generator.render();

      expect(mockHookExecutor.executeShell).toHaveBeenCalledTimes(2);
      expect(mockHookExecutor.executeShell).toHaveBeenNthCalledWith(
        1,
        "command1",
        expect.any(String),
      );
      expect(mockHookExecutor.executeShell).toHaveBeenNthCalledWith(
        2,
        "command2",
        expect.any(String),
      );
    });
  });
});
