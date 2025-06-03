export default function TypingIndicator() {
  return (
    <div className="flex justify-start mb-4">
      <div className="flex items-start space-x-2">
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
          <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
        </div>
        <div className="bg-white text-gray-800 shadow-md border rounded-lg px-4 py-2">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
          </div>
        </div>
      </div>
    </div>
  )
}
