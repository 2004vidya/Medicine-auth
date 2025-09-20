"use client";
import { useState, useEffect, useRef } from "react";

// Move ParticleBackground outside the main component to prevent re-creation
const ParticleBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
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
        this.reset();
        this.prevX = this.x;
        this.prevY = this.y;
      }

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
        
        // Give particles a random speed in a consistent direction for a slow-mo effect
        const speed = 0.8;
        this.speedX = (Math.random() * 0.5 + 0.5) * speed;
        this.speedY = (Math.random() * 0.5 + 0.5) * speed;
        
        // Reduce particle size
        this.size = Math.random() * 0.8 + 0.2;
        
        // Set previous position to current position to prevent long lines on reset
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
    };

    const animate = () => {
      // Draw a very subtle semi-transparent overlay to create a short fading trail effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0" />;
};

const ManufacturerDashboard = () => {
  const [medicineName, setMedicineName] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [addedMedicines, setAddedMedicines] = useState([]);
  const [showForm, setShowForm] = useState(false);

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

  const handleAddMedicine = (e) => {
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
      batch: batchNumber,
      expiry: expiryDate,
      verificationUrl: verificationUrl,
      qrCodeUrl: qrCodeUrl,
    };

    // Simulate backend action
    console.log("Saving to backend:", newMedicine);
    // In a real app, you'd make an API call to save the data
    // and handle the QR code storage/printing.

    setAddedMedicines((prev) => [newMedicine, ...prev]);

    // Reset form fields and hide the form
    setMedicineName("");
    setBatchNumber("");
    setExpiryDate("");
    setShowForm(false);
  };

  return (
    <div className="relative min-h-screen bg-[#000000] text-white p-4 overflow-hidden">
      <ParticleBackground />

      <div className="relative z-10 p-8 md:p-12 w-full max-w-4xl mx-auto h-full flex flex-col items-center justify-center">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold">
            Manufacturer Dashboard
          </h1>
          <p className="mt-2 text-gray-400">
            Easily manage your medicine products. Add new items, generate unique
            identifiers, and create QR codes for physical packaging.
          </p>
        </div>

        {/* Hero Section and "Add New" Button */}
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

        {/* Add New Medicine Form */}
        {showForm && (
          <div className="bg-[#1a1a1a] p-6 rounded-lg mb-8">
            <h2 className="text-2xl font-semibold mb-4">Add New Medicine</h2>
            <form
              onSubmit={handleAddMedicine}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div>
                <label
                  htmlFor="medicineName"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Medicine Name
                </label>
                <input
                  type="text"
                  id="medicineName"
                  value={medicineName}
                  onChange={(e) => setMedicineName(e.target.value)}
                  className="w-full px-4 py-2 bg-[#2a2a2a] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="batchNumber"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Batch Number
                </label>
                <input
                  type="text"
                  id="batchNumber"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  className="w-full px-4 py-2 bg-[#2a2a2a] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label
                  htmlFor="expiryDate"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Expiry Date
                </label>
                <input
                  type="date"
                  id="expiryDate"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-4 py-2 bg-[#2a2a2a] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
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

        {/* List of Added Medicines */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Added Medicines</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addedMedicines.length === 0 ? (
              <p className="text-gray-400 md:col-span-2 text-center">
                No medicines added yet.
              </p>
            ) : (
              addedMedicines.map((medicine) => (
                <div
                  key={medicine.id}
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
                      Batch: {medicine.batch}
                    </p>
                    <p className="text-sm text-gray-400">
                      Expiry: {medicine.expiry}
                    </p>
                    <p className="text-xs text-gray-500 mt-2 break-all">
                      ID: {medicine.id}
                    </p>
                    <button
                      onClick={() => window.print()}
                      className="mt-4 px-4 py-2 rounded-full text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                    >
                      Print QR Code
                    </button>
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
