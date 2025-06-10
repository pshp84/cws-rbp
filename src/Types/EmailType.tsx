export interface EmailResponse {
  message?: string;
  error?: string;
}

export interface EmailBody {
  sendTo?: string;
  subject: string;
  text?: string;
  html?: string;
  template?: string;
  context: any;
  extension?: string;
  dirpath?: string;
}
