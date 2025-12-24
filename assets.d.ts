declare module '*.gif' {
  const src: number;
  export default src;
}

declare module '*.svg' {
  import type { FunctionComponent } from 'react';
  import type { SvgProps } from 'react-native-svg';
  const content: FunctionComponent<SvgProps>;
  export default content;
}
