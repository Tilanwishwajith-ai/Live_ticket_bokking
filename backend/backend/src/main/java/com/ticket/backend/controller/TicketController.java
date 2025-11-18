package com.ticket.backend.controller;

import com.ticket.backend.model.Ticket;
import com.ticket.backend.repository.TicketRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@CrossOrigin(origins = "*")
public class TicketController {

    @Autowired
    private TicketRepository ticketRepository;

    @GetMapping("/api/tickets")
    public List<Ticket> getAllTickets() {
        return ticketRepository.findAll();
    }

    
    @GetMapping("/api/init")
    public String initSeats() {
        if(ticketRepository.count() == 0) {
            // 1. VIP Seats (A1 - A5) -> Rs. 1000
            for(int i=1; i<=5; i++) {
                ticketRepository.save(new Ticket("A"+i, "AVAILABLE", "", 1000.0, "VIP"));
            }
            // 2. Normal Seats (B1 - B5) -> Rs. 500
            for(int i=1; i<=5; i++) {
                ticketRepository.save(new Ticket("B"+i, "AVAILABLE", "", 500.0, "NORMAL"));
            }
            return "VIP & Normal Seats Created!";
        }
        return "Seats Already Exist";
    }

    @MessageMapping("/book")
    @SendTo("/topic/updates")
    public Ticket bookSeat(Ticket ticketRequest) {
        String seatNo = ticketRequest.getSeatNo();
        if (seatNo == null) return null;
        
        Ticket existingTicket = ticketRepository.findById(seatNo).orElse(null);
        
        if (existingTicket != null && "AVAILABLE".equals(existingTicket.getStatus())) {
            existingTicket.setStatus("BOOKED");
            existingTicket.setCustomerName(ticketRequest.getCustomerName());
            
            return ticketRepository.save(existingTicket);
        }
        return existingTicket;
    }
}