import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { env } from '../config/env';

let io: Server;

export function initializeSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: env.FRONTEND_URL,
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join hospital room
    socket.on('join-hospital', (hospitalId: string) => {
      socket.join(`hospital:${hospitalId}`);
      console.log(`Socket ${socket.id} joined hospital:${hospitalId}`);
    });

    // Join doctor room
    socket.on('join-doctor', (doctorId: string) => {
      socket.join(`doctor:${doctorId}`);
      console.log(`Socket ${socket.id} joined doctor:${doctorId}`);
    });

    // Join patient room
    socket.on('join-patient', (patientId: string) => {
      socket.join(`patient:${patientId}`);
      console.log(`Socket ${socket.id} joined patient:${patientId}`);
    });

    // Leave rooms
    socket.on('leave-hospital', (hospitalId: string) => {
      socket.leave(`hospital:${hospitalId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
}

// Emit helpers
export function emitQueueUpdate(hospitalId: string, data: Record<string, unknown>) {
  io?.to(`hospital:${hospitalId}`).emit('queueUpdated', data);
}

export function emitAppointmentBooked(patientId: string, data: Record<string, unknown>) {
  io?.to(`patient:${patientId}`).emit('appointmentBooked', data);
  if (data.hospitalId) {
    io?.to(`hospital:${data.hospitalId}`).emit('appointmentBooked', data);
  }
}

export function emitDoctorStatusChanged(doctorId: string, data: Record<string, unknown>) {
  io?.to(`doctor:${doctorId}`).emit('doctorStatusChanged', data);
  if (data.hospitalId) {
    io?.to(`hospital:${data.hospitalId}`).emit('doctorStatusChanged', data);
  }
}

export function emitPatientCalled(patientId: string, data: Record<string, unknown>) {
  io?.to(`patient:${patientId}`).emit('patientCalled', data);
}

export function emitNotification(recipientId: string, role: string, data: Record<string, unknown>) {
  const room = role === 'patient' ? `patient:${recipientId}` : role === 'doctor' ? `doctor:${recipientId}` : `hospital:${recipientId}`;
  io?.to(room).emit('notification', data);
}
