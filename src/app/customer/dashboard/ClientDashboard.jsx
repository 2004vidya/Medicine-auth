"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { signOut } from "next-auth/react";

// --- Inline SVG Icons (Replacing Lucide for single-file implementation) ---

const SearchIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-5 h-5 text-gray-400"
  >
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const LoaderIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-5 h-5 animate-spin"
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
  </svg>
);

const CheckCircleIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

const XCircleIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="15" y1="9" x2="9" y2="15"></line>
    <line x1="9" y1="9" x2="15" y2="15"></line>
  </svg>
);

const HistoryIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

const StethoscopeIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11.3 7.8c-.3-.2-.6-.3-1-.3H4c-1.1 0-2 .9-2 2v1c0 1.1.9 2 2 2h3"></path>
    <path d="M19 12v3h2a1 1 0 0 0 0-2h-2"></path>
    <path d="M8 12h4"></path>
    <path d="M16 8h2a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2v3a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-3h-2"></path>
  </svg>
);

const ChevronRightIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="9 18 15 12 9 6"></polyline>
  </svg>
);

const WarningIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 512 512"
    fill="currentColor"
  >
    <path
      d="M256 32c14.2 0 27.3 7.5 34.5 19.8l216 368c7.3 12.4 7.3 27.7 .2 40.1S486.3 480 472 480H40c-14.3 0-27.6-7.7-34.7-20.1s-7-27.8 .2-40.1l216-368C228.7 39.5 241.8 32 256 32zm0 128c-13.3 0-24 10.7-24 24v112c0 13.3 10.7 24 24 24s24-10.7 24-24V184c0-13.3-10.7-24-24-24zm32 224a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z"
      fill="#FFD700"
    />
    <path
      d="M256 160c-13.3 0-24 10.7-24 24v112c0 13.3 10.7 24 24 24s24-10.7 24-24V184c0-13.3-10.7-24-24-24z"
      fill="#4A5568"
    />
    <circle cx="256" cy="384" r="32" fill="#4A5568" />
  </svg>
);

// --- Particle Background Component ---
const ParticleBackground = () => {
  const canvasRef = useRef(null);
  // Add useState to track if the canvas is ready
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const particles = [];
    const particleCount = 250;
    let animationFrameId;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      init();
    };

    class Particle {
      constructor() {
        // ⭐ MODIFICATION 1: Initial position is scattered across the whole screen
        this.scatter();
        this.prevX = this.x;
        this.prevY = this.y;
      }

      // Method to place the particle randomly within the visible screen area
      scatter() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.setProperties();
      }

      // Method to reset the particle off-screen (for continuous animation loop)
      reset() {
        // Decide whether to spawn from the top edge or the left edge
        if (Math.random() < 0.5) {
          // Spawn from top edge
          this.x = Math.random() * canvas.width;
          this.y = -50;
        } else {
          // Spawn from left edge
          this.x = -50;
          this.y = Math.random() * canvas.height;
        }
        this.setProperties();
      }

      // Helper to set speed and size, used by both scatter and reset
      setProperties() {
        // Give particles a random speed in a consistent direction for a slow-mo effect
        const speed = 0.8;
        this.speedX = (Math.random() * 0.5 + 0.5) * speed;
        this.speedY = (Math.random() * 0.5 + 0.5) * speed;

        // Reduce particle size
        this.size = Math.random() * 0.8 + 0.2;

        // Set previous position to current position to prevent long lines on initial placement or reset
        this.prevX = this.x;
        this.prevY = this.y;
      }

      update() {
        this.prevX = this.x;
        this.prevY = this.y;

        // Maintain the falling motion
        this.x += this.speedX;
        this.y += this.speedY;

        // "Teleport" particle back when it goes off-screen
        // When particles exit, they should re-enter from the top/left to maintain the flow
        if (this.x > canvas.width + 50 || this.y > canvas.height + 50) {
          this.reset();
        }
      }

      draw() {
        // Draw the main round particle head
        ctx.fillStyle = `rgba(255, 255, 255, ${this.size})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Draw the comet trail
        ctx.beginPath();
        ctx.strokeStyle = `rgba(255, 255, 255, ${this.size * 0.5})`;
        ctx.lineWidth = this.size;
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.prevX, this.prevY);
        ctx.stroke();
      }
    }

    const init = () => {
      particles.length = 0;
      for (let i = 0; i < particleCount; i++) {
        // When a particle is created, it calls 'this.scatter()' in its constructor,
        // placing it randomly on the screen.
        particles.push(new Particle());
      }

      // ⭐ CRUCIAL STEP 1: Synchronous Draw
      // Clear the canvas and draw the initial positions BEFORE the animate loop starts.
      // This ensures the particles are visible on the very first paint cycle.
      ctx.fillStyle = "rgba(0, 0, 0, 1)"; // Fully opaque black fill to ensure clear state
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => p.draw());

      // ⭐ CRUCIAL STEP: Signal that the first frame is complete
      // We only set the state if the canvas has actually been created/resized
      if (canvas.width > 0) {
        setIsReady(true);
      }
    };

    const animate = () => {
      // CRUCIAL STEP 2: The animation loop starts from the second frame.
      // We use a semi-transparent fill to create the subtle trail effect.
      ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        particle.update();
        particle.draw();
      });

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

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 z-0 bg-black transition-opacity duration-500
                ${isReady ? 'opacity-100' : 'opacity-0'}`}
      aria-hidden="true"
    />
  );
};
// --- End Particle Background Component ---

// --- MOCK DATA & API SIMULATION (Remains the same) ---

const MOCK_DB = [
  {
    name: "Paracetol",
    batchNumber: "A123456",
    expiryDate: "2026-10-01",
    ingredients: "Acetaminophen 500mg, Starch, Povidone",
    dosageForm: "Tablet",
    strength: "500mg",
  },
  {
    name: "Vitamax C",
    batchNumber: "B456789",
    expiryDate: "2025-05-15",
    ingredients: "Ascorbic Acid 1000mg, Citrus Bioflavonoids",
    dosageForm: "Effervescent Tablet",
    strength: "1000mg",
  },
  {
    name: "Amoxi-Plus",
    batchNumber: "C789012",
    expiryDate: "2027-01-20",
    ingredients: "Amoxicillin 250mg, Clavulanic Acid 125mg",
    dosageForm: "Capsule",
    strength: "375mg",
  },
];

/**
 * Simulates the fetch call to your Next.js API routes (e.g., /api/medicine/lookup).
 */
const fetchMedicineDetails = async (query) => {
  try {
    const res = await fetch(
      `/api/medicine/lookup?name=${encodeURIComponent(query)}`
    );
    if (!res.ok) throw new Error("Failed to fetch medicine");
    const data = await res.json();
    console.log("📦 Raw API Response:", data); // Debug log
    return data;
  } catch (err) {
    console.error("Error fetching medicine:", err);
    return { authentic: false, details: null, error: true };
  }
};

const HISTORY_KEY = "medicineSearchHistory";

// --- MAIN REACT COMPONENT ---

export default function ClientDashboard() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null); // { authentic: boolean, details: object | null }
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState([]);

  // 1. History Initialization (on mount)
  useEffect(() => {
    try {
      const historyJson = localStorage.getItem(HISTORY_KEY);
      if (historyJson) {
        setHistory(JSON.parse(historyJson));
      }
    } catch (e) {
      console.error("Could not load search history:", e);
    }
  }, []);

  // 2. History Persistence (on history change)
  useEffect(() => {
    try {
      // Keep only the last 10 unique searches
      const uniqueHistory = Array.from(new Set(history)).slice(0, 10);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(uniqueHistory));
    } catch (e) {
      console.error("Could not save search history:", e);
    }
  }, [history]);

  const addToHistory = useCallback((newQuery) => {
    if (!newQuery) return;
    setHistory((prevHistory) => {
      // Remove duplicates and put the new query at the front
      const updatedHistory = prevHistory.filter(
        (item) => item.toLowerCase() !== newQuery.toLowerCase()
      );
      return [newQuery, ...updatedHistory];
    });
  }, []);

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
    setResult(null);
    setQuery("");
  };

  /**
   * Handles the main medicine search process.
   * @param {string} searchInput - The query to search for (used for history recall).
   */
  const handleSearch = async (searchInput = query) => {
    const currentQuery = searchInput.trim();
    if (!currentQuery) {
      // Simple validation UI effect
      const inputEl = document.getElementById("searchInput");
      if (inputEl) {
        inputEl.classList.add("border-danger");
        setTimeout(() => inputEl.classList.remove("border-danger"), 1500);
      }
      return;
    }

    setIsLoading(true);
    setResult(null);
    setQuery(currentQuery);

    try {
      const apiResult = await fetchMedicineDetails(currentQuery);
      console.log("API Result:", apiResult); // Debug log
      setResult(apiResult);

      // Add to history if it's a valid search
      if (apiResult.authentic || apiResult.type === "disease") {
        addToHistory(currentQuery);
      } else {
        addToHistory(currentQuery);
      }
    } catch (error) {
      console.error("API Lookup Failed:", error);
      setResult({ authentic: false, details: null, error: true });
      addToHistory(currentQuery);
    } finally {
      setIsLoading(false);
    }
  };

  // --- RENDERING HELPERS ---

  const renderAuthStatus = () => {
    if (!result) return null;

    // Handle disease search - show info message
    if (result.type === "disease") {
      return (
        <div
          className="mt-6 p-4 rounded-lg shadow-md bg-blue-50 border-l-4 border-blue-500 text-blue-700"
          role="alert"
        >
          <div className="flex items-start">
            <div className="w-6 h-6 mr-3 mt-1 text-blue-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                />
              </svg>
            </div>
            <div>
              <p className="font-bold text-lg text-blue-800">
                Disease/Symptom Search
              </p>
              <p className="text-blue-600">
                Showing medicines that treat{" "}
                <span className="font-bold">{query}</span>.
                {result.medicines && result.medicines.length > 0
                  ? ` Found ${result.medicines.length} medicine(s).`
                  : " No medicines found."}
              </p>
            </div>
          </div>
        </div>
      );
    }

    // Handle similar medicines suggestions
    if (result.type === "similar") {
      return (
        <div
          className="mt-6 p-4 rounded-lg shadow-md bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700"
          role="alert"
        >
          <div className="flex items-start">
            <div className="w-6 h-6 mr-3 mt-1 text-yellow-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                />
              </svg>
            </div>
            <div>
              <p className="font-bold text-lg text-yellow-800">
                Similar Medicines Found
              </p>
              <p className="text-yellow-600 mb-3">
                No exact match for "<span className="font-bold">{query}</span>".
                Did you mean one of these medicines?
              </p>
              <div className="space-y-2">
                {result.suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearch(suggestion.name)}
                    className="block w-full text-left p-2 bg-yellow-100 hover:bg-yellow-200 rounded border border-yellow-300 transition-colors"
                  >
                    <div className="font-semibold text-yellow-800">{suggestion.name}</div>
                    <div className="text-sm text-yellow-600">
                      Batch: {suggestion.batchNumber} |
                      Similarity: {Math.round(suggestion.similarity)}% |
                      Match: {suggestion.matchField}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // Handle medicine authentication
    const isAuthentic = result.authentic;
    const name = result.details?.name || query;
    const icon = isAuthentic ? <CheckCircleIcon /> : <XCircleIcon />;
    const color = isAuthentic ? "primary" : "danger";
    const statusText = isAuthentic ? "Authentic" : "Fake / Not Found";
    const message = result.error
      ? `An internal error occurred during lookup. Please try again.`
      : isAuthentic
      ? `<span class="font-bold">${name}</span> is confirmed to be **Authentic** and matches database records.`
      : `**❌ WARNING:** The entered medicine (${name}) could not be validated against known records. It may be **Fake** or the batch number is incorrect. Consult a professional.`;

    return (
      <div
        className={`mt-6 p-4 rounded-lg shadow-md bg-${color}/10 border-l-4 border-${color} text-${color}-700`}
        role="alert"
      >
        <div className="flex items-start">
          <div className={`w-6 h-6 mr-3 mt-1 text-${color}`}>{icon}</div>
          <div>
            <p className={`font-bold text-lg text-${color}-800`}>
              {statusText}
            </p>
            {/* Dangerously set inner HTML for bolding/icon */}
            <p
              className={`text-${color}-600`}
              dangerouslySetInnerHTML={{ __html: message }}
            ></p>
          </div>
        </div>
      </div>
    );
  };

  const handleReportFake = async (query) => {
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      alert(data.message || "Report submitted successfully.");
    } catch (error) {
      console.error("Error reporting fake medicine:", error);
      alert("Failed to submit report. Please try again.");
    }
  };

  const flagMedicine = async (medicineId) => {
    
  
     
    if (!medicineId) {
      alert("Cannot flag medicine: Invalid medicine ID");
      return;
    }

    const reason = window.prompt(
      "Please provide a reason for flagging this medicine (optional):"
    );

    const confirmFlag = window.confirm(
      "Are you sure you want to mark this medicine as suspicious/fake? This will notify the manufacturer and authorities."
    );

    if (!confirmFlag) return;

    try {
      // Get session to get customer ID
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();

      if (!session || !session.user) {
        alert("You must be logged in to flag medicines.");
        return;
      }

      const res = await fetch("/api/medicine/flag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medicineId,
          customerId: session.user.id,
          reason: reason || "No reason provided",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || data.error || "Failed to flag medicine");
        return;
      }

      alert(
        data.message ||
          "Medicine has been flagged as suspicious. Thank you for reporting!"
      );
    } catch (error) {
      console.error("Error flagging medicine:", error);
      alert("Failed to flag medicine. Please try again.");
    }
  };

  const renderMedicineCard = () => {
    debugger
    if (!result) return null;

    // Handle disease search - show list of medicines
    if (result.type === "disease" && result.medicines) {
      return (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-800">
            💊 Found {result.medicines.length} medicine(s) for "{query}"
          </h3>
          {result.medicines.map((medicine, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-xl shadow-lg border border-gray-100"
            >
              <div className="flex items-center justify-between mb-4 border-b pb-3">
                <h2 className="text-2xl font-bold text-gray-800">
                  {medicine.name}
                </h2>
                <span className="px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800">
                  {medicine.strength}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-gray-600">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">
                    Batch Number
                  </p>
                  <p className="text-base font-semibold text-gray-700">
                    {medicine.batchNumber}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">
                    Expiry Date
                  </p>
                  <p className="text-base font-semibold text-gray-700">
                    {new Date(medicine.expiryDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <p className="text-sm font-medium text-gray-500">
                    Ingredients
                  </p>
                  <p className="text-base">
                    {medicine.ingredients || "Not specified"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">
                    Dosage Form
                  </p>
                  <p className="text-base text-gray-700">
                    {medicine.dosageForm || "Not specified"}
                  </p>
                </div>
                {medicine.diseases && medicine.diseases.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Treats</p>
                    <p className="text-base text-gray-700">
                      {medicine.diseases.join(", ")}
                    </p>
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">
                    Manufacturer
                  </p>
                  <p className="text-base text-gray-700">
                    {medicine.manufacturer?.name ||
                      medicine.manufacturer?.email ||
                      "Unknown"}
                  </p>
                </div>
              </div>

              {/* Flag Medicine Icon */}
              <div className="mt-4 pt-4 border-t border-gray-200 flex justify-center">
                <button
                  className="p-3 bg-yellow-400 hover:bg-yellow-500 rounded-full transition duration-150 ease-in-out shadow-lg"
                  onClick={() => flagMedicine(medicine.id)}
                  title="Mark as Suspicious/Fake"
                >
                  <WarningIcon className="w-6 h-6" />
                </button>
              </div>
            </div>
          ))}
        </div>
      );
    }

    // Handle similar medicines suggestions
    if (result.type === "similar" && result.suggestions) {
      return (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-800">
            🔍 Similar medicines found for "{query}"
          </h3>
          <p className="text-gray-600 mb-4">
            Click on any medicine below to view its details:
          </p>
          {result.suggestions.map((medicine, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 cursor-pointer hover:shadow-xl transition-shadow"
              onClick={() => handleSearch(medicine.name)}
            >
              <div className="flex items-center justify-between mb-4 border-b pb-3">
                <h2 className="text-2xl font-bold text-gray-800">
                  {medicine.name}
                </h2>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800">
                    {medicine.strength}
                  </span>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                    {Math.round(medicine.similarity)}% match
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-gray-600">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">
                    Batch Number
                  </p>
                  <p className="text-base font-semibold text-gray-700">
                    {medicine.batchNumber}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">
                    Expiry Date
                  </p>
                  <p className="text-base font-semibold text-gray-700">
                    {new Date(medicine.expiryDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <p className="text-sm font-medium text-gray-500">
                    Ingredients
                  </p>
                  <p className="text-base">{medicine.ingredients || "Not specified"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">
                    Dosage Form
                  </p>
                  <p className="text-base text-gray-700">
                    {medicine.dosageForm || "Not specified"}
                  </p>
                </div>
                {medicine.diseases && medicine.diseases.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Treats</p>
                    <p className="text-base text-gray-700">
                      {medicine.diseases.join(", ")}
                    </p>
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">
                    Manufacturer
                  </p>
                  <p className="text-base text-gray-700">
                    {medicine.manufacturer?.name || medicine.manufacturer?.email || "Unknown"}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                <p className="text-sm text-gray-500">
                  Click to search for this medicine
                </p>
                <button
                  className="p-3 bg-yellow-400 hover:bg-yellow-500 rounded-full transition duration-150 ease-in-out shadow-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    flagMedicine(medicine.id);
                  }}
                  title="Mark as Suspicious/Fake"
                >
                  <WarningIcon className="w-6 h-6" />
                </button>
              </div>
            </div>
          ))}
        </div>
      );
    }

    // Handle single medicine object (when searching by medicine name/batch)
    if (result.type === "medicine" && result.details) {
      const medicine = result.details;
      return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4 border-b pb-3">
            <h2 className="text-2xl font-bold text-gray-800">
              {medicine.name}
            </h2>
            <span className="px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800">
              {medicine.strength}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-gray-600">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Batch Number</p>
              <p className="text-base font-semibold text-gray-700">
                {medicine.batchNumber}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Expiry Date</p>
              <p className="text-base font-semibold text-gray-700">
                {new Date(medicine.expiryDate).toLocaleDateString()}
              </p>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <p className="text-sm font-medium text-gray-500">Ingredients</p>
              <p className="text-base">
                {medicine.ingredients || "Not specified"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Dosage Form</p>
              <p className="text-base text-gray-700">
                {medicine.dosageForm || "Not specified"}
              </p>
            </div>
            {medicine.diseases && medicine.diseases.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Treats</p>
                <p className="text-base text-gray-700">
                  {medicine.diseases.join(", ")}
                </p>
              </div>
            )}
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Manufacturer</p>
              <p className="text-base text-gray-700">
                {medicine.manufacturer?.name ||
                  medicine.manufacturer?.email ||
                  "Unknown"}
              </p>
            </div>
          </div>

          {/* Flag Medicine Icon */}
          <div className="mt-4 pt-4 border-t border-gray-200 flex justify-center">
            <button
              className="p-3 bg-yellow-400 hover:bg-yellow-500 rounded-full transition duration-150 ease-in-out shadow-lg"
              onClick={() => flagMedicine(medicine.id)}
              title="Mark as Suspicious/Fake"
            >
              <WarningIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  const isInitialState = !result && !isLoading && !query;

  return (
    // Outermost container is relative to position inner content wrapper
    <div className="font-sans relative min-h-screen">
      <ParticleBackground />

      {/* Tailwind Config Placeholder for Next.js - Normally in tailwind.config.js */}
      <style jsx global>{`
        /* Custom scrollbar for search history */
        #history-list::-webkit-scrollbar {
          width: 4px;
        }
        #history-list::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 2px;
        }
        #history-list::-webkit-scrollbar-track {
          background: #f3f4f6;
        }
        /* Defined colors for reference */
        .bg-primary {
          background-color: #10b981;
        }
        .hover\\:bg-emerald-600:hover {
          background-color: #059669;
        }
        .text-danger {
          color: #ef4444;
        }
        .border-danger {
          border-color: #ef4444;
        }
        .bg-danger\\/10 {
          background-color: rgba(239, 68, 68, 0.1);
        }
        .border-primary {
          border-color: #10b981;
        }
        .bg-primary\\/10 {
          background-color: rgba(16, 185, 129, 0.1);
        }
      `}</style>

      {/* Content Wrapper: Added flex utilities (flex, flex-col, justify-center) to vertically center the content */}
      <div className="relative z-10 min-h-screen p-4 sm:p-8 flex flex-col justify-center items-center">
        <div className="max-w-6xl w-full mx-auto">
          {/* Header: Increased bottom margin from mb-8 to mb-16 */}
          <header className="mb-16 text-center relative">
            {" "}
            {/* Added relative for button positioning */}
            <h1 className="text-3xl font-extrabold text-white">
              Medicine Validator Hub
            </h1>
            <p className="text-gray-300">
              Search, authenticate, and view details for your medication.
            </p>
            {/* Logout Button added at top-right */}
            <button
              onClick={() => signOut({ callbackUrl: "/auth", redirect: true })}
              className="absolute top-0 right-0 text-sm font-medium text-red-400 hover:text-red-500 transition duration-150 px-3 py-1 rounded-full border border-red-400 hover:bg-red-900/20"
            >
              Logout
            </button>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content: Search and Card (White components on black background) */}
            <main className="lg:col-span-2 space-y-8">
              {/* Search Component */}
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                <h2 className="text-xl font-semibold mb-4 text-gray-700">
                  Medicine Search & Authentication
                </h2>

                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-grow">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                      <SearchIcon />
                    </span>
                    <input
                      type="text"
                      id="searchInput"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      placeholder="Search by name or batch number (e.g., 'Paracetol' or 'B456')"
                      // Added text-gray-900 to ensure input text is clearly visible on the white background
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition duration-150 ease-in-out text-gray-900"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <button
                    id="searchButton"
                    onClick={() => handleSearch()}
                    className={`shrink-0 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-150 ease-in-out ${
                      isLoading
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-primary hover:bg-emerald-600"
                    }`}
                    disabled={isLoading}
                  >
                    <span id="buttonText" className={isLoading ? "hidden" : ""}>
                      Search
                    </span>
                    {isLoading && (
                      <LoaderIcon className="w-5 h-5 mx-auto text-white" />
                    )}
                  </button>
                </div>

                {/* Authentication Status Message */}
                {renderAuthStatus()}
              </div>

              {/* Medicine Information Card */}
              {result &&
                (result.type === "medicine" || result.type === "disease" || result.type === "similar") &&
                renderMedicineCard()}

              {/* Initial Message Card */}
              {isInitialState && (
                <div
                  id="initialMessage"
                  className="bg-blue-50 border border-blue-200 p-6 rounded-xl text-center"
                >
                  <StethoscopeIcon className="w-12 h-12 text-blue-500 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-blue-800">
                    Ready to Validate
                  </h3>
                  <p className="text-blue-600">
                    Enter a medicine name or batch number above to check its
                    authenticity and details.
                  </p>
                </div>
              )}
            </main>

            {/* Sidebar: Search History (White component on black background) */}
            <aside className="lg:col-span-1">
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 sticky top-4">
                <h2 className="text-xl font-semibold mb-4 text-gray-700 flex items-center">
                  <HistoryIcon className="w-5 h-5 mr-2 text-gray-500" />
                  Recent Searches
                </h2>

                <ul
                  id="history-list"
                  className="max-h-96 overflow-y-auto space-y-3"
                >
                  {history.length > 0 ? (
                    history.map((item, index) => (
                      <li
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer transition duration-150"
                        onClick={() => handleSearch(item)}
                      >
                        <span className="truncate text-gray-700">{item}</span>
                        <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                      </li>
                    ))
                  ) : (
                    <p
                      id="noHistoryMessage"
                      className="text-sm text-gray-400 italic"
                    >
                      No recent searches yet.
                    </p>
                  )}
                </ul>

                {history.length > 0 && (
                  <button
                    onClick={clearHistory}
                    className="mt-4 w-full text-sm text-center text-gray-500 hover:text-danger hover:bg-red-50 p-2 rounded-lg transition duration-150 ease-in-out"
                  >
                    Clear History
                  </button>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
