export const API_URL = "https://functions.poehali.dev/08d65380-8061-4506-a228-896383e6d8e7";

export const avatarColors = [
  "bg-blue-500", "bg-purple-500", "bg-green-500",
  "bg-orange-500", "bg-pink-500", "bg-teal-500",
];

export const colorForChat = (id: number) => avatarColors[(id - 1) % avatarColors.length];

export interface Message {
  id: number;
  senderId: number;
  text: string;
  time: string;
  isOut: boolean;
  read: boolean;
}

export interface Chat {
  id: number;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
}
