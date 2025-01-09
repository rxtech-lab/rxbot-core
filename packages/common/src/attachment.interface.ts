/**
 * Add more attachment types as needed.
 */
export enum AttachmentType {
  /**
   * An image attachment.
   */
  Image = "image",
  /**
   * A video attachment.
   */
  Video = "video",
  /**
   * An audio attachment.
   */
  Audio = "audio",
  /**
   * A file attachment.
   */
  File = "file",
  /**
   * A user recorded voice attachment.
   */
  Voice = "voice",
  /**
   * A sticker attachment.
   */
  Sticker = "sticker",
  /**
   * A contact attachment.
   */
  Contact = "contact",
  /**
   * A location attachment.
   */
  Location = "location",
  /**
   * A poll attachment.
   */
  Poll = "poll",
  /**
   * A quiz attachment.
   */
  Quiz = "quiz",
  /**
   * A button attachment.
   */
  Button = "button",
}

export type BaseAttachment = {
  type: AttachmentType;
};

export type ImageAttachment = BaseAttachment & {
  type: AttachmentType.Image;
  url: string;
};

export type VideoAttachment = BaseAttachment & {
  type: AttachmentType.Video;
  url: string;
  thumbnail?: string;
};

export type AudioAttachment = BaseAttachment & {
  type: AttachmentType.Audio;
  url: string;
  duration?: number;
};

export type FileAttachment = BaseAttachment & {
  type: AttachmentType.File;
  url: string;
  size?: number;
  mimeType?: string;
};

export type VoiceAttachment = BaseAttachment & {
  type: AttachmentType.Voice;
  url: string;
  duration: number;
};

export type StickerAttachment = BaseAttachment & {
  type: AttachmentType.Sticker;
  url: string;
};

// Data-based attachments
export type ContactAttachment = BaseAttachment & {
  type: AttachmentType.Contact;
  data: {
    name: string;
    phoneNumber: string;
    email?: string;
  };
};

export type LocationAttachment = BaseAttachment & {
  type: AttachmentType.Location;
  data: {
    latitude: number;
    longitude: number;
    address?: string;
  };
};

export type PollAttachment = BaseAttachment & {
  type: AttachmentType.Poll;
  data: {
    question: string;
    options: {
      text: string;
      votes: number;
    }[];
    multipleChoice?: boolean;
    endTime?: string;
  };
};

export type QuizAttachment = BaseAttachment & {
  type: AttachmentType.Quiz;
  data: {
    question: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
  };
};

export type ButtonAttachment = BaseAttachment & {
  type: AttachmentType.Button;
  data: {
    text: string;
    url?: string;
    action?: string;
    payload?: Record<string, unknown>;
  };
};

// Union type of all possible attachments
export type Attachment =
  | ImageAttachment
  | VideoAttachment
  | AudioAttachment
  | FileAttachment
  | VoiceAttachment
  | StickerAttachment
  | ContactAttachment
  | LocationAttachment
  | PollAttachment
  | QuizAttachment
  | ButtonAttachment;
