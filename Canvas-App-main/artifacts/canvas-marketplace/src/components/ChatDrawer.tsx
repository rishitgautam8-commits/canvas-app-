import { useState, useEffect, useRef } from 'react';
import { X, Send, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type ChatDrawerProps = {
  open: boolean;
  bookingId?: string;       // Add ?
  currentUserId?: string;   // Add ?
  otherPartyName?: string;  // Add ?
  onClose: () => void;
};

export function ChatDrawer({ open, bookingId, currentUserId, otherPartyName, onClose }: ChatDrawerProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !bookingId) return;

    // 1. Fetch existing message history
    async function fetchMessages() {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
      } else {
        setMessages(data || []);
      }
      setLoading(false);
    }

    fetchMessages();

    // 2. Subscribe to real-time incoming messages via WebSockets
    const channel = supabase
      .channel(`booking-chat-${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `booking_id=eq.${bookingId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, bookingId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!open) return null;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const contentToSend = newMessage.trim();
    setNewMessage('');

    const { error } = await supabase.from('messages').insert([
      {
        booking_id: bookingId,
        sender_id: currentUserId,
        content: contentToSend,
      },
    ]);

    if (error) {
      console.error('Error sending message:', error);
      window.alert('Failed to send message.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#10002b]/65 backdrop-blur-sm" role="presentation" onClick={onClose}>
      <aside 
        className="glass flex h-full w-full max-w-lg flex-col justify-between rounded-l-[2rem] p-6 sm:p-8" 
        role="dialog" 
        aria-modal="true" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-5">
          <div>
            <p className="eyebrow text-[#e0aaff]">Secure Canvas Room</p>
            <h3 className="serif mt-1 text-3xl text-white">{otherPartyName}</h3>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="rounded-full border border-white/15 p-2 text-white/70 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Message Feed */}
        <div className="my-4 flex-1 overflow-y-auto space-y-4 pr-2">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <p className="eyebrow animate-pulse text-[#e0aaff]">Decrypting secure chat...</p>
            </div>
          ) : messages.length > 0 ? (
            messages.map((msg) => {
              const isMe = msg.sender_id === currentUserId;
              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div 
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      isMe 
                        ? 'bg-[#e0aaff] text-[#251037] rounded-br-sm' 
                        : 'border border-white/10 bg-white/5 text-white rounded-bl-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                  <span className="mt-1 text-[10px] text-white/30">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <Sparkles className="text-[#e0aaff]/50 mb-2" size={24} />
              <p className="serif text-2xl text-white/50">Encrypted channel open.</p>
              <p className="mt-1 text-xs text-white/40 max-w-xs">Discuss looks, timings, and venue details right here. Zero external sharing required.</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSendMessage} className="flex items-center gap-3 border-t border-white/10 pt-4">
          <input 
            type="text" 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a secure message..."
            className="flex-1 rounded-full border border-white/15 bg-white/5 px-5 py-3.5 text-sm text-white outline-none transition-colors focus:border-[#e0aaff]"
          />
          <button 
            type="submit" 
            className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e0aaff] text-[#251037] transition-transform hover:scale-105"
          >
            <Send size={18} />
          </button>
        </form>
      </aside>
    </div>
  );
}