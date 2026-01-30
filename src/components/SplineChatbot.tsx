import { useState } from 'react';
import Spline from '@splinetool/react-spline';
import { MessageCircle, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { searchKnowledgeBase } from '@/lib/knowledgeBase';

export function SplineChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', content: 'Hi! I\'m your FoodConnect assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');

  const sendMessage = () => {
    if (!input.trim()) return;
    
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    
    // Get response from knowledge base
    setTimeout(() => {
      const response = searchKnowledgeBase(input);
      setMessages(prev => [...prev, { role: 'bot', content: response }]);
    }, 1000);
    
    setInput('');
  };

  return (
    <>
      {/* Floating Spline Robot */}
      <div className="fixed bottom-6 right-6 z-50">
        <div 
          className="w-28 h-28 cursor-pointer hover:scale-110 transition-transform"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Spline scene="https://prod.spline.design/rU2-Ks0SC0T5od9B/scene.splinecode" />
        </div>
        
        {/* Chat bubble indicator */}
        {!isOpen && (
          <div className="absolute -top-2 -left-2 bg-primary text-white rounded-full p-2 animate-pulse">
            <MessageCircle size={16} />
          </div>
        )}
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-28 right-6 w-80 h-96 bg-white rounded-lg shadow-2xl border z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-primary text-white rounded-t-lg">
            <h3 className="font-semibold">FoodConnect Assistant</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-green-600"
            >
              <X size={16} />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs p-3 rounded-lg ${
                  msg.role === 'user' 
                    ? 'bg-primary text-white' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              className="flex-1"
            />
            <Button onClick={sendMessage} size="sm">
              <Send size={16} />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}