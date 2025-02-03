export interface MessagePayload {
  public: boolean;
  content: string;
}

export interface MessageResponse extends MessagePayload {
  id: string;
  timestamp: string;
  client: string;
}
