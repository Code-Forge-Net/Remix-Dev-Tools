import { sharedWebSockets } from './globals.js';
import { DEFAULT_RECONNECT_LIMIT, DEFAULT_RECONNECT_INTERVAL_MS, ReadyState, isEventSourceSupported } from './constants.js';
import { getSubscribers } from './manage-subscribers.js';
import { MutableRefObject } from 'react';
import { Options, SendMessage, WebSocketLike } from './types.js';
import { setUpSocketIOPing } from './socket-io.js';

const bindMessageHandler = (
  webSocketInstance: WebSocketLike,
  url: string,
) => {
  webSocketInstance.onmessage = (message: WebSocketEventMap['message']) => {
    getSubscribers(url).forEach(subscriber => {
      if (subscriber.optionsRef.current.onMessage) {
        subscriber.optionsRef.current.onMessage(message);
      }

      if (
        typeof subscriber.optionsRef.current.filter === 'function' &&
        subscriber.optionsRef.current.filter(message) !== true
      ) {
        return;
      }

      subscriber.setLastMessage(message);
    });
  };
};

const bindOpenHandler = (
  webSocketInstance: WebSocketLike,
  url: string,
) => {
  webSocketInstance.onopen = (event: WebSocketEventMap['open']) => {
    getSubscribers(url).forEach(subscriber => {
      subscriber.reconnectCount.current = 0;
      if (subscriber.optionsRef.current.onOpen) {
        subscriber.optionsRef.current.onOpen(event);
      }

      subscriber.setReadyState(ReadyState.OPEN);
    });
  };
};

const bindCloseHandler = (
  webSocketInstance: WebSocketLike,
  url: string,
) => {
  if (webSocketInstance instanceof WebSocket) {
    webSocketInstance.onclose = (event: WebSocketEventMap['close']) => {
      getSubscribers(url).forEach(subscriber => {
        if (subscriber.optionsRef.current.onClose) {
          subscriber.optionsRef.current.onClose(event);
        }
  
        subscriber.setReadyState(ReadyState.CLOSED);
      });
      
      delete sharedWebSockets[url];
  
      getSubscribers(url).forEach(subscriber => {
        if (
          subscriber.optionsRef.current.shouldReconnect &&
          subscriber.optionsRef.current.shouldReconnect(event)
        ) {
          const reconnectAttempts = subscriber.optionsRef.current.reconnectAttempts ?? DEFAULT_RECONNECT_LIMIT;
          if (subscriber.reconnectCount.current < reconnectAttempts) {
            const nextReconnectInterval = typeof subscriber.optionsRef.current.reconnectInterval === 'function' ?
              subscriber.optionsRef.current.reconnectInterval(subscriber.reconnectCount.current) :
              subscriber.optionsRef.current.reconnectInterval;

            setTimeout(() => {
              subscriber.reconnectCount.current++;
              subscriber.reconnect.current();
            }, nextReconnectInterval ?? DEFAULT_RECONNECT_INTERVAL_MS);
          } else {
            subscriber.optionsRef.current.onReconnectStop && subscriber.optionsRef.current.onReconnectStop(subscriber.optionsRef.current.reconnectAttempts as number);
            console.warn(`Max reconnect attempts of ${reconnectAttempts} exceeded`);
          }
        }
      });
    };
  }
};

const bindErrorHandler = (
  webSocketInstance: WebSocketLike,
  url: string,
) => {
  webSocketInstance.onerror = (error: WebSocketEventMap['error']) => {
    getSubscribers(url).forEach(subscriber => {
      if (subscriber.optionsRef.current.onError) {
        subscriber.optionsRef.current.onError(error);
      }
      if (isEventSourceSupported && webSocketInstance instanceof EventSource) {
        subscriber.optionsRef.current.onClose && subscriber.optionsRef.current.onClose({
          ...error,
          code: 1006,
          reason: `An error occurred with the EventSource: ${error}`,
          wasClean: false,
        });
  
        subscriber.setReadyState(ReadyState.CLOSED);
      }
    });
    if (isEventSourceSupported && webSocketInstance instanceof EventSource) {
      webSocketInstance.close();
    }
  };
};

export const attachSharedListeners = (
  webSocketInstance: WebSocketLike,
  url: string,
  optionsRef: MutableRefObject<Options>,
  sendMessage: SendMessage,
) => {
  let interval: number;

  if (optionsRef.current.fromSocketIO) {
    interval = setUpSocketIOPing(sendMessage);
  }

  bindMessageHandler(webSocketInstance, url);
  bindCloseHandler(webSocketInstance, url);
  bindOpenHandler(webSocketInstance, url);
  bindErrorHandler(webSocketInstance, url);

  return () => {
    if (interval) clearInterval(interval);
  };
};
