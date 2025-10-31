import { getPlayerIdBySocket } from '../services/sessionService.js';
import {
  createTeam,
  joinTeam,
  leaveTeam,
  getTeam,
  getTeamByPlayer,
  getAllTeams,
  kickPlayerFromTeam,
  transferLeadership,
  getTeamMembers
} from '../services/teamService.js';

/**
 * Register team socket handlers
 * @param {Socket} socket - The socket instance
 * @param {Server} io - The Socket.IO server instance
 */
export function registerTeamHandlers(socket, io) {
  const playerId = getPlayerIdBySocket(socket.id);
  if (!playerId) {
    return; // Player not authenticated
  }

  /**
   * Create a new team
   */
  socket.on('team:create', (data) => {
    try {
      const { name } = data;
      const result = createTeam(playerId, name);

      if (!result.success) {
        socket.emit('team:error', { message: result.error });
        return;
      }

      socket.emit('team:created', { team: result.team });
      
      // Notify other players that a new team was created (optional)
      socket.broadcast.emit('team:list-updated');
    } catch (error) {
      console.error('Error creating team:', error);
      socket.emit('team:error', { message: 'Failed to create team' });
    }
  });

  /**
   * Join a team
   */
  socket.on('team:join', (data) => {
    try {
      const { teamId } = data;
      const result = joinTeam(playerId, teamId);

      if (!result.success) {
        socket.emit('team:error', { message: result.error });
        return;
      }

      socket.emit('team:joined', { team: result.team });
      
      // Notify team members
      const teamMembers = getTeamMembers(teamId);
      teamMembers.forEach(memberId => {
        io.sockets.sockets.forEach(s => {
          const memberSocketId = getPlayerIdBySocket(s.id);
          if (memberSocketId === memberId && memberId !== playerId) {
            s.emit('team:member-joined', {
              team: result.team,
              newMemberId: playerId
            });
          }
        });
      });
    } catch (error) {
      console.error('Error joining team:', error);
      socket.emit('team:error', { message: 'Failed to join team' });
    }
  });

  /**
   * Leave current team
   */
  socket.on('team:leave', () => {
    try {
      const result = leaveTeam(playerId);

      if (!result.success) {
        socket.emit('team:error', { message: result.error });
        return;
      }

      socket.emit('team:left', { 
        teamDisbanded: result.teamDisbanded || false 
      });

      // Notify remaining team members if team wasn't disbanded
      if (!result.teamDisbanded) {
        const team = getTeamByPlayer(playerId);
        // Note: playerId won't be in team anymore, so get from previous state
        // In a real implementation, you'd store the teamId before leaving
        socket.broadcast.emit('team:member-left', {
          playerId,
          teamId: result.team?.teamId
        });
      }
    } catch (error) {
      console.error('Error leaving team:', error);
      socket.emit('team:error', { message: 'Failed to leave team' });
    }
  });

  /**
   * Get current team
   */
  socket.on('team:get', () => {
    try {
      const team = getTeamByPlayer(playerId);
      socket.emit('team:current', { team });
    } catch (error) {
      console.error('Error getting team:', error);
      socket.emit('team:error', { message: 'Failed to get team' });
    }
  });

  /**
   * Get team by ID
   */
  socket.on('team:get-by-id', (data) => {
    try {
      const { teamId } = data;
      const team = getTeam(teamId);
      socket.emit('team:info', { team });
    } catch (error) {
      console.error('Error getting team by ID:', error);
      socket.emit('team:error', { message: 'Failed to get team' });
    }
  });

  /**
   * Get all teams
   */
  socket.on('team:list', () => {
    try {
      const teams = getAllTeams();
      socket.emit('team:list', { teams });
    } catch (error) {
      console.error('Error getting team list:', error);
      socket.emit('team:error', { message: 'Failed to get team list' });
    }
  });

  /**
   * Kick player from team (leader only)
   */
  socket.on('team:kick', (data) => {
    try {
      const { playerId: targetPlayerId } = data;
      const result = kickPlayerFromTeam(playerId, targetPlayerId);

      if (!result.success) {
        socket.emit('team:error', { message: result.error });
        return;
      }

      // Notify kicked player
      io.sockets.sockets.forEach(s => {
        const memberSocketId = getPlayerIdBySocket(s.id);
        if (memberSocketId === targetPlayerId) {
          s.emit('team:kicked', { team: result.team });
        }
      });

      // Notify team members
      const teamMembers = getTeamMembers(result.team.teamId);
      teamMembers.forEach(memberId => {
        io.sockets.sockets.forEach(s => {
          const memberSocketId = getPlayerIdBySocket(s.id);
          if (memberSocketId === memberId && memberId !== playerId) {
            s.emit('team:member-kicked', {
              team: result.team,
              kickedPlayerId: targetPlayerId
            });
          }
        });
      });

      socket.emit('team:kick-success', { team: result.team });
    } catch (error) {
      console.error('Error kicking player:', error);
      socket.emit('team:error', { message: 'Failed to kick player' });
    }
  });

  /**
   * Transfer leadership (leader only)
   */
  socket.on('team:transfer-leadership', (data) => {
    try {
      const { newLeaderId } = data;
      const result = transferLeadership(playerId, newLeaderId);

      if (!result.success) {
        socket.emit('team:error', { message: result.error });
        return;
      }

      // Notify team members
      const teamMembers = getTeamMembers(result.team.teamId);
      teamMembers.forEach(memberId => {
        io.sockets.sockets.forEach(s => {
          const memberSocketId = getPlayerIdBySocket(s.id);
          if (memberSocketId === memberId) {
            s.emit('team:leadership-transferred', {
              team: result.team,
              newLeaderId
            });
          }
        });
      });
    } catch (error) {
      console.error('Error transferring leadership:', error);
      socket.emit('team:error', { message: 'Failed to transfer leadership' });
    }
  });
}

