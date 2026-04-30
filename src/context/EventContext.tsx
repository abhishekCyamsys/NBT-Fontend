import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService, AdminEvent } from '../services/api';

interface EventContextProps {
  events: AdminEvent[];
  activeEventId: string | null;
  setActiveEventId: (id: string) => void;
  isLoadingEvents: boolean;
}

const EventContext = createContext<EventContextProps | undefined>(undefined);

export const EventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [activeEventId, setActiveEventIdState] = useState<string | null>(null);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await apiService.getAdminEvents();
        setEvents(data);
        
        const storedEventId = localStorage.getItem('admin_active_event');
        
        // Use stored, or fallback to the latest active/first event
        if (storedEventId && data.some(e => e.id === storedEventId)) {
          setActiveEventIdState(storedEventId);
        } else if (data.length > 0) {
          // Defaulting to the first event in the list (usually the latest by sorting from backend)
          const latestEventId = data[0].id;
          setActiveEventIdState(latestEventId);
          localStorage.setItem('admin_active_event', latestEventId);
        }
      } catch (error) {
        console.error('Failed to fetch events for context:', error);
      } finally {
        setIsLoadingEvents(false);
      }
    };

    fetchEvents();
  }, []);

  const setActiveEventId = (id: string) => {
    setActiveEventIdState(id);
    localStorage.setItem('admin_active_event', id);
  };

  return (
    <EventContext.Provider value={{ events, activeEventId, setActiveEventId, isLoadingEvents }}>
      {children}
    </EventContext.Provider>
  );
};

export const useEventContext = () => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEventContext must be used within an EventProvider');
  }
  return context;
};
