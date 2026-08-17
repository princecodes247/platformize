import WindowControls from "./components/WindowControls";
import filesystem from "./services/filesystem";

export function App() {
  return (
    <div className="container">
      <header>
        <WindowControls />
        <h1>Platformize Tauri Example</h1>
      </header>
      <main>
        <p>Active Platform FS: {filesystem.platform}</p>
        <p>FS Separator: {filesystem.separator}</p>
      </main>
    </div>
  );
}

export default App;
