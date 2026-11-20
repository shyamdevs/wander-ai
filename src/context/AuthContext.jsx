import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import api, { getCsrfToken, onUnauthorized, setCsrfToken } from "../api/axios";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // The session cookie is invisible to JavaScript, so ask the server who we are once on load.
  const [loading, setLoading] = useState(true);

  const begin = useCallback(({ user: next, csrfToken }) => {
    setCsrfToken(csrfToken);
    setUser(next);
  }, []);
  const clear = useCallback(() => {
    setCsrfToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    let active = true;
    onUnauthorized(clear);
    api
      .get("/auth/me")
      .then((res) => active && begin(res.data))
      .catch(() => active && clear())
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
      onUnauthorized(null);
    };
  }, [begin, clear]);

  const value = useMemo(
    () => ({
      user,
      loading,
      login: async (email, password) =>
        begin((await api.post("/auth/login", { email, password })).data),
      signup: async (name, email, password) =>
        begin((await api.post("/auth/signup", { name, email, password })).data),
      // Sign out locally right away; the server call revokes the session everywhere.
     logout: async () => {
  const token = getCsrfToken();
  try {
    await api.post("/auth/logout", null, {
      headers: { "X-CSRF-Token": token },
    });
  } catch {
    /* cookie reh sakti hai; reload ke baad asli state dikhegi */
  }
  window.location.replace("/");
},
    }),
    [user, loading, begin, clear],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
