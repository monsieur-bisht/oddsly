import { useEffect, useState } from "react";
import { api } from "./api.js";

/** GET `path`; refetches when `path` or `reloadKey` changes. Ignores responses from stale requests. */
export function useApi(path, reloadKey = 0) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  useEffect(() => {
    let stale = false;
    setState((s) => ({ ...s, loading: true }));
    api(path)
      .then((data) => !stale && setState({ data, error: null, loading: false }))
      .catch((error) => !stale && setState({ data: null, error, loading: false }));
    return () => {
      stale = true;
    };
  }, [path, reloadKey]);
  return state;
}
