export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export const Ok = <T>(value: T): Result<T, never> => ({ ok: true, value });

export const Err = <E>(error: E): Result<never, E> => ({ ok: false, error });

export const map = <T, E, U>(r: Result<T, E>, f: (t: T) => U): Result<U, E> =>
  r.ok ? Ok(f(r.value)) : r;

export const flatMap = <T, E, U>(r: Result<T, E>, f: (t: T) => Result<U, E>): Result<U, E> =>
  r.ok ? f(r.value) : r;

export const mapError = <T, E, F>(r: Result<T, E>, f: (e: E) => F): Result<T, F> =>
  r.ok ? r : Err(f(r.error));

export const unwrap = <T, E>(r: Result<T, E>): T => {
  if (r.ok) return r.value;
  throw new Error(`Called unwrap on an Err value: ${JSON.stringify(r.error)}`);
};

export const unwrapOr = <T, E>(r: Result<T, E>, defaultValue: T): T =>
  r.ok ? r.value : defaultValue;

export const isOk = <T, E>(r: Result<T, E>): r is Extract<Result<T, E>, { ok: true }> => r.ok;

export const isErr = <T, E>(r: Result<T, E>): r is Extract<Result<T, E>, { ok: false }> => !r.ok;

export type AsyncResult<T, E> = Promise<Result<T, E>>;

export const mapAsync = async <T, E, U>(
  ar: AsyncResult<T, E>,
  f: (t: T) => U | Promise<U>,
): AsyncResult<U, E> => {
  const r = await ar;
  if (!r.ok) return r;
  const value = await f(r.value);
  return Ok(value);
};

export const flatMapAsync = async <T, E, U>(
  ar: AsyncResult<T, E>,
  f: (t: T) => AsyncResult<U, E>,
): AsyncResult<U, E> => {
  const r = await ar;
  return r.ok ? f(r.value) : r;
};
