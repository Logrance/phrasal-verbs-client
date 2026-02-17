import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "./firebase";

export default function LoginPage() {
  const handleLogin = () => {
    signInWithPopup(auth, googleProvider).catch((err) => {
      console.error("Login failed", err);
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="text-3xl font-bold">Phrasal Verb Tutor</h1>
        <p className="text-slate-400">Sign in to start practicing</p>
        <button
          onClick={handleLogin}
          className="bg-white text-slate-900 font-medium px-6 py-3 rounded-lg hover:bg-slate-200 transition-colors"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
