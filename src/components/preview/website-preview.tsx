"use client";

import { useState, useEffect } from "react";
import { Edit2 } from "lucide-react";

interface WebsitePreviewProps {
  deviceView: "desktop" | "mobile";
  onElementClick: () => void;
}

export function WebsitePreview({
  deviceView,
  onElementClick,
}: WebsitePreviewProps) {
  const [siteInfo, setSiteInfo] = useState<any>(null);
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);

  useEffect(() => {
    // Get the site info from localStorage
    const savedInfo = localStorage.getItem("webdash_site_info");
    if (savedInfo) {
      try {
        setSiteInfo(JSON.parse(savedInfo));
      } catch (e) {
        console.error("Error parsing site info:", e);
      }
    }
  }, []);

  if (!siteInfo) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Loading Preview...</h2>
          <p className="text-gray-500">
            Your website preview is being prepared.
          </p>
        </div>
      </div>
    );
  }

  // This is a preview - in a real implementation, you would render the actual website
  // or use an iframe to show the real 10Web site
  return (
    <div
      className={`mx-auto bg-white shadow-xl overflow-hidden transition-all ${
        deviceView === "mobile" ? "max-w-sm" : "w-full"
      }`}
    >
      {/* Website Header */}
      <header
        className="bg-gray-800 text-white p-4"
        onMouseEnter={() => setHoveredElement("header")}
        onMouseLeave={() => setHoveredElement(null)}
        onClick={onElementClick}
      >
        <div className="relative">
          {hoveredElement === "header" && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
              <button className="bg-white text-gray-800 rounded-full p-2">
                <Edit2 className="h-5 w-5" />
              </button>
            </div>
          )}
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold">
              {siteInfo.businessName || "Company Name"}
            </h1>
            <nav className="hidden md:block">
              <ul className="flex space-x-4">
                <li>Home</li>
                <li>About</li>
                <li>Services</li>
                <li>Contact</li>
              </ul>
            </nav>
            <div className="md:hidden">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section
        className="relative bg-gray-900 text-white py-16 px-6 text-center"
        onMouseEnter={() => setHoveredElement("hero")}
        onMouseLeave={() => setHoveredElement(null)}
        onClick={onElementClick}
      >
        <div className="relative">
          {hoveredElement === "hero" && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
              <button className="bg-white text-gray-800 rounded-full p-2">
                <Edit2 className="h-5 w-5" />
              </button>
            </div>
          )}
          <h2 className="text-3xl font-bold mb-4">
            {siteInfo.websiteTitle || "Welcome to Our Website"}
          </h2>
          <p className="mb-6 max-w-2xl mx-auto">
            {siteInfo.businessDescription ||
              "We provide top-quality services to meet all your needs."}
          </p>
          <button className="bg-[#f58327] hover:bg-[#f58327]/90 text-white px-6 py-2 rounded">
            Get Started
          </button>
        </div>
      </section>

      {/* Services Section */}
      <section
        className="py-12 px-6"
        onMouseEnter={() => setHoveredElement("services")}
        onMouseLeave={() => setHoveredElement(null)}
        onClick={onElementClick}
      >
        <div className="relative">
          {hoveredElement === "services" && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
              <button className="bg-white text-gray-800 rounded-full p-2">
                <Edit2 className="h-5 w-5" />
              </button>
            </div>
          )}
          <h2 className="text-2xl font-bold mb-8 text-center">Our Services</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gray-100 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Service 1</h3>
              <p>Detailed description of the first service we offer.</p>
            </div>
            <div className="bg-gray-100 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Service 2</h3>
              <p>Detailed description of the second service we offer.</p>
            </div>
            <div className="bg-gray-100 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Service 3</h3>
              <p>Detailed description of the third service we offer.</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section
        className="py-12 px-6 bg-gray-100"
        onMouseEnter={() => setHoveredElement("about")}
        onMouseLeave={() => setHoveredElement(null)}
        onClick={onElementClick}
      >
        <div className="relative">
          {hoveredElement === "about" && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
              <button className="bg-white text-gray-800 rounded-full p-2">
                <Edit2 className="h-5 w-5" />
              </button>
            </div>
          )}
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-4 text-center">About Us</h2>
            <p className="mb-4">
              {siteInfo.websiteDescription ||
                "We are a dedicated team committed to providing exceptional services to our clients."}
            </p>
            <p>
              Our mission is to deliver high-quality solutions that meet the
              unique needs of each client.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="bg-gray-800 text-white py-8 px-6"
        onMouseEnter={() => setHoveredElement("footer")}
        onMouseLeave={() => setHoveredElement(null)}
        onClick={onElementClick}
      >
        <div className="relative">
          {hoveredElement === "footer" && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
              <button className="bg-white text-gray-800 rounded-full p-2">
                <Edit2 className="h-5 w-5" />
              </button>
            </div>
          )}
          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">
                {siteInfo.businessName || "Company Name"}
              </h3>
              <p>Providing quality services since 2023.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <p>Email: info@example.com</p>
              <p>Phone: (123) 456-7890</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Follow Us</h3>
              <div className="flex space-x-4">
                <a href="#" className="hover:text-gray-300">
                  Facebook
                </a>
                <a href="#" className="hover:text-gray-300">
                  Twitter
                </a>
                <a href="#" className="hover:text-gray-300">
                  Instagram
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-6 text-center">
            <p>
              &copy; 2023 {siteInfo.businessName || "Company Name"}. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
