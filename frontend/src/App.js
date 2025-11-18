import React, { useEffect, useState, useRef } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import axios from 'axios';
import './App.css';

function App() {
  const [tickets, setTickets] = useState([]);
  const [name, setName] = useState("");
  const stompClientRef = useRef(null);

  useEffect(() => {
    fetchInitialData();
    connectSocket();

    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
    };
  }, []);

  const fetchInitialData = async () => {
    try {
      await axios.get("http://localhost:8080/api/init"); 
      const response = await axios.get("http://localhost:8080/api/tickets");
      const sortedTickets = response.data.sort((a, b) => 
        parseInt(a.seatNo.substring(1)) - parseInt(b.seatNo.substring(1))
      );
      setTickets(sortedTickets);
    } catch (error) {
      console.error("Error fetching data", error);
    }
  };

  const connectSocket = () => {
    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      onConnect: () => {
        console.log("CONNECTED TO WEBSOCKET! 🟢");
        client.subscribe('/topic/updates', (message) => {
          if (message.body) {
            updateSeatView(JSON.parse(message.body));
          }
        });
      },
      onStompError: (frame) => {
        console.error('Broker reported error: ' + frame.headers['message']);
        console.error('Additional details: ' + frame.body);
      }
    });

    client.activate();
    stompClientRef.current = client;
  };

  const updateSeatView = (updatedTicket) => {
    setTickets(prevTickets => 
      prevTickets.map(ticket => 
        ticket.seatNo === updatedTicket.seatNo ? updatedTicket : ticket
      )
    );
  };

  const handleBook = (seatNo) => {
    if (!name) {
      alert("Please enter your name first!");
      return;
    }
    
    const bookingRequest = {
      seatNo: seatNo,
      customerName: name,
      status: "BOOKED"
    };

    if (stompClientRef.current && stompClientRef.current.connected) {
        stompClientRef.current.publish({
            destination: "/app/book",
            body: JSON.stringify(bookingRequest)
        });
    } else {
        alert("Connection not ready yet! Please wait a moment or refresh.");
    }
  };

  return (
    <div className="App">
      <h1>🎟️ Live Ticket Booking System</h1>
      
      <div className="user-input">
        <input 
          type="text" 
          placeholder="Enter Your Name to Book" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
        />
      </div>

      <div className="seat-grid">
        {tickets.map((ticket) => (
          <div 
            key={ticket.seatNo} 
           
            className={`seat ${ticket.status === 'BOOKED' ? 'booked' : (ticket.type === 'VIP' ? 'vip' : 'normal')}`}
            onClick={() => ticket.status === 'AVAILABLE' && handleBook(ticket.seatNo)}
          >
            <h3>{ticket.seatNo}</h3>
            
    
            <div style={{ fontSize: '12px', margin: '5px 0' }}>
                <span style={{ fontWeight: 'bold' }}>{ticket.type}</span>
                <br/>
                Rs. {ticket.price}
            </div>

            {ticket.status === 'BOOKED' && <small className="customer-name">{ticket.customerName}</small>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;