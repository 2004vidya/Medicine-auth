"use client"; // 👈 Needed because we're using hooks + NextAuth client

import { useState, useEffect, useRef } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const ParticleBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let particles = [];
    let animationFrameId;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      createParticles();
    };

    const createParticles = () => {
      particles = [];
      const numParticles = 100;
      for (let i = 0; i < numParticles; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 1.5 + 0.5,
          speedX: (Math.random() - 0.5) * 0.2,
          speedY: (Math.random() - 0.5) * 0.2,
        });
      }
    };

    const drawParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const updateParticles = () => {
      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x < 0 || p.x > canvas.width) p.speedX *= -1;
        if (p.y < 0 || p.y > canvas.height) p.speedY *= -1;
      });
    };

    const animate = () => {
      updateParticles();
      drawParticles();
      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0" />;
};

const AuthForm = ({ type, role, setRole, onToggleType }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { data: session } = useSession();
  const router = useRouter();

  const isLogin = type === "login";

  // Redirect based on role when session is available
  useEffect(() => {
    if (session?.user?.role) {
      const userRole = session.user.role;
      if (userRole === "MANUFACTURER") {
        router.push("/manufacturer/dashboard");
      } else if (userRole === "CUSTOMER") {
        router.push("/customer/dashboard");
      }
    }
  }, [session, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isLogin) {
      // 🔑 Login with credentials
      const res = await signIn("credentials", {
        redirect: false, // Handle redirect manually
        email,
        password,
      });

      if (res?.error) {
        alert(res.error);
      } else if (res?.ok) {
        // Force a session refresh and redirect
        window.location.href = role === "MANUFACTURER" ? "/manufacturer/dashboard" : "/customer/dashboard";
      }
    } else {
      // 🔑 Signup API (custom endpoint to register user in DB)
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role: role.toUpperCase() }),
      });

      if (res.ok) {
        alert("Signup successful! Please login.");
        onToggleType(); // Switch back to login mode
      } else {
        const data = await res.json();
        alert(data.error || "Signup failed");
      }
    }
  };

  const handleGoogleLogin = async () => {
    // Set the pending role in a cookie that the server can read during OAuth callback
    await fetch("/api/auth/set-pending-role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: role.toUpperCase() }),
    });

    // Small delay to ensure cookie is set
    await new Promise(resolve => setTimeout(resolve, 100));

    // Now proceed with Google sign-in
    await signIn("google", {
      callbackUrl: role === "MANUFACTURER" ? "/manufacturer/dashboard" : "/customer/dashboard"
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
      <div className="flex justify-center space-x-4">
        <button
          type="button"
          onClick={() => setRole("CUSTOMER")}
          className={`py-2 px-4 rounded-full transition-colors duration-300 ${
            role === "CUSTOMER"
              ? "bg-orange-500 text-white"
              : "bg-[#1a1a1a] text-gray-300 hover:bg-[#333333]"
          }`}
        >
          Customer
        </button>
        <button
          type="button"
          onClick={() => setRole("MANUFACTURER")}
          className={`py-2 px-4 rounded-full transition-colors duration-300 ${
            role === "MANUFACTURER"
              ? "bg-orange-500 text-white"
              : "bg-[#1a1a1a] text-gray-300 hover:bg-[#333333]"
          }`}
        >
          Manufacturer
        </button>
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-300 mb-1"
        >
          Email Address
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 bg-[#1a1a1a] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
          placeholder={`${
            role === "CUSTOMER" ? "customer" : "manager"
          }@zoiq.io`}
          required
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-300 mb-1"
        >
          Password
        </label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 bg-[#1a1a1a] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
          placeholder="********"
          required
        />
      </div>

      <button
        type="submit"
        className="w-full py-3 mt-4 text-white font-semibold rounded-lg shadow-lg
        bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600
        transition-all duration-300 transform hover:scale-105"
      >
        {isLogin ? "Login to portal" : "Sign up"}
      </button>

      {/* Google Login Button */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        className="w-full py-3 mt-2 text-white font-semibold rounded-lg shadow-lg
        bg-blue-500 hover:bg-blue-600 transition-all duration-300 transform hover:scale-105"
      >
        Continue with Google
      </button>

      <div className="text-center text-sm">
        <button
          type="button"
          onClick={onToggleType}
          className="text-gray-400 hover:text-white transition-colors duration-300 underline"
        >
          {isLogin
            ? "Don't have an account? Sign up"
            : "Already have an account? Login"}
        </button>
        {isLogin && (
          <div className="mt-2">
            <a
              href="#"
              className="text-gray-400 hover:text-white transition-colors duration-300 underline"
            >
              Forgot password?
            </a>
          </div>
        )}
      </div>
    </form>
  );
};

export default function Home() {
  const [authType, setAuthType] = useState("login"); // 'login' or 'signup'
  const [role, setRole] = useState("CUSTOMER"); // 'CUSTOMER' or 'MANUFACTURER'

  const handleToggleType = () => {
    setAuthType(authType === "login" ? "signup" : "login");
  };

  return (
    <div className="min-h-screen bg-[#000000] flex items-center justify-center text-white p-4">
      <ParticleBackground />
      <div
        className="relative z-10 p-8 md:p-12 bg-[#121212] rounded-2xl shadow-2xl w-full max-w-sm md:max-w-md
                      border border-[#333333] backdrop-filter backdrop-blur-sm bg-opacity-70"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold">
            Welcome to Medicine-Auth
          </h1>
          <p className="mt-2 text-gray-400">
            Login to verify medicine authenticity.
          </p>
        </div>
        <AuthForm
          type={authType}
          role={role}
          setRole={setRole}
          onToggleType={handleToggleType}
        />
      </div>
    </div>
  );
}
