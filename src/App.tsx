import { useState, useEffect, useRef } from "react";
import "./App.css";

function App() {
  const [currentMessage, setCurrentMessage] = useState("");
  const [chat, setChat] = useState<ChatItem[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null); // nak manipulate <div> in this case, nak scroll to bottom
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState(false);
  const [fileName, setFileName] = useState("");

  type ChatItem =
    | { type: "message"; sender: "user" | "bot"; text: string }
    | { type: "verse"; arab: string; english: string; link:string };

  const handleKeyDown = (e: any) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
      setFile(e.target.files[0]);
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]); //handle scroll bila chat tukar "state"

  const handleSend = async () => {
    const messageToSend = currentMessage.trim();
    if (!messageToSend) return;

    if (!file) {
      setError(true);
      setTimeout(() => setError(false), 1000);
      return;
    }

    setCurrentMessage("");

    // Add user's message
    setChat((prev) => [
      ...prev,
      { type: "message", sender: "user", text: messageToSend },
    ]);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const fileResponse = await fetch(`http://localhost:5173/addFile`, {
        method: "POST",
        body: formData,
      });

      if (!fileResponse.ok) {
        throw new Error(`Upload error! status: ${fileResponse.status}`);
      }

      const { text } = await fileResponse.json();

      // Call the summarize endpoint
      const summaryResponse = await fetch(`http://localhost:5173/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!summaryResponse.ok) {
        throw new Error(`Summary error! status: ${summaryResponse.status}`);
      }
   
   
       const { sum, message } = await summaryResponse.json();


      console.log(sum)
      console.log(message)

    } catch (error) {
      console.error("Error:", error);
    } 
  };

  return (
    <div className="min-h-screen min-w-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-200 px-6">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl flex flex-col gap-6 p-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-blue-800 flex items-center justify-center gap-2 mb-2">
            🤖 <span>Resume Parser</span>
          </h1>
          <h2 className="text-xl font-medium text-blue-600">
        
            <a
              onClick={() =>
                window.open(
                  "https://docs.google.com/spreadsheets/d/1e2AbA5RqLvKoLn7yzhtoNBEhTgFgFu4cwp0s8WAAhqk/edit?gid=2096432323",
                  "_blank"
                )
              }
              className="cursor-pointer text-blue-600 hover:text-blue-800 font-bold"
            >
              View Excel
            </a>
          </h2>
        </div>

        <div className="bg-gray-100 rounded-2xl p-5 h-[400px] overflow-y-auto flex flex-col gap-4 shadow-inner hide-scrollbar">
          <div className="self-start bg-blue-100 text-blue-900 p-4 rounded-2xl rounded-bl-sm w-fit max-w-[75%] shadow-md">
            Send your resume.
          </div>

          {chat.map((item, index) => {
            if (item.type === "message") {
              return (
                <div
                  key={index}
                  className={`p-4 rounded-2xl w-fit max-w-[75%] shadow-md break-words ${
                    item.sender === "user"
                      ? "self-end bg-amber-100 text-gray-900 rounded-br-sm"
                      : "self-start bg-blue-100 text-blue-900 rounded-bl-sm"
                  }`}
                >
                  {item.text}
                </div>
              );
            } else if (item.type === "verse") {
              return (
                <div
                  key={index}
                  onClick={() => window.open(item.link, "_blank")}
                  className="self-start bg-blue-100 text-blue-900 hover:bg-blue-200 w-fit rounded-2xl p-4 shadow-md"
                >
                  <p className="arabic font-serif text-lg">{item.arab}</p>
                  <p className="translation text-sm mt-2">{item.english}</p>
                </div>
              );
            }
          })}

          {/* Scroll to bottom */}
          <div ref={bottomRef} />
        </div>

        <div className="flex justify-center items-center gap-3 mt-2">
         

           <div className="flex flex-row items-center justify-center gap-3">
          <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition shadow">
            <input type="file" onChange={handleChange} className="hidden" />
            Choose File
          </label>

          <button
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-lg font-medium transition shadow"
            onClick={handleSend}
          >
            Upload
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}

export default App;
