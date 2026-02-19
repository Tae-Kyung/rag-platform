// Discord Interaction Types
// https://discord.com/developers/docs/interactions/receiving-and-responding

export enum InteractionType {
  PING = 1,
  APPLICATION_COMMAND = 2,
}

export enum InteractionResponseType {
  PONG = 1,
  DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE = 5,
}

export enum ApplicationCommandOptionType {
  STRING = 3,
}

export interface DiscordInteraction {
  id: string;
  application_id: string;
  type: InteractionType;
  token: string;
  data?: DiscordInteractionData;
  member?: DiscordMember;
  user?: DiscordUser;
  guild_id?: string;
  channel_id?: string;
}

export interface DiscordInteractionData {
  id: string;
  name: string;
  options?: DiscordCommandOption[];
}

export interface DiscordCommandOption {
  name: string;
  type: ApplicationCommandOptionType;
  value: string;
}

export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  global_name?: string;
}

export interface DiscordMember {
  user: DiscordUser;
  nick?: string;
}

export interface DiscordInteractionResponse {
  type: InteractionResponseType;
}
