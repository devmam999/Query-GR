// Theme removed; default dark mode enforced
import ChatWindow from "./components/ChatWindow";
import "./App.css";

function App() {
  return (
    <DarkRoot>
      <ChatWindow />
    </DarkRoot>
  );
}

export default App;

function DarkRoot({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen p-5 bg-gray-900 text-gray-100">{children}</div>
  );
}
