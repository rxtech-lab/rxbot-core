import fastify, {
  FastifyInstance,
  FastifyRequest,
  FastifyReply,
} from "fastify";
import { load as yamlLoad } from "js-yaml";
import { readFileSync } from "fs";
import { join } from "path";
import { OpenAPIV3 } from "openapi-types";
import $RefParser from "@apidevtools/json-schema-ref-parser";

const server: FastifyInstance = fastify({ logger: true });

// In-memory storage
const storage: Map<string, Map<string, any>> = new Map();

async function loadAndResolveSpec(): Promise<OpenAPIV3.Document> {
  const specPath = join(__dirname, "..", "spec.yaml");
  const rawSpec = yamlLoad(
    readFileSync(specPath, "utf8"),
  ) as OpenAPIV3.Document;
  return (await $RefParser.dereference(rawSpec)) as OpenAPIV3.Document;
}

function generateMockResponse(schema: OpenAPIV3.SchemaObject | undefined): any {
  if (!schema) return {};

  // If a default value is provided, return it immediately
  if (schema.default !== undefined) return schema.default;

  if (schema.type === "object") {
    const result: { [key: string]: any } = {};
    for (const [prop, propSchema] of Object.entries(schema.properties || {})) {
      result[prop] = generateMockResponse(propSchema as OpenAPIV3.SchemaObject);
    }
    return result;
  }

  if (schema.type === "array") {
    return [generateMockResponse(schema.items as OpenAPIV3.SchemaObject)];
  }

  switch (schema.type) {
    case "string":
      return schema.example || "string";
    case "number":
    case "integer":
      return Number(schema.example) || 0;
    case "boolean":
      return schema.example || false;
    default:
      return null;
  }
}

function getStorageForTag(tag: string): Map<string, any> {
  if (!storage.has(tag)) {
    storage.set(tag, new Map());
  }
  return storage.get(tag)!;
}

function processParameters(
  parameters: OpenAPIV3.ParameterObject[] | undefined,
): {
  querystring: OpenAPIV3.SchemaObject;
  params: OpenAPIV3.SchemaObject;
} {
  const queryProperties: Record<string, OpenAPIV3.SchemaObject> = {};
  const paramProperties: Record<string, OpenAPIV3.SchemaObject> = {};
  const queryRequired: string[] = [];
  const paramRequired: string[] = [];

  parameters?.forEach((param) => {
    if (param.in === "query" && param.schema) {
      queryProperties[param.name] = param.schema as OpenAPIV3.SchemaObject;
      if (param.required) {
        queryRequired.push(param.name);
      }
    } else if (param.in === "path" && param.schema) {
      paramProperties[param.name] = param.schema as OpenAPIV3.SchemaObject;
      if (param.required) {
        paramRequired.push(param.name);
      }
    }
  });

  const querystring: OpenAPIV3.SchemaObject = {
    type: "object",
    properties: queryProperties,
    ...(queryRequired.length > 0 && { required: queryRequired }),
  };

  const params: OpenAPIV3.SchemaObject = {
    type: "object",
    properties: paramProperties,
    ...(paramRequired.length > 0 && { required: paramRequired }),
  };

  return { querystring, params };
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

async function createRoutes(spec: OpenAPIV3.Document) {
  Object.entries(spec.paths || {}).forEach(([path, pathItem]) => {
    const pathParameters = pathItem?.parameters;

    Object.entries(pathItem || {}).forEach(([method, operation]) => {
      if (method === "parameters") return; // Skip path-level parameters

      const operationObject = operation as OpenAPIV3.OperationObject;
      const allParameters = [
        ...(pathParameters || []),
        ...(operationObject.parameters || []),
      ];
      const { querystring, params } = processParameters(allParameters as any);

      const routeOptions = {
        method: method.toUpperCase() as any,
        url: path,
        schema: {
          querystring,
          params,
          body:
            operationObject.requestBody &&
            ((operationObject.requestBody as OpenAPIV3.RequestBodyObject)
              .content?.["application/json"]?.schema as OpenAPIV3.SchemaObject),
          response: {
            200: ((operationObject.responses["200"] as OpenAPIV3.ResponseObject)
              ?.content?.["application/json"]?.schema ||
              {}) as OpenAPIV3.SchemaObject,
          },
        },
        handler: async (request: FastifyRequest, reply: FastifyReply) => {
          const operationId = operationObject.operationId || "";
          const tag = operationObject.tags?.[0] || "default";
          const storageForTag = getStorageForTag(tag);

          if (operationId.startsWith("get")) {
            const id = (request.params as any).id;
            const item = storageForTag.get(id);
            return item || { error: "Not found" };
          } else if (operationId.startsWith("list")) {
            return {
              code: 0,
              data: Array.from(storageForTag.values()),
            };
          } else if (operationId.startsWith("create")) {
            const newData = request.body as any;
            const id = newData.id || generateId(); // Implement generateId() function
            storageForTag.set(id, newData);
            return reply.code(201).send({
              code: 0,
              data: { id, ...newData, message: "Created successfully" },
            });
          } else if (operationId.startsWith("update")) {
            const id = (request.params as any).id;
            const updatedData = request.body as any;
            storageForTag.set(id, updatedData);
            return reply.status(200).send({
              code: 0,
              data: { id, ...updatedData },
            });
          } else if (operationId.startsWith("delete")) {
            const id = (request.params as any).id;
            storageForTag.delete(id);
            return { message: "Deleted successfully" };
          } else {
            // For other operations, generate a mock response
            const responseSchema = (
              operationObject.responses["200"] as OpenAPIV3.ResponseObject
            )?.content?.["application/json"]?.schema;
            return generateMockResponse(
              responseSchema as OpenAPIV3.SchemaObject,
            );
          }
        },
      };

      server.route(routeOptions);
    });
  });
}

const start = async () => {
  try {
    const resolvedSpec = await loadAndResolveSpec();
    await createRoutes(resolvedSpec);

    await server.listen({ port: 3001 });
    console.log("Server is running on http://localhost:3001");
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
