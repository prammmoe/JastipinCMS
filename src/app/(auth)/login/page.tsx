import { LoginForm } from "@/features/auth/login-form";
import { getApplicationName } from "@/server/deployment";

export default function LoginPage() {
  return <LoginForm applicationName={getApplicationName()} />;
}
