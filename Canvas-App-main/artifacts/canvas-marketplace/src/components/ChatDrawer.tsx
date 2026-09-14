import { useState, useEffect, useRef } from 'react';
import { X, Send, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getTheme } from '@/lib/theme';

type ChatDrawerProps = {
  open: boolean;
  bookingId?: string;      
  currentUserId?: string;   
  otherPartyName?: string;  
  onClose: () => void;
};

export function ChatDrawer({ open, bookingId, currentUserId, otherPartyName, onClose }: ChatDrawerProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false); 
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Read style query param for the Dynamic Theme Engine
  const queryParams = new URLSearchParams(window.location.search);
  const styleVersion = queryParams.get('style') || '2';
  const theme = getTheme(styleVersion);
  
  // Adapt accents (Use Dusty Plum for Opt 3, Gold for others)
  const accentColor = styleVersion === '3' ? '#7A4B69' : '#9D7C3A';
  const accentBg = styleVersion === '3' ? 'bg-[#7A4B69]' : 'bg-[#9D7C3A]';

  useEffect(() => {
    if (!open) return;

    if (!bookingId) {
      setLoading(false);
      setMessages([
        {
          id: 'welcome-demo',
          content: 'Hi! Excited to connect about your look. Let me know what specific styling or dates you have in mind.',
          sender_id: 'artist',
          created_at: new Date().toISOString()
        }
      ]);
      return;
    }

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
          setMessages((prev) => {
            // STRICT DEDUPLICATION: Prevents the 4x duplicate bubble bug by matching ID or exact text + sender
            const isDuplicate = prev.some(
              msg => msg.id === payload.new.id || 
              (msg.content === payload.new.content && msg.sender_id === payload.new.sender_id)
            );
            
            if (isDuplicate) return prev;
            return [...prev, payload.new];
          });
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
    setNewMessage(''); // Clear input instantly

    // OPTIMISTIC UI UPDATE: Immediately render the message locally so the chat feels instantly responsive
    const tempMsg = {
      id: Date.now().toString(), // Temporary ID until DB confirms
      content: contentToSend,
      sender_id: currentUserId || 'client',
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);

    // Send to Supabase in the background
    if (bookingId) {
      const { error } = await supabase.from('messages').insert([
        {
          booking_id: bookingId,
          sender_id: currentUserId || '00000000-0000-0000-0000-000000000000',
          content: contentToSend,
        },
      ]);

      if (error) {
        // Silently log the error rather than throwing an alert to maintain a seamless experience
        console.error('Failed to sync message to database:', error);
      }
    }
  };

  return (
    <div className={`fixed inset-0 z-[200] flex justify-end bg-black/60 backdrop-blur-sm ${theme.fontBase}`} role="presentation" onClick={onClose}>
      <aside 
        className="bg-white border-l border-black/10 h-full w-full max-w-lg flex flex-col shadow-2xl p-8 md:p-12" 
        role="dialog" 
        aria-modal="true" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (Updated to Title Case) */}
        <div className="flex items-center justify-between border-b border-black/10 pb-6 mb-6">
          <div>
            <p className={`${theme.eyebrow} mb-2`}>Private Concierge</p>
            <h3 className={`${theme.headingModal} !tracking-normal !text-3xl`}>
              {otherPartyName ? otherPartyName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Artist Concierge'}
            </h3>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-black/40 hover:text-black transition-colors"
          >
            <X size={24} strokeWidth={1.5} />
          </button>
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar mb-4">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <p className={`${theme.eyebrow} animate-pulse !text-black/50`}>Connecting To Secure Room...</p>
            </div>
          ) : messages.length > 0 ? (
            messages.map((msg) => {
              const isMe = msg.sender_id === currentUserId || msg.sender_id === 'client-demo' || msg.sender_id === 'client';
              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div 
                    className={`max-w-[85%] px-5 py-4 text-[15px] leading-relaxed shadow-sm ${theme.cardRadius} ${
                      isMe 
                        ? `${accentBg} text-white ${theme.cardRadius === 'rounded-none' ? 'rounded-none' : 'rounded-br-sm'}` 
                        : `border ${theme.borderBase} bg-black/5 text-black ${theme.cardRadius === 'rounded-none' ? 'rounded-none' : 'rounded-bl-sm'}`
                    }`}
                  >
                    {msg.content}
                  </div>
                  <span className={`mt-2 ${theme.formLabel} !text-black/40 !lowercase`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className={`w-14 h-14 ${theme.cardRadius === 'rounded-none' ? 'rounded-none' : 'rounded-full'} bg-black/5 flex items-center justify-center mb-4`}>
                <Sparkles color={accentColor} size={24} strokeWidth={1.5} />
              </div>
              {/* Updated to Title Case */}
              <p className={`${theme.headingModal} !text-2xl mb-3`}>Secure Channel Open.</p>
              <p className={`${theme.bodyText} !text-black/50 max-w-xs`}>discuss looks, timings, and venue details right here. zero external sharing required.</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSendMessage} className="flex items-end gap-4 border-t border-black/10 pt-6 mt-auto">
          <input 
            type="text" 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="type a message..."
            className={`flex-1 ${theme.inputText}`}
          />
          <button 
            type="submit" 
            className={`flex h-12 w-12 shrink-0 items-center justify-center ${theme.cardRadius === 'rounded-none' ? 'rounded-none' : 'rounded-full'} ${accentBg} text-white transition-transform hover:scale-105 active:scale-95`}
          >
            <Send size={18} strokeWidth={1.5} />
          </button>
        </form>
      </aside>
    </div>
  );
}