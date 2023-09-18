import { useEffect, useRef } from 'react'
import { useWebSocket } from './use-websocket.js'
import { DEFAULT_EVENT_SOURCE_OPTIONS, EMPTY_EVENT_HANDLERS } from './constants.js'
import { EventSourceOptions, Options, EventSourceHook, EventSourceEventHandlers } from './types.js';

export const useEventSource = (
  url: string | (() => string | Promise<string>) | null,
  { withCredentials, events, ...options }: EventSourceOptions = DEFAULT_EVENT_SOURCE_OPTIONS,
  connect = true,
): EventSourceHook => {
  const optionsWithEventSource: Options = {
      ...options,
      eventSourceOptions: {
        withCredentials,
      }
  };
  const eventsRef = useRef<EventSourceEventHandlers>(EMPTY_EVENT_HANDLERS);
  if (events) {
    eventsRef.current = events
  }

  const {
    lastMessage,
    readyState,
    getWebSocket,
  } = useWebSocket(
    url,
    optionsWithEventSource,
    connect,
  );

  useEffect(() => {
    if (lastMessage?.type) {
        Object.entries(eventsRef.current).forEach(([type, handler]) => {
            if (type === lastMessage.type) {
                handler(lastMessage);
            }
        });
    }
  }, [lastMessage]);

  return {
    lastEvent: lastMessage,
    readyState,
    getEventSource: getWebSocket,
  };
}
