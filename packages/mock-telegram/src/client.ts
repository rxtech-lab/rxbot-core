/* eslint-disable */
/* tslint:disable */
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export enum MessageType {
  Text = "text",
  Callback = "callback",
}

export interface SendMessageRequest {
  type: MessageType;
  content: string;
}

export interface SendMessageResponse {
  message_id: number;
  chat_id: number;
}

export interface Message {
  message_id?: number;
  text?: string;
  reply_markup?: ReplyMarkup;
  callback_query?: string;
  update_count?: number;
}

export interface ReplyMarkup {
  inline_keyboard?: InlineKeyboardButton[][];
}

export interface InlineKeyboardButton {
  text: string;
  callback_data?: string;
  url?: string;
}

export interface GetMessageByIdResponse {
  message: Message;
}

export interface ListMessageResponse {
  messages: Message[];
  count: number;
}

export interface UpdateMessageByIdResponse {
  message: Message;
}

export interface ClickOnMessageRequest {
  text: string;
}

export type QueryParamsType = Record<string | number, any>;
export type ResponseFormat = keyof Omit<Body, "body" | "bodyUsed">;

export interface FullRequestParams extends Omit<RequestInit, "body"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseFormat;
  /** request body */
  body?: unknown;
  /** base url */
  baseUrl?: string;
  /** request cancellation token */
  cancelToken?: CancelToken;
}

export type RequestParams = Omit<
  FullRequestParams,
  "body" | "method" | "query" | "path"
>;

export interface ApiConfig<SecurityDataType = unknown> {
  baseUrl?: string;
  baseApiParams?: Omit<RequestParams, "baseUrl" | "cancelToken" | "signal">;
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<RequestParams | void> | RequestParams | void;
  customFetch?: typeof fetch;
}

export interface HttpResponse<D extends unknown, E extends unknown = unknown>
  extends Response {
  data: D;
  error: E;
}

type CancelToken = Symbol | string | number;

export enum ContentType {
  Json = "application/json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public baseUrl: string = "";
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private abortControllers = new Map<CancelToken, AbortController>();
  private customFetch = (...fetchParams: Parameters<typeof fetch>) =>
    fetch(...fetchParams);

  private baseApiParams: RequestParams = {
    credentials: "same-origin",
    headers: {},
    redirect: "follow",
    referrerPolicy: "no-referrer",
  };

  constructor(apiConfig: ApiConfig<SecurityDataType> = {}) {
    Object.assign(this, apiConfig);
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected encodeQueryParam(key: string, value: any) {
    const encodedKey = encodeURIComponent(key);
    return `${encodedKey}=${encodeURIComponent(typeof value === "number" ? value : `${value}`)}`;
  }

  protected addQueryParam(query: QueryParamsType, key: string) {
    return this.encodeQueryParam(key, query[key]);
  }

  protected addArrayQueryParam(query: QueryParamsType, key: string) {
    const value = query[key];
    return value.map((v: any) => this.encodeQueryParam(key, v)).join("&");
  }

  protected toQueryString(rawQuery?: QueryParamsType): string {
    const query = rawQuery || {};
    const keys = Object.keys(query).filter(
      (key) => "undefined" !== typeof query[key],
    );
    return keys
      .map((key) =>
        Array.isArray(query[key])
          ? this.addArrayQueryParam(query, key)
          : this.addQueryParam(query, key),
      )
      .join("&");
  }

  protected addQueryParams(rawQuery?: QueryParamsType): string {
    const queryString = this.toQueryString(rawQuery);
    return queryString ? `?${queryString}` : "";
  }

  private contentFormatters: Record<ContentType, (input: any) => any> = {
    [ContentType.Json]: (input: any) =>
      input !== null && (typeof input === "object" || typeof input === "string")
        ? JSON.stringify(input)
        : input,
    [ContentType.Text]: (input: any) =>
      input !== null && typeof input !== "string"
        ? JSON.stringify(input)
        : input,
    [ContentType.FormData]: (input: any) =>
      Object.keys(input || {}).reduce((formData, key) => {
        const property = input[key];
        formData.append(
          key,
          property instanceof Blob
            ? property
            : typeof property === "object" && property !== null
              ? JSON.stringify(property)
              : `${property}`,
        );
        return formData;
      }, new FormData()),
    [ContentType.UrlEncoded]: (input: any) => this.toQueryString(input),
  };

  protected mergeRequestParams(
    params1: RequestParams,
    params2?: RequestParams,
  ): RequestParams {
    return {
      ...this.baseApiParams,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...(this.baseApiParams.headers || {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected createAbortSignal = (
    cancelToken: CancelToken,
  ): AbortSignal | undefined => {
    if (this.abortControllers.has(cancelToken)) {
      const abortController = this.abortControllers.get(cancelToken);
      if (abortController) {
        return abortController.signal;
      }
      return void 0;
    }

    const abortController = new AbortController();
    this.abortControllers.set(cancelToken, abortController);
    return abortController.signal;
  };

  public abortRequest = (cancelToken: CancelToken) => {
    const abortController = this.abortControllers.get(cancelToken);

    if (abortController) {
      abortController.abort();
      this.abortControllers.delete(cancelToken);
    }
  };

  public request = async <T = any, E = any>({
    body,
    secure,
    path,
    type,
    query,
    format,
    baseUrl,
    cancelToken,
    ...params
  }: FullRequestParams): Promise<HttpResponse<T, E>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.baseApiParams.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const queryString = query && this.toQueryString(query);
    const payloadFormatter = this.contentFormatters[type || ContentType.Json];
    const responseFormat = format || requestParams.format;

    return this.customFetch(
      `${baseUrl || this.baseUrl || ""}${path}${queryString ? `?${queryString}` : ""}`,
      {
        ...requestParams,
        headers: {
          ...(requestParams.headers || {}),
          ...(type && type !== ContentType.FormData
            ? { "Content-Type": type }
            : {}),
        },
        signal:
          (cancelToken
            ? this.createAbortSignal(cancelToken)
            : requestParams.signal) || null,
        body:
          typeof body === "undefined" || body === null
            ? null
            : payloadFormatter(body),
      },
    ).then(async (response) => {
      const r = response.clone() as HttpResponse<T, E>;
      r.data = null as unknown as T;
      r.error = null as unknown as E;

      const data = !responseFormat
        ? r
        : await response[responseFormat]()
            .then((data) => {
              if (r.ok) {
                r.data = data;
              } else {
                r.error = data;
              }
              return r;
            })
            .catch((e) => {
              r.error = e;
              return r;
            });

      if (cancelToken) {
        this.abortControllers.delete(cancelToken);
      }

      if (!response.ok) throw data;
      return data;
    });
  };
}

/**
 * @title Chat Controller API
 * @version 1.0.0
 *
 * API for simulating user chat with a bot
 */
export class Api<
  SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
  message = {
    /**
     * No description
     *
     * @name SendMessage
     * @summary Send a message
     * @request POST:/message
     */
    sendMessage: (data: SendMessageRequest, params: RequestParams = {}) =>
      this.request<SendMessageResponse, any>({
        path: `/message`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @name GetMessages
     * @summary Get all messages
     * @request GET:/message
     */
    getMessages: (params: RequestParams = {}) =>
      this.request<ListMessageResponse, any>({
        path: `/message`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @name GetMessageById
     * @summary Get a message by ID
     * @request GET:/message/{id}
     */
    getMessageById: (id: number, params: RequestParams = {}) =>
      this.request<GetMessageByIdResponse, void>({
        path: `/message/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @name ClickOnMessage
     * @summary Simulate clicking on a message
     * @request POST:/message/{id}/click
     */
    clickOnMessage: (
      id: number,
      data: ClickOnMessageRequest,
      params: RequestParams = {},
    ) =>
      this.request<UpdateMessageByIdResponse, void>({
        path: `/message/${id}/click`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
  chatroom = {
    /**
     * No description
     *
     * @name SendMessageToChatroom
     * @summary Send a message to a specific chatroom
     * @request POST:/chatroom/{chatroomId}/message
     */
    sendMessageToChatroom: (
      chatroomId: number,
      data: SendMessageRequest,
      params: RequestParams = {},
    ) =>
      this.request<SendMessageResponse, any>({
        path: `/chatroom/${chatroomId}/message`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @name GetMessagesByChatroom
     * @summary Get all messages from a specific chatroom
     * @request GET:/chatroom/{chatroomId}/message
     */
    getMessagesByChatroom: (chatroomId: number, params: RequestParams = {}) =>
      this.request<ListMessageResponse, any>({
        path: `/chatroom/${chatroomId}/message`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @name GetMessageByIdFromChatroom
     * @summary Get a message by ID from a specific chatroom
     * @request GET:/chatroom/{chatroomId}/message/{id}
     */
    getMessageByIdFromChatroom: (
      chatroomId: number,
      id: number,
      params: RequestParams = {},
    ) =>
      this.request<GetMessageByIdResponse, void>({
        path: `/chatroom/${chatroomId}/message/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @name ClickOnMessageInChatroom
     * @summary Simulate clicking on a message in a specific chatroom
     * @request POST:/chatroom/{chatroomId}/message/{id}/click
     */
    clickOnMessageInChatroom: (
      chatroomId: number,
      id: number,
      data: ClickOnMessageRequest,
      params: RequestParams = {},
    ) =>
      this.request<UpdateMessageByIdResponse, void>({
        path: `/chatroom/${chatroomId}/message/${id}/click`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
  reset = {
    /**
     * No description
     *
     * @name ResetState
     * @summary Reset the entire state
     * @request POST:/reset
     */
    resetState: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/reset`,
        method: "POST",
        ...params,
      }),

    /**
     * No description
     *
     * @name ResetChatroomState
     * @summary Reset the state for a specific chatroom
     * @request POST:/reset/{chatroomId}
     */
    resetChatroomState: (chatroomId: number, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/reset/${chatroomId}`,
        method: "POST",
        ...params,
      }),
  };
}
