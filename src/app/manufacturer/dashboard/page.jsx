"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

// ParticleBackground component code is omitted for brevity but is assumed to be correct
// as provided in the user's prompt.
const ParticleBackground = () => {
    const canvasRef = useRef(null);
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
                this.scatter(); // Initial scatter (assuming the fix was applied here)
                this.prevX = this.x;
                this.prevY = this.y;
            }

            // Scatter method from previous solution for seamless start
            scatter() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.setProperties();
            }

            // Reset method from previous solution (for when particles go off screen)
            reset() {
                if (Math.random() < 0.5) {
                    this.x = Math.random() * canvas.width;
                    this.y = -50;
                } else {
                    this.x = -50;
                    this.y = Math.random() * canvas.height;
                }
                this.setProperties();
            }

            // Helper to set speed and size, used by both scatter and reset
            setProperties() {
                const speed = 0.8;
                this.speedX = (Math.random() * 0.5 + 0.5) * speed;
                this.speedY = (Math.random() * 0.5 + 0.5) * speed;
                this.size = Math.random() * 0.8 + 0.2;
                this.prevX = this.x;
                this.prevY = this.y;
            }

            update() {
                this.prevX = this.x;
                this.prevY = this.y;
                this.x += this.speedX;
                this.y += this.speedY;
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
                particles.push(new Particle());
            }

            // CRUCIAL STEP 1: Synchronous Draw
            ctx.fillStyle = "rgba(0, 0, 0, 1)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            particles.forEach((p) => p.draw());

            // CRUCIAL STEP: Signal that the first frame is complete
            if (canvas.width > 0) {
                setIsReady(true);
            }
        };

        const animate = () => {
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
            className={`absolute inset-0 z-0 bg-black transition-opacity duration-500
                ${isReady ? 'opacity-100' : 'opacity-0'}`}
            aria-hidden="true"
        />
    );
};

// Real flagged medicines data is now fetched from the API

const ManufacturerDashboard = () => {
    // ... (All existing state variables for adding new medicine remain here)
    const [medicineName, setMedicineName] = useState("");
    const [batchNumber, setBatchNumber] = useState("");
    const [expiryDate, setExpiryDate] = useState("");
    const [ingredients, setIngredients] = useState("");
    const [dosageForm, setDosageForm] = useState("");
    const [strength, setStrength] = useState("");
    const [diseases, setDiseases] = useState("");

    const [medicines, setMedicines] = useState([]);
    // ⭐ NEW STATE for Flagged Medicines
    const [flaggedMedicines, setFlaggedMedicines] = useState([]); 

    const [showForm, setShowForm] = useState(false);
    const router = useRouter();
    
    // Function to generate a UUID (auto-generated unique identifier)
    const generateUUID = () => {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
            /[xy]/g,
            function (c) {
                var r = (Math.random() * 16) | 0,
                    v = c === "x" ? r : (r & 0x3) | 0x8;
                return v.toString(16);
            }
        );
    };

    const handleLogout = async () => {
        // If you're using next-auth, you'd call signOut()
        // For now just redirect to home
        signOut({
            callbackUrl: "/auth",
            redirect: true,
        });
    };

    const handleDeleteMedicine = async (medicineId) => {
        if (
            !window.confirm(
                "Are you sure you want to delete this medicine? This action cannot be undone."
            )
        ) {
            return;
        }

        try {
            const res = await fetch(`/api/medicine/delete?id=${medicineId}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to delete medicine");
            }

            // Remove from local state
            setMedicines((prev) => prev.filter((med) => med.id !== medicineId));
            alert("Medicine deleted successfully!");
        } catch (error) {
            console.error("Error deleting medicine:", error);
            alert(`Failed to delete medicine: ${error.message}`);
        }
    };

    const handleAddMedicine = async (e) => {
        e.preventDefault();
        const uniqueId = generateUUID();
        const verificationUrl = `https://yourapp.com/verify/${uniqueId}`;

        // Generate QR code image URL using a public API
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
            verificationUrl
        )}`;

        const newMedicine = {
            id: uniqueId,
            name: medicineName,
            batchNo: batchNumber,
            expiry: expiryDate,
            ingredients: ingredients,
            dosageForm: dosageForm,
            strength: strength,
            diseases: diseases.split(",").map((d) => d.trim().toLowerCase()),
            verificationUrl: verificationUrl,
            qrCodeUrl: qrCodeUrl,
        };

        // Debug: Check what we're sending
        console.log("Saving to backend:", newMedicine);
        console.log("batchNumber value:", batchNumber);
        console.log("batchNo in object:", newMedicine.batchNo);

        try {
            const res = await fetch("/api/medicine", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newMedicine),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
            }

            const savedMedicine = await res.json();
            console.log("Saved medicine:", savedMedicine); // Debug log

            setMedicines((prev) => [savedMedicine, ...prev]);
            setShowForm(false); // Hide the form after successful creation

            // Reset form fields
            setMedicineName("");
            setBatchNumber("");
            setExpiryDate("");
            setIngredients("");
            setDosageForm("");
            setStrength("");
            setDiseases("");
        } catch (error) {
            console.error("Error saving medicine:", error);
            alert(`Failed to save medicine: ${error.message}`);
        }
    };

    const handleNameBlur = async () => {
        if (!medicineName) return;

        try {
            console.log("🔍 Autofilling details for:", medicineName);
            const res = await fetch(
                `/api/medicine/autofill?name=${encodeURIComponent(medicineName)}`
            );
            const data = await res.json();

            if (data.error) {
                console.error("Autofill error:", data.error);
            }

            // Autofill the fields
            setIngredients(data.ingredients || "");
            setDosageForm(data.dosageForm || "");
            setStrength(data.strength || "");
            setDiseases(data.diseases || "");

            console.log("✅ Autofilled:", data);
        } catch (error) {
            console.error("Failed to autofill medicine details:", error);
        }
    };

    const handleResolveFlag = async (flagId, medicineName) => {
        const confirmResolve = window.confirm(
            `Are you sure you want to mark the flag for "${medicineName}" as resolved? This will remove it from your flagged medicines list.`
        );

        if (!confirmResolve) return;

        try {
            const res = await fetch("/api/medicine/flagged", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ flagId }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to resolve flag");
            }

            // Remove from local state
            setFlaggedMedicines((prev) => prev.filter((flag) => flag.id !== flagId));
            alert("Flag resolved successfully!");
        } catch (error) {
            console.error("Error resolving flag:", error);
            alert(`Failed to resolve flag: ${error.message}`);
        }
    };

    // Simplified useEffect to fetch all dashboard data
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // 1. Fetch regular medicines
                const medRes = await fetch("/api/medicine");
                if (medRes.ok) {
                    const medData = await medRes.json();
                    setMedicines(medData);
                }

                // 2. ⭐ Fetch flagged medicines from real API
                const flaggedRes = await fetch("/api/medicine/flagged");
                if (flaggedRes.ok) {
                    const flaggedData = await flaggedRes.json();
                    console.log("📋 Fetched flagged medicines:", flaggedData);
                    setFlaggedMedicines(flaggedData);
                } else {
                    console.error("Failed to fetch flagged medicines");
                    setFlaggedMedicines([]); // Set empty array if fetch fails
                }
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            }
        };

        fetchDashboardData();
    }, []);


    // --- Flagged Medicines List Component ---
    const FlaggedMedicineList = () => (
        <div className="mt-12 w-full">
            <h2 className="text-3xl font-bold text-red-400 mb-6 flex items-center">
                <span role="img" aria-label="flag" className="mr-2">🚩</span> Flagged Medicines
            </h2>
            <p className="text-gray-400 mb-4">
                Review all products flagged by customers for verification failures or quality concerns.
            </p>

            {flaggedMedicines.length === 0 ? (
                <div className="bg-[#1a1a1a] p-6 rounded-lg text-center border border-green-500">
                    <p className="text-green-400 font-semibold">
                        ✅ No flagged medicines! All clear.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {flaggedMedicines.map((item) => (
                        <div key={item.id} className="bg-[#1a1a1a] p-6 rounded-lg border border-red-500/50 shadow-xl">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-red-300 mb-1">
                                        {item.medicineName}
                                        <span className="text-base text-gray-500 font-normal ml-2">
                                            (Batch: {item.batchNumber})
                                        </span>
                                    </h3>
                                    {item.strength && (
                                        <p className="text-sm text-gray-400">Strength: {item.strength}</p>
                                    )}
                                </div>
                                <span className="px-2 py-1 text-xs bg-red-600 text-white rounded">
                                    FLAGGED
                                </span>
                            </div>

                            <div className="mb-4">
                                <p className="text-sm text-gray-400 mb-1">Reason for flagging:</p>
                                <p className="text-gray-300 italic bg-gray-800 p-2 rounded">
                                    "{item.reason || 'No reason provided'}"
                                </p>
                            </div>

                            {/* Medicine Details */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 text-sm">
                                {item.ingredients && (
                                    <div>
                                        <p className="text-gray-400">Ingredients:</p>
                                        <p className="text-gray-300">{item.ingredients}</p>
                                    </div>
                                )}
                                {item.dosageForm && (
                                    <div>
                                        <p className="text-gray-400">Dosage Form:</p>
                                        <p className="text-gray-300">{item.dosageForm}</p>
                                    </div>
                                )}
                                {item.diseases && item.diseases.length > 0 && (
                                    <div className="sm:col-span-2">
                                        <p className="text-gray-400">Treats:</p>
                                        <p className="text-gray-300">{item.diseases.join(", ")}</p>
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-gray-700 pt-3 flex justify-between text-sm mb-4">
                                <div>
                                    <p className="text-yellow-400 font-medium">
                                        Customer: {item.customerName}
                                    </p>
                                    <p className="text-gray-500">
                                        Email: {item.customerEmail || 'Not provided'}
                                    </p>
                                </div>
                                <p className="text-gray-500 self-end">
                                    Flagged: {new Date(item.flaggedAt).toLocaleDateString()}
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    className="flex-1 py-2 bg-green-600 rounded-md text-white font-semibold hover:bg-green-700 transition-colors"
                                    onClick={() => handleResolveFlag(item.id, item.medicineName)}
                                >
                                    ✅ Mark as Resolved
                                </button>
                                <button
                                    className="flex-1 py-2 bg-yellow-600 rounded-md text-white font-semibold hover:bg-yellow-700 transition-colors"
                                    onClick={() => alert(`Investigating batch ${item.batchNumber} for issue: ${item.reason}`)}
                                >
                                    🔍 Investigate
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
    // ----------------------------------------


    return (
        <div className="relative min-h-screen bg-[#000000] text-white p-4 overflow-hidden">
            <ParticleBackground />

            <div className="relative z-10 p-8 md:p-12 w-full max-w-5xl mx-auto h-full flex flex-col items-center">
                <div className="w-full flex justify-end mb-8">
                    <button
                        onClick={handleLogout}
                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
                    >
                        Logout
                    </button>
                </div>

                <div className="text-center mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold">
                        Manufacturer Dashboard
                    </h1>
                    <p className="mt-2 text-gray-400">
                        Manage your products and monitor customer feedback.
                    </p>
                </div>

                {/* ⭐ 1. FLAGGED MEDICINES SECTION (PLACED PROMINENTLY) */}
                <FlaggedMedicineList />
                {/* --- */}

                {/* 2. Add New Medicine Button/Form Section */}
                {/* ... (Existing code for Add New Medicine form/button remains here) */}
                 {!showForm && (
                     <div className="text-center my-8">
                         <h2 className="text-xl md:text-2xl font-semibold mb-4">
                             Ready to add a new product?
                         </h2>
                         <button
                             onClick={() => setShowForm(true)}
                             className="py-3 px-8 text-white font-semibold rounded-lg shadow-lg
                             bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600
                             transition-all duration-300 transform hover:scale-105"
                         >
                             Add New Medicine
                         </button>
                     </div>
                 )}

                 {showForm && (
                     <div className="bg-[#1a1a1a] p-6 rounded-lg mb-8 w-full max-w-4xl">
                         <h2 className="text-2xl font-semibold mb-4">Add New Medicine</h2>
                         {/* ... form content here ... */}
                         <form
                             onSubmit={handleAddMedicine}
                             className="grid grid-cols-1 md:grid-cols-2 gap-4"
                         >
                             {/* ... all form fields (medicineName, batchNumber, etc.) ... */}
                             <div>
                                 <label htmlFor="medicineName" className="block text-sm font-medium text-gray-300 mb-1">Medicine Name</label>
                                 <input type="text" id="medicineName" value={medicineName} onChange={(e) => setMedicineName(e.target.value)} onBlur={handleNameBlur} className="w-full px-4 py-2 bg-[#2a2a2a] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" required />
                             </div>
                             <div>
                                 <label htmlFor="batchNumber" className="block text-sm font-medium text-gray-300 mb-1">Batch Number</label>
                                 <input type="text" id="batchNumber" value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)} className="w-full px-4 py-2 bg-[#2a2a2a] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" required />
                             </div>
                             <div>
                                 <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-300 mb-1">Expiry Date</label>
                                 <input type="date" id="expiryDate" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="w-full px-4 py-2 bg-[#2a2a2a] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" required />
                             </div>
                             <div>
                                 <label htmlFor="ingredients" className="block text-sm font-medium text-gray-300 mb-1">Ingredients</label>
                                 <input type="text" id="ingredients" value={ingredients} onChange={(e) => setIngredients(e.target.value)} className="w-full px-4 py-2 bg-[#2a2a2a] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" required />
                             </div>
                             <div>
                                 <label htmlFor="dosageForm" className="block text-sm font-medium text-gray-300 mb-1">Dosage Form (e.g., Tablet, Syrup)</label>
                                 <input type="text" id="dosageForm" value={dosageForm} onChange={(e) => setDosageForm(e.target.value)} className="w-full px-4 py-2 bg-[#2a2a2a] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" required />
                             </div>
                             <div>
                                 <label htmlFor="strength" className="block text-sm font-medium text-gray-300 mb-1">Strength (e.g., 500mg, 10ml)</label>
                                 <input type="text" id="strength" value={strength} onChange={(e) => setStrength(e.target.value)} className="w-full px-4 py-2 bg-[#2a2a2a] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" required />
                             </div>
                             <div className="md:col-span-2">
                                 <label htmlFor="diseases" className="block text-sm font-medium text-gray-300 mb-1">Diseases/Symptoms (e.g., Cold, Cough, Fever)</label>
                                 <input type="text" id="diseases" value={diseases} onChange={(e) => setDiseases(e.target.value)} className="w-full px-4 py-2 bg-[#2a2a2a] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" required />
                             </div>


                             <button
                                 type="submit"
                                 className="md:col-span-2 py-3 mt-4 text-white font-semibold rounded-lg shadow-lg
                                 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600
                                 transition-all duration-300 transform hover:scale-105"
                             >
                                 Add Medicine & Generate QR Code
                             </button>
                         </form>
                     </div>
                 )}

                {/* 3. List of Added Medicines Section */}
                <div className="mt-8 w-full">
                    <h2 className="text-2xl font-semibold mb-4">Added Medicines</h2>
                    {/* ... (Existing code for displaying added medicines remains here) ... */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {medicines.length === 0 ? (
                            <p className="text-gray-400 md:col-span-2 text-center">
                                No medicines added yet.
                            </p>
                        ) : (
                            medicines.map((medicine, index) => (
                                <div
                                    key={medicine.id || `medicine-${index}`}
                                    className="bg-[#1a1a1a] p-6 rounded-lg flex flex-col items-center"
                                >
                                    <img
                                        src={medicine.qrCodeUrl}
                                        alt={`QR Code for ${medicine.name}`}
                                        className="mb-4 w-36 h-36"
                                    />
                                    <div className="text-center">
                                        <h3 className="text-lg font-bold">{medicine.name}</h3>
                                        <p className="text-sm text-gray-400">
                                            Batch: {medicine.batchNumber}
                                        </p>
                                        <p className="text-sm text-gray-400">
                                            Expiry:{" "}
                                            {new Date(medicine.expiryDate).toLocaleDateString()}
                                        </p>
                                        {medicine.ingredients && (
                                            <p className="text-sm text-gray-400">
                                                Ingredients: {medicine.ingredients}
                                            </p>
                                        )}
                                        {medicine.dosageForm && (
                                            <p className="text-sm text-gray-400">
                                                Dosage Form: {medicine.dosageForm}
                                            </p>
                                        )}
                                        {medicine.strength && (
                                            <p className="text-sm text-gray-400">
                                                Strength: {medicine.strength}
                                            </p>
                                        )}
                                        {medicine.diseases && medicine.diseases.length > 0 && (
                                            <p className="text-sm text-gray-400">
                                                Treats: {Array.isArray(medicine.diseases) ? medicine.diseases.join(", ") : medicine.diseases}
                                            </p>
                                        )}
                                        <p className="text-xs text-gray-500 mt-2 break-all">
                                            ID: {medicine.id}
                                        </p>
                                        <div className="flex gap-2 mt-4">
                                            <button
                                                onClick={() => window.print()}
                                                className="px-4 py-2 rounded-full text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                                            >
                                                Print QR
                                            </button>
                                            <button
                                                onClick={() => handleDeleteMedicine(medicine.id)}
                                                className="px-4 py-2 rounded-full text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManufacturerDashboard;
// "use client";
// import { useState, useEffect, useRef } from "react";
// import { useRouter } from "next/navigation";
// import { signOut } from "next-auth/react";

// // Move ParticleBackground outside the main component to prevent re-creation
// const ParticleBackground = () => {
//   const canvasRef = useRef(null);
//   // Add useState to track if the canvas is ready
//   const [isReady, setIsReady] = useState(false);

//   useEffect(() => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;

//     const ctx = canvas.getContext("2d");
//     const particles = [];
//     const particleCount = 250;
//     let animationFrameId;

//     const resizeCanvas = () => {
//       canvas.width = window.innerWidth;
//       canvas.height = window.innerHeight;
//       init();
//     };

//     class Particle {
//       constructor() {
//         this.reset();
//         this.prevX = this.x;
//         this.prevY = this.y;
//       }

//       reset() {
//         // Decide whether to spawn from the top edge or the left edge
//         if (Math.random() < 0.5) {
//           // Spawn from top edge
//           this.x = Math.random() * canvas.width;
//           this.y = -50;
//         } else {
//           // Spawn from left edge
//           this.x = -50;
//           this.y = Math.random() * canvas.height;
//         }

//         // Give particles a random speed in a consistent direction for a slow-mo effect
//         const speed = 0.8;
//         this.speedX = (Math.random() * 0.5 + 0.5) * speed;
//         this.speedY = (Math.random() * 0.5 + 0.5) * speed;

//         // Reduce particle size
//         this.size = Math.random() * 0.8 + 0.2;

//         // Set previous position to current position to prevent long lines on reset
//         this.prevX = this.x;
//         this.prevY = this.y;
//       }

//       update() {
//         this.prevX = this.x;
//         this.prevY = this.y;

//         // Maintain the falling motion
//         this.x += this.speedX;
//         this.y += this.speedY;

//         // "Teleport" particle back when it goes off-screen
//         if (this.x > canvas.width + 50 || this.y > canvas.height + 50) {
//           this.reset();
//         }
//       }

//       draw() {
//         // Draw the main round particle head
//         ctx.fillStyle = `rgba(255, 255, 255, ${this.size})`;
//         ctx.beginPath();
//         ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
//         ctx.fill();

//         // Draw the comet trail
//         ctx.beginPath();
//         ctx.strokeStyle = `rgba(255, 255, 255, ${this.size * 0.5})`;
//         ctx.lineWidth = this.size;
//         ctx.moveTo(this.x, this.y);
//         ctx.lineTo(this.prevX, this.prevY);
//         ctx.stroke();
//       }
//     }

//     const init = () => {
//       particles.length = 0;
//       for (let i = 0; i < particleCount; i++) {
//         particles.push(new Particle());
//       }

//       // ⭐ CRUCIAL STEP 1: Synchronous Draw
//       // Clear the canvas and draw the initial positions BEFORE the animate loop starts.
//       // This ensures the particles are visible on the very first paint cycle.
//       ctx.fillStyle = "rgba(0, 0, 0, 1)"; // Fully opaque black fill to ensure clear state
//       ctx.fillRect(0, 0, canvas.width, canvas.height);
//       particles.forEach((p) => p.draw());

//       // ⭐ CRUCIAL STEP: Signal that the first frame is complete
//       // We only set the state if the canvas has actually been created/resized
//       if (canvas.width > 0) {
//         setIsReady(true);
//       }
//     };

//     const animate = () => {
//       // Draw a very subtle semi-transparent overlay to create a short fading trail effect
//       ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
//       ctx.fillRect(0, 0, canvas.width, canvas.height);

//       particles.forEach((particle) => {
//         particle.update();
//         particle.draw();
//       });

//       animationFrameId = requestAnimationFrame(animate);
//     };

//     window.addEventListener("resize", resizeCanvas);
//     resizeCanvas();
//     animate();

//     return () => {
//       window.removeEventListener("resize", resizeCanvas);
//       cancelAnimationFrame(animationFrameId);
//     };
//   }, []);

//   return (
//     <canvas
//       ref={canvasRef}
//       className={`absolute inset-0 z-0 bg-black transition-opacity duration-500
//                 ${isReady ? 'opacity-100' : 'opacity-0'}`}
//       aria-hidden="true"
//     />
//   );
// };

// const ManufacturerDashboard = () => {
//   const [medicineName, setMedicineName] = useState("");
//   const [batchNumber, setBatchNumber] = useState("");
//   const [expiryDate, setExpiryDate] = useState("");
//   // New state for ingredients, dosage form, and strength
//   const [ingredients, setIngredients] = useState("");
//   const [dosageForm, setDosageForm] = useState("");
//   const [strength, setStrength] = useState("");
//   const [diseases, setDiseases] = useState("");

//   const [medicines, setMedicines] = useState([]); // ✅ medicines from DB

//   const [showForm, setShowForm] = useState(false);
//   const router = useRouter();

//   // Function to generate a UUID (auto-generated unique identifier)
//   const generateUUID = () => {
//     return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
//       /[xy]/g,
//       function (c) {
//         var r = (Math.random() * 16) | 0,
//           v = c === "x" ? r : (r & 0x3) | 0x8;
//         return v.toString(16);
//       }
//     );
//   };

//   const handleLogout = async () => {
//     // If you’re using next-auth, you’d call signOut()
//     // For now just redirect to home
//     signOut({
//       callbackUrl: "/auth",
//       redirect: true,
//     });
//   };

//   const handleSubmit = async () => {
//     const res = await fetch("/api/medicine", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         name: medicineName,
//         batchNumber,
//         expiryDate,
//         ingredients,
//         dosage,
//         diseases: diseases.split(",").map((d) => d.trim()), // ✅ store as array
//       }),
//     });
//   };

//   const handleDeleteMedicine = async (medicineId) => {
//     if (
//       !window.confirm(
//         "Are you sure you want to delete this medicine? This action cannot be undone."
//       )
//     ) {
//       return;
//     }

//     try {
//       const res = await fetch(`/api/medicine/delete?id=${medicineId}`, {
//         method: "DELETE",
//       });

//       if (!res.ok) {
//         const errorData = await res.json();
//         throw new Error(errorData.error || "Failed to delete medicine");
//       }

//       // Remove from local state
//       setMedicines((prev) => prev.filter((med) => med.id !== medicineId));
//       alert("Medicine deleted successfully!");
//     } catch (error) {
//       console.error("Error deleting medicine:", error);
//       alert(`Failed to delete medicine: ${error.message}`);
//     }
//   };

//   useEffect(() => {
//     const fetchMedicines = async () => {
//       try {
//         const res = await fetch("/api/medicine");
//         if (!res.ok) {
//           throw new Error(`HTTP error! status: ${res.status}`);
//         }
//         const data = await res.json();
//         console.log("Fetched medicines:", data); // Debug log
//         setMedicines(data);
//       } catch (error) {
//         console.error("Error fetching medicines:", error);
//       }
//     };

//     fetchMedicines();
//   }, []);

//   const handleAddMedicine = async (e) => {
//     e.preventDefault();
//     const uniqueId = generateUUID();
//     const verificationUrl = `https://yourapp.com/verify/${uniqueId}`;

//     // Generate QR code image URL using a public API
//     const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
//       verificationUrl
//     )}`;

//     const newMedicine = {
//       id: uniqueId,
//       name: medicineName,
//       batchNo: batchNumber,
//       expiry: expiryDate,
//       ingredients: ingredients,
//       dosageForm: dosageForm,
//       strength: strength,
//       diseases: diseases.split(",").map((d) => d.trim().toLowerCase()),
//       verificationUrl: verificationUrl,
//       qrCodeUrl: qrCodeUrl,
//     };

//     // Debug: Check what we're sending
//     console.log("Saving to backend:", newMedicine);
//     console.log("batchNumber value:", batchNumber);
//     console.log("batchNo in object:", newMedicine.batchNo);

//     try {
//       const res = await fetch("/api/medicine", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(newMedicine),
//       });

//       if (!res.ok) {
//         const errorData = await res.json();
//         throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
//       }

//       const savedMedicine = await res.json();
//       console.log("Saved medicine:", savedMedicine); // Debug log

//       setMedicines((prev) => [savedMedicine, ...prev]);
//       setShowForm(false); // Hide the form after successful creation

//       // Reset form fields
//       setMedicineName("");
//       setBatchNumber("");
//       setExpiryDate("");
//       setIngredients("");
//       setDosageForm("");
//       setStrength("");
//       setDiseases("");
//     } catch (error) {
//       console.error("Error saving medicine:", error);
//       alert(`Failed to save medicine: ${error.message}`);
//     }
//   };
//   const handleNameBlur = async () => {
//     if (!medicineName) return;

//     try {
//       console.log("🔍 Autofilling details for:", medicineName);
//       const res = await fetch(
//         `/api/medicine/autofill?name=${encodeURIComponent(medicineName)}`
//       );
//       const data = await res.json();

//       if (data.error) {
//         console.error("Autofill error:", data.error);
//       }

//       // Autofill the fields
//       setIngredients(data.ingredients || "");
//       setDosageForm(data.dosageForm || "");
//       setStrength(data.strength || "");
//       setDiseases(data.diseases || "");

//       console.log("✅ Autofilled:", data);
//     } catch (error) {
//       console.error("Failed to autofill medicine details:", error);
//     }
//   };

//   return (
//     <div className="relative min-h-screen bg-[#000000] text-white p-4 overflow-hidden">
//       <ParticleBackground />

//       <div className="relative z-10 p-8 md:p-12 w-full max-w-4xl mx-auto h-full flex flex-col items-center justify-center">
//         <button
//           onClick={handleLogout}
//           className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
//         >
//           Logout
//         </button>
//         <div className="text-center mb-8">
//           <h1 className="text-3xl md:text-4xl  font-bold">
//             Manufacturer Dashboard
//           </h1>

//           <p className="mt-2 text-gray-400">
//             Easily manage your medicine products. Add new items, generate unique
//             identifiers, and create QR codes for physical packaging.
//           </p>
//         </div>

//         {/* Hero Section and "Add New" Button */}
//         {!showForm && (
//           <div className="text-center my-8">
//             <h2 className="text-xl md:text-2xl font-semibold mb-4">
//               Ready to add a new product?
//             </h2>
//             <button
//               onClick={() => setShowForm(true)}
//               className="py-3 px-8 text-white font-semibold rounded-lg shadow-lg
//               bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600
//               transition-all duration-300 transform hover:scale-105"
//             >
//               Add New Medicine
//             </button>
//           </div>
//         )}

//         {/* Add New Medicine Form */}
//         {showForm && (
//           <div className="bg-[#1a1a1a] p-6 rounded-lg mb-8">
//             <h2 className="text-2xl font-semibold mb-4">Add New Medicine</h2>
//             <form
//               onSubmit={handleAddMedicine}
//               className="grid grid-cols-1 md:grid-cols-2 gap-4"
//             >
//               <div>
//                 <label
//                   htmlFor="medicineName"
//                   className="block text-sm font-medium text-gray-300 mb-1"
//                 >
//                   Medicine Name
//                 </label>
//                 <input
//                   type="text"
//                   id="medicineName"
//                   value={medicineName}
//                   onChange={(e) => setMedicineName(e.target.value)}
//                   onBlur={handleNameBlur}
//                   className="w-full px-4 py-2 bg-[#2a2a2a] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
//                   required
//                 />
//               </div>
//               <div>
//                 <label
//                   htmlFor="batchNumber"
//                   className="block text-sm font-medium text-gray-300 mb-1"
//                 >
//                   Batch Number
//                 </label>
//                 <input
//                   type="text"
//                   id="batchNumber"
//                   value={batchNumber}
//                   onChange={(e) => setBatchNumber(e.target.value)}
//                   className="w-full px-4 py-2 bg-[#2a2a2a] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
//                   required
//                 />
//               </div>
//               <div>
//                 <label
//                   htmlFor="expiryDate"
//                   className="block text-sm font-medium text-gray-300 mb-1"
//                 >
//                   Expiry Date
//                 </label>
//                 <input
//                   type="date"
//                   id="expiryDate"
//                   value={expiryDate}
//                   onChange={(e) => setExpiryDate(e.target.value)}
//                   className="w-full px-4 py-2 bg-[#2a2a2a] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
//                   required
//                 />
//               </div>
//               {/* New input field for Ingredients */}
//               <div>
//                 <label
//                   htmlFor="ingredients"
//                   className="block text-sm font-medium text-gray-300 mb-1"
//                 >
//                   Ingredients
//                 </label>
//                 <input
//                   type="text"
//                   id="ingredients"
//                   value={ingredients}
//                   onChange={(e) => setIngredients(e.target.value)}
//                   className="w-full px-4 py-2 bg-[#2a2a2a] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
//                   required
//                 />
//               </div>
//               {/* New input field for Dosage Form */}
//               <div>
//                 <label
//                   htmlFor="dosageForm"
//                   className="block text-sm font-medium text-gray-300 mb-1"
//                 >
//                   Dosage Form (e.g., Tablet, Syrup)
//                 </label>
//                 <input
//                   type="text"
//                   id="dosageForm"
//                   value={dosageForm}
//                   onChange={(e) => setDosageForm(e.target.value)}
//                   className="w-full px-4 py-2 bg-[#2a2a2a] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
//                   required
//                 />
//               </div>
//               {/* New input field for Strength */}
//               <div>
//                 <label
//                   htmlFor="strength"
//                   className="block text-sm font-medium text-gray-300 mb-1"
//                 >
//                   Strength (e.g., 500mg, 10ml)
//                 </label>
//                 <input
//                   type="text"
//                   id="strength"
//                   value={strength}
//                   onChange={(e) => setStrength(e.target.value)}
//                   className="w-full px-4 py-2 bg-[#2a2a2a] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
//                   required
//                 />
//               </div>
//               <div>
//                 <label
//                   htmlFor="diseases"
//                   className="block text-sm font-medium text-gray-300 mb-1"
//                 >
//                   Diseases/Symptoms (e.g., Cold, Cough, Fever)
//                 </label>
//                 <input
//                   type="text"
//                   id="diseases"
//                   value={diseases}
//                   onChange={(e) => setDiseases(e.target.value)}
//                   className="w-full px-4 py-2 bg-[#2a2a2a] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
//                   required
//                 />
//               </div>

//               <button
//                 type="submit"
//                 className="md:col-span-2 py-3 mt-4 text-white font-semibold rounded-lg shadow-lg
//                 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600
//                 transition-all duration-300 transform hover:scale-105"
//               >
//                 Add Medicine & Generate QR Code
//               </button>
//             </form>
//           </div>
//         )}

//         {/* List of Added Medicines */}
//         <div>
//           <h2 className="text-2xl font-semibold mb-4">Added Medicines</h2>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             {medicines.length === 0 ? (
//               <p className="text-gray-400 md:col-span-2 text-center">
//                 No medicines added yet.
//               </p>
//             ) : (
//               medicines.map((medicine, index) => (
//                 <div
//                   key={medicine.id || `medicine-${index}`}
//                   className="bg-[#1a1a1a] p-6 rounded-lg flex flex-col items-center"
//                 >
//                   <img
//                     src={medicine.qrCodeUrl}
//                     alt={`QR Code for ${medicine.name}`}
//                     className="mb-4 w-36 h-36"
//                   />
//                   <div className="text-center">
//                     <h3 className="text-lg font-bold">{medicine.name}</h3>
//                     <p className="text-sm text-gray-400">
//                       Batch: {medicine.batchNumber}
//                     </p>
//                     <p className="text-sm text-gray-400">
//                       Expiry:{" "}
//                       {new Date(medicine.expiryDate).toLocaleDateString()}
//                     </p>
//                     {/* Display new fields */}
//                     {medicine.ingredients && (
//                       <p className="text-sm text-gray-400">
//                         Ingredients: {medicine.ingredients}
//                       </p>
//                     )}
//                     {medicine.dosageForm && (
//                       <p className="text-sm text-gray-400">
//                         Dosage Form: {medicine.dosageForm}
//                       </p>
//                     )}
//                     {medicine.strength && (
//                       <p className="text-sm text-gray-400">
//                         Strength: {medicine.strength}
//                       </p>
//                     )}
//                     {medicine.diseases && medicine.diseases.length > 0 && (
//                       <p className="text-sm text-gray-400">
//                         Treats: {Array.isArray(medicine.diseases) ? medicine.diseases.join(", ") : medicine.diseases}
//                       </p>
//                     )}
//                     <p className="text-xs text-gray-500 mt-2 break-all">
//                       ID: {medicine.id}
//                     </p>
//                     <div className="flex gap-2 mt-4">
//                       <button
//                         onClick={() => window.print()}
//                         className="px-4 py-2 rounded-full text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
//                       >
//                         Print QR
//                       </button>
//                       <button
//                         onClick={() => handleDeleteMedicine(medicine.id)}
//                         className="px-4 py-2 rounded-full text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
//                       >
//                         Delete
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               ))
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ManufacturerDashboard;
