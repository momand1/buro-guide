'use client';
import { useState, useRef } from 'react';
import { explainDocument, saveAppointmentAlert, triggerEmailAlert } from './actions';

export default function Home() {
  // Global State
  const [activeTab, setActiveTab] = useState("translator");

  // Translator State
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedLang, setSelectedLang] = useState("English");
  const fileInputRef = useRef(null);

  // Hunter State
  const [city, setCity] = useState("Berlin");
  const [service, setService] = useState("Anmeldung (City Registration)");
  const [email, setEmail] = useState("");
  const [hunterStatus, setHunterStatus] = useState("");
  const [savingAlert, setSavingAlert] = useState(false);

  // Handle Document Upload
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setSummary(""); 
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("language", selectedLang);
      
      const resultString = await explainDocument(formData);
      setSummary(resultString);
    } catch (error) {
      setSummary(`Error: ${error.message}`);
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle Saving to Database
  const handleSetAlert = async (e) => {
    e.preventDefault();
    setSavingAlert(true);
    setHunterStatus("Saving your alert...");
    
    try {
      const formData = new FormData();
      formData.append("city", city);
      formData.append("service", service);
      formData.append("email", email);

      const result = await saveAppointmentAlert(formData);
      setHunterStatus(result);
      // We do NOT clear the email here anymore, so you can easily use the test button!
    } catch (error) {
      setHunterStatus(`Error: ${error.message}`);
    } finally {
      setSavingAlert(false);
    }
  };

  // Handle Testing the Email (Admin Button)
  const handleTestEmail = async () => {
    if (!email) {
      setHunterStatus("Error: Please enter your email address in the form above first to test the alert.");
      return;
    }
    
    setHunterStatus("Sending test email...");
    try {
      const result = await triggerEmailAlert(email, city, service);
      setHunterStatus(`📧 ${result} Check your inbox!`);
    } catch (error: any) {
      setHunterStatus(`Error: ${error.message}`);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">
      <div className="max-w-2xl w-full bg-white p-8 rounded-xl shadow-md">
        
        {/* App Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Büro-Guide 🇩🇪</h1>
          <p className="text-gray-600">Your digital assistant for German bureaucracy.</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b mb-8">
          <button 
            onClick={() => setActiveTab("translator")}
            className={`flex-1 py-3 font-medium transition-colors ${activeTab === "translator" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
          >
            📄 Document Translator
          </button>
          <button 
            onClick={() => setActiveTab("hunter")}
            className={`flex-1 py-3 font-medium transition-colors ${activeTab === "hunter" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
          >
            🎯 Appointment Hunter
          </button>
        </div>

        {/* TAB 1: TRANSLATOR */}
        {activeTab === "translator" && (
          <div className="animate-fade-in space-y-4">
            <label className="block text-sm font-medium text-gray-700">Select Language</label>
            <select 
              value={selectedLang} 
              onChange={(e) => setSelectedLang(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
            >
              <option value="German">German</option>
              <option value="English">English</option>
              <option value="Dari">Dari</option>
              <option value="Pashto">Pashto</option>
              <option value="Turkish">Turkish</option>
              <option value="Arabic">Arabic</option>
            </select>

            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange} 
            />
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className={`w-full text-white py-3 rounded-md font-semibold transition mt-2 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {loading ? "Analyzing Document..." : "Upload Document"}
            </button>

            {summary && (
              <div className="mt-6 p-5 bg-gray-50 rounded-lg border border-gray-200 whitespace-pre-wrap text-gray-800 leading-relaxed shadow-inner">
                {summary}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: APPOINTMENT HUNTER */}
        {activeTab === "hunter" && (
          <div className="animate-fade-in">
            <p className="text-gray-600 mb-6 text-sm">
              Finding a Bürgeramt appointment is almost impossible. Tell us what you need, and our bots will email you the second a cancellation opens up.
            </p>

            <form onSubmit={handleSetAlert} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <select value={city} onChange={(e) => setCity(e.target.value)} className="w-full p-3 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-2 focus:ring-blue-500">
                  <option>Berlin</option>
                  <option>Munich</option>
                  <option>Frankfurt</option>
                  <option>Hamburg</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Needed</label>
                <select value={service} onChange={(e) => setService(e.target.value)} className="w-full p-3 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-2 focus:ring-blue-500">
                  <option>Anmeldung (City Registration)</option>
                  <option>Passport / ID Renewal</option>
                  <option>Visa Extension</option>
                  <option>Driving License Conversion</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your Resend Account Email"
                  className="w-full p-3 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button 
                type="submit" 
                disabled={savingAlert}
                className={`w-full text-white py-3 rounded-md font-semibold transition mt-4 ${savingAlert ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
              >
                {savingAlert ? "Setting Alert..." : "Set Alert"}
              </button>
            </form>

            {/* Secret Admin Button */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-2 uppercase font-bold tracking-wider">Admin Area</p>
              <button 
                onClick={handleTestEmail}
                className="w-full bg-gray-800 hover:bg-gray-900 text-white py-3 rounded-md font-semibold transition text-sm"
              >
                Simulate Found Appointment (Send Test Email)
              </button>
            </div>

            {hunterStatus && (
              <div className={`mt-6 p-4 rounded-md border ${hunterStatus.startsWith("Error") ? "bg-red-50 border-red-200 text-red-800" : "bg-green-50 border-green-200 text-green-800"}`}>
                {hunterStatus.startsWith("Error") ? "❌" : "✅"} {hunterStatus}
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  );
}