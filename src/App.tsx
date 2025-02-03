import WebSocketComponent from "./components/WebSocketComponent";
import "./index.css";

function App() {
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-8 text-center text-gray-800">
        Real Time Data
      </h1>
      <WebSocketComponent />
    </div>
  );
}

export default App;
