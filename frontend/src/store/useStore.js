
export function createStore(initial) {
  let _state = { ...initial };
  const _listeners = new Set();

  function getState() {
    return _state;
  }

  function setState(patch) {
    _state =
      typeof patch === "function"
        ? { ..._state, ...patch(_state) }
        : { ..._state, ...patch };
    _listeners.forEach((fn) => fn(_state));
  }

  function subscribe(fn) {
    _listeners.add(fn);
    return () => _listeners.delete(fn);
  }

  return { getState, setState, subscribe };
}
