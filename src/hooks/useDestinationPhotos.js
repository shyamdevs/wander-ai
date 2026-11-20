import { useCallback, useEffect, useMemo, useState } from "react";
import { searchDestinationPhotos } from "../api/places";

const EMPTY = { photos: [], page: 0, hasMore: false, providers: [], failed: false };

export default function useDestinationPhotos({ name, destination, latitude, longitude }) {
  const query = useMemo(() => ({ name, destination, latitude, longitude }), [name, destination, latitude, longitude]);
  const [state, setState] = useState({ ...EMPTY, status: "idle", loadingMore: false });
  const [retryKey, setRetryKey] = useState(0);
  // Photos whose file failed to load. They are dropped so the next available photo takes their place.
  const [broken, setBroken] = useState(() => new Set());

  useEffect(() => {
    if (!query.name) return undefined;
    let active = true;
    setState({ ...EMPTY, status: "loading", loadingMore: false });
    setBroken(new Set());
    searchDestinationPhotos({ ...query, page: 1 })
      .then((data) => {
        if (!active) return;
        setState({
          photos: data.photos || [], page: data.page || 1, hasMore: Boolean(data.hasMore),
          providers: data.providers || [], failed: Boolean(data.providersUnavailable),
          status: "ready", loadingMore: false,
        });
      })
      .catch(() => { if (active) setState({ ...EMPTY, status: "error", failed: true, loadingMore: false }); });
    return () => { active = false; };
  }, [query, retryKey]);

  const loadMore = useCallback(async () => {
    if (state.loadingMore || !state.hasMore || state.page >= 10) return;
    setState((current) => ({ ...current, loadingMore: true }));
    try {
      const data = await searchDestinationPhotos({ ...query, page: state.page + 1 });
      setState((current) => {
        const seen = new Set(current.photos.map((photo) => photo.id || photo.uri));
        const more = (data.photos || []).filter((photo) => !seen.has(photo.id || photo.uri));
        return {
          ...current,
          photos: [...current.photos, ...more],
          page: data.page || current.page + 1,
          hasMore: Boolean(data.hasMore) && more.length > 0,
          providers: [...new Set([...current.providers, ...(data.providers || [])])],
          failed: current.failed && Boolean(data.providersUnavailable),
          loadingMore: false,
        };
      });
    } catch {
      setState((current) => ({ ...current, loadingMore: false, failed: current.photos.length === 0 }));
    }
  }, [query, state.hasMore, state.loadingMore, state.page]);

  const retry = useCallback(() => setRetryKey((value) => value + 1), []);

  const markBroken = useCallback((photo) => {
    const key = photo?.id || photo?.uri;
    if (!key) return;
    setBroken((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));
  }, []);
  const photos = useMemo(() => state.photos.filter((photo) => !broken.has(photo.id || photo.uri)), [state.photos, broken]);

  // Running low after removals: quietly fetch the next page so replacements keep coming.
  useEffect(() => {
    if (state.status === "ready" && photos.length < 6 && state.hasMore && !state.loadingMore && state.page < 10) loadMore();
  }, [state.status, photos.length, state.hasMore, state.loadingMore, state.page, loadMore]);

  return { ...state, photos, loadMore, retry, markBroken };
}
