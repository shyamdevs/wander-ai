import { useCallback, useState } from "react";
import api from "../api/axios";

const msg = (e) => e.response?.data?.message || "Something went wrong. Please try again.";

// Saved trips: list, save/update, open, delete, duplicate, share link
export default function useTripStorage({ plan, savedId, setSavedId, dirty, setDirty, show, setStatus, toast }) {
  const [trips, setTrips] = useState([]);

  const loadTrips = useCallback(async () => {
    try { setTrips((await api.get("/trips")).data.trips); } catch { /* non-critical */ }
  }, []);

  const save = async () => {
    if (!plan) return null;
    setStatus("saving");
    try {
      let id = savedId;
      if (savedId) await api.put(`/trips/${savedId}`, plan);
      else { id = (await api.post("/trips", plan)).data.trip._id; setSavedId(id); }
      setDirty(false);
      await loadTrips();
      toast.success(savedId ? "Trip updated." : "Trip saved to your account.");
      return id;
    } catch (e) {
      toast.error(msg(e));
      return null;
    } finally {
      setStatus("idle");
    }
  };

  const openTrip = async (id) => {
    try {
      const { data } = await api.get(`/trips/${id}`);
      show(data.trip, data.trip._id);
    } catch (e) { toast.error(msg(e)); }
  };

  const removeTrip = async (id) => {
    try {
      await api.delete(`/trips/${id}`);
      setTrips((t) => t.filter((x) => x._id !== id));
      if (savedId === id) setSavedId(null);
      toast.success("Trip deleted.");
    } catch (e) { toast.error(msg(e)); }
  };

  const duplicateTrip = async (id) => {
    try {
      const { data } = await api.post(`/trips/${id}/duplicate`);
      await loadTrips();
      toast.success(`Duplicated as “${data.trip.title}”.`);
    } catch (e) { toast.error(msg(e)); }
  };

  // Saves first (so the link shows the latest version), then creates + copies the link
  const shareTrip = async () => {
    let id = savedId;
    if (!id || dirty) id = await save();
    if (!id) return;
    try {
      const { shareId } = (await api.post(`/trips/${id}/share`)).data;
      const url = `${window.location.origin}/shared/${shareId}`;
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Share link copied. Anyone with it can view (not edit) this trip.");
      } catch {
        toast.info(`Share link: ${url}`);
      }
    } catch (e) { toast.error(msg(e)); }
  };

  return { trips, setTrips, loadTrips, save, openTrip, removeTrip, duplicateTrip, shareTrip };
}
