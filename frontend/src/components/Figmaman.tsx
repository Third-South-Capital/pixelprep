import { useState } from 'react';

export function Figmaman() {
  const [showRoadmap, setShowRoadmap] = useState(false);

  return (
    <>
      {/* Figmaman Character */}
      <div 
        className="fixed bottom-6 left-6 z-40 cursor-pointer group"
        onClick={() => setShowRoadmap(true)}
      >
        <div className="relative">
          {/* Speech bubble */}
          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-white rounded-lg px-3 py-2 shadow-lg border opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
            <div className="text-sm font-medium text-gray-700">Click for roadmap!</div>
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
              <div className="w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-white"></div>
            </div>
          </div>
          
          {/* Figmaman SVG Character */}
          <div className="w-16 h-20 bg-gradient-to-b from-blue-500 to-blue-600 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 p-2">
            <svg viewBox="0 0 60 80" className="w-full h-full text-white">
              {/* Head */}
              <circle cx="30" cy="15" r="8" fill="currentColor" />
              
              {/* Body */}
              <rect x="24" y="23" width="12" height="20" rx="2" fill="currentColor" />
              
              {/* Arms */}
              <rect x="18" y="25" width="6" height="3" rx="1.5" fill="currentColor" />
              <rect x="36" y="25" width="6" height="3" rx="1.5" fill="currentColor" />
              
              {/* Cape */}
              <path d="M20 28 Q15 35 18 42 Q25 38 30 42 Q35 38 42 42 Q45 35 40 28 Z" fill="rgba(255,255,255,0.3)" />
              
              {/* Legs */}
              <rect x="26" y="43" width="3" height="12" rx="1.5" fill="currentColor" />
              <rect x="31" y="43" width="3" height="12" rx="1.5" fill="currentColor" />
              
              {/* Eyes */}
              <circle cx="27" cy="13" r="1.5" fill="#1e40af" />
              <circle cx="33" cy="13" r="1.5" fill="#1e40af" />
              
              {/* "F" on chest */}
              <text x="30" y="35" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#1e40af">F</text>
            </svg>
          </div>
          
          {/* Label */}
          <div className="text-center mt-1">
            <span className="text-xs font-bold text-blue-600 bg-white px-2 py-1 rounded-full shadow-sm">
              Figmaman
            </span>
          </div>
        </div>
      </div>

      {/* Roadmap Modal */}
      {showRoadmap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={() => setShowRoadmap(false)}
          ></div>
          
          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <svg viewBox="0 0 60 80" className="w-6 h-8 text-white">
                      <circle cx="30" cy="15" r="8" fill="currentColor" />
                      <rect x="24" y="23" width="12" height="20" rx="2" fill="currentColor" />
                      <rect x="18" y="25" width="6" height="3" rx="1.5" fill="currentColor" />
                      <rect x="36" y="25" width="6" height="3" rx="1.5" fill="currentColor" />
                      <path d="M20 28 Q15 35 18 42 Q25 38 30 42 Q35 38 42 42 Q45 35 40 28 Z" fill="rgba(255,255,255,0.3)" />
                      <rect x="26" y="43" width="3" height="12" rx="1.5" fill="currentColor" />
                      <rect x="31" y="43" width="3" height="12" rx="1.5" fill="currentColor" />
                      <circle cx="27" cy="13" r="1.5" fill="#1e40af" />
                      <circle cx="33" cy="13" r="1.5" fill="#1e40af" />
                      <text x="30" y="35" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#1e40af">F</text>
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">PixelPrep Roadmap</h2>
                    <p className="text-blue-100">Where we're heading next</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowRoadmap(false)}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-8">
                {/* Current Features */}
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">✅ Current Features & Recent Updates</h3>
                  </div>
                  <div className="ml-11 space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <p className="font-semibold text-gray-800">5 Professional Optimization Presets</p>
                        <p className="text-sm text-gray-600">Instagram Square, Jury Submission, Web Display, Email Newsletter, Quick Compress</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <p className="font-semibold text-gray-800">Bug Fixes & UI Refresh</p>
                        <p className="text-sm text-gray-600">Cleaner interface, improved performance, better user experience</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <p className="font-semibold text-gray-800">Instant Direct Downloads</p>
                        <p className="text-sm text-gray-600">No registration required for basic use</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <p className="font-semibold text-gray-800">Professional Quality Processing</p>
                        <p className="text-sm text-gray-600">Optimized specifically for artists and creators</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Planned Features */}
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">🚀 Coming Soon - Core Platform</h3>
                  </div>
                  <div className="ml-11 space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <p className="font-semibold text-gray-800">User Accounts & Image Galleries</p>
                        <p className="text-sm text-gray-600">Save your work, track optimization history, build portfolio</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <p className="font-semibold text-gray-800">Batch Processing</p>
                        <p className="text-sm text-gray-600">Upload multiple images, optimize them all simultaneously</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <p className="font-semibold text-gray-800">Custom Preset Builder</p>
                        <p className="text-sm text-gray-600">Create and save your own optimization rules and templates</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <p className="font-semibold text-gray-800">Cloud Storage Integration</p>
                        <p className="text-sm text-gray-600">Sync with Google Drive, Dropbox for seamless portfolio management</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI-Powered Content Generation */}
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">🤖 AI-Powered Content Generation</h3>
                  </div>
                  <div className="ml-11 space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                      <div>
                        <p className="font-semibold text-gray-800">Art Description Generator</p>
                        <p className="text-sm text-gray-600">Automatic captions for Instagram, artist statements, grant applications</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                      <div>
                        <p className="font-semibold text-gray-800">Smart Titles & File Naming</p>
                        <p className="text-sm text-gray-600">Generate descriptive filenames instead of "IMG_4527.jpg"</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                      <div>
                        <p className="font-semibold text-gray-800">Auto-Generated Artist Statements</p>
                        <p className="text-sm text-gray-600">Help artists write compelling descriptions of their work</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Smart Analysis & Intelligence */}
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">🧠 Smart Analysis & Intelligence</h3>
                  </div>
                  <div className="ml-11 space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2"></div>
                      <div>
                        <p className="font-semibold text-gray-800">Style Classification & Tagging</p>
                        <p className="text-sm text-gray-600">Automatically categorize medium, style, subject matter for artist segmentation</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2"></div>
                      <div>
                        <p className="font-semibold text-gray-800">Smart Cropping Intelligence</p>
                        <p className="text-sm text-gray-600">AI-powered subject detection instead of center crop</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2"></div>
                      <div>
                        <p className="font-semibold text-gray-800">Color Palette Extraction</p>
                        <p className="text-sm text-gray-600">Generate hex codes, Pantone matches, marketing copy from artwork</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Professional Integration */}
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">🏆 Professional Integration</h3>
                  </div>
                  <div className="ml-11 space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></div>
                      <div>
                        <p className="font-semibold text-gray-800">Grant/Competition Matching</p>
                        <p className="text-sm text-gray-600">Search EntryThingy database to recommend applicable opportunities based on artwork analysis</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></div>
                      <div>
                        <p className="font-semibold text-gray-800">EntryThingy Platform Integration</p>
                        <p className="text-sm text-gray-600">Unified artist accounts and streamlined submission workflows</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></div>
                      <div>
                        <p className="font-semibold text-gray-800">Export to Platforms</p>
                        <p className="text-sm text-gray-600">Direct publishing to Instagram, portfolio sites, and professional platforms</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
                  <div className="text-center">
                    <h4 className="text-lg font-bold text-gray-900 mb-2">Want to influence our roadmap?</h4>
                    <p className="text-gray-600 mb-4">Join our community and help shape the future of PixelPrep</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <a 
                        href="mailto:harrison@third-south-capital.com?subject=PixelPrep%20Feature%20Request" 
                        className="inline-flex items-center justify-center px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Send Feedback
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}