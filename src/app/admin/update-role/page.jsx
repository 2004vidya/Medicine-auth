"use client";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function UpdateRolePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdateRole = async () => {
    if (!selectedRole) {
      setMessage("Please select a role");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/user/update-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newRole: selectedRole }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(`✅ Role updated to ${selectedRole}! Please logout and login again.`);
        // Wait 2 seconds then sign out
        setTimeout(async () => {
          await signOut({ callbackUrl: "/auth" });
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
        <h1 className="text-3xl font-bold mb-6 text-center">Update Your Role</h1>
        
        <div className="mb-6">
          <p className="text-gray-400 mb-2">Current Email:</p>
          <p className="text-white font-semibold">{session.user.email}</p>
        </div>

        <div className="mb-6">
          <p className="text-gray-400 mb-2">Current Role:</p>
          <p className="text-white font-semibold">{session.user.role}</p>
        </div>

        <div className="mb-6">
          <label className="block text-gray-400 mb-2">Select New Role:</label>
          <div className="flex gap-4">
            <button
              onClick={() => setSelectedRole("CUSTOMER")}
              className={`flex-1 py-3 rounded-lg font-semibold transition ${
                selectedRole === "CUSTOMER"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              Customer
            </button>
            <button
              onClick={() => setSelectedRole("MANUFACTURER")}
              className={`flex-1 py-3 rounded-lg font-semibold transition ${
                selectedRole === "MANUFACTURER"
                  ? "bg-orange-500 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              Manufacturer
            </button>
          </div>
        </div>

        <button
          onClick={handleUpdateRole}
          disabled={loading || !selectedRole}
          className="w-full py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed transition"
        >
          {loading ? "Updating..." : "Update Role"}
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
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

