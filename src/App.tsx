import { useState, useEffect, useRef } from "react";
import "./App.css";

function App() {
  const [currentMessage, setCurrentMessage] = useState("");
  const [chat, setChat] = useState<ChatItem[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null); // nak manipulate <div> in this case, nak scroll to bottom

  type ChatItem =
    | { type: "message"; sender: "user" | "bot"; text: string }
    | { type: "verse"; arab: string; english: string; link:string };

  const handleKeyDown = (e: any) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]); //handle scroll bila chat tukar "state"

  const handleSend = async () => {
    const messageToSend = currentMessage.trim();
    if (!messageToSend) return;

    setCurrentMessage("");

    // Add user's message
    setChat((prev) => [
      ...prev,
      { type: "message", sender: "user", text: messageToSend },
    ]);

    try {
      const response = await fetch("http://localhost:3000/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: messageToSend }),
      });

      const { comfortingMessage, verseLinks } = await response.json();

      // Add bot's text response
      setChat((prev) => [
        ...prev,
        { type: "message", sender: "bot", text: comfortingMessage },
      ]);

      // Add each verse
      verseLinks.map((verse:string) => {
        console.log("Verse",verse);

        fetch(verse)
        .then(response => response.json())
        .then(ayahData => {
          const ayah = ayahData;
          console.log("Arab", ayah.arabic1);
          console.log("English", ayah.english);

          setChat((prev) => [
            ...prev,
            {
              type: "verse",
              arab: ayahData.arabic1,
              english: ayahData.english,
              link: `https://quran.com/${ayahData.surahNo}:${ayahData.ayahNo}`,
            },
          ]);

          // (prev) => [...prev, {..}]); basically takes the old array and adds the new element to it
        })

      });
    } catch (e) {
      console.error("Error sending request:", e);
    }
  };

  return (
    <div className="min-h-screen min-w-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-200 px-6">
      {/* Left Side - Quote/Dhikr */}
      <div className="hidden md:flex flex-col gap-4 text-blue-700 font-bold w-1/4 pr-4 text-center">
        <p className="italic text-3xl leading-relaxed">
          “Indeed, in the remembrance of Allah do hearts find rest.”
          <br />
          <span className="text-2xl text-blue-400">
            — Surah Ar-Ra'd [13:28]
          </span>
        </p>
      </div>

      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl flex flex-col gap-6 p-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-blue-800 flex items-center justify-center gap-2 mb-2">
            📿 <span>Quran Comfort</span>
          </h1>
          <h2 className="text-xl font-medium text-blue-600">
            Words that heal, verses that guide.
          </h2>
        </div>

        <div className="bg-gray-100 rounded-2xl p-5 h-[400px] overflow-y-auto flex flex-col gap-4 shadow-inner hide-scrollbar">
          <div className="self-start bg-blue-100 text-blue-900 p-4 rounded-2xl rounded-bl-sm w-fit max-w-[75%] shadow-md">
            How are you feeling?
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

        <div className="flex items-center gap-3 mt-2">
          <input
            type="text"
            placeholder="Type your feeling..."
            className="flex-grow px-4 py-2 rounded-xl border border-gray-300 bg-amber-100 focus:outline-none focus:ring-2 focus:ring-blue-300 transition duration-150"
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            className="bg-blue-600 text-white px-5 py-2 rounded-xl hover:bg-blue-700 transition duration-200"
            onClick={handleSend}
          >
            Send
          </button>
        </div>
      </div>

      <div className="hidden md:flex w-1/4 pl-10 text-center text-blue-700 text-3xl font-bold italic leading-relaxed">
        <p>
          “Verily, with hardship comes ease.”
          <br />
          <span className="text-2xl text-blue-400">
            — Surah Ash-Sharh [94:6]
          </span>
        </p>
      </div>
    </div>
  );
}

export default App;
