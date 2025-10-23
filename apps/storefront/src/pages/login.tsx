import { useLocation, useNavigate } from "react-router-dom";
import UserLogin from "../components/molecules/UserLogin";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || "/";

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-semibold mb-4">Sign in</h1>
      <UserLogin
        onLogin={() => {
          navigate(from, { replace: true });
        }}
      />
    </div>
  );
}
