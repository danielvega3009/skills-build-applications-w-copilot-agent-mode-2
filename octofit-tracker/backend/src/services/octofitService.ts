import { Activity, Team, User, Workout } from '../models/index.js';
import mongoose from 'mongoose';

function httpError(status: number, message: string) {
  return Object.assign(new Error(message), { status });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!isRecord(input)) throw httpError(400, 'Activity input is required');
  const { userId, teamId, type, minutes } = input;
  if (
    typeof userId !== 'string'
    || typeof teamId !== 'string'
    || typeof type !== 'string'
    || !type.trim()
    || typeof minutes !== 'number'
    || !Number.isFinite(minutes)
    || minutes < 1
  ) {
    throw httpError(400, 'A valid user, team, type, and minutes are required');
  }
  if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(teamId)) {
    throw httpError(400, 'Invalid user or team id');
  }
  const [user, team] = await Promise.all([
    User.findById(userId),
    Team.findById(teamId),
  ]);
  if (!user || !team) throw httpError(404, 'User or team not found');

  return (await Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  })).toObject();
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isRecord(input) || typeof input.name !== 'string' || !input.name.trim()) {
    throw httpError(400, 'Team name is required');
  }
  if (typeof input.mascot !== 'string' || !input.mascot.trim()) {
    throw httpError(400, 'Team mascot is required');
  }
  const memberIds = input.members === undefined
    ? []
    : Array.isArray(input.members)
      ? input.members
      : null;
  if (!memberIds || memberIds.some((id) => typeof id !== 'string' || !mongoose.isValidObjectId(id))) {
    throw httpError(400, 'Team members must be valid user ids');
  }

  return (await Team.create({
    name: input.name.trim(),
    mascot: input.mascot.trim(),
    members: memberIds,
  })).toObject();
}

export async function getLeaderboard() {
  const [activities, teams] = await Promise.all([
    Activity.find().lean(),
    Team.find().lean(),
  ]);
  const totals = new Map<string, number>();
  for (const activity of activities) {
    const teamId = activity.team.toString();
    totals.set(teamId, (totals.get(teamId) ?? 0) + activity.points);
  }
  return teams
    .map((team) => ({
      teamName: team.name,
      totalPoints: totals.get(team._id.toString()) ?? 0,
    }))
    .sort((left, right) => right.totalPoints - left.totalPoints)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.toLowerCase() });
  if (!user) throw httpError(404, 'User not found');

  const recentActivity = await Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean();
  const recentFocus = recentActivity?.type?.trim();
  const focus = ['run', 'cycle', 'walk', 'cardio', 'endurance'].includes(recentFocus?.toLowerCase() ?? '')
    ? 'endurance'
    : user.fitnessGoal?.trim().toLowerCase() || recentFocus?.toLowerCase() || 'endurance';

  const workout = await Workout.findOne({ focus }).lean()
    ?? await Workout.findOne({ focus: user.fitnessGoal?.trim().toLowerCase() }).lean()
    ?? await Workout.findOne().lean();
  if (!workout) return [];

  const reason = recentActivity
    ? `Based on your recent ${recentActivity.type} activity and ${focus} goal`
    : `Based on your ${focus} fitness goal`;
  return [{ ...workout, reason }];
}

export { User };
