import React, { useState, useEffect } from 'react';
import 'tailwindcss/tailwind.css';
import emojiList from './emojiList';

const levenshtein = (a, b) => {
  const matrix = Array(a.length + 1).fill(null).map(() =>
    Array(b.length + 1).fill(null));
  for (let i = 0; i <= a.length; i += 1) {
    matrix[i][0] = i;
  }
  for (let j = 0; j <= b.length; j += 1) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i][j - 1] + 1,
        matrix[i - 1][j] + 1,
        matrix[i - 1][j - 1] + indicator
      );
    }
  }
  return matrix[a.length][b.length];
};

const getClosestMatches = (input, users) => {
  if (!input) return [];
  return users
    .map(user => ({
      username: user.username,
      distance: levenshtein(input, user.username)
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3)
    .map(match => match.username);  // extract only usernames
};

const commands = [
  { command: '/mute', description: 'Mute a user' },
  { command: '/ban', description: 'Ban a user' },
  { command: '/title', description: 'Set a title for the current stream' },
  { command: '/description', description: 'Set a description for the current stream' },
];

const Chat = ({ users }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [showUserList, setShowUserList] = useState(false);
  const [showEmojiList, setShowEmojiList] = useState(false);
  const [showCommandList, setShowCommandList] = useState(false);
  const [userMatches, setUserMatches] = useState([]);
  const [chatTitle, setChatTitle] = useState('Chat');
  const [chatDescription, setChatDescription] = useState('');
  const [selectedEmojiIndex, setSelectedEmojiIndex] = useState(0);

  const handleSend = () => {
    if (input.trim()) {
      if (input.startsWith('/title ')) {
        const title = input.replace('/title ', '').trim();
        setChatTitle(title);
      } else if (input.startsWith('/description ')) {
        const description = input.replace('/description ', '').trim();
        setChatDescription(description);
      } else {
        const processedInput = input.replace(/@(\w+)/g, '$1').replace(/:([a-z_]+):/g, (match, p1) => {
          const emoji = emojiList.find(e => e.name === p1);
          return emoji ? emoji.char : match;
        });
        setMessages([...messages, processedInput]);
      }
      setInput('');
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);

    if (value.includes('@')) {
      const searchText = value.split('@').pop().split(' ')[0];
      setUserMatches(getClosestMatches(searchText, users));
      setShowUserList(true);
    } else {
      setShowUserList(false);
    }

    if (value.includes(':')) {
      setShowEmojiList(true);
    } else {
      setShowEmojiList(false);
    }

    if (value.startsWith('/')) {
      setShowCommandList(true);
    } else {
      setShowCommandList(false);
    }
  };

  const handleTagUser = (username) => {
    setInput(input.replace(/@\w*$/, `@${username} `));
    setShowUserList(false);
  };

  const handleSelectEmoji = (emoji) => {
    const newInput = input.replace(/:[a-z_]*$/, '') + emoji.char;
    setInput(newInput);
    setShowEmojiList(false);
    setSelectedEmojiIndex(0);
  };

  const handleSelectCommand = (command) => {
    setInput(command + ' ');
    setShowCommandList(false);
  };

  const handleKeyDown = (e) => {
    if (showEmojiList) {
      if (e.key === 'ArrowRight') {
        setSelectedEmojiIndex((prevIndex) => (prevIndex + 1) % emojiList.slice(0, 40).length);
        e.preventDefault();
      } else if (e.key === 'ArrowLeft') {
        setSelectedEmojiIndex((prevIndex) => (prevIndex - 1 + emojiList.slice(0, 40).length) % emojiList.slice(0, 40).length);
        e.preventDefault();
      } else if (e.key === 'Enter') {
        handleSelectEmoji(emojiList[selectedEmojiIndex]);
        e.preventDefault();
      }
    }
  };

  useEffect(() => {
    if (showEmojiList) {
      setSelectedEmojiIndex(0);
    }
  }, [showEmojiList]);

  return (
    <div className="p-4 bg-white shadow-md rounded-lg">
      <div className="flex items-center mb-4">
        <h2 className="text-xl font-bold mr-2">{chatTitle}</h2>
        {chatDescription && <span className="text-gray-600 italic">{chatDescription}</span>}
      </div>
      <div className="mb-4 h-64 overflow-y-auto border p-4 rounded-lg">
        {messages.map((message, index) => (
          <div key={index} className={`p-2 ${message.includes('@yourusername') ? 'bg-yellow-100' : 'bg-gray-100'} rounded my-1`}>
            {message.split(' ').map((word, i) => (
              <span key={i} className="mr-1">
                {emojiList.includes(word) ? (
                  <img src={`https://twemoji.maxcdn.com/2/72x72/${word.codePointAt(0).toString(16)}.png`} alt={word} className="inline h-5 w-5" />
                ) : (
                  word
                )}
              </span>
            ))}
          </div>
        ))}
      </div>
      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onKeyPress={(e) => e.key === 'Enter' && !showEmojiList && handleSend()}
          placeholder="Type a message..."
          className="border p-2 w-full rounded mb-2"
        />
        <button onClick={handleSend} className="bg-blue-500 text-white p-2 rounded absolute right-2 bottom-2 hover:bg-blue-600">
          Send
        </button>
        {showUserList && (
          <div className="absolute bottom-12 left-0 bg-white border rounded-lg shadow-lg p-4 w-64 max-h-48 overflow-y-auto">
            {userMatches.map(username => (
              <div key={username} onClick={() => handleTagUser(username)} className="cursor-pointer p-2 hover:bg-gray-100">
                @{username}
              </div>
            ))}
          </div>
        )}
        {showEmojiList && (
          <div className="absolute bottom-12 left-0 bg-white border rounded-lg shadow-lg p-4 w-64 max-h-48 overflow-y-auto grid grid-cols-4 gap-2">
            {emojiList.slice(0, 40).map((emoji, index) => (
              <div
                key={emoji.name}
                onClick={() => handleSelectEmoji(emoji)}
                className={`cursor-pointer p-2 hover:bg-gray-100 ${index === selectedEmojiIndex ? 'bg-gray-200' : ''}`}
              >
                {emoji.char}
              </div>
            ))}
          </div>
        )}
        {showCommandList && (
          <div className="absolute bottom-12 left-0 bg-white border rounded-lg shadow-lg p-4 w-64 max-h-48 overflow-y-auto">
            {commands.map((cmd) => (
              <div key={cmd.command} onClick={() => handleSelectCommand(cmd.command)} className="cursor-pointer p-2 hover:bg-gray-100">
                {cmd.command} - {cmd.description}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
