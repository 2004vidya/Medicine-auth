"use client";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function DeleteUserPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [confirmEmail, setConfirmEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDeleteUser = async () => {
    if (!session?.user?.email) {
      setMessage("❌ No user session found");
      return;
    }

    if (confirmEmail !== session.user.email) {
      setMessage("❌ Email doesn't match. Please type your email correctly.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete your account? This cannot be undone!")) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/user/delete", {
        method: "DELETE",
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("✅ Account deleted successfully! Redirecting to home...");
        setTimeout(async () => {
          await signOut({ callbackUrl: "/" });
        }, 2000);
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl mb-4">Please login first</h1>
          <button
            onClick={() => router.push("/auth")}
            className="bg-blue-500 px-6 py-2 rounded hover:bg-blue-600"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] p-8 rounded-lg max-w-md w-full">
        <h1 className="text-3xl font-bold mb-6 text-center text-red-500">Delete Account</h1>
        
        <div className="mb-6 p-4 bg-red-900/20 border border-red-500 rounded-lg">
          <p className="text-red-400 text-sm">
            ⚠️ Warning: This action cannot be undone. All your data will be permanently deleted.
          </p>
        </div>

        <div className="mb-6">
          <p className="text-gray-400 mb-2">Current Email:</p>
          <p className="text-white font-semibold">{session.user.email}</p>
        </div>

        <div className="mb-6">
          <p className="text-gray-400 mb-2">Current Role:</p>
          <p className="text-white font-semibold">{session.user.role}</p>
        </div>

        <div className="mb-6">
          <label className="block text-gray-400 mb-2">
            Type your email to confirm deletion:
          </label>
          <input
            type="email"
            value={confirmEmail}
            onChange={(e) => setConfirmEmail(e.target.value)}
            placeholder={session.user.email}
            className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <button
          onClick={handleDeleteUser}
          disabled={loading || confirmEmail !== session.user.email}
          className="w-full py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 disabled:bg-gray-600 disabled:cursor-not-allowed transition"
        >
          {loading ? "Deleting..." : "Delete My Account"}
        </button>

        {message && (
          <div className="mt-4 p-4 bg-gray-800 rounded-lg text-center">
            {message}
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={() => router.push("/")}
            className="text-gray-400 hover:text-white transition"
          >
            ← Cancel and Go Back
          </button>
        </div>
      </div>
    </div>
  );
}

