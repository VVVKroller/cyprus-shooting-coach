import { useEffect, useState } from "react";
import { auth } from "../../firebase/config";
import AdminLogin from "./AdminLogin";
import AdminPanel from "./AdminPanel";

export default function AdminRoute() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? <AdminPanel /> : <AdminLogin />;
}
