declare module '*.gif' {
  const src: number;
  export default src;
}

declare module '*.png' {
  const src: number;
  export default src;
}

declare module '*.json' {
  const value: Record<string, unknown>;
  export default value;
}

declare module '*.svg' {
  import type { FunctionComponent } from 'react';
  import type { SvgProps } from 'react-native-svg';
  const content: FunctionComponent<SvgProps>;
  export default content;
}
