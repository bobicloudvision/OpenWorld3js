/**
 * Team Service
 * Manages team creation, membership, and team-based combat
 */

// Team storage (in-memory, move to Redis/database for production)
const teams = new Map(); // teamId -> Team
const playerTeams = new Map(); // playerId -> teamId

/**
 * Team structure:
 * {
 *   teamId: string,
 *   name: string,
 *   leaderId: number,
 *   members: [{ playerId: number, role: 'leader' | 'member', joinedAt: timestamp }],
 *   createdAt: timestamp,
 *   combatInstanceId: string | null
 * }
 */

/**
 * Create a new team
 * @param {number} leaderId - Leader player ID
 * @param {string} name - Team name
 * @returns {{success: boolean, team?: Object, error?: string}}
 */
export function createTeam(leaderId, name) {
  // Check if player is already in a team
  if (playerTeams.has(leaderId)) {
    return { success: false, error: 'Player is already in a team' };
  }

  const teamId = `team-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const team = {
    teamId,
    name: name || `Team ${teamId.substr(-6)}`,
    leaderId,
    members: [
      {
        playerId: leaderId,
        role: 'leader',
        joinedAt: Date.now()
      }
    ],
    createdAt: Date.now(),
    combatInstanceId: null
  };

  teams.set(teamId, team);
  playerTeams.set(leaderId, teamId);

  return { success: true, team };
}

/**
 * Join a team
 * @param {number} playerId - Player ID
 * @param {string} teamId - Team ID
 * @returns {{success: boolean, error?: string}}
 */
export function joinTeam(playerId, teamId) {
  // Check if player is already in a team
  if (playerTeams.has(playerId)) {
    return { success: false, error: 'Player is already in a team' };
  }

  const team = teams.get(teamId);
  if (!team) {
    return { success: false, error: 'Team not found' };
  }

  // Check if player is already a member
  if (team.members.some(m => m.playerId === playerId)) {
    return { success: false, error: 'Player is already a member of this team' };
  }

  // Add player to team
  team.members.push({
    playerId,
    role: 'member',
    joinedAt: Date.now()
  });

  playerTeams.set(playerId, teamId);

  return { success: true, team };
}

/**
 * Leave a team
 * @param {number} playerId - Player ID
 * @returns {{success: boolean, error?: string, teamDisbanded?: boolean}}
 */
export function leaveTeam(playerId) {
  const teamId = playerTeams.get(playerId);
  if (!teamId) {
    return { success: false, error: 'Player is not in a team' };
  }

  const team = teams.get(teamId);
  if (!team) {
    playerTeams.delete(playerId);
    return { success: false, error: 'Team not found' };
  }

  // Remove player from team
  team.members = team.members.filter(m => m.playerId !== playerId);

  // If leader leaves, assign new leader or disband
  if (team.leaderId === playerId) {
    if (team.members.length > 0) {
      // Assign first member as new leader
      team.leaderId = team.members[0].playerId;
      team.members[0].role = 'leader';
    } else {
      // Disband team if no members left
      teams.delete(teamId);
      playerTeams.delete(playerId);
      return { success: true, teamDisbanded: true };
    }
  }

  playerTeams.delete(playerId);

  return { success: true, team };
}

/**
 * Get team by ID
 * @param {string} teamId - Team ID
 * @returns {Object|null}
 */
export function getTeam(teamId) {
  return teams.get(teamId) || null;
}

/**
 * Get team by player ID
 * @param {number} playerId - Player ID
 * @returns {Object|null}
 */
export function getTeamByPlayer(playerId) {
  const teamId = playerTeams.get(playerId);
  if (!teamId) return null;
  
  return teams.get(teamId) || null;
}

/**
 * Get all teams
 * @returns {Array}
 */
export function getAllTeams() {
  return Array.from(teams.values());
}

/**
 * Check if two players are on the same team
 * @param {number} playerId1 - First player ID
 * @param {number} playerId2 - Second player ID
 * @returns {boolean}
 */
export function arePlayersOnSameTeam(playerId1, playerId2) {
  const teamId1 = playerTeams.get(playerId1);
  const teamId2 = playerTeams.get(playerId2);
  
  return teamId1 && teamId2 && teamId1 === teamId2;
}

/**
 * Check if two teams are allied
 * TODO: Implement alliance system
 * @param {string} teamId1 - First team ID
 * @param {string} teamId2 - Second team ID
 * @returns {boolean}
 */
export function areTeamsAllied(teamId1, teamId2) {
  // For now, teams are never allied (can fight each other)
  // In future, implement alliance system
  return false;
}

/**
 * Get all members of a team
 * @param {string} teamId - Team ID
 * @returns {Array<number>} Array of player IDs
 */
export function getTeamMembers(teamId) {
  const team = teams.get(teamId);
  if (!team) return [];
  
  return team.members.map(m => m.playerId);
}

/**
 * Set team's combat instance
 * @param {string} teamId - Team ID
 * @param {string|null} combatInstanceId - Combat instance ID or null
 */
export function setTeamCombatInstance(teamId, combatInstanceId) {
  const team = teams.get(teamId);
  if (team) {
    team.combatInstanceId = combatInstanceId;
  }
}

/**
 * Kick player from team (leader only)
 * @param {number} leaderId - Leader player ID
 * @param {number} playerId - Player to kick
 * @returns {{success: boolean, error?: string}}
 */
export function kickPlayerFromTeam(leaderId, playerId) {
  const teamId = playerTeams.get(leaderId);
  if (!teamId) {
    return { success: false, error: 'Leader is not in a team' };
  }

  const team = teams.get(teamId);
  if (!team) {
    return { success: false, error: 'Team not found' };
  }

  if (team.leaderId !== leaderId) {
    return { success: false, error: 'Only the leader can kick players' };
  }

  if (playerId === leaderId) {
    return { success: false, error: 'Leader cannot kick themselves' };
  }

  // Remove player from team
  team.members = team.members.filter(m => m.playerId !== playerId);
  playerTeams.delete(playerId);

  return { success: true, team };
}

/**
 * Transfer leadership (leader only)
 * @param {number} currentLeaderId - Current leader ID
 * @param {number} newLeaderId - New leader ID
 * @returns {{success: boolean, error?: string}}
 */
export function transferLeadership(currentLeaderId, newLeaderId) {
  const teamId = playerTeams.get(currentLeaderId);
  if (!teamId) {
    return { success: false, error: 'Current leader is not in a team' };
  }

  const team = teams.get(teamId);
  if (!team) {
    return { success: false, error: 'Team not found' };
  }

  if (team.leaderId !== currentLeaderId) {
    return { success: false, error: 'Only the current leader can transfer leadership' };
  }

  // Check if new leader is a member
  const newLeaderMember = team.members.find(m => m.playerId === newLeaderId);
  if (!newLeaderMember) {
    return { success: false, error: 'New leader is not a member of the team' };
  }

  // Transfer leadership
  team.leaderId = newLeaderId;
  
  // Update roles
  team.members.forEach(m => {
    if (m.playerId === currentLeaderId) {
      m.role = 'member';
    } else if (m.playerId === newLeaderId) {
      m.role = 'leader';
    }
  });

  return { success: true, team };
}

