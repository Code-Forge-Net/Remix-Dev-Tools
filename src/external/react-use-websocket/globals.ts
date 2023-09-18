import { WebSocketLike } from './types.js';

export interface SharedWebSockets {
  [url: string]: WebSocketLike;
}

export const sharedWebSockets: SharedWebSockets = {};

export const resetWebSockets = (url?: string): void => {
  if (url && sharedWebSockets.hasOwnProperty(url)) {
    delete sharedWebSockets[url];
  } else {
    for (const url in sharedWebSockets){
      if (sharedWebSockets.hasOwnProperty(url)){
        delete sharedWebSockets[url];
      }
    }
  }
}
