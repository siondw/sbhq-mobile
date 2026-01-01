import '@testing-library/react-native';

jest.mock('@react-native-async-storage/async-storage', () => {
  const mock = {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => undefined),
    removeItem: jest.fn(async () => undefined),
    clear: jest.fn(async () => undefined),
  };

  return {
    __esModule: true,
    default: mock,
  };
});
