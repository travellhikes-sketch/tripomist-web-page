$files = Get-ChildItem "C:\Users\storm\Desktop\antigravity file\stitch_tripomist_web_page\react-app\src\pages\Itinerary*.jsx"

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    
    $newCostingContent = @"
            {activeTab === 'Costing' && (
              <section className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-sm mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Costing Details</h2>
                <div className="space-y-4 text-gray-700 font-medium">
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="font-bold">Quad Sharing</span>
                    <span className="text-[#136b8a] font-bold text-lg">₹{(trip.numericPrice - 2000).toLocaleString()} <span className="text-sm text-gray-500 font-normal">+ 5% GST</span></span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="font-bold">Triple Sharing</span>
                    <span className="text-[#136b8a] font-bold text-lg">₹{(trip.numericPrice - 1000).toLocaleString()} <span className="text-sm text-gray-500 font-normal">+ 5% GST</span></span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-[#eff6f9] rounded-xl border border-[#cde5ef]">
                    <span className="font-bold">Double Sharing</span>
                    <span className="text-[#136b8a] font-bold text-lg">₹{trip.numericPrice.toLocaleString()} <span className="text-sm text-gray-500 font-normal">+ 5% GST</span></span>
                  </div>
                </div>
              </section>
            )}
"@

    $target = @'
            {activeTab !== 'Itinerary' && activeTab !== 'Inclusions' && (
              <section className="mb-10 min-h-[200px] flex items-center justify-center bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-gray-500 font-medium">Content for {activeTab} will be available here.</p>
              </section>
            )}
'@
    $replacement = $newCostingContent + "`n" + @'
            {activeTab !== 'Itinerary' && activeTab !== 'Inclusions' && activeTab !== 'Costing' && (
              <section className="mb-10 min-h-[200px] flex items-center justify-center bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-gray-500 font-medium">Content for {activeTab} will be available here.</p>
              </section>
            )}
'@

    $content = $content.Replace('<span className="text-[#136b8a] text-3xl font-bold">{trip.price}</span>', '<span className="text-[#136b8a] text-3xl font-bold">{trip.price} <span className="text-sm text-gray-500 font-medium">+ 5% GST</span></span>')

    $content = $content.Replace($target, $replacement)

    Set-Content -Path $file.FullName -Value $content
}
