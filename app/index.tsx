/**
 * Expo Router uses file-based routing - the file path becomes the URL.
 *
 * Examples:
 *   app/index.tsx        → "/"
 *   app/about.tsx        → "/about"
 *   app/users/[id].tsx   → "/users/:id" (dynamic param)
 *   app/(group)/foo.tsx  → "/foo" (parentheses = invisible in URL)
 *
 * Route files should be thin wrappers that import and render screens.
 * All logic lives in src/screens/, src/logic/, and src/ui/.
 */
import React from 'react';
import IndexScreen from '../src/screens/IndexScreen';

const IndexRoute = () => {
  return <IndexScreen />;
};

export default IndexRoute;
