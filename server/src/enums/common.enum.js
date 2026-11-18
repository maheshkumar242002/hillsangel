/**
 * Common System Enums
 */

export const DeleteMode = Object.freeze({
  SOFT: 'soft',
  HARD: 'hard',
});

export const SortDirection = Object.freeze({
  ASC: 'ASC',
  DESC: 'DESC',
});

export const UserRole = Object.freeze({
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  OPERATOR: 'operator',
});

export const MediaType = Object.freeze({
  PHOTO: 'photo',
  VIDEO: 'video',
});

export const Environment = Object.freeze({
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  TEST: 'test',
});

export default {
  DeleteMode,
  SortDirection,
  UserRole,
  MediaType,
  Environment,
};
