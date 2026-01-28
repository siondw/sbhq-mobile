/**
 * Verifies Scorebug spectator label rendering.
 */
import React from 'react';
import { render } from '@testing-library/react-native';

import Scorebug from '../../src/ui/components/Scorebug';

describe('Scorebug spectator label', () => {
  test('renders Spectating label when provided', () => {
    const view = render(<Scorebug playerCount={321} statusLabel="Spectating" />);

    expect(view.getByText('Spectating')).toBeTruthy();
    expect(view.getByText('remaining')).toBeTruthy();
    expect(view.getByText('321')).toBeTruthy();
  });

  test('does not render label when not provided', () => {
    const view = render(<Scorebug playerCount={10} />);

    expect(view.queryByText('Spectating')).toBeNull();
  });
});
