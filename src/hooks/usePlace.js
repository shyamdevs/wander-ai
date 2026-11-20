import { useEffect, useRef, useState } from "react";
import { lookupPlace } from "../api/places";

/**
 * Real provider-verified place data for a stop: status = loading | ready | notfound | unconfigured | error.
 * `onVerified(place)` updates saved coordinates only when an external provider verifies the place.
 */
export default function usePlace(stop, destination, onVerified) {
  const [state, setState] = useState({ status: "loading", data: null, error: "" });
  const cb = useRef(onVerified);
  cb.current = onVerified;
  const sid = stop?.sid;

  useEffect(() => {
    if (!stop) return;
    let dead = false;
    setState({ status: "loading", data: null, error: "" });
    lookupPlace(stop, destination)
      .then((data) => {
        if (dead) return;
        if (!data.found) return setState({ status: "notfound", data: null, error: "" });
        setState({ status: "ready", data, error: "" });
        if (data.verified && data.location) cb.current?.(data);
      })
      .catch((e) => {
        if (dead) return;
        setState({
          status: "error",
          data: null,
          error: e.response?.data?.message || "Couldn't load place details.",
        });
      });
    return () => { dead = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sid]);

  return state;
}
