import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HEADER_CONTENT_HEIGHT } from '../../ui/theme';

/**
 * Returns the total height of the header including safe area insets.
 * Use this value for paddingTop/marginTop when positioning content below the absolute-positioned header.
 */
export const useHeaderHeight = (): number => {
  const insets = useSafeAreaInsets();
  return insets.top + HEADER_CONTENT_HEIGHT;
};
