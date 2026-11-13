import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '../utils/formatters';

/**
 * Runs an API call (returning an axios promise) whenever `deps` change.
 * Ignores out-of-order responses. Returns { data, pagination, loading, error, reload }.
 */
export default function useFetch(fetcher, deps = []) {
  const [state, setState] = useState({ data: null, pagination: null, loading: true, error: '' });
  const callId = useRef(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(async () => {
    const id = ++callId.current;
    setState((s) => ({ ...s, loading: true, error: '' }));
    try {
      const res = await fetcher();
      if (id === callId.current) setState({ data: res.data.data, pagination: res.data.pagination || null, loading: false, error: '' });
    } catch (err) {
      if (id === callId.current) setState({ data: null, pagination: null, loading: false, error: getErrorMessage(err) });
    }
  }, deps);

  useEffect(() => {
    run();
  }, [run]);

  return { ...state, reload: run };
}
