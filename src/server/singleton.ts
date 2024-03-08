// since the dev server re-requires the bundle, do some shenanigans to make
// certain things persist across that 😆
// Borrowed/modified from https://github.com/jenseng/abuse-the-platform/blob/2993a7e846c95ace693ce61626fa072174c8d9c7/app/utils/singleton.ts
// eslint-disable-next-line no-var
var global = {};
export function singleton<Value>(name: string, value: () => Value): Value {
  const yolo = global as any;
  yolo.__singletons ??= {};
  yolo.__singletons[name] ??= value();
  return yolo.__singletons[name];
}

export function getSingleton<Value>(name: string): Value | undefined {
  const yolo = global as any;
  return yolo.__singletons?.[name];
}

export function setSingleton<Value>(name: string, value: Value): void {
  const yolo = global as any;
  yolo.__singletons ??= {};
  yolo.__singletons[name] = value;
}
