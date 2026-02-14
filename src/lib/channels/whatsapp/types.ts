// WhatsApp Cloud API types

export interface WhatsAppWebhookPayload {
  object: 'whatsapp_business_account';
  entry: WhatsAppEntry[];
}

export interface WhatsAppEntry {
  id: string;
  changes: WhatsAppChange[];
}

export interface WhatsAppChange {
  value: {
    messaging_product: 'whatsapp';
    metadata: {
      display_phone_number: string;
      phone_number_id: string;
    };
    contacts?: { profile: { name: string }; wa_id: string }[];
    messages?: WhatsAppMessage[];
    statuses?: unknown[];
  };
  field: 'messages';
}

export interface WhatsAppMessage {
  from: string;
  id: string;
  timestamp: string;
  text?: {
    body: string;
  };
  type: 'text' | 'image' | 'audio' | 'video' | 'document' | 'sticker' | 'reaction' | 'location' | 'contacts' | 'interactive' | 'button' | 'unknown';
}

export interface WhatsAppSendResponse {
  messaging_product: 'whatsapp';
  contacts: { input: string; wa_id: string }[];
  messages: { id: string }[];
}
